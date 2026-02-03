'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { api, ApiError } from '@/lib';
import { Button } from '@/components/ui';
import type { BreedPrediction, BreedSpecies, PetSpecies } from '@/types';

interface AIBreedSuggestionProps {
  petId: string;
  petSpecies: PetSpecies;
  photoUrl: string | null;
  currentBreed: string | null;
  token: string;
  onBreedSelect: (breed: string) => Promise<void>;
}

export function AIBreedSuggestion({
  petSpecies,
  photoUrl,
  currentBreed,
  token,
  onBreedSelect,
}: AIBreedSuggestionProps) {
  const t = useTranslations('pets.breedAI');
  const [isLoading, setIsLoading] = useState(false);
  const [predictions, setPredictions] = useState<BreedPrediction[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedBreed, setSelectedBreed] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  const isSupported = petSpecies === 'dog' || petSpecies === 'cat';
  const hasPhoto = !!photoUrl;
  const canDetect = isSupported && hasPhoto && !isLoading;

  // Don't render anything if species is not supported or no photo
  if (!isSupported || !hasPhoto) {
    return null;
  }

  const handleDetect = async () => {
    if (!photoUrl || !isSupported) return;

    setIsLoading(true);
    setError(null);
    setPredictions(null);
    setSelectedBreed(null);

    try {
      const response = await api.breedRecognition.recognize(token, {
        imageUrl: photoUrl,
        species: petSpecies as BreedSpecies,
        topK: 5,
      });

      // Only show top 3 results
      setPredictions(response.top.slice(0, 3));
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.statusCode === 400) {
          setError(t('errors.unsupportedSpecies'));
        } else {
          setError(t('errors.detectionFailed'));
        }
      } else {
        setError(t('errors.detectionFailed'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyBreed = async (breed: string) => {
    setIsApplying(true);
    setSelectedBreed(breed);
    try {
      await onBreedSelect(breed);
    } catch {
      setError(t('errors.applyFailed'));
    } finally {
      setIsApplying(false);
    }
  };

  const formatConfidence = (confidence: number): string => {
    return `${Math.round(confidence * 100)}%`;
  };

  const formatBreedName = (breed: string): string => {
    return breed
      .replace(/_/g, ' ')
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  return (
    <div className="rounded-xl border border-border bg-surface p-4 space-y-4">
      {/* Header with Detect Button */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <svg
              className="w-5 h-5 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-text">{t('title')}</h3>
            {currentBreed && (
              <p className="text-sm text-text-muted">
                {t('currentBreed')}: <span className="font-medium text-text">{currentBreed}</span>
              </p>
            )}
          </div>
        </div>

        {/* Detect Button - Always visible when no predictions */}
        {!predictions && (
          <Button
            onClick={handleDetect}
            disabled={!canDetect}
            isLoading={isLoading}
            size="sm"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            {isLoading ? t('detecting') : t('detectButton')}
          </Button>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="p-3 rounded-lg bg-error-bg border border-error/20 text-error text-sm flex items-center gap-2">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          {error}
        </div>
      )}

      {/* Predictions results */}
      {predictions && predictions.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-text">{t('suggestedBreeds')}</h4>
          <div className="space-y-2">
            {predictions.map((prediction, index) => (
              <div
                key={prediction.breed}
                className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                  selectedBreed === prediction.breed
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50 hover:bg-surface-hover'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      index === 0
                        ? 'bg-primary text-white'
                        : 'bg-surface-hover text-text-muted'
                    }`}
                  >
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium text-text">{formatBreedName(prediction.breed)}</div>
                    <div className="text-xs text-text-muted">
                      {t('confidence')}: {formatConfidence(prediction.confidence)}
                    </div>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant={index === 0 ? 'primary' : 'outline'}
                  onClick={() => handleApplyBreed(prediction.breed)}
                  disabled={isApplying}
                  isLoading={isApplying && selectedBreed === prediction.breed}
                >
                  {t('useThis')}
                </Button>
              </div>
            ))}
          </div>

          {/* Detect again button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDetect}
            disabled={isLoading}
            className="w-full text-text-muted hover:text-text"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            {t('detectAgain')}
          </Button>
        </div>
      )}

      {/* No predictions found */}
      {predictions && predictions.length === 0 && (
        <div className="p-3 rounded-lg bg-surface-hover border border-border text-text-muted text-sm text-center">
          {t('noPredictions')}
        </div>
      )}
    </div>
  );
}
