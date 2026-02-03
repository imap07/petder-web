export type BreedSpecies = 'dog' | 'cat';

export interface BreedPrediction {
  breed: string;
  confidence: number;
}

export interface RecognizeBreedRequest {
  imageUrl: string;
  species: BreedSpecies;
  topK?: number;
}

export interface RecognizeBreedResponse {
  provider: string;
  species: BreedSpecies;
  modelId: string;
  top: BreedPrediction[];
}
