'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { useAuth } from '@/contexts';
import { api } from '@/lib';
import { ProtectedRoute } from '@/components/auth';
import { Button } from '@/components/ui';
import { SwipeableCard, MatchCelebration } from '@/components/discover';
import type { Pet } from '@/types';

function DiscoverContent() {
  const t = useTranslations('discover');
  const { token } = useAuth();

  const [pets, setPets] = useState<Pet[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSwiping, setIsSwiping] = useState(false);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [matchedPet, setMatchedPet] = useState<Pet | null>(null);
  const [hasNoPets, setHasNoPets] = useState(false);
  const [, setError] = useState<string | null>(null);
  const [cardKey, setCardKey] = useState(0);

  // History for undo functionality
  const [swipeHistory, setSwipeHistory] = useState<Pet[]>([]);
  const [isUndoing, setIsUndoing] = useState(false);

  const loadDiscoveryFeed = useCallback(async () => {
    if (!token) return;

    setIsLoading(true);
    setError(null);

    try {
      // First check if user has pets
      const myPets = await api.pets.getMyPets(token);
      if (myPets.length === 0) {
        setHasNoPets(true);
        setIsLoading(false);
        return;
      }

      // Load discovery feed
      const discoveryPets = await api.discovery.getFeed(token, 20);
      setPets(discoveryPets);
      setCurrentIndex(0);
      setCardKey(prev => prev + 1);
      setSwipeHistory([]); // Reset history on new load
    } catch (err) {
      console.error('Failed to load discovery feed:', err);
      setError(t('empty.subtitle'));
    } finally {
      setIsLoading(false);
    }
  }, [token, t]);

  useEffect(() => {
    loadDiscoveryFeed();
  }, [loadDiscoveryFeed]);

  const handleSwipe = useCallback(async (action: 'like' | 'pass') => {
    if (!token || isSwiping || currentIndex >= pets.length) return;

    const currentPet = pets[currentIndex];
    setIsSwiping(true);

    try {
      const response = await api.swipes.swipe(token, {
        toPetId: currentPet.id,
        action,
      });

      // Add to history for undo
      setSwipeHistory(prev => [...prev, currentPet]);

      // Move to next pet
      setCurrentIndex((prev) => prev + 1);
      setCardKey(prev => prev + 1);

      // Show match modal if it's a match
      if (response.matchCreated) {
        setMatchedPet(currentPet);
        setTimeout(() => {
          setShowMatchModal(true);
        }, 300);
      }
    } catch (err) {
      console.error('Failed to swipe:', err);
    } finally {
      setIsSwiping(false);
    }
  }, [token, isSwiping, currentIndex, pets]);

  const handleUndo = useCallback(async () => {
    if (!token || isUndoing || swipeHistory.length === 0) return;

    setIsUndoing(true);

    try {
      const response = await api.swipes.undo(token);

      if (response.success && response.undoneSwipePetId) {
        // Find the pet we just undid in history
        const undoneIndex = swipeHistory.findIndex(p => p.id === response.undoneSwipePetId);

        if (undoneIndex !== -1) {
          const undonePet = swipeHistory[undoneIndex];

          // Insert the pet back at the current position
          setPets(prev => {
            const newPets = [...prev];
            newPets.splice(currentIndex, 0, undonePet);
            return newPets;
          });

          // Remove from history
          setSwipeHistory(prev => prev.slice(0, -1));

          // Update card key to trigger animation
          setCardKey(prev => prev + 1);
        }
      }
    } catch (err) {
      console.error('Failed to undo swipe:', err);
    } finally {
      setIsUndoing(false);
    }
  }, [token, isUndoing, swipeHistory, currentIndex]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isSwiping || showMatchModal || isUndoing) return;

      if (e.key === 'ArrowLeft' && currentIndex < pets.length) {
        handleSwipe('pass');
      } else if (e.key === 'ArrowRight' && currentIndex < pets.length) {
        handleSwipe('like');
      } else if ((e.key === 'z' || e.key === 'Z') && (e.ctrlKey || e.metaKey)) {
        // Ctrl+Z or Cmd+Z for undo
        e.preventDefault();
        handleUndo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSwiping, showMatchModal, currentIndex, pets.length, handleSwipe, handleUndo, isUndoing]);

  const handleRefresh = () => {
    setPets([]);
    setCurrentIndex(0);
    setSwipeHistory([]);
    loadDiscoveryFeed();
  };

  const handleMatchClose = () => {
    setShowMatchModal(false);
    setMatchedPet(null);
  };

  const currentPet = pets[currentIndex];
  const hasMorePets = currentIndex < pets.length;
  const canUndo = swipeHistory.length > 0 && !isUndoing;

  // Loading state with beautiful animation
  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full bg-primary/20 animate-pulse-ring" />
            <div className="absolute inset-2 rounded-full bg-primary/30 animate-pulse-ring" style={{ animationDelay: '0.2s' }} />
            <div className="absolute inset-4 rounded-full bg-primary/40 animate-pulse-ring" style={{ animationDelay: '0.4s' }} />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-4xl">🐾</span>
            </div>
          </div>
          <p className="text-text-muted font-medium">{t('loading')}</p>
        </div>
      </div>
    );
  }

  // No pets state
  if (hasNoPets) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 bg-background">
        <div className="text-center max-w-md animate-card-enter">
          <div className="relative mb-8">
            <div className="w-32 h-32 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
              <span className="text-6xl">🐾</span>
            </div>
            <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-accent rounded-full flex items-center justify-center shadow-lg">
              <span className="text-2xl">➕</span>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-text mb-3">{t('noPets.title')}</h2>
          <p className="text-text-muted mb-8 leading-relaxed">{t('noPets.subtitle')}</p>
          <Link href="/pets/new">
            <Button size="lg" className="px-8">
              {t('noPets.addPet')}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Empty discovery state
  if (!hasMorePets) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 bg-background">
        <div className="text-center max-w-md animate-card-enter">
          <div className="relative mb-8">
            <div className="w-32 h-32 mx-auto bg-secondary/10 rounded-full flex items-center justify-center">
              <span className="text-6xl">🔍</span>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-text mb-3">{t('empty.title')}</h2>
          <p className="text-text-muted mb-8 leading-relaxed">{t('empty.subtitle')}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {canUndo && (
              <Button
                onClick={handleUndo}
                variant="outline"
                size="lg"
                className="px-6"
                disabled={isUndoing}
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
                {t('actions.undo')}
              </Button>
            )}
            <Button
              onClick={handleRefresh}
              size="lg"
              className="px-8"
            >
              {t('empty.refresh')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-background py-6 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header with Undo Button */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-text">{t('title')}</h1>
            <p className="text-text-muted text-sm">{t('subtitle')}</p>
          </div>

          {/* Undo Button */}
          {canUndo && (
            <button
              onClick={handleUndo}
              disabled={isUndoing}
              className="group flex items-center gap-2 px-3 py-2 rounded-xl
                       bg-foreground border border-border
                       hover:border-accent active:scale-95 transition-all duration-200
                       disabled:opacity-50 disabled:cursor-not-allowed"
              title={`${t('actions.undo')} (Ctrl+Z)`}
            >
              <svg
                className="w-5 h-5 text-text-muted group-hover:text-accent transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
              <span className="text-sm font-medium text-text-muted group-hover:text-accent hidden sm:inline">
                {t('actions.undo')}
              </span>
            </button>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-xs text-text-muted mb-1.5">
            <span>{currentIndex + 1} of {pets.length}</span>
            <span>{Math.round(((currentIndex + 1) / pets.length) * 100)}%</span>
          </div>
          <div className="h-1.5 bg-border rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
              style={{ width: `${((currentIndex + 1) / pets.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Swipeable Pet Card */}
        {currentPet && (
          <div key={cardKey} className="animate-card-enter">
            <SwipeableCard
              pet={currentPet}
              onLike={() => handleSwipe('like')}
              onPass={() => handleSwipe('pass')}
              isLoading={isSwiping}
            />
          </div>
        )}

        {/* Tips (mobile) */}
        <div className="md:hidden mt-6 text-center">
          <p className="text-xs text-text-muted">
            Swipe right to like • Swipe left to pass
            {canUndo && ' • Tap undo to go back'}
          </p>
        </div>
      </div>

      {/* Match Celebration Modal */}
      <MatchCelebration
        isOpen={showMatchModal}
        onClose={handleMatchClose}
        petName={matchedPet?.name}
        petPhoto={matchedPet?.photos?.[0]}
      />
    </div>
  );
}

export default function DiscoverPage() {
  return (
    <ProtectedRoute>
      <DiscoverContent />
    </ProtectedRoute>
  );
}
