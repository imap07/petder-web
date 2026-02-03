export type NotificationType = 'match' | 'like' | 'message' | 'system';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  read: boolean;
  createdAt: string;
}

export interface UnreadCountResponse {
  count: number;
}
