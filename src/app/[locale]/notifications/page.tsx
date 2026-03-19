'use client';

import { useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { useNotifications } from '@/contexts';
import { useNotificationsFeed } from '@/hooks';
import { ProtectedRoute } from '@/components/auth';
import { NotificationCard } from '@/components/notifications';
import { Button, Card } from '@/components/ui';
import type { Notification } from '@/types';

function NotificationsContent() {
  const t = useTranslations('notifications');
  const { isConnected } = useNotifications();

  const {
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
  } = useNotificationsFeed({ limit: 20 });

  // Fetch notifications on mount
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Count unread notifications
  const unreadCount = notifications.filter((n) => !n.read && !n.isRead).length;

  const handleNotificationOpen = useCallback((notification: Notification) => {
    console.log('Notification opened:', notification.id);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-text-muted">{t('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-text">{t('title')}</h1>
            <div className="flex items-center gap-3 mt-1">
              {unreadCount > 0 && (
                <span className="text-sm text-text-muted">
                  {t('unreadCount', { count: unreadCount })}
                </span>
              )}
              {/* Connection status indicator */}
              <span
                className={`inline-flex items-center gap-1.5 text-xs ${
                  isConnected ? 'text-success' : 'text-text-muted'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isConnected ? 'bg-success animate-pulse' : 'bg-gray-400'
                  }`}
                />
                {isConnected ? t('status.live') : t('status.offline')}
              </span>
            </div>
          </div>

          {/* Actions */}
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={markAllAsRead}
              className="self-start sm:self-auto"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              {t('markAllAsRead')}
            </Button>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className="p-4 rounded-lg bg-error-bg dark:bg-error/20 border border-error/20 text-error mb-6 flex items-center gap-2">
            <svg
              className="w-5 h-5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {error}
          </div>
        )}

        {/* Notifications List */}
        {notifications.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-surface-alt dark:bg-gray-700 flex items-center justify-center">
              <svg
                className="w-10 h-10 text-text-muted"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-text mb-2">
              {t('empty.title')}
            </h2>
            <p className="text-text-muted mb-6 max-w-sm mx-auto">
              {t('empty.subtitle')}
            </p>
            <Link href="/discover">
              <Button>
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                {t('empty.cta')}
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                onMarkRead={markAsRead}
                onOpen={handleNotificationOpen}
                onDelete={deleteNotification}
              />
            ))}

            {/* Load More Button */}
            {hasMore && (
              <div className="pt-4 text-center">
                <Button
                  variant="outline"
                  onClick={loadMore}
                  isLoading={isLoadingMore}
                  className="min-w-[200px]"
                >
                  {isLoadingMore ? t('loadingMore') : t('loadMore')}
                </Button>
              </div>
            )}

            {/* End of list indicator */}
            {!hasMore && notifications.length > 0 && (
              <p className="text-center text-sm text-text-muted pt-4">
                {t('endOfList')}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  return (
    <ProtectedRoute>
      <NotificationsContent />
    </ProtectedRoute>
  );
}
