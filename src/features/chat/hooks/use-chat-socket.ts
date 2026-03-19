'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/contexts';
import type { ChatMessage } from '@/types';

// Use dedicated socket URL or fallback to API URL
// In production, WebSocket might be on a different port/domain
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050';

// Typing indicator timeout - same value for sender and receiver to avoid desync
export const TYPING_TIMEOUT_MS = 3000;

interface NewMessageEvent {
  conversationId: string;
  message: {
    id: string;
    senderId: string;
    text: string;
    createdAt: string;
    contextMatchId?: string | null;
  };
}

interface MessageReadEvent {
  conversationId: string;
  readBy: string;
  readAt: string;
}

interface TypingEvent {
  conversationId: string;
  userId: string;
  isTyping: boolean;
}

interface UseChatSocketOptions {
  conversationId?: string;
  onNewMessage?: (message: ChatMessage) => void;
  onMessagesRead?: (event: MessageReadEvent) => void;
  onUserTyping?: (event: TypingEvent) => void;
  onUserJoined?: (userId: string) => void;
}

interface UseChatSocketReturn {
  isConnected: boolean;
  isConnecting: boolean;
  sendTyping: (isTyping: boolean) => void;
  joinConversation: (conversationId: string) => void;
  leaveConversation: (conversationId: string) => void;
}

export function useChatSocket(options: UseChatSocketOptions = {}): UseChatSocketReturn {
  const { conversationId, onNewMessage, onMessagesRead, onUserTyping, onUserJoined } = options;
  const { token, isAuthenticated } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // Use refs for callbacks to avoid re-registering event listeners on every render
  // This fixes the memory leak issue (CHAT-008)
  const callbacksRef = useRef({ onNewMessage, onMessagesRead, onUserTyping, onUserJoined });
  callbacksRef.current = { onNewMessage, onMessagesRead, onUserTyping, onUserJoined };

  // Connect to socket
  useEffect(() => {
    if (!isAuthenticated || !token) {
      return;
    }

    setIsConnecting(true);

    const socket = io(`${SOCKET_URL}/chat`, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[ChatSocket] Connected');
      setIsConnected(true);
      setIsConnecting(false);
    });

    socket.on('disconnect', (reason) => {
      console.log('[ChatSocket] Disconnected:', reason);
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('[ChatSocket] Connection error:', error);
      setIsConnecting(false);
    });

    socket.on('connected', (data) => {
      console.log('[ChatSocket] Authenticated:', data);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
      setIsConnecting(false);
    };
  }, [isAuthenticated, token]);

  // Join conversation room when conversationId changes
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !isConnected || !conversationId) return;

    socket.emit('join_conversation', { conversationId });

    return () => {
      socket.emit('leave_conversation', { conversationId });
    };
  }, [isConnected, conversationId]);

  // Set up event listeners - using stable refs to avoid memory leaks (CHAT-008 fix)
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const handleNewMessage = (event: NewMessageEvent) => {
      console.log('[ChatSocket] New message:', event);
      const { onNewMessage } = callbacksRef.current;
      if (onNewMessage && (!conversationId || event.conversationId === conversationId)) {
        onNewMessage({
          id: event.message.id,
          senderId: event.message.senderId,
          text: event.message.text,
          createdAt: event.message.createdAt,
          contextMatchId: event.message.contextMatchId,
          status: 'delivered',
        });
      }
    };

    const handleMessagesRead = (event: MessageReadEvent) => {
      console.log('[ChatSocket] Messages read:', event);
      const { onMessagesRead } = callbacksRef.current;
      if (onMessagesRead && (!conversationId || event.conversationId === conversationId)) {
        onMessagesRead(event);
      }
    };

    const handleUserTyping = (event: TypingEvent) => {
      const { onUserTyping } = callbacksRef.current;
      if (onUserTyping && (!conversationId || event.conversationId === conversationId)) {
        onUserTyping(event);
      }
    };

    const handleUserJoined = (data: { userId: string }) => {
      const { onUserJoined } = callbacksRef.current;
      if (onUserJoined) {
        onUserJoined(data.userId);
      }
    };

    socket.on('new_message', handleNewMessage);
    socket.on('messages_read', handleMessagesRead);
    socket.on('user_typing', handleUserTyping);
    socket.on('user_joined', handleUserJoined);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('messages_read', handleMessagesRead);
      socket.off('user_typing', handleUserTyping);
      socket.off('user_joined', handleUserJoined);
    };
  }, [conversationId, isConnected]); // Only re-register when conversationId or connection changes

  // Send typing indicator
  const sendTyping = useCallback((isTyping: boolean) => {
    const socket = socketRef.current;
    if (!socket || !isConnected || !conversationId) return;
    socket.emit('typing', { conversationId, isTyping });
  }, [isConnected, conversationId]);

  // Join a conversation room
  const joinConversation = useCallback((convId: string) => {
    const socket = socketRef.current;
    if (!socket || !isConnected) return;
    socket.emit('join_conversation', { conversationId: convId });
  }, [isConnected]);

  // Leave a conversation room
  const leaveConversation = useCallback((convId: string) => {
    const socket = socketRef.current;
    if (!socket || !isConnected) return;
    socket.emit('leave_conversation', { conversationId: convId });
  }, [isConnected]);

  return {
    isConnected,
    isConnecting,
    sendTyping,
    joinConversation,
    leaveConversation,
  };
}
