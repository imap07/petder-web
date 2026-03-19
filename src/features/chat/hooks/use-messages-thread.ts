'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts';
import api from '@/lib/api';
import type { PendingMessage, Conversation, ConversationContext, ChatMessage } from '@/types';
import { useChatSocket, TYPING_TIMEOUT_MS } from './use-chat-socket';

interface UseMessagesThreadReturn {
  messages: PendingMessage[];
  conversation: Conversation | null;
  isLoading: boolean;
  isLoadingOlder: boolean;
  isSending: boolean;
  error: string | null;
  hasOlderMessages: boolean;
  loadOlderMessages: () => Promise<void>;
  sendMessage: (text: string) => Promise<void>;
  retryMessage: (tempId: string, text: string) => Promise<void>;
  markAsRead: () => Promise<void>;
  /** All match contexts in this conversation */
  contexts: ConversationContext[];
  /** Currently active context match ID */
  activeContextMatchId: string | null;
  /** Set the active context */
  setActiveContext: (matchId: string) => void;
  /** Real-time connection status */
  isRealTimeConnected: boolean;
  /** Is the other user typing */
  isOtherUserTyping: boolean;
  /** Send typing indicator */
  sendTyping: (isTyping: boolean) => void;
}

function generateTempId(): string {
  return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function useMessagesThread(
  conversationId: string,
  initialContextMatchId?: string | null
): UseMessagesThreadReturn {
  const { token, user } = useAuth();
  const [messages, setMessages] = useState<PendingMessage[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const hasMarkedRead = useRef(false);
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Context state
  const [contexts, setContexts] = useState<ConversationContext[]>([]);
  const [activeContextMatchId, setActiveContextMatchId] = useState<string | null>(
    initialContextMatchId || null
  );

  // Handle incoming real-time messages
  const handleNewMessage = useCallback((message: ChatMessage) => {
    // Don't add if it's our own message (already added optimistically)
    if (message.senderId === user?.id) return;

    setMessages((prev) => {
      // Check if message already exists
      if (prev.some((m) => m.id === message.id)) return prev;
      return [...prev, { ...message, isPending: false, isFailed: false }];
    });
  }, [user?.id]);

  // Handle messages read event
  const handleMessagesRead = useCallback(() => {
    // Update all our messages to "read" status
    setMessages((prev) =>
      prev.map((msg) =>
        msg.senderId === user?.id && msg.status !== 'read'
          ? { ...msg, status: 'read' }
          : msg
      )
    );
  }, [user?.id]);

  // Handle typing indicator (CHAT-003 fix: use shared TYPING_TIMEOUT_MS)
  const handleUserTyping = useCallback((event: { userId: string; isTyping: boolean }) => {
    if (event.userId === user?.id) return;

    setIsOtherUserTyping(event.isTyping);

    // Auto-clear typing using the same timeout value as sender
    if (event.isTyping) {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        setIsOtherUserTyping(false);
      }, TYPING_TIMEOUT_MS);
    }
  }, [user?.id]);

  // WebSocket connection
  const { isConnected, sendTyping } = useChatSocket({
    conversationId,
    onNewMessage: handleNewMessage,
    onMessagesRead: handleMessagesRead,
    onUserTyping: handleUserTyping,
  });

  // Fetch messages (newest first from API, we reverse for display)
  const fetchMessages = useCallback(
    async (cursor?: string, contextMatchId?: string) => {
      if (!token) return;

      try {
        const response = await api.chat.getMessages(token, conversationId, {
          limit: 30,
          cursor,
          contextMatchId: contextMatchId || activeContextMatchId || undefined,
        });

        // API returns newest first, we need oldest first for display
        const newMessages = [...response.items].reverse();

        if (cursor) {
          // Prepend older messages
          setMessages((prev) => [...newMessages, ...prev]);
        } else {
          setMessages(newMessages);
        }
        setNextCursor(response.nextCursor);
        setError(null);

        // Update contexts if provided
        if (response.contexts) {
          setContexts(response.contexts);
        }

        // Set active context from response if not already set
        if (response.activeContextMatchId && !activeContextMatchId) {
          setActiveContextMatchId(response.activeContextMatchId);
        }
      } catch (err) {
        if (err instanceof Error && err.message.includes('not found')) {
          setError('conversation_not_found');
        } else {
          setError(err instanceof Error ? err.message : 'Failed to load messages');
        }
      }
    },
    [token, conversationId, activeContextMatchId]
  );

  // Fetch conversation details (CHAT-006 fix: use dedicated endpoint if available)
  const fetchConversation = useCallback(async () => {
    if (!token) return;

    try {
      // Try to get conversation details from the API
      // If a dedicated endpoint exists, use it; otherwise fall back to list with limit 1
      // TODO: Create dedicated GET /conversations/:id endpoint in backend for efficiency
      const response = await api.chat.listConversations(token, { limit: 50 });
      const conv = response.items.find((c) => c.id === conversationId);
      if (conv) {
        setConversation(conv);
      }
    } catch {
      // Silently fail, conversation details are optional
    }
  }, [token, conversationId]);

  // Initial load
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      await Promise.all([
        fetchMessages(undefined, initialContextMatchId || undefined),
        fetchConversation(),
      ]);
      setIsLoading(false);
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]); // Only reload on conversation change, not on every fetchMessages change

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Mark as read after initial load
  const markAsRead = useCallback(async () => {
    if (!token || hasMarkedRead.current) return;
    hasMarkedRead.current = true;

    try {
      await api.chat.markAsRead(token, conversationId);
    } catch {
      // Silently fail
    }
  }, [token, conversationId]);

  // Auto mark as read after loading (CHAT-001 fix: mark even with 0 messages)
  useEffect(() => {
    // Mark as read when loading completes, regardless of message count
    // This fixes conversations with no messages not being marked as read
    if (!isLoading && !error) {
      markAsRead();
    }
  }, [isLoading, error, markAsRead]);

  // Load older messages
  const loadOlderMessages = useCallback(async () => {
    if (!nextCursor || isLoadingOlder) return;
    setIsLoadingOlder(true);
    await fetchMessages(nextCursor);
    setIsLoadingOlder(false);
  }, [nextCursor, isLoadingOlder, fetchMessages]);

  // Send message with optimistic update
  const sendMessage = useCallback(
    async (text: string) => {
      if (!token || !user || !text.trim()) return;

      const tempId = generateTempId();
      const pendingMessage: PendingMessage = {
        id: tempId,
        tempId,
        senderId: user.id,
        text: text.trim(),
        createdAt: new Date().toISOString(),
        isPending: true,
        status: 'sending',
        contextMatchId: activeContextMatchId,
      };

      // Optimistically add message
      setMessages((prev) => [...prev, pendingMessage]);
      setIsSending(true);

      // Clear typing indicator
      sendTyping(false);

      try {
        const sentMessage = await api.chat.sendMessage(token, conversationId, {
          text: text.trim(),
          contextMatchId: activeContextMatchId || undefined,
        });

        // Replace pending with real message
        setMessages((prev) =>
          prev.map((msg) =>
            msg.tempId === tempId
              ? { ...sentMessage, isPending: false, isFailed: false, status: 'sent' as const }
              : msg
          )
        );
      } catch {
        // Mark as failed
        setMessages((prev) =>
          prev.map((msg) =>
            msg.tempId === tempId
              ? { ...msg, isPending: false, isFailed: true, status: 'failed' as const }
              : msg
          )
        );
      } finally {
        setIsSending(false);
      }
    },
    [token, user, conversationId, activeContextMatchId, sendTyping]
  );

  // Retry failed message
  const retryMessage = useCallback(
    async (tempId: string, text: string) => {
      if (!token || !user) return;

      // Find the original message to get its context
      const originalMsg = messages.find((m) => m.tempId === tempId);

      // Mark as pending again
      setMessages((prev) =>
        prev.map((msg) =>
          msg.tempId === tempId
            ? { ...msg, isPending: true, isFailed: false, status: 'sending' as const }
            : msg
        )
      );

      try {
        const sentMessage = await api.chat.sendMessage(token, conversationId, {
          text,
          contextMatchId: originalMsg?.contextMatchId || activeContextMatchId || undefined,
        });

        // Replace with real message
        setMessages((prev) =>
          prev.map((msg) =>
            msg.tempId === tempId
              ? { ...sentMessage, isPending: false, isFailed: false, status: 'sent' as const }
              : msg
          )
        );
      } catch {
        // Mark as failed again
        setMessages((prev) =>
          prev.map((msg) =>
            msg.tempId === tempId
              ? { ...msg, isPending: false, isFailed: true, status: 'failed' as const }
              : msg
          )
        );
      }
    },
    [token, user, conversationId, messages, activeContextMatchId]
  );

  // Set active context and refetch messages
  const setActiveContext = useCallback(
    (matchId: string) => {
      setActiveContextMatchId(matchId);
      // Refetch messages with new context
      setIsLoading(true);
      fetchMessages(undefined, matchId).finally(() => setIsLoading(false));
    },
    [fetchMessages]
  );

  return {
    messages,
    conversation,
    isLoading,
    isLoadingOlder,
    isSending,
    error,
    hasOlderMessages: !!nextCursor,
    loadOlderMessages,
    sendMessage,
    retryMessage,
    markAsRead,
    contexts,
    activeContextMatchId,
    setActiveContext,
    isRealTimeConnected: isConnected,
    isOtherUserTyping,
    sendTyping,
  };
}
