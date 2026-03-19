'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { ConversationRow } from './conversation-row';
import { ConversationListSkeleton } from './skeletons';
import type { Conversation } from '@/types';

interface ConversationListProps {
  conversations: Conversation[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  query: string;
  onLoadMore: () => void;
}

export function ConversationList({
  conversations,
  isLoading,
  isLoadingMore,
  hasMore,
  error,
  query,
  onLoadMore,
}: ConversationListProps) {
  const t = useTranslations('chat');
  const router = useRouter();

  if (isLoading) {
    return <ConversationListSkeleton />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="w-16 h-16 mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <p className="text-[var(--color-text-secondary)]">{error}</p>
      </div>
    );
  }

  if (conversations.length === 0) {
    // Check if it's a search with no results or just empty
    if (query.trim()) {
      return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <div className="w-16 h-16 mb-4 rounded-full bg-[var(--color-surface)] flex items-center justify-center">
            <svg
              className="w-8 h-8 text-[var(--color-text-secondary)]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <p className="text-[var(--color-text-secondary)]">{t('noResults')}</p>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="w-20 h-20 mb-4 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center">
          <svg
            className="w-10 h-10 text-[var(--color-primary)]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-[var(--color-text)] mb-2">
          {t('noMessages')}
        </h3>
        <p className="text-[var(--color-text-secondary)] mb-6 max-w-xs">
          {t('noMessagesDescription')}
        </p>
        <button
          onClick={() => router.push('/matches')}
          className="px-6 py-2.5 bg-[var(--color-primary)] text-white font-medium rounded-full hover:bg-[var(--color-primary-hover)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
        >
          {t('goToMatches')}
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="divide-y divide-[var(--color-border)]">
        {conversations.map((conversation) => (
          <ConversationRow key={conversation.id} conversation={conversation} />
        ))}
      </div>

      {hasMore && (
        <div className="p-4">
          <button
            onClick={onLoadMore}
            disabled={isLoadingMore}
            className="w-full py-3 text-sm font-medium text-[var(--color-primary)] bg-[var(--color-surface)] rounded-lg hover:bg-[var(--color-surface-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
          >
            {isLoadingMore ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="w-4 h-4 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                {t('loading')}
              </span>
            ) : (
              t('loadMore')
            )}
          </button>
        </div>
      )}
    </div>
  );
}
