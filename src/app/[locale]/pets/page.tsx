'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { useAuth } from '@/contexts';
import { api } from '@/lib';
import { ProtectedRoute } from '@/components/auth';
import { Button, Card, CardContent } from '@/components/ui';
import {
  PetStatusBadge,
  PetActionsMenu,
  DeactivatePetModal,
  DeletePetModal,
} from '@/components/pets';
import type { Pet, PetStatus } from '@/types';

interface PetCardProps {
  pet: Pet;
  onActivate: (id: string) => void;
  onDeactivate: (id: string) => void;
  onDelete: (id: string) => void;
  isLoading: boolean;
}

function PetCard({
  pet,
  onActivate,
  onDeactivate,
  onDelete,
  isLoading,
}: PetCardProps) {
  const t = useTranslations('pets.list');
  const tSpecies = useTranslations('pets.species');

  // Derive status from pet.status or fallback to isActive for backward compatibility
  const status: PetStatus = pet.status || (pet.isActive ? 'active' : 'inactive');

  const getAgeDisplay = () => {
    if (!pet.ageMonths) return t('ageUnknown');
    if (pet.ageMonths >= 12) {
      const years = Math.floor(pet.ageMonths / 12);
      return t('yearsOld', { years });
    }
    return t('monthsOld', { months: pet.ageMonths });
  };

  return (
    <Card className={`overflow-hidden ${status === 'inactive' ? 'opacity-75' : ''}`}>
      <div className="relative">
        {pet.photos.length > 0 ? (
          <img
            src={pet.photos[0]}
            alt={pet.name}
            className="w-full h-48 object-cover"
          />
        ) : (
          <div className="w-full h-48 bg-surface dark:bg-gray-700 flex items-center justify-center">
            <span className="text-6xl">🐾</span>
          </div>
        )}
        {/* Status badge */}
        <div className="absolute top-2 left-2">
          <PetStatusBadge status={status} />
        </div>
        {/* Actions menu */}
        <div className="absolute top-2 right-2">
          <div className="bg-white/90 dark:bg-gray-800/90 rounded-lg backdrop-blur-sm">
            <PetActionsMenu
              petId={pet.id}
              petName={pet.name}
              status={status}
              onActivate={() => onActivate(pet.id)}
              onDeactivate={() => onDeactivate(pet.id)}
              onDelete={() => onDelete(pet.id)}
              isLoading={isLoading}
            />
          </div>
        </div>
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
            <span className="text-xs bg-surface dark:bg-gray-700 border border-border dark:border-gray-600 text-text-muted px-2 py-1 rounded">
              {t(`sex.${pet.sex}`)}
            </span>
          )}
          {pet.size && (
            <span className="text-xs bg-surface dark:bg-gray-700 border border-border dark:border-gray-600 text-text-muted px-2 py-1 rounded">
              {t(`size.${pet.size}`)}
            </span>
          )}
          {pet.energyLevel && (
            <span className="text-xs bg-surface dark:bg-gray-700 border border-border dark:border-gray-600 text-text-muted px-2 py-1 rounded">
              {t(`energy.${pet.energyLevel}`)}
            </span>
          )}
          {pet.vaccinated && (
            <span className="text-xs bg-success-bg dark:bg-success/20 text-success border border-success/20 px-2 py-1 rounded">
              {t('vaccinated')}
            </span>
          )}
          {pet.neutered && (
            <span className="text-xs bg-primary/10 text-primary border border-primary/20 px-2 py-1 rounded">
              {t('neutered')}
            </span>
          )}
        </div>

        <Link href={`/pets/${pet.id}/edit`} className="block">
          <Button variant="outline" size="sm" className="w-full">
            {t('editButton')}
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

