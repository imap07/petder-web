'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { ProtectedRoute } from '@/components/auth';
import { Toast } from '@/components/ui';
import {
  useMatchesFeed,
  MatchCard,
  MatchCardSkeleton,
  MatchesEmptyState,
  NewMatchesCarousel,
  NewMatchesCarouselSkeleton,
} from '@/features/matches';
import type { MatchDisplay } from '@/types';

function MatchesContent() {
  const t = useTranslations('matches');
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const {
    newMatches,
    conversationMatches,
    matches,
    isLoading,
    isRefreshing,
    error,
    counts,
    setQuery,
    refresh,
  } = useMatchesFeed();

  // Filter matches based on local search
  const displayedMatches = searchQuery
    ? matches.filter(
        (m) =>
          m.pet?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.otherOwner?.displayName?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : matches;

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setQuery(value);
  };

  // Handle match selection - chat-first navigation
  const handleMatchSelect = useCallback(
    (match: MatchDisplay) => {
      const chatId = match.conversationId || match.chatId;
      
      if (chatId) {
        // Navigate to chat with match context
        router.push(`/messages/${chatId}?contextMatchId=${match.id}`);
      } else {
        // Show toast if conversation not ready
        setToastMessage(t('conversationNotReady') || 'Conversation not ready yet');
      }
    },
    [router, t]
  );

  return (
    <div className="min-h-[calc(100vh-64px)] bg-surface dark:bg-gray-900">
      <div className="max-w-2xl mx-auto">
        {/* Header - Fixed style like Tinder */}
        <div className="sticky top-0 z-10 bg-surface/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-border dark:border-gray-800 px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-text">{t('title')}</h1>
            {!isLoading && counts.all > 0 && (
              <button
                onClick={refresh}
                disabled={isRefreshing}
                className={`p-2 -mr-2 rounded-full text-text-muted hover:text-primary hover:bg-primary/10 transition-all ${
                  isRefreshing ? 'animate-spin' : ''
                }`}
                aria-label={t('refresh')}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="p-4">
            {/* Search skeleton */}
            <div className="h-10 bg-surface-alt dark:bg-gray-800 rounded-full animate-pulse mb-4" />
            {/* Carousel skeleton */}
            <div className="mb-4">
              <div className="h-3 w-24 bg-surface-alt dark:bg-gray-700 rounded animate-pulse mb-3" />
              <NewMatchesCarouselSkeleton />
            </div>
            {/* Divider */}
            <div className="h-px bg-border dark:bg-gray-800 mb-4" />
            {/* Messages label skeleton */}
            <div className="h-3 w-20 bg-surface-alt dark:bg-gray-700 rounded animate-pulse mb-2" />
            {/* Cards skeleton */}
            <div className="space-y-0.5">
              {[...Array(5)].map((_, i) => (
                <MatchCardSkeleton key={i} animationDelay={i * 100} />
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="p-4">
            <MatchesEmptyState type="error" onRetry={refresh} />
          </div>
        ) : counts.all === 0 ? (
          <div className="p-4">
            <MatchesEmptyState type="no-matches" />
          </div>
        ) : (
          <div className="p-4">
            {/* Search bar - Clean minimal design */}
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
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder={t('searchPlaceholder')}
                className="w-full pl-9 pr-4 py-2.5 text-sm bg-surface-alt dark:bg-gray-800 border-0 rounded-full text-text placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              {searchQuery && (
                <button
                  onClick={() => handleSearch('')}
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

            {/* Search results view */}
            {searchQuery ? (
              displayedMatches.length === 0 ? (
                <MatchesEmptyState type="no-results" query={searchQuery} />
              ) : (
                <div className="space-y-0.5">
                  {displayedMatches.map((match, index) => (
                    <MatchCard 
                      key={match.id} 
                      match={match} 
                      animationDelay={index * 50}
                      onSelect={handleMatchSelect}
                    />
                  ))}
                </div>
              )
            ) : (
              /* Default view with carousel + list */
              <>
                {/* New Matches Section */}
                {newMatches.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                        {t('newMatches')}
                      </span>
                      <span className="text-xs text-primary font-medium">{newMatches.length}</span>
                    </div>
                    <NewMatchesCarousel matches={newMatches} onMatchSelect={handleMatchSelect} />
                  </div>
                )}

                {/* Divider */}
                {newMatches.length > 0 && conversationMatches.length > 0 && (
                  <div className="h-px bg-border dark:bg-gray-800 mb-4" />
                )}

                {/* Messages Section */}
                {(conversationMatches.length > 0 || newMatches.length > 0) && (
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                      {t('messages')}
                    </span>
                    {conversationMatches.length > 0 && (
                      <span className="text-xs text-text-muted">{conversationMatches.length}</span>
                    )}
                  </div>
                )}

                {conversationMatches.length > 0 ? (
                  <div className="space-y-0.5">
                    {conversationMatches.map((match, index) => (
                      <MatchCard 
                        key={match.id} 
                        match={match} 
                        animationDelay={index * 50}
                        onSelect={handleMatchSelect}
                      />
                    ))}
                  </div>
                ) : newMatches.length > 0 ? (
                  /* Only new matches, invite to chat */
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                      <svg className="w-8 h-8 text-primary/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                      </svg>
                    </div>
                    <p className="text-sm text-text-muted max-w-[200px] mx-auto">{t('startConversationHint')}</p>
                  </div>
                ) : null}
              </>
            )}
          </div>
        )}
      </div>

      {/* Toast for conversation not ready */}
      {toastMessage && (
        <Toast
          message={toastMessage}
          type="info"
          duration={3000}
          onClose={() => setToastMessage(null)}
        />
      )}
    </div>
  );
}

export default function MatchesPage() {
  return (
    <ProtectedRoute>
      <MatchesContent />
    </ProtectedRoute>
  );
}
