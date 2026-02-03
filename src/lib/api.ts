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
  Match,
  OwnerProfile,
  UpdateOwnerProfileData,
  UploadResponse,
  Notification,
  UnreadCountResponse,
  RecognizeBreedRequest,
  RecognizeBreedResponse,
} from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

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

function getAuthHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
  };
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

    getMyPets: (token: string): Promise<Pet[]> => {
      return request<Pet[]>('/pets/me', {
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

    delete: (token: string, id: string): Promise<Pet> => {
      return request<Pet>(`/pets/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(token),
      });
    },
  },

  discovery: {
    getFeed: (token: string, limit: number = 20): Promise<Pet[]> => {
      return request<Pet[]>(`/discovery?limit=${limit}`, {
        method: 'GET',
        headers: getAuthHeaders(token),
      });
    },
  },

  swipes: {
    swipe: (token: string, data: SwipeData): Promise<SwipeResponse> => {
      return request<SwipeResponse>('/swipes', {
        method: 'POST',
        headers: getAuthHeaders(token),
        body: JSON.stringify(data),
      });
    },

    undo: (token: string): Promise<{ success: boolean; undoneSwipePetId?: string }> => {
      return request<{ success: boolean; undoneSwipePetId?: string }>('/swipes/undo', {
        method: 'DELETE',
        headers: getAuthHeaders(token),
      });
    },
  },

  matches: {
    getMyMatches: (token: string): Promise<Match[]> => {
      return request<Match[]>('/matches', {
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
        method: 'POST',
        headers: getAuthHeaders(token),
      });
    },

    markAllAsRead: (token: string): Promise<{ success: boolean }> => {
      return request<{ success: boolean }>('/notifications/read-all', {
        method: 'POST',
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
};

export default api;
