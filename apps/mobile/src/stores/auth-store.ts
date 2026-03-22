/**
 * Zustand auth store — single source of truth for authentication state.
 *
 * Tokens are persisted in expo-secure-store (encrypted keychain).
 * State is synchronous to avoid suspense flicker on reads.
 * Hydration runs on app start to restore tokens from SecureStore.
 *
 * IMPORTANT: This store manages token state ONLY — no API calls.
 * API calls (login, logout, getMe) live in hooks (use-auth, use-user).
 * This separation breaks circular dependencies:
 *   store ←→ api/client ←→ store  →  store ← hooks → api → client → store (lazy)
 */

import { create } from 'zustand';

import type { AuthResponseDto, UserDto } from '@pichichi/shared';

import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setTokens as persistTokens,
} from '@/lib/storage';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: UserDto | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
}

interface AuthActions {
  login: (response: AuthResponseDto) => Promise<void>;
  logout: () => Promise<void>;
  setTokens: (accessToken: string, refreshToken: string) => Promise<void>;
  setUser: (user: UserDto) => void;
  hydrate: () => Promise<void>;
}

type AuthStore = AuthState & AuthActions;

const INITIAL_STATE: AuthState = {
  accessToken: null,
  refreshToken: null,
  user: null,
  isAuthenticated: false,
  isHydrated: false,
};

export const useAuthStore = create<AuthStore>((set) => ({
  ...INITIAL_STATE,

  login: async (response: AuthResponseDto) => {
    await persistTokens(response.accessToken, response.refreshToken);
    set({
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
      user: response.user,
      isAuthenticated: true,
    });
  },

  /**
   * Clear local auth state + SecureStore.
   * The API logout call (revoking the refresh token on the server) is handled
   * by the `useLogout` hook BEFORE calling this method.
   */
  logout: async () => {
    await clearTokens();
    set({ ...INITIAL_STATE, isHydrated: true });
  },

  setTokens: async (accessToken: string, refreshToken: string) => {
    await persistTokens(accessToken, refreshToken);
    set({ accessToken, refreshToken });
  },

  setUser: (user: UserDto) => {
    set({ user, isAuthenticated: true });
  },

  /**
   * Restore tokens from SecureStore and mark hydration complete.
   * Does NOT fetch user profile — that's handled by `useMe()` in the
   * AuthProvider via TanStack Query after hydration completes.
   */
  hydrate: async () => {
    const [accessToken, refreshToken] = await Promise.all([
      getAccessToken(),
      getRefreshToken(),
    ]);

    if (accessToken && refreshToken) {
      set({
        accessToken,
        refreshToken,
        isAuthenticated: true,
        isHydrated: true,
      });
    } else {
      set({ isHydrated: true });
    }
  },
}));
