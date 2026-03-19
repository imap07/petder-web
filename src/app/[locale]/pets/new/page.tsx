'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/routing';
import { useAuth } from '@/contexts';
import { api, ApiError } from '@/lib';
import { ProtectedRoute } from '@/components/auth';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Button,
  Input,
  Select,
  Textarea,
  ImageUploader,
} from '@/components/ui';
import type { PetSpecies, PetSex, PetSize, EnergyLevel } from '@/types';

const MAX_PHOTOS = 6;
const MIN_PHOTOS = 2;

function CreatePetContent() {
  const t = useTranslations('pets.create');
  const tCommon = useTranslations('common');
  const tPets = useTranslations('pets');
  const tErrors = useTranslations('auth.errors');
  const tUpload = useTranslations('upload');
  const router = useRouter();
  const { token } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    species: '' as PetSpecies | '',
    breed: '',
    sex: 'unknown' as PetSex,
    ageMonths: '',
    size: '' as PetSize | '',
    energyLevel: '' as EnergyLevel | '',
    temperament: '',
    vaccinated: '',
    neutered: '',
    bio: '',
  });
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handlePhotoUpload = useCallback(async (file: File): Promise<string> => {
    if (!token) throw new Error('Not authenticated');
    if (photoUrls.length >= MAX_PHOTOS) {
      throw new Error(tUpload('errors.maxPhotos', { max: MAX_PHOTOS }));
    }

    // Upload to temp storage for new pets
    const result = await api.uploads.uploadTempPetPhoto(token, file);
    
    // Update local state
    setPhotoUrls((prev) => [...prev, result.url]);
    
    return result.url;
  }, [token, photoUrls.length, tUpload]);

  const handleRemovePhoto = useCallback((indexToRemove: number) => {
    setPhotoUrls((prev) => prev.filter((_, index) => index !== indexToRemove));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    // Validate minimum photos
    if (photoUrls.length < MIN_PHOTOS) {
      setError(t('errors.minPhotos', { min: MIN_PHOTOS }));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const createdPet = await api.pets.create(token, {
        name: formData.name,
        species: formData.species as PetSpecies,
        breed: formData.breed || undefined,
        sex: formData.sex || undefined,
        ageMonths: formData.ageMonths ? parseInt(formData.ageMonths, 10) : undefined,
        size: formData.size || undefined,
        energyLevel: formData.energyLevel || undefined,
        temperament: formData.temperament
          ? formData.temperament.split(',').map((t) => t.trim()).filter(Boolean)
          : undefined,
        vaccinated: formData.vaccinated === 'true' ? true : formData.vaccinated === 'false' ? false : undefined,
        neutered: formData.neutered === 'true' ? true : formData.neutered === 'false' ? false : undefined,
        bio: formData.bio || undefined,
        photos: photoUrls,
      });

      setIsSuccess(true);

      // Redirect to edit page to use AI breed detection if needed
      setTimeout(() => {
        router.push(`/pets/${createdPet.id}/edit`);
      }, 1500);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError(tErrors('genericError'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Link
          href="/pets"
          className="text-primary hover:underline text-sm flex items-center gap-1"
        >
          ← {tCommon('back')}
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="text-4xl mb-2">🐾</div>
          <CardTitle className="text-2xl">{t('title')}</CardTitle>
          <CardDescription>{t('subtitle')}</CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {isSuccess && (
              <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-green-600 text-sm">
                {t('success')}
              </div>
            )}

            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
                {error}
              </div>
            )}

            <Input
              name="name"
              label={t('nameLabel')}
              placeholder={t('namePlaceholder')}
              value={formData.name}
              onChange={handleChange}
              required
            />

            <Select
              name="species"
              label={t('speciesLabel')}
              value={formData.species}
              onChange={handleChange}
              options={[
                { value: '', label: t('speciesPlaceholder') },
                { value: 'dog', label: tPets('species.dog') },
                { value: 'cat', label: tPets('species.cat') },
                { value: 'rabbit', label: tPets('species.rabbit') },
                { value: 'bird', label: tPets('species.bird') },
                { value: 'fish', label: tPets('species.fish') },
                { value: 'hamster', label: tPets('species.hamster') },
                { value: 'guinea_pig', label: tPets('species.guinea_pig') },
                { value: 'turtle', label: tPets('species.turtle') },
                { value: 'snake', label: tPets('species.snake') },
                { value: 'lizard', label: tPets('species.lizard') },
                { value: 'ferret', label: tPets('species.ferret') },
                { value: 'horse', label: tPets('species.horse') },
                { value: 'other', label: tPets('species.other') },
              ]}
              required
            />

            <div className="space-y-2">
              <Input
                name="breed"
                label={t('breedLabel')}
                placeholder={t('breedPlaceholder')}
                value={formData.breed}
                onChange={handleChange}
              />
              {formData.species && (
                <p className="text-xs text-text-muted flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  {t('breedAIHint')}
                </p>
              )}
            </div>

            <Select
              name="sex"
              label={t('sexLabel')}
              value={formData.sex}
              onChange={handleChange}
              options={[
                { value: 'unknown', label: t('sexOptions.unknown') },
                { value: 'male', label: t('sexOptions.male') },
                { value: 'female', label: t('sexOptions.female') },
              ]}
            />

            <Input
              name="ageMonths"
              type="number"
              label={t('ageLabel')}
              placeholder={t('agePlaceholder')}
              value={formData.ageMonths}
              onChange={handleChange}
              min={0}
            />

            <Select
              name="size"
              label={t('sizeLabel')}
              value={formData.size}
              onChange={handleChange}
              options={[
                { value: '', label: t('sizePlaceholder') },
                { value: 'xs', label: t('sizeOptions.xs') },
                { value: 's', label: t('sizeOptions.s') },
                { value: 'm', label: t('sizeOptions.m') },
                { value: 'l', label: t('sizeOptions.l') },
                { value: 'xl', label: t('sizeOptions.xl') },
              ]}
            />

            <Select
              name="energyLevel"
              label={t('energyLabel')}
              value={formData.energyLevel}
              onChange={handleChange}
              options={[
                { value: '', label: t('energyPlaceholder') },
                { value: 'low', label: t('energyOptions.low') },
                { value: 'medium', label: t('energyOptions.medium') },
                { value: 'high', label: t('energyOptions.high') },
              ]}
            />

            <Input
              name="temperament"
              label={t('temperamentLabel')}
              placeholder={t('temperamentPlaceholder')}
              value={formData.temperament}
              onChange={handleChange}
            />

            <div className="grid grid-cols-2 gap-4">
              <Select
                name="vaccinated"
                label={t('vaccinatedLabel')}
                value={formData.vaccinated}
                onChange={handleChange}
                options={[
                  { value: '', label: t('booleanOptions.unknown') },
                  { value: 'true', label: t('booleanOptions.yes') },
                  { value: 'false', label: t('booleanOptions.no') },
                ]}
              />

              <Select
                name="neutered"
                label={t('neuteredLabel')}
                value={formData.neutered}
                onChange={handleChange}
                options={[
                  { value: '', label: t('booleanOptions.unknown') },
                  { value: 'true', label: t('booleanOptions.yes') },
                  { value: 'false', label: t('booleanOptions.no') },
                ]}
              />
            </div>

            <Textarea
              name="bio"
              label={t('bioLabel')}
              placeholder={t('bioPlaceholder')}
              value={formData.bio}
              onChange={handleChange}
              rows={4}
              maxLength={500}
            />

            {/* Photo Upload Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-text">
                  {t('photosLabel')} <span className="text-red-500">*</span>
                </label>
                <span className="text-xs text-text-muted bg-surface-alt dark:bg-gray-700 px-2 py-1 rounded-full">
                  {photoUrls.length}/{MAX_PHOTOS} ({t('minRequired', { min: MIN_PHOTOS })})
                </span>
              </div>

              {/* Current Photos Grid */}
              {photoUrls.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {photoUrls.map((url, index) => (
                    <div key={index} className="relative group aspect-square rounded-xl overflow-hidden border border-border hover:border-primary/50 transition-colors">
                      <img
                        src={url}
                        alt={`Pet photo ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {/* Photo number badge */}
                      <div className="absolute top-2 left-2 w-6 h-6 bg-black/50 text-white text-xs rounded-full flex items-center justify-center font-medium">
                        {index + 1}
                      </div>
                      {/* Delete button */}
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(index)}
                        className="absolute top-2 right-2 w-8 h-8 bg-red-500/90 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600 hover:scale-110 shadow-lg"
                        title={tCommon('delete')}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none" />
                    </div>
                  ))}
                </div>
              )}

              {/* Add Photo Uploader */}
              {photoUrls.length < MAX_PHOTOS && (
                <div className="mt-4">
                  <ImageUploader
                    onUpload={handlePhotoUpload}
                    variant="photo"
                    label={photoUrls.length === 0 ? t('addFirstPhoto') : t('addMorePhotos')}
                  />
                </div>
              )}

              {/* Minimum photos warning */}
              {photoUrls.length < MIN_PHOTOS && (
                <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 text-amber-700 dark:text-amber-400 text-sm flex items-center gap-2">
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  {t('photosRequired', { min: MIN_PHOTOS })}
                </div>
              )}

              {/* Max photos reached message */}
              {photoUrls.length >= MAX_PHOTOS && (
                <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 text-amber-700 dark:text-amber-400 text-sm flex items-center gap-2">
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {t('maxPhotosReached')}
                </div>
              )}

              {/* AI Breed hint */}
              {(formData.species === 'dog' || formData.species === 'cat') && photoUrls.length >= MIN_PHOTOS && (
                <p className="text-xs text-text-muted flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  {t('breedAIHintAfterCreate')}
                </p>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex gap-4">
            <Button type="submit" className="flex-1" isLoading={isLoading}>
              {t('submitButton')}
            </Button>
            <Link href="/pets" className="flex-1">
              <Button type="button" variant="outline" className="w-full">
                {tCommon('cancel')}
              </Button>
            </Link>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default function CreatePetPage() {
  return (
    <ProtectedRoute>
      <CreatePetContent />
    </ProtectedRoute>
  );
}
