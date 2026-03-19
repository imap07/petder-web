'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts';
import api from '@/lib/api';
import type { Conversation } from '@/types';

interface UseConversationsFeedReturn {
  conversations: Conversation[];
  filteredConversations: Conversation[];
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  query: string;
  hasMore: boolean;
  totalUnread: number;
  setQuery: (query: string) => void;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  markAsRead: (conversationId: string) => void;
}

export function useConversationsFeed(): UseConversationsFeedReturn {
  const { token } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const fetchConversations = useCallback(
    async (cursor?: string) => {
      if (!token) return;

      try {
        const response = await api.chat.listConversations(token, {
          limit: 20,
          cursor,
        });

        if (cursor) {
          setConversations((prev) => [...prev, ...response.items]);
        } else {
          setConversations(response.items);
        }
        setNextCursor(response.nextCursor);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load conversations');
      }
    },
    [token]
  );

  // Initial load
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      await fetchConversations();
      setIsLoading(false);
    };
    load();
  }, [fetchConversations]);

  // Load more
  const loadMore = useCallback(async () => {
    if (!nextCursor || isLoadingMore) return;
    setIsLoadingMore(true);
    await fetchConversations(nextCursor);
    setIsLoadingMore(false);
  }, [nextCursor, isLoadingMore, fetchConversations]);

  // Refresh
  const refresh = useCallback(async () => {
    setIsLoading(true);
    setNextCursor(null);
    await fetchConversations();
    setIsLoading(false);
  }, [fetchConversations]);

  // Filter by search query
  const filteredConversations = useMemo(() => {
    if (!query.trim()) return conversations;

    const lowerQuery = query.toLowerCase().trim();
    return conversations.filter((conv) =>
      conv.participants.some((p) =>
        p.displayName.toLowerCase().includes(lowerQuery)
      )
    );
  }, [conversations, query]);

  // Total unread count
  const totalUnread = useMemo(
    () => conversations.reduce((sum, conv) => sum + conv.unreadCount, 0),
    [conversations]
  );

  // Optimistically mark as read
  const markAsRead = useCallback((conversationId: string) => {
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv
      )
    );
  }, []);

  return {
    conversations,
    filteredConversations,
    isLoading,
    isLoadingMore,
    error,
    query,
    hasMore: !!nextCursor,
    totalUnread,
    setQuery,
    loadMore,
    refresh,
    markAsRead,
  };
}
