'use client';

import { useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import type { MatchDisplay } from '@/types';

interface NewMatchesCarouselProps {
  matches: MatchDisplay[];
  onMatchClick?: (match: MatchDisplay) => void;
  onMatchSelect?: (match: MatchDisplay) => void;
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

function NewMatchAvatar({
  match,
  onMatchClick,
}: {
  match: MatchDisplay;
  onMatchClick?: (match: MatchDisplay) => void;
}) {
  const t = useTranslations('matches');
  const router = useRouter();

  const petPhoto = match.pet?.photoUrl;
  const petName = match.pet?.name || t('unknownPet');
  const petSpecies = match.pet?.species;
  const ownerName = match.otherOwner?.displayName || t('someone');

  const handleClick = () => {
    if (onMatchClick) {
      onMatchClick(match);
    } else if (match.pet?.id) {
      // New matches in carousel → go to pet profile to see who matched
      router.push(`/pets/${match.pet.id}`);
    }
  };

  return (
    <button
      onClick={handleClick}
      className="flex flex-col items-center gap-1 group focus:outline-none"
      aria-label={`${t('matchWith')} ${petName} ${t('and')} ${ownerName}`}
    >
      {/* Avatar with gradient ring - Instagram Stories style */}
      <div className="relative p-[3px] rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 group-hover:from-yellow-300 group-hover:via-pink-400 group-hover:to-purple-500 transition-all duration-300 group-hover:scale-105">
        {/* Inner white ring */}
        <div className="p-[2px] rounded-full bg-surface dark:bg-gray-900">
          {/* Avatar */}
          <div className="w-14 h-14 rounded-full overflow-hidden bg-surface-alt dark:bg-gray-700">
            {petPhoto ? (
              <img
                src={petPhoto}
                alt={petName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xl bg-gradient-to-br from-primary/20 to-accent/20">
                {getSpeciesEmoji(petSpecies)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pet name */}
      <span className="text-[11px] font-medium text-text truncate w-16 text-center group-hover:text-primary transition-colors">
        {petName}
      </span>
    </button>
  );
}

export function NewMatchesCarousel({ matches, onMatchClick, onMatchSelect }: NewMatchesCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (matches.length === 0) {
    return null;
  }

  // Use onMatchSelect if provided, otherwise fall back to onMatchClick
  const handleClick = onMatchSelect || onMatchClick;

  return (
    <div className="mb-4">
      {/* Scrollable area - horizontal */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4"
      >
        {matches.map((match) => (
          <NewMatchAvatar key={match.id} match={match} onMatchClick={handleClick} />
        ))}
      </div>
    </div>
  );
}

// Skeleton loader
export function NewMatchesCarouselSkeleton() {
  return (
    <div className="mb-4">
      <div className="flex gap-3 pb-2 -mx-4 px-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <div className="w-[62px] h-[62px] rounded-full bg-gradient-to-tr from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 p-[3px]">
              <div className="w-full h-full rounded-full bg-surface dark:bg-gray-900 p-[2px]">
                <div className="w-full h-full rounded-full bg-surface-alt dark:bg-gray-700 animate-pulse" />
              </div>
            </div>
            <div className="h-3 w-12 bg-surface-alt dark:bg-gray-700 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default NewMatchesCarousel;
