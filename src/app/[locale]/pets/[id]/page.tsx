'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useRouter, Link } from '@/i18n/routing';
import { useAuth } from '@/contexts';
import { api } from '@/lib';
import { ProtectedRoute } from '@/components/auth';
import { Button } from '@/components/ui';
import type { Pet } from '@/types';

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

function PetDetailContent() {
  const t = useTranslations('pets');
  const tCommon = useTranslations('common');
  const params = useParams();
  const router = useRouter();
  const { token } = useAuth();
  const petId = params.id as string;

  const [pet, setPet] = useState<Pet | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPet = useCallback(async () => {
    if (!token || !petId) return;

    setIsLoading(true);
    setError(null);

    try {
      const petData = await api.pets.getById(token, petId);
      setPet(petData);
    } catch (err) {
      console.error('Failed to load pet:', err);
      setError('Failed to load pet details');
    } finally {
      setIsLoading(false);
    }
  }, [token, petId]);

  useEffect(() => {
    loadPet();
  }, [loadPet]);

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-surface dark:bg-gray-900">
        <div className="max-w-2xl mx-auto p-4">
          {/* Back button skeleton */}
          <div className="h-10 w-24 bg-surface-alt dark:bg-gray-800 rounded-lg animate-pulse mb-4" />

          {/* Image skeleton */}
          <div className="aspect-square w-full max-w-md mx-auto bg-surface-alt dark:bg-gray-800 rounded-2xl animate-pulse mb-6" />

          {/* Info skeleton */}
          <div className="space-y-4">
            <div className="h-8 w-48 bg-surface-alt dark:bg-gray-800 rounded animate-pulse" />
            <div className="h-4 w-32 bg-surface-alt dark:bg-gray-800 rounded animate-pulse" />
            <div className="h-20 w-full bg-surface-alt dark:bg-gray-800 rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !pet) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-surface dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-text mb-2">{t('notFound')}</h2>
          <p className="text-text-muted mb-6">{error || t('notFoundDescription')}</p>
          <Button onClick={() => router.push('/matches')}>
            {tCommon('back')}
          </Button>
        </div>
      </div>
    );
  }

  const mainPhoto = pet.photos?.[0];

  return (
    <div className="min-h-[calc(100vh-64px)] bg-surface dark:bg-gray-900">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-surface/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-border dark:border-gray-800 px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 -ml-2 rounded-full hover:bg-surface-alt dark:hover:bg-gray-800 transition-colors"
            >
              <svg className="w-5 h-5 text-text" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-lg font-semibold text-text">{pet.name}</h1>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Photo */}
          <div className="aspect-square w-full max-w-md mx-auto rounded-2xl overflow-hidden bg-surface-alt dark:bg-gray-800 mb-6 shadow-lg">
            {mainPhoto ? (
              <img
                src={mainPhoto}
                alt={pet.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-8xl">{getSpeciesEmoji(pet.species)}</span>
              </div>
            )}
          </div>

          {/* Pet Info Card */}
          <div className="bg-surface-alt dark:bg-gray-800 rounded-2xl p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-2xl font-bold text-text">{pet.name}</h2>
              {pet.sex && pet.sex !== 'unknown' && (
                <span className={`text-xl ${pet.sex === 'male' ? 'text-blue-500' : 'text-pink-500'}`}>
                  {pet.sex === 'male' ? '♂' : '♀'}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              {pet.species && (
                <div>
                  <span className="text-xs text-text-muted uppercase tracking-wider">{t('species')}</span>
                  <p className="text-text font-medium capitalize">{pet.species}</p>
                </div>
              )}
              {pet.breed && (
                <div>
                  <span className="text-xs text-text-muted uppercase tracking-wider">{t('breed')}</span>
                  <p className="text-text font-medium">{pet.breed}</p>
                </div>
              )}
              {pet.ageMonths && (
                <div>
                  <span className="text-xs text-text-muted uppercase tracking-wider">{t('age')}</span>
                  <p className="text-text font-medium">
                    {pet.ageMonths >= 12
                      ? `${Math.floor(pet.ageMonths / 12)} ${t('yearsOld')}`
                      : `${pet.ageMonths} months`
                    }
                  </p>
                </div>
              )}
              {pet.size && (
                <div>
                  <span className="text-xs text-text-muted uppercase tracking-wider">{t('size')}</span>
                  <p className="text-text font-medium uppercase">{pet.size}</p>
                </div>
              )}
            </div>

            {pet.bio && (
              <div className="pt-4 border-t border-border dark:border-gray-700">
                <span className="text-xs text-text-muted uppercase tracking-wider">{t('about')}</span>
                <p className="text-text mt-1">{pet.bio}</p>
              </div>
            )}
          </div>

          {/* Additional Photos */}
          {pet.photos && pet.photos.length > 1 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">
                {t('photos')}
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {pet.photos.slice(1).map((photo, index) => (
                  <div key={index} className="aspect-square rounded-xl overflow-hidden bg-surface-alt dark:bg-gray-800">
                    <img
                      src={photo}
                      alt={`${pet.name} photo ${index + 2}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Link href="/matches" className="flex-1">
              <Button variant="outline" className="w-full">
                {t('backToMatches')}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PetDetailPage() {
  return (
    <ProtectedRoute>
      <PetDetailContent />
    </ProtectedRoute>
  );
}
