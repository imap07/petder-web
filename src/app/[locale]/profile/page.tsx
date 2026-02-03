'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
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
  PhoneInput,
} from '@/components/ui';
import type { Country } from 'react-phone-number-input';

interface Coords {
  lat: number;
  lng: number;
}

interface LocationInfo {
  country?: string;
  countryCode?: string;
  city?: string;
}

function ProfileContent() {
  const t = useTranslations('profile');
  const tCommon = useTranslations('common');
  const tUpload = useTranslations('upload');
  const { token } = useAuth();
  const { ownerProfile, setOwnerProfile } = useOnboarding();

  const [formData, setFormData] = useState({
    displayName: '',
    avatarUrl: '',
    bio: '',
    phoneNumber: '',
    country: '',
    city: '',
    language: 'en',
    discoveryRadiusKm: 25,
    isProfilePublic: true,
    allowMessages: true,
    emailNotifications: true,
    pushNotifications: true,
  });
  const [coords, setCoords] = useState<Coords | null>(null);
  const [detectedCountryCode, setDetectedCountryCode] = useState<Country>('CA');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [avatarUploadSuccess, setAvatarUploadSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (ownerProfile) {
      setFormData({
        displayName: ownerProfile.displayName || '',
        avatarUrl: ownerProfile.avatarUrl || '',
        bio: ownerProfile.bio || '',
        phoneNumber: ownerProfile.phoneNumber || '',
        country: ownerProfile.location?.country || '',
        city: ownerProfile.location?.city || '',
        language: ownerProfile.preferences?.language || 'en',
        discoveryRadiusKm: ownerProfile.preferences?.discoveryRadiusKm || 25,
        isProfilePublic: ownerProfile.settings?.isProfilePublic ?? true,
        allowMessages: ownerProfile.settings?.allowMessages ?? true,
        emailNotifications: ownerProfile.settings?.notifications?.email ?? true,
        pushNotifications: ownerProfile.settings?.notifications?.push ?? true,
      });
      // Set coords if available
      if (ownerProfile.location?.coords) {
        setCoords(ownerProfile.location.coords);
      }
    }
  }, [ownerProfile]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData((prev) => ({ ...prev, [name]: newValue }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
    setApiError(null);
    setSuccessMessage(null);
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: checked }));
    setApiError(null);
    setSuccessMessage(null);
  };

  const handleRadiusChange = useCallback((radius: number) => {
    setFormData((prev) => ({ ...prev, discoveryRadiusKm: radius }));
    setErrors((prev) => ({ ...prev, discoveryRadiusKm: '' }));
    setSuccessMessage(null);
  }, []);

  const handleCoordsChange = useCallback((newCoords: Coords) => {
    setCoords(newCoords);
    setSuccessMessage(null);
  }, []);

  const handleLocationInfoChange = useCallback((info: LocationInfo) => {
    // Auto-fill country and city from geocoding
    if (info.country) {
      setFormData((prev) => ({ ...prev, country: info.country || prev.country }));
    }
    if (info.city) {
      setFormData((prev) => ({ ...prev, city: info.city || prev.city }));
    }
    // Update phone country code
    if (info.countryCode) {
      setDetectedCountryCode(info.countryCode as Country);
    }
  }, []);

  const handlePhoneChange = useCallback((value: string | undefined) => {
    setFormData((prev) => ({ ...prev, phoneNumber: value || '' }));
    setSuccessMessage(null);
  }, []);

  const handleAvatarUpload = useCallback(async (file: File): Promise<string> => {
    if (!token) throw new Error('Not authenticated');
    
    setAvatarUploadSuccess(null);
    setApiError(null);
    
    // Upload the file
    const result = await api.uploads.uploadOwnerAvatar(token, file);
    
    // Update the profile with the new avatar URL
    const updatedProfile = await api.ownerProfile.updateMe(token, {
      avatarUrl: result.url,
    });
    
    // Update local state
    setOwnerProfile(updatedProfile);
    setFormData((prev) => ({ ...prev, avatarUrl: result.url }));
    setAvatarUploadSuccess(tUpload('avatarSuccess'));
    
    return result.url;
  }, [token, setOwnerProfile, tUpload]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setApiError(null);
    setSuccessMessage(null);

    // Validation
    const newErrors: Record<string, string> = {};
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

    setIsSaving(true);

    try {
      const updatedProfile = await api.ownerProfile.updateMe(token!, {
        displayName: formData.displayName,
        avatarUrl: formData.avatarUrl || null,
        bio: formData.bio || null,
        phoneNumber: formData.phoneNumber || null,
        location: {
          country: formData.country || null,
          city: formData.city || null,
          coords: coords ? { lat: coords.lat, lng: coords.lng } : undefined,
        },
        preferences: {
          language: formData.language as 'en' | 'es',
          discoveryRadiusKm: Number(formData.discoveryRadiusKm),
        },
        settings: {
          isProfilePublic: formData.isProfilePublic,
          allowMessages: formData.allowMessages,
          notifications: {
            email: formData.emailNotifications,
            push: formData.pushNotifications,
          },
        },
      });
      setOwnerProfile(updatedProfile);
      setSuccessMessage(t('success'));
    } catch (error) {
      if (error instanceof ApiError) {
        setApiError(error.message);
      } else {
        setApiError(t('errors.generic'));
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (!ownerProfile && isLoading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{t('title')}</CardTitle>
            <CardDescription>{t('subtitle')}</CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              {apiError && (
                <div className="p-3 rounded-lg bg-error-bg border border-error/20 text-error text-sm">
                  {apiError}
                </div>
              )}

              {successMessage && (
                <div className="p-3 rounded-lg bg-success-bg border border-success/20 text-success text-sm">
                  {successMessage}
                </div>
              )}

              {avatarUploadSuccess && (
                <div className="p-3 rounded-lg bg-success-bg border border-success/20 text-success text-sm flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {avatarUploadSuccess}
                </div>
              )}

              {/* Avatar Upload */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-text">{t('sections.avatar')}</h3>
                <ImageUploader
                  onUpload={handleAvatarUpload}
                  currentImageUrl={formData.avatarUrl}
                  variant="avatar"
                />
              </div>

              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-text">{t('sections.basicInfo')}</h3>

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

                <PhoneInput
                  value={formData.phoneNumber}
                  onChange={handlePhoneChange}
                  defaultCountry={detectedCountryCode}
                  label={t('phoneLabel')}
                  placeholder={t('phonePlaceholder')}
                />
              </div>

              {/* Location & Discovery */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-text">{t('sections.location')}</h3>
                
                <LocationRadiusPicker
                  radius={formData.discoveryRadiusKm}
                  onRadiusChange={handleRadiusChange}
                  coords={coords}
                  onCoordsChange={handleCoordsChange}
                  onLocationInfoChange={handleLocationInfoChange}
                  minRadius={1}
                  maxRadius={200}
                  autoRequestLocation={!coords}
                />

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <Input
                    name="country"
                    label={t('countryLabel')}
                    placeholder={t('countryPlaceholder')}
                    value={formData.country}
                    onChange={handleChange}
                  />

                  <Input
                    name="city"
                    label={t('cityLabel')}
                    placeholder={t('cityPlaceholder')}
                    value={formData.city}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Preferences */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-text">{t('sections.preferences')}</h3>

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
              </div>

              {/* Privacy Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-text">{t('sections.privacy')}</h3>

                <div className="space-y-3">
                  <label className="flex items-center justify-between p-3 bg-surface rounded-xl cursor-pointer hover:bg-surface-hover transition-colors border border-border">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-text">{t('isProfilePublicLabel')}</span>
                    </div>
                    <div className={`relative w-12 h-7 rounded-full transition-colors ${formData.isProfilePublic ? 'bg-primary' : 'bg-border'}`}>
                      <input
                        type="checkbox"
                        name="isProfilePublic"
                        checked={formData.isProfilePublic}
                        onChange={handleCheckboxChange}
                        className="sr-only"
                      />
                      <div className={`absolute top-1 w-5 h-5 bg-foreground rounded-full shadow transition-transform ${formData.isProfilePublic ? 'translate-x-6' : 'translate-x-1'}`} />
                    </div>
                  </label>

                  <label className="flex items-center justify-between p-3 bg-surface rounded-xl cursor-pointer hover:bg-surface-hover transition-colors border border-border">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
                        <svg className="w-5 h-5 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-text">{t('allowMessagesLabel')}</span>
                    </div>
                    <div className={`relative w-12 h-7 rounded-full transition-colors ${formData.allowMessages ? 'bg-primary' : 'bg-border'}`}>
                      <input
                        type="checkbox"
                        name="allowMessages"
                        checked={formData.allowMessages}
                        onChange={handleCheckboxChange}
                        className="sr-only"
                      />
                      <div className={`absolute top-1 w-5 h-5 bg-foreground rounded-full shadow transition-transform ${formData.allowMessages ? 'translate-x-6' : 'translate-x-1'}`} />
                    </div>
                  </label>
                </div>
              </div>

              {/* Notifications */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-text">{t('sections.notifications')}</h3>

                <div className="space-y-3">
                  <label className="flex items-center justify-between p-3 bg-surface rounded-xl cursor-pointer hover:bg-surface-hover transition-colors border border-border">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                        <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-text">{t('emailNotificationsLabel')}</span>
                    </div>
                    <div className={`relative w-12 h-7 rounded-full transition-colors ${formData.emailNotifications ? 'bg-primary' : 'bg-border'}`}>
                      <input
                        type="checkbox"
                        name="emailNotifications"
                        checked={formData.emailNotifications}
                        onChange={handleCheckboxChange}
                        className="sr-only"
                      />
                      <div className={`absolute top-1 w-5 h-5 bg-foreground rounded-full shadow transition-transform ${formData.emailNotifications ? 'translate-x-6' : 'translate-x-1'}`} />
                    </div>
                  </label>

                  <label className="flex items-center justify-between p-3 bg-surface rounded-xl cursor-pointer hover:bg-surface-hover transition-colors border border-border">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-text">{t('pushNotificationsLabel')}</span>
                    </div>
                    <div className={`relative w-12 h-7 rounded-full transition-colors ${formData.pushNotifications ? 'bg-primary' : 'bg-border'}`}>
                      <input
                        type="checkbox"
                        name="pushNotifications"
                        checked={formData.pushNotifications}
                        onChange={handleCheckboxChange}
                        className="sr-only"
                      />
                      <div className={`absolute top-1 w-5 h-5 bg-foreground rounded-full shadow transition-transform ${formData.pushNotifications ? 'translate-x-6' : 'translate-x-1'}`} />
                    </div>
                  </label>
                </div>
              </div>
            </CardContent>

            <CardFooter>
              <Button type="submit" className="w-full" isLoading={isSaving}>
                {tCommon('save')}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
}
