'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import type { Conversation } from '@/types';

interface ConversationRowProps {
  conversation: Conversation;
  onSelect?: (conversation: Conversation) => void;
}

// Check if conversation has multiple contexts
function hasMultipleContexts(conversation: Conversation): boolean {
  return (conversation.contexts?.length || 0) > 1;
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function ConversationRow({
  conversation,
  onSelect,
}: ConversationRowProps) {
  const t = useTranslations('chat');
  const router = useRouter();

  // Get the other participant (first one in the list)
  const otherParticipant = conversation.participants[0];
  const displayName = otherParticipant?.displayName || 'Unknown';
  const avatarUrl = otherParticipant?.avatarUrl;
  const initials = getInitials(displayName);

  const timeAgo = useMemo(
    () => formatRelativeTime(conversation.updatedAt),
    [conversation.updatedAt]
  );

  const previewText = conversation.lastMessage?.text || t('sayHi');
  const hasUnread = conversation.unreadCount > 0;
  const isMultiContext = hasMultipleContexts(conversation);

  const handleClick = () => {
    if (onSelect) {
      onSelect(conversation);
    }
    // Navigate to chat without forcing a specific context
    router.push(`/messages/${conversation.id}`);
  };

  return (
    <button
      onClick={handleClick}
      className={`
        w-full flex items-center gap-3 p-3 rounded-xl
        text-left transition-all duration-200
        hover:bg-surface-alt dark:hover:bg-gray-800/50
        active:scale-[0.98]
        focus:outline-none focus:bg-surface-alt dark:focus:bg-gray-800/50
        ${hasUnread ? 'bg-primary/5 dark:bg-primary/10' : ''}
      `}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={displayName}
            className="w-14 h-14 rounded-full object-cover"
          />
        ) : (
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-pink-500 flex items-center justify-center">
            <span className="text-white font-semibold text-base">{initials}</span>
          </div>
        )}
        {hasUnread && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-surface dark:border-gray-900">
            {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={`text-[15px] truncate ${
                hasUnread ? 'font-semibold text-text' : 'font-medium text-text'
              }`}
            >
              {displayName}
            </span>
            {/* Multi-context badge */}
            {isMultiContext && (
              <span className="flex-shrink-0 px-1.5 py-0.5 text-[10px] font-medium rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                {conversation.contexts?.length}
              </span>
            )}
          </div>
          <span className={`text-xs flex-shrink-0 ${hasUnread ? 'text-primary font-medium' : 'text-text-muted'}`}>
            {timeAgo}
          </span>
        </div>
        <p
          className={`text-sm truncate mt-0.5 ${
            hasUnread ? 'text-text font-medium' : 'text-text-muted'
          }`}
        >
          {previewText}
        </p>
      </div>
    </button>
  );
}
