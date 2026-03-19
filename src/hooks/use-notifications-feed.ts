'use client';

import { useState, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts';
import { api } from '@/lib';
import type { Notification } from '@/types';

interface UseNotificationsFeedOptions {
  limit?: number;
}

interface UseNotificationsFeedReturn {
  notifications: Notification[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  fetchNotifications: () => Promise<void>;
  loadMore: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  updateNotification: (id: string, updates: Partial<Notification>) => void;
  refresh: () => Promise<void>;
}

export function useNotificationsFeed(
  options: UseNotificationsFeedOptions = {}
): UseNotificationsFeedReturn {
  const { limit = 20 } = options;
  const { token } = useAuth();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cursorRef = useRef<string | null>(null);

  // Normalize notification to handle both old and new API formats
  const normalizeNotification = (n: Notification): Notification => ({
    ...n,
    read: n.read ?? n.isRead ?? false,
    isRead: n.isRead ?? n.read ?? false,
    message: n.message ?? n.body ?? '',
    body: n.body ?? n.message ?? '',
  });

  // Fetch initial notifications
  const fetchNotifications = useCallback(async () => {
    if (!token) return;

    setIsLoading(true);
    setError(null);

    try {
      // Try new feed endpoint first, fallback to legacy
      try {
        const response = await api.notifications.getFeed(token, { limit });
        const normalized = response.items.map(normalizeNotification);
        setNotifications(normalized);
        cursorRef.current = response.nextCursor;
        setHasMore(!!response.nextCursor);
      } catch {
        // Fallback to legacy endpoint
        const items = await api.notifications.getAll(token, limit);
        const normalized = items.map(normalizeNotification);
        setNotifications(normalized);
        cursorRef.current = null;
        setHasMore(false);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      setError('Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  }, [token, limit]);

  // Load more notifications (pagination)
  const loadMore = useCallback(async () => {
    if (!token || !cursorRef.current || isLoadingMore) return;

    setIsLoadingMore(true);

    try {
      const response = await api.notifications.getFeed(token, {
        cursor: cursorRef.current,
        limit,
      });
      const normalized = response.items.map(normalizeNotification);
      setNotifications((prev) => [...prev, ...normalized]);
      cursorRef.current = response.nextCursor;
      setHasMore(!!response.nextCursor);
    } catch (err) {
      console.error('Failed to load more notifications:', err);
      setError('Failed to load more notifications');
    } finally {
      setIsLoadingMore(false);
    }
  }, [token, limit, isLoadingMore]);

  // Mark single notification as read (optimistic update)
  const markAsRead = useCallback(
    async (id: string) => {
      if (!token) return;

      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, read: true, isRead: true } : n
        )
      );

      try {
        await api.notifications.markAsRead(token, id);
      } catch (err) {
        console.error('Failed to mark notification as read:', err);
        // Revert on error
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === id ? { ...n, read: false, isRead: false } : n
          )
        );
      }
    },
    [token]
  );

  // Mark all notifications as read (optimistic update)
  const markAllAsRead = useCallback(async () => {
    if (!token) return;

    // Store previous state for rollback
    const previousNotifications = [...notifications];

    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, read: true, isRead: true }))
    );

    try {
      await api.notifications.markAllAsRead(token);
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
      // Revert on error
      setNotifications(previousNotifications);
    }
  }, [token, notifications]);

  // Delete notification (optimistic update)
  const deleteNotification = useCallback(
    async (id: string) => {
      if (!token) return;

      // Store for rollback
      const notification = notifications.find((n) => n.id === id);

      // Optimistic update
      setNotifications((prev) => prev.filter((n) => n.id !== id));

      try {
        await api.notifications.delete(token, id);
      } catch (err) {
        console.error('Failed to delete notification:', err);
        // Revert on error
        if (notification) {
          setNotifications((prev) => [...prev, notification].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          ));
        }
      }
    },
    [token, notifications]
  );

  // Update a notification locally
  const updateNotification = useCallback(
    (id: string, updates: Partial<Notification>) => {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, ...updates } : n))
      );
    },
    []
  );

  // Refresh notifications
  const refresh = useCallback(async () => {
    cursorRef.current = null;
    await fetchNotifications();
  }, [fetchNotifications]);

  return {
    notifications,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    fetchNotifications,
    loadMore,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    updateNotification,
    refresh,
  };
}
