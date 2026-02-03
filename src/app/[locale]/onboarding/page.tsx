'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { useAuth, useOnboarding } from '@/contexts';
import { api, ApiError } from '@/lib';
import { ProtectedRoute } from '@/components/auth';
import {
  Button,
  Input,
  Select,
  Textarea,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  ImageUploader,
  LocationRadiusPicker,
} from '@/components/ui';
import type { PetSpecies, PetSex, PetSize, EnergyLevel } from '@/types';

type OnboardingStep = 'owner' | 'pet';

interface Coords {
  lat: number;
  lng: number;
}

interface LocationInfo {
  country?: string;
  countryCode?: string;
  city?: string;
}

function OwnerStep({ onComplete }: { onComplete: () => void }) {
  const t = useTranslations('onboarding.owner');
  const { token, user } = useAuth();
  const { ownerProfile, setOwnerProfile } = useOnboarding();

  const [formData, setFormData] = useState({
    displayName: ownerProfile?.displayName || user?.displayName || '',
    avatarUrl: ownerProfile?.avatarUrl || '',
    bio: ownerProfile?.bio || '',
    language: ownerProfile?.preferences?.language || 'en',
    discoveryRadiusKm: ownerProfile?.preferences?.discoveryRadiusKm || 25,
    country: ownerProfile?.location?.country || '',
    city: ownerProfile?.location?.city || '',
  });
  const [coords, setCoords] = useState<Coords | null>(
    ownerProfile?.location?.coords || null
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Update displayName from user if ownerProfile doesn't have one
  useEffect(() => {
    if (!formData.displayName && user?.displayName) {
      setFormData((prev) => ({ ...prev, displayName: user.displayName }));
    }
  }, [user, formData.displayName]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
    setApiError(null);
  };

  const handleRadiusChange = useCallback((radius: number) => {
    setFormData((prev) => ({ ...prev, discoveryRadiusKm: radius }));
    setErrors((prev) => ({ ...prev, discoveryRadiusKm: '' }));
  }, []);

  const handleCoordsChange = useCallback((newCoords: Coords) => {
    setCoords(newCoords);
  }, []);

  const handleLocationInfoChange = useCallback((info: LocationInfo) => {
    // Auto-fill country and city from geocoding
    if (info.country) {
      setFormData((prev) => ({ ...prev, country: info.country || prev.country }));
    }
    if (info.city) {
      setFormData((prev) => ({ ...prev, city: info.city || prev.city }));
    }
  }, []);

  const handleAvatarUpload = useCallback(async (file: File): Promise<string> => {
    if (!token) throw new Error('Not authenticated');
    
    // 1. Upload the image to storage
    const result = await api.uploads.uploadOwnerAvatar(token, file);
    
    // 2. Update the owner profile with the new avatar URL
    await api.ownerProfile.updateMe(token, {
      avatarUrl: result.url,
    });
    
    // 3. Update local state
    setFormData((prev) => ({ ...prev, avatarUrl: result.url }));
    
    return result.url;
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setApiError(null);

    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.avatarUrl) {
      newErrors.avatar = t('errors.avatarRequired');
    }
    if (!formData.displayName.trim()) {
      newErrors.displayName = t('errors.displayNameRequired');
    }
    if (!formData.discoveryRadiusKm || formData.discoveryRadiusKm < 1 || formData.discoveryRadiusKm > 200) {
      newErrors.discoveryRadiusKm = t('errors.radiusInvalid');
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);

    try {
      const updatedProfile = await api.ownerProfile.updateMe(token!, {
        displayName: formData.displayName,
        avatarUrl: formData.avatarUrl || null,
        bio: formData.bio || null,
        location: {
          country: formData.country || null,
          city: formData.city || null,
          coords: coords ? { lat: coords.lat, lng: coords.lng } : undefined,
        },
        preferences: {
          language: formData.language as 'en' | 'es',
          discoveryRadiusKm: Number(formData.discoveryRadiusKm),
        },
      });
      setOwnerProfile(updatedProfile);
      onComplete();
    } catch (error) {
      if (error instanceof ApiError) {
        setApiError(error.message);
      } else {
        setApiError(t('errors.generic'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-lg">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">{t('title')}</CardTitle>
        <CardDescription>{t('subtitle')}</CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {apiError && (
            <div className="p-3 rounded-lg bg-error-bg border border-error/20 text-error text-sm flex items-center gap-2">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {apiError}
            </div>
          )}

          {/* Avatar Upload - Required */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-text text-center">
              {t('avatarLabel')}
            </label>
            <ImageUploader
              onUpload={handleAvatarUpload}
              currentImageUrl={formData.avatarUrl}
              variant="avatar"
            />
            {errors.avatar && (
              <p className="text-sm text-error text-center">{errors.avatar}</p>
            )}
            <p className="text-xs text-text-muted text-center">
              {t('avatarRequired')}
            </p>
          </div>

          <Input
            name="displayName"
            label={t('displayNameLabel')}
            placeholder={t('displayNamePlaceholder')}
            value={formData.displayName}
            onChange={handleChange}
            error={errors.displayName}
            required
          />

          <Textarea
            name="bio"
            label={t('bioLabel')}
            placeholder={t('bioPlaceholder')}
            value={formData.bio}
            onChange={handleChange}
            maxLength={300}
          />

          <Select
            name="language"
            label={t('languageLabel')}
            value={formData.language}
            onChange={handleChange}
            options={[
              { value: 'en', label: 'English' },
              { value: 'es', label: 'Español' },
            ]}
          />

          {/* Location & Radius Picker */}
          <LocationRadiusPicker
            radius={formData.discoveryRadiusKm}
            onRadiusChange={handleRadiusChange}
            coords={coords}
            onCoordsChange={handleCoordsChange}
            onLocationInfoChange={handleLocationInfoChange}
            minRadius={1}
            maxRadius={200}
          />
        </CardContent>

        <CardFooter>
          <Button type="submit" className="w-full" isLoading={isLoading}>
            {t('continueButton')}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

// Compact photo uploader for pet photos grid
function PetPhotoUploader({
  onUpload,
  isUploading,
  setIsUploading,
}: {
  onUpload: (file: File) => Promise<string>;
  isUploading: boolean;
  setIsUploading: (value: boolean) => void;
}) {
  const t = useTranslations('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (file: File) => {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError(t('errors.invalidType'));
      return;
    }
    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError(t('errors.tooLarge', { maxSize: 5 }));
      return;
    }

    setError(null);
    setIsUploading(true);
    try {
      await onUpload(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.uploadFailed'));
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  return (
    <div className="aspect-square">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleInputChange}
        className="hidden"
        disabled={isUploading}
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        disabled={isUploading}
        className={`
          w-full h-full rounded-xl border-2 border-dashed transition-all
          flex flex-col items-center justify-center gap-2
          ${isDragging 
            ? 'border-primary bg-primary/10 scale-105' 
            : 'border-border hover:border-primary/50 bg-surface hover:bg-surface-hover'
          }
          ${isUploading ? 'opacity-60 cursor-wait' : 'cursor-pointer'}
        `}
      >
        {isUploading ? (
          <>
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-text-muted">{t('uploading')}</span>
          </>
        ) : (
          <>
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <span className="text-xs text-text-muted text-center px-2">{t('addPhoto')}</span>
          </>
        )}
      </button>
      {error && (
        <p className="text-xs text-error mt-1 text-center">{error}</p>
      )}
    </div>
  );
}

function PetStep({ onComplete }: { onComplete: () => void }) {
  const t = useTranslations('onboarding.pet');
  const tPets = useTranslations('pets');
  const { token } = useAuth();
  const { addPet } = useOnboarding();

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
  const [photos, setPhotos] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
    setApiError(null);
  };

  const handlePhotoUpload = useCallback(async (file: File): Promise<string> => {
    if (!token) throw new Error('Not authenticated');
    
    // For onboarding, we upload to a temp location (pets/temp/{userId}/)
    const result = await api.uploads.uploadTempPetPhoto(token, file);
    setPhotos((prev) => [...prev, result.url]);
    setErrors((prev) => ({ ...prev, photos: '' }));
    
    return result.url;
  }, [token]);

  const handleRemovePhoto = useCallback((index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setApiError(null);

    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = t('errors.nameRequired');
    }
    if (!formData.species) {
      newErrors.species = t('errors.speciesRequired');
    }
    if (photos.length < 2) {
      newErrors.photos = t('errors.photosRequired');
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);

    try {
      const petData = {
        name: formData.name,
        species: formData.species as PetSpecies,
        breed: formData.breed || undefined,
        sex: formData.sex || undefined,
        ageMonths: formData.ageMonths ? Number(formData.ageMonths) : undefined,
        size: formData.size || undefined,
        energyLevel: formData.energyLevel || undefined,
        temperament: formData.temperament
          ? formData.temperament.split(',').map((t) => t.trim()).filter(Boolean)
          : undefined,
        vaccinated: formData.vaccinated === 'true' ? true : formData.vaccinated === 'false' ? false : undefined,
        neutered: formData.neutered === 'true' ? true : formData.neutered === 'false' ? false : undefined,
        bio: formData.bio || undefined,
        photos: photos,
      };

      const newPet = await api.pets.create(token!, petData);
      addPet(newPet);
      onComplete();
    } catch (error) {
      if (error instanceof ApiError) {
        setApiError(error.message);
      } else {
        setApiError(t('errors.generic'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-lg">
      <CardHeader className="text-center">
        <div className="text-4xl mb-4">🐾</div>
        <CardTitle className="text-2xl">{t('title')}</CardTitle>
        <CardDescription>{t('subtitle')}</CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {apiError && (
            <div className="p-3 rounded-lg bg-error-bg border border-error/20 text-error text-sm">
              {apiError}
            </div>
          )}

          {/* Pet Photos - Required (min 2) */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-text">
              {t('photosLabel')} <span className="text-error">*</span>
            </label>
            <p className="text-xs text-text-muted">{t('photosMinRequired')}</p>
            
            <div className="grid grid-cols-3 gap-3">
              {photos.map((photo, index) => (
                <div key={index} className="relative aspect-square rounded-xl overflow-hidden border-2 border-border bg-surface group">
                  <img src={photo} alt={`Pet photo ${index + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(index)}
                    className="absolute top-2 right-2 w-7 h-7 bg-error text-white rounded-full flex items-center justify-center hover:bg-error/80 shadow-lg transition-transform hover:scale-110"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
              
              {photos.length < 6 && (
                <PetPhotoUploader
                  onUpload={handlePhotoUpload}
                  isUploading={isUploadingPhoto}
                  setIsUploading={setIsUploadingPhoto}
                />
              )}
            </div>
            
            {errors.photos && (
              <p className="text-sm text-error">{errors.photos}</p>
            )}
            <p className="text-xs text-text-muted">
              {photos.length}/6 {t('photosCount')} {photos.length < 2 && `(${t('photosNeedMore', { count: 2 - photos.length })})`}
            </p>
          </div>

          <Input
            name="name"
            label={t('nameLabel')}
            placeholder={t('namePlaceholder')}
            value={formData.name}
            onChange={handleChange}
            error={errors.name}
            required
          />

          <Select
            name="species"
            label={t('speciesLabel')}
            value={formData.species}
            onChange={handleChange}
            error={errors.species}
            options={[
              { value: '', label: t('speciesPlaceholder') },
              { value: 'dog', label: tPets('species.dog') },
              { value: 'cat', label: tPets('species.cat') },
              { value: 'other', label: tPets('species.other') },
            ]}
          />

          <Input
            name="breed"
            label={t('breedLabel')}
            placeholder={t('breedPlaceholder')}
            value={formData.breed}
            onChange={handleChange}
          />

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
            maxLength={500}
          />
        </CardContent>

        <CardFooter>
          <Button type="submit" className="w-full" isLoading={isLoading}>
            {t('finishButton')}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { needsOwnerSetup, needsPetSetup } = useOnboarding();

  const stepParam = searchParams.get('step') as OnboardingStep | null;
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('owner');

  useEffect(() => {
    if (stepParam === 'pet' && !needsOwnerSetup) {
      setCurrentStep('pet');
    } else if (needsOwnerSetup) {
      setCurrentStep('owner');
    } else if (needsPetSetup) {
      setCurrentStep('pet');
    }
  }, [stepParam, needsOwnerSetup, needsPetSetup]);

  const handleOwnerComplete = () => {
    setCurrentStep('pet');
    router.replace('/onboarding?step=pet');
  };

  const handlePetComplete = () => {
    router.replace('/discover');
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center px-4 py-8">
      {/* Progress indicator */}
      <div className="flex items-center gap-4 mb-8">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center text-text-inverse font-bold ${
            currentStep === 'owner' ? 'bg-primary' : 'bg-secondary'
          }`}
        >
          1
        </div>
        <div className="w-16 h-1 bg-border">
          <div
            className={`h-full bg-primary transition-all ${
              currentStep === 'pet' ? 'w-full' : 'w-0'
            }`}
          />
        </div>
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
            currentStep === 'pet' ? 'bg-primary text-text-inverse' : 'bg-surface text-text-muted border border-border'
          }`}
        >
          2
        </div>
      </div>

      {currentStep === 'owner' ? (
        <OwnerStep onComplete={handleOwnerComplete} />
      ) : (
        <PetStep onComplete={handlePetComplete} />
      )}
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <ProtectedRoute>
      <OnboardingContent />
    </ProtectedRoute>
  );
}
