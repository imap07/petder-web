import type { MatchIntent } from './pet';

export interface ChatParticipant {
  id: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface ChatPetContext {
  id: string;
  name: string;
  photoUrl: string | null;
}

export interface LastMessage {
  text: string;
  senderId: string;
  createdAt: string;
}

/** A match context within a conversation (multiple pet-to-pet contexts) */
export interface ConversationContext {
  matchId: string;
  myPet: ChatPetContext;
  otherPet: ChatPetContext;
  matchIntent: MatchIntent;
  createdAt: string;
}

export interface Conversation {
  id: string;
  matchId: string | null;
  participants: ChatParticipant[];
  lastMessage: LastMessage | null;
  unreadCount: number;
  updatedAt: string;
  /** My pet in this conversation (if available from backend) */
  myPet?: ChatPetContext | null;
  /** The other pet in this conversation (if available from backend) */
  otherPet?: ChatPetContext | null;
  /** Multiple match contexts within this conversation */
  contexts?: ConversationContext[];
}

/** Message read status */
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

export interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  createdAt: string;
  /** Which match context this message belongs to */
  contextMatchId?: string | null;
  /** Message delivery/read status */
  status?: MessageStatus;
  /** When the message was read */
  readAt?: string | null;
}

export interface ConversationsListResponse {
  items: Conversation[];
  nextCursor: string | null;
}

export interface MessagesListResponse {
  items: ChatMessage[];
  nextCursor: string | null;
  /** All contexts available in this conversation */
  contexts?: ConversationContext[];
  /** The currently active context for this conversation */
  activeContextMatchId?: string | null;
}

// For optimistic updates
export interface PendingMessage extends ChatMessage {
  isPending?: boolean;
  isFailed?: boolean;
  tempId?: string;
}

/** Send message request body */
export interface SendMessageData {
  text: string;
  contextMatchId?: string;
}
