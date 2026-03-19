// Match types for the matches feature

import type { MatchIntent } from './pet';

export interface MatchPet {
  id: string;
  name: string;
  photoUrl: string | null;
  species?: string;
  sex?: string;
}

export interface MatchOwner {
  id: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface MatchLastMessage {
  text: string;
  createdAt: string;
  senderId?: string;
}

// Enhanced match with additional data (for UI display)
export interface EnhancedMatch {
  id: string;
  createdAt: string;
  /** @deprecated Use otherPet instead */
  pet: MatchPet | null;
  /** Your pet in this match */
  myPet: MatchPet | null;
  /** The other pet in this match */
  otherPet: MatchPet | null;
  otherOwner: MatchOwner | null;
  lastMessage: MatchLastMessage | null;
  unreadCount: number;
  chatId?: string;
  conversationId?: string;
  matchIntent?: MatchIntent;
  /** Number of match contexts in the conversation (for multi-context indicator) */
  contextCount?: number;
}

// Derived match for UI display with computed fields
export interface MatchDisplay extends EnhancedMatch {
  displayTitle: string;
  previewText: string;
  sortKey: number;
  isNew: boolean; // Created within last 24h
  hasMessages: boolean;
}

export type MatchFilter = 'all' | 'unread' | 'new';

// API response type from backend (enriched match data)
export interface ApiMatchResponse {
  id: string;
  userAId: string;
  userBId: string;
  petAId: string | null;
  petBId: string | null;
  createdAt: string;
  matchIntent?: MatchIntent;
  myPet?: {
    id: string;
    name: string;
    photoUrl: string | null;
    species?: string;
  } | null;
  otherPet?: {
    id: string;
    name: string;
    photoUrl: string | null;
    species?: string;
  } | null;
  /** @deprecated Use otherPet instead */
  pet?: {
    id: string;
    name: string;
    photoUrl: string | null;
    species?: string;
  } | null;
  otherOwner?: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
  } | null;
  conversationId: string | null;
  /** Number of match contexts in the conversation */
  contextCount?: number;
}
