'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { useRouter, usePathname } from '@/i18n/routing';
import { useAuth } from './auth-context';
import { api } from '@/lib';
import type { OwnerProfile, Pet } from '@/types';

interface OnboardingState {
  ownerProfile: OwnerProfile | null;
  pets: Pet[];
  incompletePets: Pet[];
  isLoading: boolean;
  isOnboardingComplete: boolean;
  needsOwnerSetup: boolean;
  needsPetSetup: boolean;
  needsAvatar: boolean;
}

interface OnboardingContextValue extends OnboardingState {
  refreshOnboardingStatus: () => Promise<void>;
  setOwnerProfile: (profile: OwnerProfile) => void;
  addPet: (pet: Pet) => void;
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

// Routes that don't require onboarding check
const PUBLIC_ROUTES = ['/', '/login', '/register', '/auth/callback'];
const ONBOARDING_ROUTE = '/onboarding';
// Routes allowed during pet setup (to add photos to existing pets)
const PET_SETUP_ALLOWED_ROUTES = ['/pets/'];

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading: authLoading, token } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [state, setState] = useState<OnboardingState>({
    ownerProfile: null,
    pets: [],
    incompletePets: [],
    isLoading: true,
    isOnboardingComplete: false,
    needsOwnerSetup: false,
    needsPetSetup: false,
    needsAvatar: false,
  });

  const checkOnboardingStatus = useCallback(async () => {
    if (!token) {
      setState((prev) => ({ ...prev, isLoading: false }));
      return;
    }

    try {
      const [ownerProfile, pets] = await Promise.all([
        api.ownerProfile.getMe(token).catch(() => null),
        api.pets.getMyPets(token).catch(() => []),
      ]);

      const activePets = pets.filter((p) => p.isActive);
      // Avatar is required for profile completion
      const needsAvatar = !ownerProfile?.avatarUrl;
      const needsOwnerSetup = !ownerProfile || 
        !ownerProfile.avatarUrl ||  // Avatar is now required
        !ownerProfile.displayName || 
        !ownerProfile.preferences?.discoveryRadiusKm;
      // Pets need at least 2 photos to be considered complete
      const completePets = activePets.filter((p) => p.photos && p.photos.length >= 2);
      const incompletePets = activePets.filter((p) => !p.photos || p.photos.length < 2);
      // User needs at least one complete pet (with 2+ photos) to finish onboarding
      const needsPetSetup = completePets.length === 0;
      const isOnboardingComplete = !needsOwnerSetup && !needsPetSetup;

      setState({
        ownerProfile,
        pets,
        incompletePets,
        isLoading: false,
        isOnboardingComplete,
        needsOwnerSetup,
        needsPetSetup,
        needsAvatar,
      });
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, [token]);

  const refreshOnboardingStatus = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }));
    await checkOnboardingStatus();
  }, [checkOnboardingStatus]);

  const setOwnerProfile = useCallback((profile: OwnerProfile) => {
    const needsAvatar = !profile.avatarUrl;
    const needsOwnerSetup = !profile.avatarUrl || !profile.displayName || !profile.preferences?.discoveryRadiusKm;
    setState((prev) => ({
      ...prev,
      ownerProfile: profile,
      needsAvatar,
      needsOwnerSetup,
      isOnboardingComplete: !needsOwnerSetup && !prev.needsPetSetup,
    }));
  }, []);

  const addPet = useCallback((pet: Pet) => {
    setState((prev) => {
      const newPets = [...prev.pets, pet];
      const activePets = newPets.filter((p) => p.isActive);
      return {
        ...prev,
        pets: newPets,
        needsPetSetup: activePets.length === 0,
        isOnboardingComplete: !prev.needsOwnerSetup && activePets.length > 0,
      };
    });
  }, []);

  // Check onboarding status when authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      checkOnboardingStatus();
    } else if (!authLoading && !isAuthenticated) {
      setState({
        ownerProfile: null,
        pets: [],
        incompletePets: [],
        isLoading: false,
        isOnboardingComplete: false,
        needsOwnerSetup: false,
        needsPetSetup: false,
        needsAvatar: false,
      });
    }
  }, [authLoading, isAuthenticated, checkOnboardingStatus]);

  // Handle routing based on onboarding status
  useEffect(() => {
    if (authLoading || state.isLoading || !isAuthenticated) return;

    const isPublicRoute = PUBLIC_ROUTES.includes(pathname);
    const isOnboardingRoute = pathname.startsWith(ONBOARDING_ROUTE);
    // Allow access to pet edit pages during pet setup (to add photos)
    const isPetSetupAllowedRoute = PET_SETUP_ALLOWED_ROUTES.some(route => pathname.startsWith(route));

    // If on a protected route and onboarding not complete, redirect
    if (!isPublicRoute && !isOnboardingRoute) {
      if (state.needsOwnerSetup) {
        router.replace('/onboarding?step=owner');
      } else if (state.needsPetSetup && !isPetSetupAllowedRoute) {
        // Allow pet edit pages so users can add photos to incomplete pets
        router.replace('/onboarding?step=pet');
      }
    }

    // If on onboarding route but onboarding is complete, redirect to discover
    if (isOnboardingRoute && state.isOnboardingComplete) {
      router.replace('/discover');
    }
  }, [
    authLoading,
    state.isLoading,
    state.needsOwnerSetup,
    state.needsPetSetup,
    state.isOnboardingComplete,
    isAuthenticated,
    pathname,
    router,
  ]);

  return (
    <OnboardingContext.Provider
      value={{
        ...state,
        refreshOnboardingStatus,
        setOwnerProfile,
        addPet,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}
