"use client";

import { useAuthStore } from "@/stores/auth-store";

/**
 * Selector hook simple para leer estado de auth desde componentes.
 *
 * Devuelve flags y datos derivados — los actions (login/logout) viven en
 * `use-login` y `use-logout` para mantener separadas lecturas y mutaciones.
 */
export function useAuth() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isHydrated = useAuthStore((s) => s.isHydrated);

  return {
    accessToken,
    user,
    isAuthenticated,
    isHydrated,
  };
}
