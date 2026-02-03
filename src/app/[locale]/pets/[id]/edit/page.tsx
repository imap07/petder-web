'use client';

import { useState, useEffect, useCallback } from 'react';
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
import { AIBreedSuggestion } from '@/components/pets';
import type { Pet, PetSpecies, PetSex, PetSize, EnergyLevel } from '@/types';

const MAX_PHOTOS = 6;

function EditPetContent({ id }: { id: string }) {
  const t = useTranslations('pets.edit');
  const tCreate = useTranslations('pets.create');
  const tCommon = useTranslations('common');
  const tPets = useTranslations('pets');
  const tErrors = useTranslations('auth.errors');
  const tUpload = useTranslations('upload');
  const router = useRouter();
  const { token } = useAuth();

  const [pet, setPet] = useState<Pet | null>(null);
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
    photos: '',
  });
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photoUploadSuccess, setPhotoUploadSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchPet = async () => {
      if (!token) return;

      try {
        const data = await api.pets.getById(token, id);
        setPet(data);
        setFormData({
          name: data.name,
          species: data.species,
          breed: data.breed || '',
          sex: data.sex,
          ageMonths: data.ageMonths?.toString() || '',
          size: data.size || '',
          energyLevel: data.energyLevel || '',
          temperament: data.temperament?.join(', ') || '',
          vaccinated: data.vaccinated === true ? 'true' : data.vaccinated === false ? 'false' : '',
          neutered: data.neutered === true ? 'true' : data.neutered === false ? 'false' : '',
          bio: data.bio || '',
          photos: data.photos?.join(', ') || '',
        });
        setPhotoUrls(data.photos || []);
      } catch (err) {
        console.error('Error fetching pet:', err);
        setError(t('errors.loadFailed'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchPet();
  }, [token, id, t]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
    setIsSuccess(false);
  };

  const handlePhotoUpload = useCallback(async (file: File): Promise<string> => {
    if (!token) throw new Error('Not authenticated');
    if (photoUrls.length >= MAX_PHOTOS) {
      throw new Error(tUpload('errors.maxPhotos', { max: MAX_PHOTOS }));
    }

    setPhotoUploadSuccess(null);
    setError(null);

    // Upload the file
    const result = await api.uploads.uploadPetPhoto(token, id, file);

    // Update the pet with the new photo
    const newPhotos = [...photoUrls, result.url];
    await api.pets.update(token, id, { photos: newPhotos });

    // Update local state
    setPhotoUrls(newPhotos);
    setFormData((prev) => ({ ...prev, photos: newPhotos.join(', ') }));
    setPhotoUploadSuccess(tUpload('photoSuccess'));

    return result.url;
  }, [token, id, photoUrls, tUpload]);

  const handleRemovePhoto = useCallback(async (indexToRemove: number) => {
    if (!token) return;

    const newPhotos = photoUrls.filter((_, index) => index !== indexToRemove);

    try {
      await api.pets.update(token, id, { photos: newPhotos });
      setPhotoUrls(newPhotos);
      setFormData((prev) => ({ ...prev, photos: newPhotos.join(', ') }));
      setPhotoUploadSuccess(tUpload('photoRemoved'));
    } catch (err) {
      setError(err instanceof Error ? err.message : tErrors('genericError'));
    }
  }, [token, id, photoUrls, tUpload, tErrors]);

  const handleBreedSelect = useCallback(async (breed: string) => {
    if (!token) return;

    // Format breed name: replace underscores with spaces and capitalize
    const formattedBreed = breed
      .replace(/_/g, ' ')
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');

    // Update the pet with the new breed
    await api.pets.update(token, id, { breed: formattedBreed });

    // Update local state
    setFormData((prev) => ({ ...prev, breed: formattedBreed }));
    setPet((prev) => prev ? { ...prev, breed: formattedBreed } : prev);
  }, [token, id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setIsSaving(true);
    setError(null);

    try {
      await api.pets.update(token, id, {
        name: formData.name,
        species: formData.species as PetSpecies,
        breed: formData.breed || null,
        sex: formData.sex || undefined,
        ageMonths: formData.ageMonths ? parseInt(formData.ageMonths, 10) : null,
        size: formData.size || null,
        energyLevel: formData.energyLevel || null,
        temperament: formData.temperament
          ? formData.temperament.split(',').map((t) => t.trim()).filter(Boolean)
          : [],
        vaccinated: formData.vaccinated === 'true' ? true : formData.vaccinated === 'false' ? false : null,
        neutered: formData.neutered === 'true' ? true : formData.neutered === 'false' ? false : null,
        bio: formData.bio || null,
        photos: formData.photos
          ? formData.photos.split(',').map((p) => p.trim()).filter(Boolean)
          : [],
      });

      setIsSuccess(true);

      // Redirect to pets list after success
      setTimeout(() => {
        router.push('/pets');
      }, 1500);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError(tErrors('genericError'));
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!pet && !isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="p-8 text-center">
          <span className="text-6xl block mb-4">🐾</span>
          <h2 className="text-xl font-semibold text-text mb-2">{t('notFound.title')}</h2>
          <p className="text-text-muted mb-6">{t('notFound.subtitle')}</p>
          <Link href="/pets">
            <Button>{tCommon('back')}</Button>
          </Link>
        </Card>
      </div>
    );
  }

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
          <CardDescription>{t('subtitle', { name: pet?.name ?? '' })}</CardDescription>
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
              label={tCreate('nameLabel')}
              placeholder={tCreate('namePlaceholder')}
              value={formData.name}
              onChange={handleChange}
              required
            />

            <Select
              name="species"
              label={tCreate('speciesLabel')}
              value={formData.species}
              onChange={handleChange}
              options={[
                { value: '', label: tCreate('speciesPlaceholder') },
                { value: 'dog', label: tPets('species.dog') },
                { value: 'cat', label: tPets('species.cat') },
                { value: 'other', label: tPets('species.other') },
              ]}
              required
            />

            <Input
              name="breed"
              label={tCreate('breedLabel')}
              placeholder={tCreate('breedPlaceholder')}
              value={formData.breed}
              onChange={handleChange}
            />

            <Select
              name="sex"
              label={tCreate('sexLabel')}
              value={formData.sex}
              onChange={handleChange}
              options={[
                { value: 'unknown', label: tCreate('sexOptions.unknown') },
                { value: 'male', label: tCreate('sexOptions.male') },
                { value: 'female', label: tCreate('sexOptions.female') },
              ]}
            />

            <Input
              name="ageMonths"
              type="number"
              label={tCreate('ageLabel')}
              placeholder={tCreate('agePlaceholder')}
              value={formData.ageMonths}
              onChange={handleChange}
              min={0}
            />

            <Select
              name="size"
              label={tCreate('sizeLabel')}
              value={formData.size}
              onChange={handleChange}
              options={[
                { value: '', label: tCreate('sizePlaceholder') },
                { value: 'xs', label: tCreate('sizeOptions.xs') },
                { value: 's', label: tCreate('sizeOptions.s') },
                { value: 'm', label: tCreate('sizeOptions.m') },
                { value: 'l', label: tCreate('sizeOptions.l') },
                { value: 'xl', label: tCreate('sizeOptions.xl') },
              ]}
            />

            <Select
              name="energyLevel"
              label={tCreate('energyLabel')}
              value={formData.energyLevel}
              onChange={handleChange}
              options={[
                { value: '', label: tCreate('energyPlaceholder') },
                { value: 'low', label: tCreate('energyOptions.low') },
                { value: 'medium', label: tCreate('energyOptions.medium') },
                { value: 'high', label: tCreate('energyOptions.high') },
              ]}
            />

            <Input
              name="temperament"
              label={tCreate('temperamentLabel')}
              placeholder={tCreate('temperamentPlaceholder')}
              value={formData.temperament}
              onChange={handleChange}
            />

            <div className="grid grid-cols-2 gap-4">
              <Select
                name="vaccinated"
                label={tCreate('vaccinatedLabel')}
                value={formData.vaccinated}
                onChange={handleChange}
                options={[
                  { value: '', label: tCreate('booleanOptions.unknown') },
                  { value: 'true', label: tCreate('booleanOptions.yes') },
                  { value: 'false', label: tCreate('booleanOptions.no') },
                ]}
              />

              <Select
                name="neutered"
                label={tCreate('neuteredLabel')}
                value={formData.neutered}
                onChange={handleChange}
                options={[
                  { value: '', label: tCreate('booleanOptions.unknown') },
                  { value: 'true', label: tCreate('booleanOptions.yes') },
                  { value: 'false', label: tCreate('booleanOptions.no') },
                ]}
              />
            </div>

            <Textarea
              name="bio"
              label={tCreate('bioLabel')}
              placeholder={tCreate('bioPlaceholder')}
              value={formData.bio}
              onChange={handleChange}
              rows={4}
              maxLength={500}
            />

            {/* Photo Upload Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-text">
                  {t('photosLabel')}
                </label>
                <span className="text-xs text-text-muted bg-gray-100 px-2 py-1 rounded-full">
                  {photoUrls.length}/{MAX_PHOTOS}
                </span>
              </div>

              {photoUploadSuccess && (
                <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-green-600 text-sm flex items-center gap-2">
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {photoUploadSuccess}
                </div>
              )}

              {/* Current Photos Grid */}
              {photoUrls.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {photoUrls.map((url, index) => (
                    <div key={index} className="relative group aspect-square rounded-xl overflow-hidden border border-gray-200 hover:border-primary/50 transition-colors">
                      <img
                        src={url}
                        alt={`${pet?.name} photo ${index + 1}`}
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
                        title={t('removePhoto')}
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

              {/* Max photos reached message */}
              {photoUrls.length >= MAX_PHOTOS && (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-sm flex items-center gap-2">
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {t('maxPhotosReached')}
                </div>
              )}

              {/* AI Breed Suggestion - Only show when there are photos */}
              {pet && token && (
                <AIBreedSuggestion
                  petId={id}
                  petSpecies={pet.species}
                  photoUrl={photoUrls.length > 0 ? photoUrls[0] : null}
                  currentBreed={formData.breed || null}
                  token={token}
                  onBreedSelect={handleBreedSelect}
                />
              )}
            </div>
          </CardContent>

          <CardFooter className="flex gap-4">
            <Button type="submit" className="flex-1" isLoading={isSaving}>
              {tCommon('save')}
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

export default function EditPetPage({ params }: { params: { id: string } }) {
  return (
    <ProtectedRoute>
      <EditPetContent id={params.id} />
    </ProtectedRoute>
  );
}
