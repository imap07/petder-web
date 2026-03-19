export type BreedSpecies =
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

export const SUPPORTED_SPECIES: BreedSpecies[] = [
  'dog',
  'cat',
  'rabbit',
  'bird',
  'fish',
  'hamster',
  'guinea_pig',
  'turtle',
  'snake',
  'lizard',
  'ferret',
  'horse',
  'other',
];

export interface BreedPrediction {
  breed: string;
  confidence: number;
}

export interface RecognizeBreedRequest {
  imageUrl: string;
  species: BreedSpecies;
  petId: string;
  topK?: number;
}

export interface RateLimitInfo {
  attemptsUsed: number;
  attemptsRemaining: number;
  resetAt: string | null;
  waitTimeMinutes: number | null;
}

export interface RecognizeBreedResponse {
  provider: string;
  species: BreedSpecies;
  modelId: string;
  top: BreedPrediction[];
  rateLimit: RateLimitInfo;
}
