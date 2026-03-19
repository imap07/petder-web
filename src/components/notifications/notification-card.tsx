'use client';

import { useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import type { Notification, NotificationType } from '@/types';

interface NotificationCardProps {
  notification: Notification;
  onMarkRead?: (id: string) => void;
  onOpen?: (notification: Notification) => void;
  onDelete?: (id: string) => void;
}

// Get icon for notification type
function getTypeIcon(type: NotificationType): string {
  switch (type) {
    case 'match':
      return '💕';
    case 'like':
      return '❤️';
    case 'message':
      return '💬';
    case 'pet_status':
      return '🐾';
    case 'system':
    default:
      return '🔔';
  }
}

// Get background color class for notification type
function getTypeColorClass(type: NotificationType): string {
  switch (type) {
    case 'match':
      return 'bg-pink-100 dark:bg-pink-900/30';
    case 'like':
      return 'bg-red-100 dark:bg-red-900/30';
    case 'message':
      return 'bg-blue-100 dark:bg-blue-900/30';
    case 'pet_status':
      return 'bg-amber-100 dark:bg-amber-900/30';
    case 'system':
    default:
      return 'bg-gray-100 dark:bg-gray-700';
  }
}

// Format relative time
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffSecs < 60) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

// Get destination URL based on notification type
function getDestinationUrl(notification: Notification): string | null {
  const { type, meta, entity, data } = notification;

  // Try to get IDs from meta, entity, or data
  const matchId = meta?.matchId || entity?.id || (data?.matchId as string);
  const petId = meta?.petId || entity?.id || (data?.petId as string);
  const chatId = meta?.chatId || entity?.id || (data?.chatId as string);

  switch (type) {
    case 'match':
      return matchId ? `/matches` : null; // TODO: /matches/:id when implemented
    case 'message':
      return chatId ? `/chats/${chatId}` : null;
    case 'like':
      return '/discover';
    case 'pet_status':
      return petId ? `/pets/${petId}/edit` : '/pets';
    case 'system':
    default:
      return null;
  }
}

// Get action button text
function getActionText(type: NotificationType, t: (key: string) => string): string | null {
  switch (type) {
    case 'match':
      return t('actions.viewMatch');
    case 'message':
      return t('actions.openChat');
    case 'like':
      return t('actions.viewPet');
    case 'pet_status':
      return t('actions.managePet');
    case 'system':
    default:
      return null;
  }
}

export function NotificationCard({
  notification,
  onMarkRead,
  onOpen,
  onDelete,
}: NotificationCardProps) {
  const t = useTranslations('notifications');
  const router = useRouter();

  const isRead = notification.read || notification.isRead || false;
  const body = notification.body || notification.message || '';
  const destinationUrl = useMemo(() => getDestinationUrl(notification), [notification]);
  const actionText = useMemo(() => getActionText(notification.type, t), [notification.type, t]);
  const relativeTime = useMemo(
    () => formatRelativeTime(notification.createdAt),
    [notification.createdAt]
  );

  const handleClick = useCallback(() => {
    // Mark as read if unread
    if (!isRead && onMarkRead) {
      onMarkRead(notification.id);
    }

    // Call onOpen callback
    if (onOpen) {
      onOpen(notification);
    }

    // Navigate to destination
    if (destinationUrl) {
      router.push(destinationUrl);
    }
  }, [isRead, onMarkRead, onOpen, notification, destinationUrl, router]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleClick();
      }
    },
    [handleClick]
  );

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (onDelete) {
        onDelete(notification.id);
      }
    },
    [onDelete, notification.id]
  );

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`
        relative flex gap-4 p-4 rounded-xl border transition-all cursor-pointer
        focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
        dark:focus:ring-offset-gray-900
        ${
          isRead
            ? 'bg-surface dark:bg-gray-800 border-border dark:border-gray-700 hover:bg-surface-hover dark:hover:bg-gray-750'
            : 'bg-primary/5 dark:bg-primary/10 border-primary/30 dark:border-primary/40 hover:bg-primary/10 dark:hover:bg-primary/15'
        }
      `}
      aria-label={`${notification.title}. ${body}. ${relativeTime}`}
    >
      {/* Unread indicator dot */}
      {!isRead && (
        <div className="absolute top-4 right-4 w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
      )}

      {/* Avatar / Icon */}
      <div className="flex-shrink-0">
        {notification.actor?.avatarUrl ? (
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-border dark:border-gray-600">
            <img
              src={notification.actor.avatarUrl}
              alt={notification.actor.displayName}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div
            className={`
              w-12 h-12 rounded-full flex items-center justify-center text-2xl
              ${getTypeColorClass(notification.type)}
            `}
          >
            {getTypeIcon(notification.type)}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pr-8">
        {/* Title */}
        <h3
          className={`
            text-sm leading-tight mb-1
            ${isRead ? 'font-medium text-text' : 'font-semibold text-text'}
          `}
        >
          {notification.title}
        </h3>

        {/* Body - truncated to 2 lines */}
        {body && (
          <p className="text-sm text-text-muted line-clamp-2 mb-2">{body}</p>
        )}

        {/* Footer: Time + Action */}
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-text-muted">{relativeTime}</span>

          {actionText && destinationUrl && (
            <span className="text-xs font-medium text-primary hover:text-primary-dark transition-colors">
              {actionText}
              <svg
                className="inline-block w-3 h-3 ml-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </span>
          )}
        </div>
      </div>

      {/* Delete button */}
      {onDelete && (
        <button
          onClick={handleDelete}
          className="absolute top-4 right-10 p-1.5 rounded-lg text-text-muted hover:text-error hover:bg-error/10 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
          aria-label={t('actions.delete')}
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  );
}

export default NotificationCard;
