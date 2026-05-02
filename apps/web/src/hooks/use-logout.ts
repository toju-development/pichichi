"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { logout as apiLogout } from "@/api/auth";
import { ROUTES } from "@/lib/routes";
import { useAuthStore } from "@/stores/auth-store";

/**
 * Hook de logout.
 *
 * Flujo (paridad con mobile):
 *   1. Best-effort: revocar refresh token en el server (`POST /auth/logout`).
 *      Si falla (token expirado, red caída) seguimos igual — no podemos dejar
 *      al usuario "logueado pero roto".
 *   2. Limpiar estado local + persistencia (Zustand persist remueve la key
 *      automáticamente al pasar todos los campos persistidos a null).
 *   3. Limpiar el cache de TanStack Query con `qc.clear()` para evitar que el
 *      próximo usuario que se loguee en este browser vea datos cacheados del
 *      anterior (privacidad + correctitud).
 *   4. Redirigir a `/app/login` con `router.replace` (no se acumula history).
 */
export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const storeLogout = useAuthStore((s) => s.logout);
  const [isPending, setIsPending] = useState(false);

  async function mutate(): Promise<void> {
    setIsPending(true);
    try {
      const refreshToken = useAuthStore.getState().refreshToken;
      if (refreshToken) {
        try {
          await apiLogout(refreshToken);
        } catch {
          // best-effort
        }
      }
      storeLogout();
      queryClient.clear();
      router.replace(ROUTES.app.login);
    } finally {
      setIsPending(false);
    }
  }

  return { mutate, isPending };
}
