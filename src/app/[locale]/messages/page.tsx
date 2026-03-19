'use client';

import { useState, useCallback, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { ProtectedRoute } from '@/components/auth';
import { useConversationsFeed, ConversationList } from '@/features/chat';

function MessagesContent() {
  const t = useTranslations('chat');
  const {
    filteredConversations,
    isLoading,
    isLoadingMore,
    error,
    query,
    hasMore,
    totalUnread,
    setQuery,
    loadMore,
  } = useConversationsFeed();

  const [searchValue, setSearchValue] = useState('');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(searchValue);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchValue, setQuery]);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchValue(e.target.value);
    },
    []
  );

  return (
    <div className="min-h-[calc(100vh-64px)] bg-surface dark:bg-gray-900">
      <div className="max-w-2xl mx-auto">
        {/* Header - Same style as Matches */}
        <div className="sticky top-0 z-10 bg-surface/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-border dark:border-gray-800 px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-text">{t('messages')}</h1>
            {totalUnread > 0 && (
              <span className="px-2.5 py-1 text-xs font-bold text-white bg-primary rounded-full">
                {totalUnread > 99 ? '99+' : totalUnread}
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Search bar - Same style as Matches */}
          <div className="relative mb-4">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <svg
                className="w-4 h-4 text-text-muted"
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
            </div>
            <input
              type="text"
              value={searchValue}
              onChange={handleSearchChange}
              placeholder={t('searchPlaceholder')}
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-surface-alt dark:bg-gray-800 border-0 rounded-full text-text placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            {searchValue && (
              <button
                onClick={() => setSearchValue('')}
                className="absolute inset-y-0 right-3 flex items-center text-text-muted hover:text-text"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

          {/* Conversation List */}
          <ConversationList
            conversations={filteredConversations}
            isLoading={isLoading}
            isLoadingMore={isLoadingMore}
            hasMore={hasMore}
            error={error}
            query={query}
            onLoadMore={loadMore}
          />
        </div>
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <ProtectedRoute>
      <MessagesContent />
    </ProtectedRoute>
  );
}
