'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './auth-context';
import { api } from '@/lib';
import type { Notification } from '@/types';

interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  isConnected: boolean;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { token, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    if (!token) return;

    setIsLoading(true);
    try {
      const [notifs, countResponse] = await Promise.all([
        api.notifications.getAll(token, 50),
        api.notifications.getUnreadCount(token),
      ]);
      setNotifications(notifs);
      setUnreadCount(countResponse.count);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  // Mark single notification as read
  const markAsRead = useCallback(async (id: string) => {
    if (!token) return;

    try {
      await api.notifications.markAsRead(token, id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }, [token]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!token) return;

    try {
      await api.notifications.markAllAsRead(token);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  }, [token]);

  // Delete a notification
  const deleteNotification = useCallback(async (id: string) => {
    if (!token) return;

    try {
      await api.notifications.delete(token, id);
      const notification = notifications.find((n) => n.id === id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      if (notification && !notification.read) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  }, [token, notifications]);

  // Setup WebSocket connection
  useEffect(() => {
    if (!isAuthenticated || !token) {
      // Cleanup if not authenticated
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
      return;
    }

    // Create socket connection
    const socket = io(`${API_URL}/notifications`, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Notifications WebSocket connected');
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('Notifications WebSocket disconnected');
      setIsConnected(false);
    });

    socket.on('connected', (data: { userId: string }) => {
      console.log('Authenticated to notifications:', data.userId);
    });

    // Handle new notification
    socket.on('notification', (notification: Notification) => {
      console.log('New notification received:', notification);
      setNotifications((prev) => [notification, ...prev]);
      if (!notification.read) {
        setUnreadCount((prev) => prev + 1);
      }
    });

    // Handle new match event
    socket.on('new_match', (data: { matchId: string; petName: string; ownerName: string }) => {
      console.log('New match event:', data);
      // The notification will be sent via the 'notification' event as well
    });

    // Handle unread count update
    socket.on('unread_count', (data: { count: number }) => {
      setUnreadCount(data.count);
    });

    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
    });

    // Fetch initial notifications
    fetchNotifications();

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, token, fetchNotifications]);

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        isConnected,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
}
