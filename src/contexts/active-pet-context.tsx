'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { api } from '@/lib';
import { useAuth } from './auth-context';
import type { Pet, PetSex } from '@/types';

const ACTIVE_PET_KEY = 'petder_active_pet_id';
const DATING_SAME_SEX_DISMISSED_KEY = 'petder_dating_same_sex_dismissed';
const REMEMBER_CHOICE_KEY = 'petder_remember_pet_choice';

export interface ActivePetCandidate {
  id: string;
  name: string;
  photoUrl: string | null;
  status: 'active' | 'inactive';
  sex?: PetSex;
}

interface ActivePetState {
  activePetId: string | null;
  activePet: ActivePetCandidate | null;
  pets: ActivePetCandidate[];
  activePets: ActivePetCandidate[];
  isLoadingPets: boolean;
  requiresSelection: boolean;
}

interface ActivePetContextValue extends ActivePetState {
  loadMyPets: () => Promise<void>;
  setActivePetId: (id: string) => void;
  clearActivePet: () => void;
  openPetPicker: () => void;
  closePetPicker: () => void;
  isPetPickerOpen: boolean;
  /** Check if dating same-sex nudge has been dismissed */
  isDatingSameSexDismissed: () => boolean;
  /** Dismiss the dating same-sex nudge permanently */
  dismissDatingSameSexNudge: () => void;
  /** Handle API error - opens picker if ACTIVE_PET_REQUIRED */
  handleApiError: (error: unknown) => boolean;
}

const ActivePetContext = createContext<ActivePetContextValue | null>(null);

// Storage helpers
const activePetStorage = {
  get: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(ACTIVE_PET_KEY);
  },
  set: (id: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(ACTIVE_PET_KEY, id);
  },
  remove: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(ACTIVE_PET_KEY);
  },
};

export function ActivePetProvider({ children }: { children: ReactNode }) {
  const { token, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  
  const [state, setState] = useState<ActivePetState>({
    activePetId: null,
    activePet: null,
    pets: [],
    activePets: [],
    isLoadingPets: true,
    requiresSelection: false,
  });
  
  const [isPetPickerOpen, setIsPetPickerOpen] = useState(false);

  const mapPetToCandidate = (pet: Pet): ActivePetCandidate => ({
    id: pet.id,
    name: pet.name,
    photoUrl: pet.photos?.[0] || null,
    status: pet.status === 'active' ? 'active' : 'inactive',
    sex: pet.sex,
  });

  const loadMyPets = useCallback(async () => {
    if (!token) {
      setState(prev => ({
        ...prev,
        pets: [],
        activePets: [],
        activePetId: null,
        activePet: null,
        isLoadingPets: false,
        requiresSelection: false,
      }));
      return;
    }

    setState(prev => ({ ...prev, isLoadingPets: true }));

    try {
      const petsData = await api.pets.getMyPets(token);
      const candidates = petsData
        .filter(p => p.status !== 'deleted')
        .map(mapPetToCandidate);
      
      const activePets = candidates.filter(p => p.status === 'active');
      
      // Get stored active pet ID
      const storedId = activePetStorage.get();
      
      let newActivePetId: string | null = null;
      let requiresSelection = false;
      
      if (activePets.length === 0) {
        // No active pets - clear selection
        activePetStorage.remove();
        newActivePetId = null;
        requiresSelection = false;
      } else if (activePets.length === 1) {
        // Auto-select the only active pet
        newActivePetId = activePets[0].id;
        activePetStorage.set(newActivePetId);
        requiresSelection = false;
      } else {
        // Multiple active pets - check if stored ID is still valid
        if (storedId && activePets.some(p => p.id === storedId)) {
          newActivePetId = storedId;
          // Check if user wants to remember their choice
          const shouldRemember = typeof window !== 'undefined' &&
            localStorage.getItem(REMEMBER_CHOICE_KEY) === 'true';
          requiresSelection = !shouldRemember;
        } else {
          // Invalid or no stored ID - require selection
          activePetStorage.remove();
          newActivePetId = null;
          requiresSelection = true;
        }
      }
      
      const newActivePet = newActivePetId 
        ? activePets.find(p => p.id === newActivePetId) || null
        : null;
      
      setState({
        pets: candidates,
        activePets,
        activePetId: newActivePetId,
        activePet: newActivePet,
        isLoadingPets: false,
        requiresSelection,
      });
    } catch (error) {
      console.error('Failed to load pets:', error);
      setState(prev => ({
        ...prev,
        isLoadingPets: false,
      }));
    }
  }, [token]);

  const setActivePetId = useCallback((id: string) => {
    const pet = state.activePets.find(p => p.id === id);
    if (!pet) {
      console.warn('Cannot set inactive or non-existent pet as active');
      return;
    }
    
    activePetStorage.set(id);
    setState(prev => ({
      ...prev,
      activePetId: id,
      activePet: pet,
      requiresSelection: false,
    }));
    setIsPetPickerOpen(false);
  }, [state.activePets]);

  const clearActivePet = useCallback(() => {
    activePetStorage.remove();
    setState(prev => ({
      ...prev,
      activePetId: null,
      activePet: null,
      requiresSelection: prev.activePets.length > 1,
    }));
  }, []);

  const openPetPicker = useCallback(() => {
    setIsPetPickerOpen(true);
  }, []);

  const closePetPicker = useCallback(() => {
    setIsPetPickerOpen(false);
  }, []);

  // Dating same-sex nudge helpers
  const isDatingSameSexDismissed = useCallback((): boolean => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(DATING_SAME_SEX_DISMISSED_KEY) === 'true';
  }, []);

  const dismissDatingSameSexNudge = useCallback(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(DATING_SAME_SEX_DISMISSED_KEY, 'true');
  }, []);

  // Handle API errors - returns true if error was handled
  const handleApiError = useCallback((error: unknown): boolean => {
    if (!error || typeof error !== 'object') return false;
    
    // Check for ACTIVE_PET_REQUIRED error
    const err = error as { code?: string; statusCode?: number };
    if (err.code === 'ACTIVE_PET_REQUIRED' || 
        (err.statusCode === 400 && 'availablePets' in err)) {
      openPetPicker();
      return true;
    }
    
    return false;
  }, [openPetPicker]);

  // Load pets when authenticated
  useEffect(() => {
    if (!isAuthLoading && isAuthenticated && token) {
      loadMyPets();
    } else if (!isAuthLoading && !isAuthenticated) {
      // Clear state when logged out
      activePetStorage.remove();
      setState({
        activePetId: null,
        activePet: null,
        pets: [],
        activePets: [],
        isLoadingPets: false,
        requiresSelection: false,
      });
    }
  }, [isAuthLoading, isAuthenticated, token, loadMyPets]);

  return (
    <ActivePetContext.Provider
      value={{
        ...state,
        loadMyPets,
        setActivePetId,
        clearActivePet,
        openPetPicker,
        closePetPicker,
        isPetPickerOpen,
        isDatingSameSexDismissed,
        dismissDatingSameSexNudge,
        handleApiError,
      }}
    >
      {children}
    </ActivePetContext.Provider>
  );
}

export function useActivePet() {
  const context = useContext(ActivePetContext);
  if (!context) {
    throw new Error('useActivePet must be used within an ActivePetProvider');
  }
  return context;
}

export default ActivePetProvider;
