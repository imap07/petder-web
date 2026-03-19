export type PetSpecies =
  | 'dog'
  | 'cat'
  | 'rabbit'
  | 'bird'
  | 'fish'
  | 'hamster'
  | 'guinea_pig'
  | 'turtle'
  | 'snake'
  | 'lizard'
  | 'ferret'
  | 'horse'
  | 'other';
export type PetSex = 'male' | 'female' | 'unknown';
export type PetSize = 'xs' | 's' | 'm' | 'l' | 'xl';
export type EnergyLevel = 'low' | 'medium' | 'high';

/**
 * Pet lifecycle status:
 * - active: Visible in discovery, can receive swipes/matches
 * - inactive: Hidden from discovery, visible in owner's list
 * - deleted: Soft-deleted, hidden everywhere
 */
export type PetStatus = 'active' | 'inactive' | 'deleted';

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
  status: PetStatus;
  isActive: boolean; // Deprecated: use status instead
  deletedAt: string | null;
  deletionReason: string | null;
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

export type SwipeAction = 'like' | 'pass' | 'dating';
export type MatchIntent = 'social' | 'mixed' | 'dating';

export interface SwipeData {
  toPetId: string;
  action: SwipeAction;
  fromPetId?: string; // Optional: can also be sent via X-Active-Pet-Id header
}

export interface SwipeResponse {
  matchCreated: boolean;
  matchId?: string;
  matchIntent?: MatchIntent;
}

export interface Match {
  id: string;
  userAId: string;
  userBId: string;
  petAId: string | null;
  petBId: string | null;
  createdAt: string;
}
