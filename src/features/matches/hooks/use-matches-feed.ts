'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts';
import { api } from '@/lib';
import type { EnhancedMatch, MatchDisplay, MatchFilter, ApiMatchResponse } from '@/types/match';

interface UseMatchesFeedOptions {
  initialFilter?: MatchFilter;
  pageSize?: number;
}

interface UseMatchesFeedReturn {
  matches: MatchDisplay[];
  filteredMatches: MatchDisplay[];
  newMatches: MatchDisplay[];
  conversationMatches: MatchDisplay[];
  isLoading: boolean;
  isRefreshing: boolean;
  isLoadingMore: boolean;
  error: string | null;
  filter: MatchFilter;
  query: string;
  selectedMatchId: string | null;
  hasMore: boolean;
  totalCount: number;
  setFilter: (filter: MatchFilter) => void;
  setQuery: (query: string) => void;
  setSelectedMatchId: (id: string | null) => void;
  fetchMatches: () => Promise<void>;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  counts: {
    all: number;
    unread: number;
    new: number;
  };
}

// Check if match was created within last 48 hours (extended window for "new")
function isNewMatch(createdAt: string): boolean {
  const matchDate = new Date(createdAt);
  const now = new Date();
  const diffHours = (now.getTime() - matchDate.getTime()) / (1000 * 60 * 60);
  return diffHours < 48;
}

// Transform API match response to enhanced match
function transformMatch(raw: ApiMatchResponse): EnhancedMatch {
  return {
    id: raw.id,
    createdAt: raw.createdAt,
    // Use otherPet if available, fallback to deprecated pet field
    pet: raw.otherPet || raw.pet
      ? {
          id: (raw.otherPet || raw.pet)!.id,
          name: (raw.otherPet || raw.pet)!.name,
          photoUrl: (raw.otherPet || raw.pet)!.photoUrl,
          species: (raw.otherPet || raw.pet)!.species,
        }
      : null,
    myPet: raw.myPet
      ? {
          id: raw.myPet.id,
          name: raw.myPet.name,
          photoUrl: raw.myPet.photoUrl,
          species: raw.myPet.species,
        }
      : null,
    otherPet: raw.otherPet
      ? {
          id: raw.otherPet.id,
          name: raw.otherPet.name,
          photoUrl: raw.otherPet.photoUrl,
          species: raw.otherPet.species,
        }
      : null,
    otherOwner: raw.otherOwner
      ? {
          id: raw.otherOwner.id,
          displayName: raw.otherOwner.displayName,
          avatarUrl: raw.otherOwner.avatarUrl,
        }
      : null,
    lastMessage: null,
    unreadCount: 0,
    chatId: raw.conversationId || undefined,
    conversationId: raw.conversationId || undefined,
    matchIntent: raw.matchIntent,
    contextCount: raw.contextCount,
  };
}

// Create display match with computed fields
function createDisplayMatch(match: EnhancedMatch): MatchDisplay {
  const petName = match.pet?.name || 'Unknown Pet';
  const ownerName = match.otherOwner?.displayName || 'Someone';
  const hasMessages = !!match.lastMessage;
  const isNew = isNewMatch(match.createdAt);

  return {
    ...match,
    displayTitle: `${petName} - ${ownerName}`,
    previewText: match.lastMessage?.text || '',
    sortKey: match.lastMessage
      ? new Date(match.lastMessage.createdAt).getTime()
      : new Date(match.createdAt).getTime(),
    isNew,
    hasMessages,
  };
}

export function useMatchesFeed(
  options: UseMatchesFeedOptions = {}
): UseMatchesFeedReturn {
  const { initialFilter = 'all', pageSize = 20 } = options;
  const { token } = useAuth();

  const [matches, setMatches] = useState<MatchDisplay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<MatchFilter>(initialFilter);
  const [query, setQuery] = useState('');
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  // Ref to track if we've done initial load
  const hasLoadedRef = useRef(false);

  // Fetch matches from API (API-001 fix: now paginated)
  const fetchMatches = useCallback(async (cursor?: string) => {
    if (!token) return;

    setError(null);

    try {
      const response = await api.matches.getMyMatches(token, {
        limit: pageSize,
        cursor,
      });

      // Transform and enhance matches
      const enhanced = response.items.map((raw: ApiMatchResponse) => {
        const match = transformMatch(raw);
        return createDisplayMatch(match);
      });

      // Sort by most recent activity
      enhanced.sort((a, b) => b.sortKey - a.sortKey);

      if (cursor) {
        // Append to existing matches
        setMatches(prev => [...prev, ...enhanced]);
      } else {
        // Replace matches (initial load or refresh)
        setMatches(enhanced);
      }

      setNextCursor(response.nextCursor);
      setTotalCount(response.totalCount);
    } catch (err) {
      console.error('Failed to fetch matches:', err);
      setError('Failed to load matches');
    }
  }, [token, pageSize]);

  // Initial fetch
  useEffect(() => {
    if (hasLoadedRef.current) return;

    const load = async () => {
      setIsLoading(true);
      await fetchMatches();
      setIsLoading(false);
      hasLoadedRef.current = true;
    };
    load();
  }, [fetchMatches]);

  // Load more matches
  const loadMore = useCallback(async () => {
    if (!nextCursor || isLoadingMore) return;

    setIsLoadingMore(true);
    await fetchMatches(nextCursor);
    setIsLoadingMore(false);
  }, [nextCursor, isLoadingMore, fetchMatches]);

  // Refresh matches (with visual indicator)
  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    setNextCursor(null); // Reset pagination
    await fetchMatches();
    setIsRefreshing(false);
  }, [fetchMatches]);

  // Separate new matches (for carousel) and conversation matches (for list)
  const newMatches = useMemo(() => {
    return matches.filter((m) => m.isNew && !m.hasMessages);
  }, [matches]);

  const conversationMatches = useMemo(() => {
    // Matches that either have messages OR are not new anymore
    return matches.filter((m) => m.hasMessages || !m.isNew);
  }, [matches]);

  // Filter and search matches
  const filteredMatches = useMemo(() => {
    let result = [...matches];

    // Apply filter
    switch (filter) {
      case 'unread':
        result = result.filter((m) => m.unreadCount > 0);
        break;
      case 'new':
        result = result.filter((m) => m.isNew && !m.hasMessages);
        break;
      default:
        break;
    }

    // Apply search query
    if (query.trim()) {
      const searchLower = query.toLowerCase().trim();
      result = result.filter((m) => {
        const petName = m.pet?.name?.toLowerCase() || '';
        const ownerName = m.otherOwner?.displayName?.toLowerCase() || '';
        return petName.includes(searchLower) || ownerName.includes(searchLower);
      });
    }

    return result;
  }, [matches, filter, query]);

  // Compute counts for filter tabs
  const counts = useMemo(() => {
    return {
      all: matches.length,
      unread: matches.filter((m) => m.unreadCount > 0).length,
      new: matches.filter((m) => m.isNew && !m.hasMessages).length,
    };
  }, [matches]);

  return {
    matches,
    filteredMatches,
    newMatches,
    conversationMatches,
    isLoading,
    isRefreshing,
    isLoadingMore,
    error,
    filter,
    query,
    selectedMatchId,
    hasMore: !!nextCursor,
    totalCount,
    setFilter,
    setQuery,
    setSelectedMatchId,
    fetchMatches: () => fetchMatches(),
    loadMore,
    refresh,
    counts,
  };
}
