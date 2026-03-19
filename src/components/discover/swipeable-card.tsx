'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import type { Pet } from '@/types';

interface SwipeableCardProps {
  pet: Pet;
  onLike: () => void;
  onPass: () => void;
  onDating?: () => void;
  isLoading?: boolean;
}

const speciesEmoji: Record<string, string> = {
  dog: '🐕',
  cat: '🐱',
  other: '🐾',
};


export function SwipeableCard({ pet, onLike, onPass, onDating, isLoading }: SwipeableCardProps) {
  const t = useTranslations('discover');
  const tPets = useTranslations('pets.species');
  const tSize = useTranslations('pets.list.size');

  const cardRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isExiting, setIsExiting] = useState<'left' | 'right' | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Reset photo index when pet changes
  useEffect(() => {
    setCurrentPhotoIndex(0);
    setIsExiting(null);
  }, [pet.id]);

  const photos = pet.photos && pet.photos.length > 0 ? pet.photos : [];
  const hasPhotos = photos.length > 0;
  const currentPhoto = hasPhotos ? photos[currentPhotoIndex] : null;

  // Calculate swipe progress (-1 to 1)
  const swipeProgress = isDragging ? Math.max(-1, Math.min(1, currentX / 150)) : 0;
  const rotation = swipeProgress * 15;
  const likeOpacity = Math.max(0, swipeProgress);
  const nopeOpacity = Math.max(0, -swipeProgress);

  // Drag handlers
  const handleDragStart = useCallback((clientX: number) => {
    if (isLoading || isExiting) return;
    setIsDragging(true);
    setStartX(clientX);
    setCurrentX(0);
  }, [isLoading, isExiting]);

  const handleDragMove = useCallback((clientX: number) => {
    if (!isDragging) return;
    const deltaX = clientX - startX;
    setCurrentX(deltaX);
  }, [isDragging, startX]);

  const handleDragEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);

    const threshold = 100;

    if (currentX > threshold) {
      // Swipe right - Like
      setIsExiting('right');
      setTimeout(() => {
        onLike();
      }, 300);
    } else if (currentX < -threshold) {
      // Swipe left - Pass
      setIsExiting('left');
      setTimeout(() => {
        onPass();
      }, 300);
    } else {
      // Reset position
      setCurrentX(0);
    }
  }, [isDragging, currentX, onLike, onPass]);

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleDragStart(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    handleDragMove(e.clientX);
  };

  const handleMouseUp = () => {
    handleDragEnd();
  };

  const handleMouseLeave = () => {
    if (isDragging) {
      handleDragEnd();
    }
  };

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    handleDragStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    handleDragMove(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    handleDragEnd();
  };

  // Photo navigation
  const handlePhotoTap = (e: React.MouseEvent | React.TouchEvent) => {
    if (isDragging || !hasPhotos || photos.length <= 1) return;

    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const x = clientX - rect.left;
    const isLeftSide = x < rect.width / 2;

    if (isLeftSide && currentPhotoIndex > 0) {
      setCurrentPhotoIndex(prev => prev - 1);
    } else if (!isLeftSide && currentPhotoIndex < photos.length - 1) {
      setCurrentPhotoIndex(prev => prev + 1);
    }
  };

  // Button handlers
  const handlePassClick = () => {
    if (isLoading || isExiting) return;
    setIsExiting('left');
    setTimeout(() => {
      onPass();
    }, 300);
  };

  const handleLikeClick = () => {
    if (isLoading || isExiting) return;
    setIsExiting('right');
    setTimeout(() => {
      onLike();
    }, 300);
  };

  const handleDatingClick = () => {
    if (isLoading || isExiting || !onDating) return;
    setIsExiting('right');
    setTimeout(() => {
      onDating();
    }, 300);
  };

  // Get exit transform
  const getTransform = () => {
    if (isExiting === 'right') {
      return 'translateX(150%) rotate(30deg)';
    }
    if (isExiting === 'left') {
      return 'translateX(-150%) rotate(-30deg)';
    }
    if (isDragging) {
      return `translateX(${currentX}px) rotate(${rotation}deg)`;
    }
    return 'translateX(0) rotate(0deg)';
  };

  // Dynamic shadow based on swipe direction
  const getShadow = () => {
    if (swipeProgress > 0.1) {
      return `0 20px 50px rgba(22, 163, 74, ${swipeProgress * 0.3}), 0 10px 20px rgba(0,0,0,0.1)`;
    }
    if (swipeProgress < -0.1) {
      return `0 20px 50px rgba(220, 38, 38, ${-swipeProgress * 0.3}), 0 10px 20px rgba(0,0,0,0.1)`;
    }
    return '0 10px 40px rgba(0,0,0,0.15)';
  };

  return (
    <div className="w-full max-w-md mx-auto perspective-1000">
      {/* Swipeable Card */}
      <div
        ref={cardRef}
        className={`relative bg-foreground rounded-3xl overflow-hidden cursor-grab select-none border border-border
                   ${isDragging ? 'cursor-grabbing' : ''}
                   ${isExiting ? 'pointer-events-none' : ''}`}
        style={{
          transform: getTransform(),
          boxShadow: getShadow(),
          transition: isDragging ? 'none' : 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Photo Area */}
        <div
          className="relative h-[28rem] sm:h-[32rem] bg-surface"
          onClick={handlePhotoTap}
        >
          {currentPhoto ? (
            <img
              src={currentPhoto}
              alt={pet.name}
              className="w-full h-full object-cover"
              draggable={false}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-surface">
              <span className="text-[10rem] opacity-40 select-none">
                {speciesEmoji[pet.species] || '🐾'}
              </span>
            </div>
          )}

          {/* Photo indicators */}
          {hasPhotos && photos.length > 1 && (
            <div className="absolute top-3 left-3 right-3 flex gap-1">
              {photos.map((_, index) => (
                <div
                  key={index}
                  className={`h-1 flex-1 rounded-full transition-all duration-200 ${
                    index === currentPhotoIndex
                      ? 'bg-white'
                      : 'bg-white/40'
                  }`}
                />
              ))}
            </div>
          )}

          {/* LIKE stamp */}
          <div
            className="absolute top-8 left-6 px-4 py-2 border-4 border-green-500 rounded-lg
                       transform -rotate-12 transition-opacity duration-200"
            style={{ opacity: likeOpacity }}
          >
            <span className="text-green-500 font-black text-3xl tracking-wider">LIKE</span>
          </div>

          {/* NOPE stamp */}
          <div
            className="absolute top-8 right-6 px-4 py-2 border-4 border-red-500 rounded-lg
                       transform rotate-12 transition-opacity duration-200"
            style={{ opacity: nopeOpacity }}
          >
            <span className="text-red-500 font-black text-3xl tracking-wider">NOPE</span>
          </div>

          {/* Bottom gradient */}
          <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none" />

          {/* Pet Info Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
            <div className="flex items-end justify-between">
              <div className="flex-1">
                <h2 className="text-3xl font-bold mb-1 drop-shadow-lg">
                  {pet.name}
                  {pet.ageMonths && (
                    <span className="font-normal text-2xl ml-2 opacity-90">
                      {pet.ageMonths >= 12 ? Math.floor(pet.ageMonths / 12) : pet.ageMonths}
                      <span className="text-lg ml-0.5">{pet.ageMonths >= 12 ? 'y' : 'm'}</span>
                    </span>
                  )}
                </h2>

                <div className="flex flex-wrap items-center gap-2 text-white/90">
                  <span className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full text-sm">
                    {speciesEmoji[pet.species]} {tPets(pet.species)}
                  </span>
                  {pet.breed && (
                    <span className="bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full text-sm">
                      {pet.breed}
                    </span>
                  )}
                  {pet.size && (
                    <span className="bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full text-sm">
                      {tSize(pet.size)}
                    </span>
                  )}
                </div>
              </div>

              {/* Info button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDetails(!showDetails);
                }}
                className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm
                         flex items-center justify-center text-white
                         hover:bg-white/30 transition-colors ml-3"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Expandable Details Section */}
        <div className={`overflow-hidden transition-all duration-300 ease-out ${showDetails ? 'max-h-80' : 'max-h-0'}`}>
          <div className="p-5 border-t border-border bg-foreground">
            {/* Bio */}
            {pet.bio && (
              <p className="text-text-muted text-sm mb-4 leading-relaxed">{pet.bio}</p>
            )}

            {/* Traits */}
            <div className="flex flex-wrap gap-2 mb-4">
              {pet.vaccinated === true && (
                <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-xs font-medium">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Vaccinated
                </span>
              )}
              {pet.neutered === true && (
                <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Neutered
                </span>
              )}
              {pet.energyLevel && (
                <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                  pet.energyLevel === 'high' ? 'bg-orange-50 text-orange-700' :
                  pet.energyLevel === 'medium' ? 'bg-yellow-50 text-yellow-700' :
                  'bg-gray-50 text-gray-700'
                }`}>
                  {pet.energyLevel === 'high' ? '⚡ High Energy' :
                   pet.energyLevel === 'medium' ? '🔥 Medium Energy' :
                   '😌 Low Energy'}
                </span>
              )}
              {pet.sex && pet.sex !== 'unknown' && (
                <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                  pet.sex === 'male' ? 'bg-blue-50 text-blue-700' : 'bg-pink-50 text-pink-700'
                }`}>
                  {pet.sex === 'male' ? '♂ Male' : '♀ Female'}
                </span>
              )}
            </div>

            {/* Temperament */}
            {pet.temperament && pet.temperament.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {pet.temperament.map((trait, index) => (
                  <span
                    key={index}
                    className="px-2.5 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium"
                  >
                    {trait}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-center gap-4 mt-6">
        {/* Pass Button */}
        <button
          onClick={handlePassClick}
          disabled={isLoading || !!isExiting}
          className="group w-16 h-16 rounded-full bg-foreground border-2 border-border
                   flex items-center justify-center
                   hover:border-error hover:scale-110
                   active:scale-95 transition-all duration-200
                   disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          aria-label={t('actions.pass')}
        >
          <svg
            className="w-8 h-8 text-text-muted group-hover:text-error transition-colors"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Dating Button - romantic interest */}
        {onDating && (
          <button
            onClick={handleDatingClick}
            disabled={isLoading || !!isExiting}
            className="group w-14 h-14 rounded-full bg-foreground border-2 border-border
                     flex items-center justify-center
                     hover:border-pink-400 hover:bg-pink-50 dark:hover:bg-pink-950 hover:scale-110
                     active:scale-95 transition-all duration-200
                     disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            aria-label={t('actions.dating')}
          >
            <span className="text-2xl group-hover:scale-110 transition-transform">💕</span>
          </button>
        )}

        {/* Like Button */}
        <button
          onClick={handleLikeClick}
          disabled={isLoading || !!isExiting}
          className="group w-16 h-16 rounded-full bg-primary
                   flex items-center justify-center
                   hover:bg-primary-dark hover:scale-110
                   active:scale-95 transition-all duration-200
                   disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          aria-label={t('actions.like')}
        >
          <svg
            className="w-8 h-8 text-white"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </button>
      </div>

      {/* Keyboard hints (desktop) */}
      <div className="hidden md:flex justify-center gap-6 mt-4 text-xs text-text-muted">
        <span className="flex items-center gap-1.5">
          <kbd className="px-2 py-1 bg-surface border border-border rounded text-[10px] font-mono">←</kbd>
          {t('actions.pass')}
        </span>
        {onDating && (
          <span className="flex items-center gap-1.5">
            <kbd className="px-2 py-1 bg-surface border border-border rounded text-[10px] font-mono">↑</kbd>
            {t('actions.dating')}
          </span>
        )}
        <span className="flex items-center gap-1.5">
          <kbd className="px-2 py-1 bg-surface border border-border rounded text-[10px] font-mono">→</kbd>
          {t('actions.like')}
        </span>
      </div>
    </div>
  );
}

export default SwipeableCard;
