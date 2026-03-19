'use client';

import { useCallback, useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import type { MatchFilter } from '@/types';

interface MatchFiltersProps {
  filter: MatchFilter;
  onFilterChange: (filter: MatchFilter) => void;
  query: string;
  onQueryChange: (query: string) => void;
  counts: {
    all: number;
    unread: number;
    new: number;
  };
}

const FILTERS: MatchFilter[] = ['all', 'unread', 'new'];

export function MatchFilters({
  filter,
  onFilterChange,
  query,
  onQueryChange,
  counts,
}: MatchFiltersProps) {
  const t = useTranslations('matches');
  const [localQuery, setLocalQuery] = useState(query);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      onQueryChange(localQuery);
    }, 250);

    return () => clearTimeout(timer);
  }, [localQuery, onQueryChange]);

  // Sync external query changes
  useEffect(() => {
    setLocalQuery(query);
  }, [query]);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setLocalQuery(e.target.value);
    },
    []
  );

  const handleClearSearch = useCallback(() => {
    setLocalQuery('');
    onQueryChange('');
  }, [onQueryChange]);

  const getFilterLabel = (f: MatchFilter): string => {
    switch (f) {
      case 'all':
        return t('filters.all');
      case 'unread':
        return t('filters.unread');
      case 'new':
        return t('filters.new');
      default:
        return f;
    }
  };

  const getFilterCount = (f: MatchFilter): number => {
    return counts[f] || 0;
  };

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg
            className="w-5 h-5 text-text-muted"
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
          value={localQuery}
          onChange={handleSearchChange}
          placeholder={t('searchPlaceholder')}
          className="
            w-full pl-10 pr-10 py-2.5 rounded-xl
            bg-surface dark:bg-gray-800
            border border-border dark:border-gray-700
            text-text placeholder-text-muted
            focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
            transition-all
          "
          aria-label={t('searchPlaceholder')}
        />
        {localQuery && (
          <button
            onClick={handleClearSearch}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-muted hover:text-text transition-colors"
            aria-label={t('clearSearch')}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

      {/* Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {FILTERS.map((f) => {
          const isActive = filter === f;
          const count = getFilterCount(f);

          return (
            <button
              key={f}
              onClick={() => onFilterChange(f)}
              className={`
                inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium
                transition-all whitespace-nowrap
                focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
                dark:focus:ring-offset-gray-900
                ${
                  isActive
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-surface dark:bg-gray-800 text-text-muted border border-border dark:border-gray-700 hover:border-primary/30 hover:text-text'
                }
              `}
              aria-pressed={isActive}
            >
              {getFilterLabel(f)}
              {count > 0 && (
                <span
                  className={`
                    px-1.5 py-0.5 text-xs rounded-full
                    ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-surface-alt dark:bg-gray-700 text-text-muted'
                    }
                  `}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default MatchFilters;
