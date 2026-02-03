export type Language = 'en' | 'es';

export interface Coords {
  lat: number;
  lng: number;
}

export interface Location {
  country: string | null;
  city: string | null;
  coords: Coords | null;
}

export interface Preferences {
  language: Language;
  discoveryRadiusKm: number;
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
}

export interface Settings {
  isProfilePublic: boolean;
  allowMessages: boolean;
  notifications: NotificationSettings;
}

export interface OwnerProfile {
  id: string;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  phoneNumber: string | null;
  location: Location;
  preferences: Preferences;
  settings: Settings;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateOwnerProfileData {
  displayName?: string;
  avatarUrl?: string | null;
  bio?: string | null;
  phoneNumber?: string | null;
  location?: {
    country?: string | null;
    city?: string | null;
    coords?: Coords | null;
  };
  preferences?: {
    language?: Language;
    discoveryRadiusKm?: number;
  };
  settings?: {
    isProfilePublic?: boolean;
    allowMessages?: boolean;
    notifications?: {
      email?: boolean;
      push?: boolean;
    };
  };
}

export interface PublicOwnerProfile {
  id: string;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  country: string | null;
  city: string | null;
}
