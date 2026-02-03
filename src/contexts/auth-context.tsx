'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { api, authStorage } from '@/lib';
import type { User, LoginCredentials, RegisterCredentials } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextValue extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  loginWithToken: (token: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
    isAuthenticated: false,
  });

  const initializeAuth = useCallback(async () => {
    const token = authStorage.getToken();

    if (!token) {
      setState({
        user: null,
        token: null,
        isLoading: false,
        isAuthenticated: false,
      });
      return;
    }

    try {
      const user = await api.auth.me(token);
      authStorage.setUser(user);
      setState({
        user,
        token,
        isLoading: false,
        isAuthenticated: true,
      });
    } catch {
      // Token is invalid or expired - clear everything
      authStorage.clear();
      setState({
        user: null,
        token: null,
        isLoading: false,
        isAuthenticated: false,
      });
    }
  }, []);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  const login = async (credentials: LoginCredentials) => {
    const response = await api.auth.login(credentials);
    authStorage.setToken(response.accessToken);
    authStorage.setUser(response.user);
    setState({
      user: response.user,
      token: response.accessToken,
      isLoading: false,
      isAuthenticated: true,
    });
  };

  const register = async (credentials: RegisterCredentials) => {
    const response = await api.auth.register(credentials);
    authStorage.setToken(response.accessToken);
    authStorage.setUser(response.user);
    setState({
      user: response.user,
      token: response.accessToken,
      isLoading: false,
      isAuthenticated: true,
    });
  };

  const loginWithToken = async (token: string) => {
    const user = await api.auth.me(token);
    authStorage.setToken(token);
    authStorage.setUser(user);
    setState({
      user,
      token,
      isLoading: false,
      isAuthenticated: true,
    });
  };

  const logout = () => {
    authStorage.clear();
    setState({
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,
    });
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        loginWithToken,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
