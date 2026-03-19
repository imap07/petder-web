export type NotificationType = 'match' | 'like' | 'message' | 'system' | 'pet_status';

export interface NotificationActor {
  id: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface NotificationEntity {
  kind: 'pet' | 'match' | 'chat';
  id: string;
}

export interface NotificationMeta {
  petId?: string;
  matchId?: string;
  chatId?: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  body?: string; // Alias for message for new API
  data?: Record<string, unknown>;
  read: boolean;
  isRead?: boolean; // Alias for read for new API
  createdAt: string;
  actor?: NotificationActor | null;
  entity?: NotificationEntity | null;
  meta?: NotificationMeta;
}

export interface NotificationFeedResponse {
  items: Notification[];
  nextCursor: string | null;
}

export interface UnreadCountResponse {
  count: number;
}
