export type PetSpecies = 'dog' | 'cat' | 'other';
export type PetSex = 'male' | 'female' | 'unknown';
export type PetSize = 'xs' | 's' | 'm' | 'l' | 'xl';
export type EnergyLevel = 'low' | 'medium' | 'high';

export interface Pet {
  id: string;
  ownerId: string;
  name: string;
  species: PetSpecies;
  breed: string | null;
  sex: PetSex;
  ageMonths: number | null;
  size: PetSize | null;
  energyLevel: EnergyLevel | null;
  temperament: string[];
  vaccinated: boolean | null;
  neutered: boolean | null;
  bio: string | null;
  photos: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePetData {
  name: string;
  species: PetSpecies;
  breed?: string;
  sex?: PetSex;
  ageMonths?: number;
  size?: PetSize;
  energyLevel?: EnergyLevel;
  temperament?: string[];
  vaccinated?: boolean;
  neutered?: boolean;
  bio?: string;
  photos?: string[];
}

export interface UpdatePetData {
  name?: string;
  species?: PetSpecies;
  breed?: string | null;
  sex?: PetSex;
  ageMonths?: number | null;
  size?: PetSize | null;
  energyLevel?: EnergyLevel | null;
  temperament?: string[];
  vaccinated?: boolean | null;
  neutered?: boolean | null;
  bio?: string | null;
  photos?: string[];
}

export type SwipeAction = 'like' | 'pass';

export interface SwipeData {
  toPetId: string;
  action: SwipeAction;
}

export interface SwipeResponse {
  matchCreated: boolean;
  matchId?: string;
}

export interface Match {
  id: string;
  userAId: string;
  userBId: string;
  petAId: string | null;
  petBId: string | null;
  createdAt: string;
}
