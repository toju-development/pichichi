/**
 * Zustand auth store — single source of truth para el estado de auth en web.
 *
 * DEVIATION vs mobile: en mobile la persistencia es manual contra
 * `expo-secure-store`. En web usamos el middleware oficial `persist` +
 * `localStorage` (decisión de design.md §4 y §5). El flag `isHydrated` se
 * dispara en `onRehydrateStorage` así el AuthProvider puede gatear el render.
 *
 * Persistimos sólo `accessToken`, `refreshToken`, `user`. `isAuthenticated`
 * deriva de `!!accessToken && !!user` y se calcula al setear estado.
 *
 * El store NO hace API calls — eso vive en hooks (use-login, use-logout,
 * use-user). Esa separación es la que permite romper el ciclo
 * `client → store → api → client` con un lazy require en client.ts.
 */
import type { AuthResponseDto, UserDto } from "@pichichi/shared";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { STORAGE_KEY_AUTH } from "@/lib/storage";

interface AuthPersistedState {
  accessToken: string | null;
  refreshToken: string | null;
  user: UserDto | null;
}

interface AuthState extends AuthPersistedState {
  isAuthenticated: boolean;
  isHydrated: boolean;
}

interface AuthActions {
  login: (response: AuthResponseDto) => void;
  logout: () => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setUser: (user: UserDto) => void;
  /** Test-only: forzar el flag de hidratación (no usar en producción). */
  _setHydrated: (value: boolean) => void;
}

type AuthStore = AuthState & AuthActions;

const INITIAL_STATE: AuthState = {
  accessToken: null,
  refreshToken: null,
  user: null,
  isAuthenticated: false,
  isHydrated: false,
};

function deriveAuthenticated(
  accessToken: string | null,
  user: UserDto | null,
): boolean {
  return Boolean(accessToken) && Boolean(user);
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      ...INITIAL_STATE,

      login: (response) => {
        set({
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
          user: response.user,
          isAuthenticated: true,
        });
      },

      logout: () => {
        set({
          accessToken: null,
          refreshToken: null,
          user: null,
          isAuthenticated: false,
          // mantenemos isHydrated en true: ya estamos en cliente.
          isHydrated: true,
        });
      },

      setTokens: (accessToken, refreshToken) => {
        set({
          accessToken,
          refreshToken,
          isAuthenticated: deriveAuthenticated(accessToken, get().user),
        });
      },

      setUser: (user) => {
        set({
          user,
          isAuthenticated: deriveAuthenticated(get().accessToken, user),
        });
      },

      _setHydrated: (value) => {
        set({ isHydrated: value });
      },
    }),
    {
      name: STORAGE_KEY_AUTH,
      storage: createJSONStorage(() => {
        // Guard SSR: durante el render server-side localStorage no existe.
        if (typeof window === "undefined") {
          return {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          };
        }
        return window.localStorage;
      }),
      partialize: (state): AuthPersistedState => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
      }),
      onRehydrateStorage: () => (state) => {
        // Re-derivar isAuthenticated después de rehidratar tokens persistidos.
        if (state) {
          state.isAuthenticated = deriveAuthenticated(
            state.accessToken,
            state.user,
          );
          state.isHydrated = true;
        }
      },
    },
  ),
);
