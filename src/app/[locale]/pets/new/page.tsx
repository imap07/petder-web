'use client';

import { useState } from 'react';
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
} from '@/components/ui';
import type { PetSpecies, PetSex, PetSize, EnergyLevel } from '@/types';

function CreatePetContent() {
  const t = useTranslations('pets.create');
  const tCommon = useTranslations('common');
  const tPets = useTranslations('pets');
  const tErrors = useTranslations('auth.errors');
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
    photos: '',
  });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

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
        photos: formData.photos
          ? formData.photos.split(',').map((p) => p.trim()).filter(Boolean)
          : undefined,
      });

      setIsSuccess(true);

      // Redirect to edit page to upload photos and use AI breed detection
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
              {(formData.species === 'dog' || formData.species === 'cat') && (
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

            <Input
              name="photos"
              label={t('photosLabel')}
              placeholder={t('photosPlaceholder')}
              value={formData.photos}
              onChange={handleChange}
            />
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
