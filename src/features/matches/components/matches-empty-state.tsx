'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui';

interface MatchesEmptyStateProps {
  type: 'no-matches' | 'no-results' | 'error';
  query?: string;
  onRetry?: () => void;
}

// Animated heart icon for no-matches state
function AnimatedHeartIcon() {
  return (
    <div className="relative">
      {/* Pulsing background circles */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="w-32 h-32 rounded-full bg-primary/5 animate-ping"
          style={{ animationDuration: '3s' }}
        />
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="w-24 h-24 rounded-full bg-primary/10 animate-ping"
          style={{ animationDuration: '2s', animationDelay: '0.5s' }}
        />
      </div>

      {/* Main icon container */}
      <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
        {/* Pet silhouettes */}
        <div
          className="absolute -left-2 top-1/2 -translate-y-1/2 text-4xl opacity-60 animate-bounce"
          style={{ animationDelay: '0.2s', animationDuration: '2s' }}
        >
          🐕
        </div>
        <div
          className="absolute -right-2 top-1/2 -translate-y-1/2 text-4xl opacity-60 animate-bounce"
          style={{ animationDelay: '0.5s', animationDuration: '2s' }}
        >
          🐱
        </div>

        {/* Heart */}
        <svg className="w-14 h-14 text-primary animate-pulse" fill="currentColor" viewBox="0 0 24 24">
          <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      </div>
    </div>
  );
}

// Search icon for no-results state
function SearchNotFoundIcon() {
  return (
    <div className="relative w-24 h-24 rounded-full bg-surface-alt dark:bg-gray-700 flex items-center justify-center">
      <svg className="w-12 h-12 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
      {/* X mark overlay */}
      <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-error/10 flex items-center justify-center">
        <svg className="w-4 h-4 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
    </div>
  );
}

// Error icon
function ErrorIcon() {
  return (
    <div className="relative w-24 h-24 rounded-full bg-error/10 dark:bg-error/20 flex items-center justify-center">
      <svg className="w-12 h-12 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
    </div>
  );
}

export function MatchesEmptyState({ type, query, onRetry }: MatchesEmptyStateProps) {
  const t = useTranslations('matches');

  if (type === 'error') {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <ErrorIcon />
        <h3 className="text-xl font-semibold text-text mt-6 mb-2">{t('error.title')}</h3>
        <p className="text-text-muted mb-6 max-w-sm">{t('error.description')}</p>
        {onRetry && (
          <Button onClick={onRetry} variant="outline">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            {t('error.retry')}
          </Button>
        )}
      </div>
    );
  }

  if (type === 'no-results') {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <SearchNotFoundIcon />
        <h3 className="text-xl font-semibold text-text mt-6 mb-2">{t('noResults.title')}</h3>
        <p className="text-text-muted max-w-sm">{t('noResults.description', { query: query || '' })}</p>
      </div>
    );
  }

  // No matches at all - main empty state
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <AnimatedHeartIcon />
      <h3 className="text-2xl font-bold text-text mt-8 mb-3">{t('empty.title')}</h3>
      <p className="text-text-muted mb-8 max-w-md leading-relaxed">{t('empty.description')}</p>
      <Link href="/discover">
        <Button size="lg" className="shadow-lg hover:shadow-xl transition-shadow">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

      {/* Decorative paw prints */}
      <div className="mt-12 flex gap-4 opacity-20">
        <span className="text-2xl">🐾</span>
        <span className="text-2xl">🐾</span>
        <span className="text-2xl">🐾</span>
      </div>
    </div>
  );
}

export default MatchesEmptyState;
