'use client';

import { useTranslations } from 'next-intl';
import type { Pet } from '@/types';

interface PetCardProps {
  pet: Pet;
  onLike: () => void;
  onPass: () => void;
  isLoading?: boolean;
}

const speciesEmoji: Record<string, string> = {
  dog: '🐕',
  cat: '🐱',
  other: '🐾',
};

export function PetCard({ pet, onLike, onPass, isLoading }: PetCardProps) {
  const t = useTranslations('discover');
  const tPets = useTranslations('pets.species');

  const getAgeDisplay = () => {
    if (!pet.ageMonths) return t('card.ageUnknown');
    if (pet.ageMonths >= 12) {
      const years = Math.floor(pet.ageMonths / 12);
      return t('card.yearsOld', { years });
    }
    return t('card.monthsOld', { months: pet.ageMonths });
  };

  const photoUrl =
    pet.photos && pet.photos.length > 0
      ? pet.photos[0]
      : null;

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Photo */}
        <div className="relative h-96 bg-gradient-to-br from-primary/20 to-secondary/20">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={pet.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-9xl opacity-50">
                {speciesEmoji[pet.species] || '🐾'}
              </span>
            </div>
          )}

          {/* Gradient overlay */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/60 to-transparent" />

          {/* Pet info overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
            <h2 className="text-2xl font-bold">{pet.name}</h2>
            <div className="flex items-center gap-2 text-white/90">
              <span>{speciesEmoji[pet.species]}</span>
              <span>{tPets(pet.species)}</span>
              {pet.breed && (
                <>
                  <span>•</span>
                  <span>{pet.breed}</span>
                </>
              )}
            </div>
            <p className="text-white/80 text-sm mt-1">{getAgeDisplay()}</p>
          </div>
        </div>

        {/* Bio */}
        {pet.bio && (
          <div className="p-4 border-t border-gray-100">
            <p className="text-text-muted text-sm line-clamp-2">{pet.bio}</p>
          </div>
        )}

        {/* Actions */}
        <div className="p-4 flex gap-4">
          <button
            onClick={onPass}
            disabled={isLoading}
            className="flex-1 py-4 rounded-xl bg-gray-100 hover:bg-gray-200
                     text-text-muted font-semibold text-lg
                     transition-all duration-200 active:scale-95
                     disabled:opacity-50 disabled:cursor-not-allowed
                     flex items-center justify-center gap-2"
          >
            <span className="text-2xl">👎</span>
            {t('actions.pass')}
          </button>
          <button
            onClick={onLike}
            disabled={isLoading}
            className="flex-1 py-4 rounded-xl bg-primary hover:bg-primary-dark
                     text-white font-semibold text-lg
                     transition-all duration-200 active:scale-95
                     disabled:opacity-50 disabled:cursor-not-allowed
                     flex items-center justify-center gap-2"
          >
            <span className="text-2xl">❤️</span>
            {t('actions.like')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default PetCard;
