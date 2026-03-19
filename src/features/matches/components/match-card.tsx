'use client';

import { useCallback, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import type { MatchDisplay, MatchIntent } from '@/types';

interface MatchCardProps {
  match: MatchDisplay;
  isSelected?: boolean;
  onSelect?: (match: MatchDisplay) => void;
  animationDelay?: number;
}

// Get badge color for match intent
function getIntentBadgeClasses(intent?: MatchIntent): string {
  switch (intent) {
    case 'dating':
      return 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300';
    case 'mixed':
      return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300';
    case 'social':
    default:
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
  }
}

// Format relative time with localization support
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

// Get species emoji
function getSpeciesEmoji(species?: string): string {
  const emojiMap: Record<string, string> = {
    dog: '🐕',
    cat: '🐱',
    rabbit: '🐰',
    bird: '🐦',
    fish: '🐟',
    hamster: '🐹',
    guinea_pig: '🐹',
    turtle: '🐢',
    snake: '🐍',
    lizard: '🦎',
    ferret: '🦡',
    horse: '🐴',
  };
  return emojiMap[species?.toLowerCase() || ''] || '🐾';
}

export function MatchCard({
  match,
  isSelected,
  onSelect,
  animationDelay = 0,
}: MatchCardProps) {
  const t = useTranslations('matches');
  const tActivePet = useTranslations('activePet');
  const tIntent = useTranslations('matchIntent');
  const tGeneral = useTranslations('general');
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);
  const [navigationError, setNavigationError] = useState(false);

  // Use otherPet if available, fallback to deprecated pet field
  const displayPet = match.otherPet || match.pet;
  const petPhoto = displayPet?.photoUrl;
  const petName = displayPet?.name || t('unknownPet');
  const petSpecies = displayPet?.species;
  const ownerName = match.otherOwner?.displayName || t('someone');
  const ownerAvatar = match.otherOwner?.avatarUrl;

  // My pet in this match (for context display)
  const myPetName = match.myPet?.name;

  // Check if this is a multi-context conversation
  const hasMultipleContexts = (match.contextCount || 0) > 1;

  const timeAgo = useMemo(() => {
    const dateStr = match.lastMessage?.createdAt || match.createdAt;
    return formatRelativeTime(dateStr);
  }, [match.lastMessage?.createdAt, match.createdAt]);

  const previewText = match.lastMessage?.text || t('sayHi');
  const hasUnread = match.unreadCount > 0;

  // Chat-first: primary click always opens chat (MATCH-001 fix: added error handling)
  const handleClick = useCallback(async () => {
    if (isNavigating) return; // Prevent double-clicks

    setNavigationError(false);
    setIsNavigating(true);

    if (onSelect) {
      onSelect(match);
    }

    try {
      // Prefer conversationId, fallback to chatId
      const chatId = match.conversationId || match.chatId;

      if (chatId) {
        // Open chat with match context
        await router.push(`/messages/${chatId}?contextMatchId=${match.id}`);
      } else {
        // Fallback: if no conversation yet, still try to open messages
        // The chat page will handle the "conversation not ready" state
        await router.push('/messages');
      }
    } catch (error) {
      console.error('[MatchCard] Navigation error:', error);
      setNavigationError(true);
      // Auto-clear error after 3 seconds
      setTimeout(() => setNavigationError(false), 3000);
    } finally {
      setIsNavigating(false);
    }
  }, [match, onSelect, router, isNavigating]);

  // Secondary action: view pet profile
  const handleViewProfile = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (displayPet?.id) {
      router.push(`/pets/${displayPet.id}`);
    }
  }, [displayPet?.id, router]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleClick();
      }
    },
    [handleClick]
  );

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`
        group flex items-center gap-3 p-3 rounded-xl transition-all duration-200 cursor-pointer
        hover:bg-surface-alt dark:hover:bg-gray-800/50
        active:scale-[0.98]
        focus:outline-none focus:bg-surface-alt dark:focus:bg-gray-800/50
        ${isSelected ? 'bg-primary/5 dark:bg-primary/10' : ''}
        ${hasUnread ? 'bg-primary/5 dark:bg-primary/10' : ''}
        ${isNavigating ? 'opacity-70 pointer-events-none' : ''}
        ${navigationError ? 'ring-2 ring-red-500/50' : ''}
      `}
      style={{
        animationDelay: `${animationDelay}ms`,
      }}
      aria-label={`${t('matchWith')} ${petName} ${t('and')} ${ownerName}`}
    >
      {/* Pet Photo - Circular like messaging apps */}
      <div className="relative flex-shrink-0">
        {/* Main pet avatar */}
        <div className="w-14 h-14 rounded-full overflow-hidden bg-surface-alt dark:bg-gray-700">
          {petPhoto ? (
            <img
              src={petPhoto}
              alt={petName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl bg-gradient-to-br from-primary/20 to-accent/20">
              {getSpeciesEmoji(petSpecies)}
            </div>
          )}
        </div>

        {/* Owner avatar overlay - Small circle at bottom right */}
        <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full overflow-hidden border-2 border-surface dark:border-gray-900 bg-surface-alt dark:bg-gray-700">
          {ownerAvatar ? (
            <img
              src={ownerAvatar}
              alt={ownerName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[10px] bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/50 dark:to-purple-900/50">
              👤
            </div>
          )}
        </div>

        {/* Online/Active indicator or Unread badge */}
        {hasUnread && (
          <div className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-primary rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 border-surface dark:border-gray-900">
            {match.unreadCount > 9 ? '9+' : match.unreadCount}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Name and time row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <h3 className={`text-[15px] truncate ${hasUnread ? 'font-semibold text-text' : 'font-medium text-text'}`}>
              {petName}
              <span className="text-text-muted font-normal"> · {ownerName}</span>
            </h3>
            {/* Match Intent Badge */}
            {match.matchIntent && (
              <span className={`flex-shrink-0 px-1.5 py-0.5 text-[10px] font-medium rounded-full ${getIntentBadgeClasses(match.matchIntent)}`}>
                {tIntent(match.matchIntent)}
              </span>
            )}
            {/* Multi-context indicator */}
            {hasMultipleContexts && (
              <span
                className="flex-shrink-0 inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                title={tGeneral('multiContext')}
              >
                <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                  <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                </svg>
                {match.contextCount}
              </span>
            )}
          </div>
          <span className={`text-xs flex-shrink-0 ${hasUnread ? 'text-primary font-medium' : 'text-text-muted'}`}>
            {timeAgo}
          </span>
        </div>

        {/* My pet context (if available) */}
        {myPetName && (
          <p className="text-xs text-text-muted truncate">
            {tActivePet('matchFor', { name: myPetName })}
          </p>
        )}

        {/* Preview text */}
        <p className={`text-sm truncate mt-0.5 ${
          hasUnread
            ? 'text-text font-medium'
            : match.lastMessage
            ? 'text-text-muted'
            : 'text-primary/70'
        }`}>
          {previewText}
        </p>
      </div>

      {/* View Profile button (secondary action) */}
      {displayPet?.id && (
        <button
          onClick={handleViewProfile}
          className="flex-shrink-0 p-2 rounded-full opacity-0 group-hover:opacity-100 
                     hover:bg-surface-alt dark:hover:bg-gray-700 transition-all"
          aria-label="View profile"
        >
          <svg className="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </button>
      )}
    </div>
  );
}

// Skeleton loader for MatchCard
export function MatchCardSkeleton({ animationDelay = 0 }: { animationDelay?: number }) {
  return (
    <div
      className="flex items-center gap-3 p-3 rounded-xl"
      style={{
        animationDelay: `${animationDelay}ms`,
      }}
    >
      {/* Avatar skeleton */}
      <div className="relative flex-shrink-0">
        <div className="w-14 h-14 rounded-full bg-surface-alt dark:bg-gray-700 animate-pulse" />
        <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-surface-alt dark:bg-gray-700 border-2 border-surface dark:border-gray-900 animate-pulse" />
      </div>

      {/* Content skeleton */}
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="h-4 w-32 bg-surface-alt dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-3 w-8 bg-surface-alt dark:bg-gray-700 rounded animate-pulse" />
        </div>
        <div className="h-3.5 w-44 bg-surface-alt dark:bg-gray-700 rounded animate-pulse" />
      </div>
    </div>
  );
}

export default MatchCard;
