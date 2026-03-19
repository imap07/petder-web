import type {
  AuthResponse,
  LoginCredentials,
  RegisterCredentials,
  User,
  Pet,
  CreatePetData,
  UpdatePetData,
  SwipeData,
  SwipeResponse,
  OwnerProfile,
  UpdateOwnerProfileData,
  UploadResponse,
  Notification,
  NotificationFeedResponse,
  UnreadCountResponse,
  RecognizeBreedRequest,
  RecognizeBreedResponse,
  ConversationsListResponse,
  MessagesListResponse,
  ChatMessage,
  SendMessageData,
  ApiMatchResponse,
} from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5051';

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_URL}${endpoint}`;

  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  const response = await fetch(url, config);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An error occurred' }));
    throw new ApiError(response.status, error.message || 'An error occurred');
  }

  return response.json();
}

function getAuthHeaders(token: string, activePetId?: string | null): HeadersInit {
  const headers: HeadersInit = {
    Authorization: `Bearer ${token}`,
  };
  
  if (activePetId) {
    headers['X-Active-Pet-Id'] = activePetId;
  }
  
  return headers;
}

export const api = {
  auth: {
    register: (credentials: RegisterCredentials): Promise<AuthResponse> => {
      return request<AuthResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
    },

    login: (credentials: LoginCredentials): Promise<AuthResponse> => {
      return request<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
    },

    me: (token: string): Promise<User> => {
      return request<User>('/auth/me', {
        method: 'GET',
        headers: getAuthHeaders(token),
      });
    },
  },

  ownerProfile: {
    getMe: (token: string): Promise<OwnerProfile> => {
      return request<OwnerProfile>('/owner-profile/me', {
        method: 'GET',
        headers: getAuthHeaders(token),
      });
    },

    updateMe: (token: string, data: UpdateOwnerProfileData): Promise<OwnerProfile> => {
      return request<OwnerProfile>('/owner-profile/me', {
        method: 'PATCH',
        headers: getAuthHeaders(token),
        body: JSON.stringify(data),
      });
    },
  },

  pets: {
    create: (token: string, data: CreatePetData): Promise<Pet> => {
      return request<Pet>('/pets', {
        method: 'POST',
        headers: getAuthHeaders(token),
        body: JSON.stringify(data),
      });
    },

    getMyPets: (token: string, includeDeleted = false): Promise<Pet[]> => {
      const query = includeDeleted ? '?includeDeleted=true' : '';
      return request<Pet[]>(`/pets/me${query}`, {
        method: 'GET',
        headers: getAuthHeaders(token),
      });
    },

    getById: (token: string, id: string): Promise<Pet> => {
      return request<Pet>(`/pets/${id}`, {
        method: 'GET',
        headers: getAuthHeaders(token),
      });
    },

    update: (token: string, id: string, data: UpdatePetData): Promise<Pet> => {
      return request<Pet>(`/pets/${id}`, {
        method: 'PATCH',
        headers: getAuthHeaders(token),
        body: JSON.stringify(data),
      });
    },

    /**
     * Activate a pet - makes it visible in discovery again.
     * Cannot activate deleted pets.
     */
    activate: (token: string, id: string): Promise<Pet> => {
      return request<Pet>(`/pets/${id}/activate`, {
        method: 'PATCH',
        headers: getAuthHeaders(token),
      });
    },

    /**
     * Deactivate a pet - hides from discovery but keeps in owner's list.
     * Can be reactivated later.
     */
    deactivate: (token: string, id: string): Promise<Pet> => {
      return request<Pet>(`/pets/${id}/deactivate`, {
        method: 'PATCH',
        headers: getAuthHeaders(token),
      });
    },

    /**
     * Soft delete a pet - FINAL action, cannot be undone.
     * Pet will be hidden from discovery, matches, and swipes.
     */
    delete: (token: string, id: string, reason?: string): Promise<Pet> => {
      return request<Pet>(`/pets/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(token),
        body: reason ? JSON.stringify({ reason }) : undefined,
      });
    },
  },

  discovery: {
    /**
     * Get discovery feed for the active pet.
     * @param token - Auth token
     * @param activePetId - The pet browsing the feed (required by backend)
     * @param limit - Max number of pets to return
     */
    getFeed: (token: string, activePetId: string | null, limit: number = 20): Promise<Pet[]> => {
      return request<Pet[]>(`/discovery?limit=${limit}`, {
        method: 'GET',
        headers: getAuthHeaders(token, activePetId),
      });
    },
  },

  swipes: {
    /**
     * Swipe on a pet as the active pet.
     * @param token - Auth token
     * @param activePetId - The pet performing the swipe
     * @param data - Swipe data (toPetId, action)
     */
    swipe: (token: string, activePetId: string | null, data: SwipeData): Promise<SwipeResponse> => {
      return request<SwipeResponse>('/swipes', {
        method: 'POST',
        headers: getAuthHeaders(token, activePetId),
        body: JSON.stringify(data),
      });
    },

    /**
     * Undo the last swipe for the active pet.
     * @param token - Auth token
     * @param activePetId - The pet to undo the last swipe for
     */
    undo: (token: string, activePetId: string | null): Promise<{ success: boolean; undoneSwipePetId?: string }> => {
      return request<{ success: boolean; undoneSwipePetId?: string }>('/swipes/undo', {
        method: 'DELETE',
        headers: getAuthHeaders(token, activePetId),
      });
    },
  },

  matches: {
    getMyMatches: (
      token: string,
      options?: { limit?: number; cursor?: string }
    ): Promise<{ items: ApiMatchResponse[]; nextCursor: string | null; totalCount: number }> => {
      const params = new URLSearchParams();
      if (options?.limit) params.append('limit', options.limit.toString());
      if (options?.cursor) params.append('cursor', options.cursor);
      const queryString = params.toString();
      const url = `/matches${queryString ? `?${queryString}` : ''}`;
      return request<{ items: ApiMatchResponse[]; nextCursor: string | null; totalCount: number }>(url, {
        method: 'GET',
        headers: getAuthHeaders(token),
      });
    },
  },

  uploads: {
    uploadOwnerAvatar: async (token: string, file: File): Promise<UploadResponse> => {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_URL}/uploads/owner-avatar`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Upload failed' }));
        throw new ApiError(response.status, error.message || 'Upload failed');
      }

      return response.json();
    },

    uploadPetPhoto: async (token: string, petId: string, file: File): Promise<UploadResponse> => {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_URL}/uploads/pet-photo/${petId}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Upload failed' }));
        throw new ApiError(response.status, error.message || 'Upload failed');
      }

      return response.json();
    },

    uploadTempPetPhoto: async (token: string, file: File): Promise<UploadResponse> => {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_URL}/uploads/pet-photo-temp`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Upload failed' }));
        throw new ApiError(response.status, error.message || 'Upload failed');
      }

      return response.json();
    },
  },

  notifications: {
    /**
     * Get notifications with cursor-based pagination
     */
    getFeed: (
      token: string,
      options?: { cursor?: string; limit?: number }
    ): Promise<NotificationFeedResponse> => {
      const params = new URLSearchParams();
      if (options?.cursor) params.append('cursor', options.cursor);
      if (options?.limit) params.append('limit', options.limit.toString());
      const query = params.toString() ? `?${params.toString()}` : '';

      return request<NotificationFeedResponse>(`/notifications/feed${query}`, {
        method: 'GET',
        headers: getAuthHeaders(token),
      });
    },

    /**
     * Get all notifications (legacy, for backward compatibility)
     */
    getAll: (token: string, limit?: number): Promise<Notification[]> => {
      const query = limit ? `?limit=${limit}` : '';
      return request<Notification[]>(`/notifications${query}`, {
        method: 'GET',
        headers: getAuthHeaders(token),
      });
    },

    getUnread: (token: string): Promise<Notification[]> => {
      return request<Notification[]>('/notifications/unread', {
        method: 'GET',
        headers: getAuthHeaders(token),
      });
    },

    getUnreadCount: (token: string): Promise<UnreadCountResponse> => {
      return request<UnreadCountResponse>('/notifications/unread/count', {
        method: 'GET',
        headers: getAuthHeaders(token),
      });
    },

    markAsRead: (token: string, id: string): Promise<Notification> => {
      return request<Notification>(`/notifications/${id}/read`, {
        method: 'PATCH',
        headers: getAuthHeaders(token),
      });
    },

    markAllAsRead: (token: string): Promise<{ success: boolean }> => {
      return request<{ success: boolean }>('/notifications/read-all', {
        method: 'PATCH',
        headers: getAuthHeaders(token),
      });
    },

    delete: (token: string, id: string): Promise<{ success: boolean }> => {
      return request<{ success: boolean }>(`/notifications/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(token),
      });
    },
  },

  breedRecognition: {
    recognize: (token: string, data: RecognizeBreedRequest): Promise<RecognizeBreedResponse> => {
      return request<RecognizeBreedResponse>('/breed-recognition', {
        method: 'POST',
        headers: getAuthHeaders(token),
        body: JSON.stringify(data),
      });
    },
  },

  chat: {
    /**
     * List conversations for current user with pagination
     */
    listConversations: (
      token: string,
      options?: { limit?: number; cursor?: string }
    ): Promise<ConversationsListResponse> => {
      const params = new URLSearchParams();
      if (options?.limit) params.append('limit', options.limit.toString());
      if (options?.cursor) params.append('cursor', options.cursor);
      const query = params.toString() ? `?${params.toString()}` : '';

      return request<ConversationsListResponse>(`/conversations${query}`, {
        method: 'GET',
        headers: getAuthHeaders(token),
      });
    },

    /**
     * Get messages for a conversation with pagination
     * @param contextMatchId - Optional match context to filter/set active context
     */
    getMessages: (
      token: string,
      conversationId: string,
      options?: { limit?: number; cursor?: string; contextMatchId?: string }
    ): Promise<MessagesListResponse> => {
      const params = new URLSearchParams();
      if (options?.limit) params.append('limit', options.limit.toString());
      if (options?.cursor) params.append('cursor', options.cursor);
      if (options?.contextMatchId) params.append('contextMatchId', options.contextMatchId);
      const query = params.toString() ? `?${params.toString()}` : '';

      return request<MessagesListResponse>(
        `/conversations/${conversationId}/messages${query}`,
        {
          method: 'GET',
          headers: getAuthHeaders(token),
        }
      );
    },

    /**
     * Send a message to a conversation
     * @param data - Message text and optional contextMatchId
     */
    sendMessage: (
      token: string,
      conversationId: string,
      data: SendMessageData
    ): Promise<ChatMessage> => {
      return request<ChatMessage>(
        `/conversations/${conversationId}/messages`,
        {
          method: 'POST',
          headers: getAuthHeaders(token),
          body: JSON.stringify(data),
        }
      );
    },

    /**
     * Mark conversation as read
     */
    markAsRead: (
      token: string,
      conversationId: string
    ): Promise<{ success: boolean }> => {
      return request<{ success: boolean }>(
        `/conversations/${conversationId}/read`,
        {
          method: 'PATCH',
          headers: getAuthHeaders(token),
        }
      );
    },
  },
};

export default api;