function PetsListContent() {
  const t = useTranslations('pets.list');
  const { token } = useAuth();

  const [pets, setPets] = useState<Pet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modal states
  const [deactivateModal, setDeactivateModal] = useState<{
    isOpen: boolean;
    petId: string;
    petName: string;
  }>({ isOpen: false, petId: '', petName: '' });

  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    petId: string;
    petName: string;
  }>({ isOpen: false, petId: '', petName: '' });

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

  // Clear messages after timeout
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleActivate = async (id: string) => {
    if (!token) return;

    setActionLoadingId(id);
    try {
      const updatedPet = await api.pets.activate(token, id);
      setPets((prev) =>
        prev.map((p) => (p.id === id ? updatedPet : p))
      );
      setSuccessMessage(t('success.activated'));
    } catch (err) {
      console.error('Error activating pet:', err);
      setError(t('errors.activateFailed'));
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeactivateClick = (id: string) => {
    const pet = pets.find((p) => p.id === id);
    if (pet) {
      setDeactivateModal({ isOpen: true, petId: id, petName: pet.name });
    }
  };

  const handleDeactivateConfirm = async () => {
    if (!token) return;

    const { petId } = deactivateModal;
    setActionLoadingId(petId);

    try {
      const updatedPet = await api.pets.deactivate(token, petId);
      setPets((prev) =>
        prev.map((p) => (p.id === petId ? updatedPet : p))
      );
      setSuccessMessage(t('success.deactivated'));
      setDeactivateModal({ isOpen: false, petId: '', petName: '' });
    } catch (err) {
      console.error('Error deactivating pet:', err);
      setError(t('errors.deactivateFailed'));
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteClick = (id: string) => {
    const pet = pets.find((p) => p.id === id);
    if (pet) {
      setDeleteModal({ isOpen: true, petId: id, petName: pet.name });
    }
  };

  const handleDeleteConfirm = async (reason?: string) => {
    if (!token) return;

    const { petId } = deleteModal;
    setActionLoadingId(petId);

    try {
      await api.pets.delete(token, petId, reason);
      // Remove from list (deleted pets are not shown)
      setPets((prev) => prev.filter((p) => p.id !== petId));
      setSuccessMessage(t('success.deleted'));
      setDeleteModal({ isOpen: false, petId: '', petName: '' });
    } catch (err) {
      console.error('Error deleting pet:', err);
      setError(t('errors.deleteFailed'));
    } finally {
      setActionLoadingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Filter pets by status (exclude deleted - they shouldn't be returned by API anyway)
  const activePets = pets.filter((p) => (p.status || (p.isActive ? 'active' : 'inactive')) === 'active');
  const inactivePets = pets.filter((p) => (p.status || (p.isActive ? 'active' : 'inactive')) === 'inactive');

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

        {/* Success message */}
        {successMessage && (
          <div className="p-4 rounded-lg bg-success-bg dark:bg-success/20 border border-success/20 text-success mb-6 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {successMessage}
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="p-4 rounded-lg bg-error-bg dark:bg-error/20 border border-error/20 text-error mb-6 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
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
                      onActivate={handleActivate}
                      onDeactivate={handleDeactivateClick}
                      onDelete={handleDeleteClick}
                      isLoading={actionLoadingId === pet.id}
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
                      onActivate={handleActivate}
                      onDeactivate={handleDeactivateClick}
                      onDelete={handleDeleteClick}
                      isLoading={actionLoadingId === pet.id}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Deactivate Modal */}
      <DeactivatePetModal
        petName={deactivateModal.petName}
        isOpen={deactivateModal.isOpen}
        isLoading={actionLoadingId === deactivateModal.petId}
        onConfirm={handleDeactivateConfirm}
        onCancel={() => setDeactivateModal({ isOpen: false, petId: '', petName: '' })}
      />

      {/* Delete Modal */}
      <DeletePetModal
        petName={deleteModal.petName}
        isOpen={deleteModal.isOpen}
        isLoading={actionLoadingId === deleteModal.petId}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteModal({ isOpen: false, petId: '', petName: '' })}
      />
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
