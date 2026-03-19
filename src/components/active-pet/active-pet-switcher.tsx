'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { Link } from '@/i18n/routing';
import { useActivePet } from '@/contexts';

export function ActivePetSwitcher() {
  const t = useTranslations('activePet');
  const {
    activePet,
    activePets,
    pets,
    isLoadingPets,
    setActivePetId,
    openPetPicker,
  } = useActivePet();
  
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown on escape
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  if (isLoadingPets) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface animate-pulse">
        <div className="w-8 h-8 rounded-full bg-border" />
        <div className="w-16 h-4 rounded bg-border hidden sm:block" />
      </div>
    );
  }

  // Don't show if user has no pets
  if (pets.length === 0) {
    return null;
  }

  // If no active pet selected but there are active pets, show prompt
  if (!activePet && activePets.length > 0) {
    return (
      <button
        onClick={openPetPicker}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 
                   text-primary transition-colors text-sm font-medium"
        aria-label={t('selectPet')}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
        <span className="hidden sm:inline">{t('selectPet')}</span>
      </button>
    );
  }

  // No active pets at all
  if (!activePet) {
    return null;
  }

  const handleSelect = (petId: string) => {
    setActivePetId(petId);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-surface 
                   transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={t('browsingAs', { name: activePet.name })}
      >
        {/* Pet Avatar */}
        <div className="relative w-8 h-8 rounded-full overflow-hidden bg-surface border-2 border-primary">
          {activePet.photoUrl ? (
            <Image
              src={activePet.photoUrl}
              alt={activePet.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-text-muted">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </div>
        
        {/* Pet Name (hidden on small screens) */}
        <span className="hidden sm:block text-sm font-medium text-text max-w-[100px] truncate">
          {activePet.name}
        </span>
        
        {/* Chevron */}
        {activePets.length > 1 && (
          <svg
            className={`w-4 h-4 text-text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && activePets.length > 1 && (
        <div
          className="absolute right-0 mt-2 w-64 rounded-xl bg-foreground border border-border 
                     shadow-lg z-50 py-2 animate-in fade-in slide-in-from-top-2 duration-200"
          role="listbox"
          aria-label={t('selectPet')}
        >
          {/* Header */}
          <div className="px-4 py-2 border-b border-border">
            <p className="text-xs text-text-muted uppercase tracking-wide font-medium">
              {t('browsingAsLabel')}
            </p>
          </div>

          {/* Pet List */}
          <div className="max-h-64 overflow-y-auto py-1">
            {pets.map((pet) => {
              const isActive = pet.status === 'active';
              const isSelected = pet.id === activePet.id;
              
              return (
                <button
                  key={pet.id}
                  onClick={() => isActive && handleSelect(pet.id)}
                  disabled={!isActive}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors
                    ${isSelected ? 'bg-primary/10' : 'hover:bg-surface'}
                    ${!isActive ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                  role="option"
                  aria-selected={isSelected}
                  aria-disabled={!isActive}
                >
                  {/* Pet Avatar */}
                  <div className={`relative w-10 h-10 rounded-full overflow-hidden bg-surface flex-shrink-0
                    ${isSelected ? 'ring-2 ring-primary' : 'ring-1 ring-border'}
                  `}>
                    {pet.photoUrl ? (
                      <Image
                        src={pet.photoUrl}
                        alt={pet.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-text-muted">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                  
                  {/* Pet Info */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${isSelected ? 'text-primary' : 'text-text'}`}>
                      {pet.name}
                    </p>
                    {!isActive && (
                      <p className="text-xs text-text-muted">{t('inactive')}</p>
                    )}
                  </div>
                  
                  {/* Selected Check */}
                  {isSelected && (
                    <svg className="w-5 h-5 text-primary flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>

          {/* Add Pet Link */}
          <div className="border-t border-border pt-2 px-2">
            <Link
              href="/pets/new"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-primary 
                         hover:bg-primary/10 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {t('addPet')}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default ActivePetSwitcher;
