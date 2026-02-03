/**
 * Auth Storage Utility
 *
 * NOTE: For MVP, we use localStorage to store JWT tokens.
 * In production, consider using httpOnly cookies with a BFF (Backend for Frontend)
 * pattern for improved security against XSS attacks.
 *
 * To migrate to httpOnly cookies:
 * 1. Create API routes in Next.js that proxy auth requests
 * 2. Set httpOnly cookies in those API routes
 * 3. Remove localStorage usage
 */

const TOKEN_KEY = 'petder_token';
const USER_KEY = 'petder_user';

export const authStorage = {
  getToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
  },

  setToken: (token: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(TOKEN_KEY, token);
  },

  removeToken: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(TOKEN_KEY);
  },

  getUser: <T>(): T | null => {
    if (typeof window === 'undefined') return null;
    const user = localStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
  },

  setUser: <T>(user: T): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  removeUser: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(USER_KEY);
  },

  clear: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
};

export default authStorage;
