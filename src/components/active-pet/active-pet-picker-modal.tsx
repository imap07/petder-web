'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { Link } from '@/i18n/routing';
import { useActivePet } from '@/contexts';
import { Modal } from '@/components/ui';

const REMEMBER_CHOICE_KEY = 'petder_remember_pet_choice';

// Storage helper for remember choice preference
const rememberChoiceStorage = {
  get: (): boolean => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(REMEMBER_CHOICE_KEY) === 'true';
  },
  set: (value: boolean): void => {
    if (typeof window === 'undefined') return;
    if (value) {
      localStorage.setItem(REMEMBER_CHOICE_KEY, 'true');
    } else {
      localStorage.removeItem(REMEMBER_CHOICE_KEY);
    }
  },
};

export function ActivePetPickerModal() {
  const t = useTranslations('activePet');
  const {
    isPetPickerOpen,
    closePetPicker,
    pets,
    activePets,
    setActivePetId,
    isLoadingPets,
  } = useActivePet();

  // Remember choice checkbox state
  const [rememberChoice, setRememberChoice] = useState(false);

  // Load saved preference when modal opens
  useEffect(() => {
    if (isPetPickerOpen) {
      setRememberChoice(rememberChoiceStorage.get());
    }
  }, [isPetPickerOpen]);

  const handleSelect = (petId: string) => {
    // Save remember choice preference
    rememberChoiceStorage.set(rememberChoice);
    setActivePetId(petId);
    // Modal will close automatically via setActivePetId
  };

  // Don't render if not open
  if (!isPetPickerOpen) {
    return null;
  }

  return (
    <Modal
      isOpen={isPetPickerOpen}
      onClose={closePetPicker}
    >
      <div className="bg-foreground rounded-2xl p-6 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-text">{t('choosePetTitle')}</h2>
          <button
            onClick={closePetPicker}
            className="p-2 rounded-full hover:bg-surface transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
        {/* Description */}
        <p className="text-text-muted text-sm">
          {t('choosePetDescription')}
        </p>

        {/* Loading State */}
        {isLoadingPets && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-surface animate-pulse">
                <div className="w-14 h-14 rounded-full bg-border" />
                <div className="flex-1 space-y-2">
                  <div className="w-24 h-4 rounded bg-border" />
                  <div className="w-16 h-3 rounded bg-border" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pet Cards */}
        {!isLoadingPets && (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {pets.map((pet) => {
              const isActive = pet.status === 'active';
              
              return (
                <button
                  key={pet.id}
                  onClick={() => isActive && handleSelect(pet.id)}
                  disabled={!isActive}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl text-left transition-all
                    ${isActive 
                      ? 'bg-surface hover:bg-surface/80 hover:ring-2 hover:ring-primary/50 cursor-pointer' 
                      : 'bg-surface/50 opacity-60 cursor-not-allowed'
                    }
                  `}
                >
                  {/* Pet Avatar */}
                  <div className="relative w-14 h-14 rounded-full overflow-hidden bg-background flex-shrink-0 ring-2 ring-border">
                    {pet.photoUrl ? (
                      <Image
                        src={pet.photoUrl}
                        alt={pet.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-text-muted">
                        <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                  
                  {/* Pet Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-semibold text-text truncate">
                      {pet.name}
                    </p>
                    {!isActive && (
                      <span className="inline-flex items-center gap-1 text-xs text-warning mt-1">
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {t('inactive')}
                      </span>
                    )}
                  </div>
                  
                  {/* Select Indicator */}
                  {isActive && (
                    <div className="flex-shrink-0">
                      <svg className="w-5 h-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* No Active Pets Warning */}
        {!isLoadingPets && activePets.length === 0 && pets.length > 0 && (
          <div className="p-4 rounded-xl bg-warning/10 border border-warning/20">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-sm font-medium text-warning">{t('noActivePetsTitle')}</p>
                <p className="text-xs text-text-muted mt-1">{t('noActivePetsDescription')}</p>
              </div>
            </div>
          </div>
        )}

        {/* No Pets at All */}
        {!isLoadingPets && pets.length === 0 && (
          <div className="text-center py-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-surface flex items-center justify-center">
              <svg className="w-8 h-8 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <p className="text-text font-medium">{t('noPetsTitle')}</p>
            <p className="text-text-muted text-sm mt-1">{t('noPetsDescription')}</p>
          </div>
        )}

        {/* Remember Choice Checkbox - Only show when there are multiple active pets */}
        {activePets.length > 1 && (
          <div className="pt-2">
            <label className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface/50 transition-colors cursor-pointer">
              <div className="relative flex-shrink-0">
                <input
                  type="checkbox"
                  checked={rememberChoice}
                  onChange={(e) => setRememberChoice(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-5 h-5 border-2 border-border rounded-md peer-checked:bg-primary peer-checked:border-primary transition-colors flex items-center justify-center">
                  {rememberChoice && (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </div>
              <span className="text-sm text-text-muted">{t('rememberChoice')}</span>
            </label>
          </div>
        )}

        {/* Add Pet Button */}
        <div className="pt-2 border-t border-border">
          <Link
            href="/pets/new"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl
                       bg-primary/10 text-primary font-medium hover:bg-primary/20 transition-colors"
            onClick={closePetPicker}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {t('addPet')}
          </Link>
        </div>
        </div>
      </div>
    </Modal>
  );
}

export default ActivePetPickerModal;
