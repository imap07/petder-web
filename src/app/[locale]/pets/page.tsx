'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { useAuth } from '@/contexts';
import { api } from '@/lib';
import { ProtectedRoute } from '@/components/auth';
import { Button, Card, CardContent } from '@/components/ui';
import type { Pet } from '@/types';

function PetCard({
  pet,
  onDelete,
  isDeleting,
}: {
  pet: Pet;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}) {
  const t = useTranslations('pets.list');
  const tSpecies = useTranslations('pets.species');

  const getAgeDisplay = () => {
    if (!pet.ageMonths) return t('ageUnknown');
    if (pet.ageMonths >= 12) {
      const years = Math.floor(pet.ageMonths / 12);
      return t('yearsOld', { years });
    }
    return t('monthsOld', { months: pet.ageMonths });
  };

  return (
    <Card className={`overflow-hidden ${!pet.isActive ? 'opacity-60' : ''}`}>
      <div className="relative">
        {pet.photos.length > 0 ? (
          <img
            src={pet.photos[0]}
            alt={pet.name}
            className="w-full h-48 object-cover"
          />
        ) : (
          <div className="w-full h-48 bg-surface flex items-center justify-center">
            <span className="text-6xl">🐾</span>
          </div>
        )}
        {!pet.isActive && (
          <div className="absolute top-2 right-2 bg-error text-text-inverse text-xs px-2 py-1 rounded">
            {t('inactive')}
          </div>
        )}
      </div>

      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="font-semibold text-lg text-text">{pet.name}</h3>
            <p className="text-sm text-text-muted">
              {tSpecies(pet.species)} {pet.breed && `- ${pet.breed}`}
            </p>
          </div>
          <span className="text-sm text-text-muted">{getAgeDisplay()}</span>
        </div>

        {pet.bio && (
          <p className="text-sm text-text-muted mb-3 line-clamp-2">{pet.bio}</p>
        )}

        <div className="flex flex-wrap gap-2 mb-4">
          {pet.sex !== 'unknown' && (
            <span className="text-xs bg-surface border border-border text-text-muted px-2 py-1 rounded">
              {t(`sex.${pet.sex}`)}
            </span>
          )}
          {pet.size && (
            <span className="text-xs bg-surface border border-border text-text-muted px-2 py-1 rounded">
              {t(`size.${pet.size}`)}
            </span>
          )}
          {pet.energyLevel && (
            <span className="text-xs bg-surface border border-border text-text-muted px-2 py-1 rounded">
              {t(`energy.${pet.energyLevel}`)}
            </span>
          )}
          {pet.vaccinated && (
            <span className="text-xs bg-success-bg text-success border border-success/20 px-2 py-1 rounded">
              {t('vaccinated')}
            </span>
          )}
          {pet.neutered && (
            <span className="text-xs bg-primary/10 text-primary border border-primary/20 px-2 py-1 rounded">
              {t('neutered')}
            </span>
          )}
        </div>

        <div className="flex gap-2">
          <Link href={`/pets/${pet.id}/edit`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full">
              {t('editButton')}
            </Button>
          </Link>
          {pet.isActive && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(pet.id)}
              isLoading={isDeleting}
              className="text-error hover:text-error hover:bg-error-bg"
            >
              {t('deleteButton')}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function PetsListContent() {
  const t = useTranslations('pets.list');
  const { token } = useAuth();

  const [pets, setPets] = useState<Pet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchPets = async () => {
    if (!token) return;

    try {
      const data = await api.pets.getMyPets(token);
      setPets(data);
    } catch (err) {
      console.error('Error fetching pets:', err);
      setError(t('errors.loadFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleDelete = async (id: string) => {
    if (!token) return;

    const confirmed = window.confirm(t('deleteConfirm'));
    if (!confirmed) return;

    setDeletingId(id);
    try {
      await api.pets.delete(token, id);
      // Update the pet in the list to show as inactive
      setPets((prev) =>
        prev.map((p) => (p.id === id ? { ...p, isActive: false } : p))
      );
    } catch (err) {
      console.error('Error deleting pet:', err);
      setError(t('errors.deleteFailed'));
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const activePets = pets.filter((p) => p.isActive);
  const inactivePets = pets.filter((p) => !p.isActive);

  return (
    <div className="min-h-[calc(100vh-64px)] py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-text">{t('title')}</h1>
            <p className="text-text-muted">{t('subtitle')}</p>
          </div>
          <Link href="/pets/new">
            <Button>{t('addButton')}</Button>
          </Link>
        </div>

        {error && (
          <div className="p-4 rounded-lg bg-error-bg border border-error/20 text-error mb-6">
            {error}
          </div>
        )}

        {pets.length === 0 ? (
          <Card className="p-12 text-center">
            <span className="text-6xl block mb-4">🐾</span>
            <h2 className="text-xl font-semibold text-text mb-2">{t('empty.title')}</h2>
            <p className="text-text-muted mb-6">{t('empty.subtitle')}</p>
            <Link href="/pets/new">
              <Button>{t('empty.addButton')}</Button>
            </Link>
          </Card>
        ) : (
          <>
            {activePets.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-text mb-4">
                  {t('activePets')} ({activePets.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {activePets.map((pet) => (
                    <PetCard
                      key={pet.id}
                      pet={pet}
                      onDelete={handleDelete}
                      isDeleting={deletingId === pet.id}
                    />
                  ))}
                </div>
              </div>
            )}

            {inactivePets.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-text-muted mb-4">
                  {t('inactivePets')} ({inactivePets.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {inactivePets.map((pet) => (
                    <PetCard
                      key={pet.id}
                      pet={pet}
                      onDelete={handleDelete}
                      isDeleting={deletingId === pet.id}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function PetsListPage() {
  return (
    <ProtectedRoute>
      <PetsListContent />
    </ProtectedRoute>
  );
}
