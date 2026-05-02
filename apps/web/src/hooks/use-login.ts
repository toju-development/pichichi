"use client";

import { useState } from "react";

import { loginWithGoogle } from "@/api/auth";
import { useAuthStore } from "@/stores/auth-store";

/**
 * Hook de login con Google id_token.
 *
 * No usa TanStack Query a propósito: el QueryClient se cablea en Phase 4.
 * Mantenemos `useState` para `isPending`/`error` y replicamos la API mínima
 * que la pantalla de login necesita (`mutate`, `isPending`, `error`).
 */
export function useLoginWithGoogle() {
  const login = useAuthStore((s) => s.login);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  async function mutate(idToken: string): Promise<void> {
    setIsPending(true);
    setError(null);
    try {
      const response = await loginWithGoogle(idToken);
      login(response);
    } catch (err) {
      const normalized =
        err instanceof Error ? err : new Error("Login con Google falló");
      setError(normalized);
      throw normalized;
    } finally {
      setIsPending(false);
    }
  }

  return { mutate, isPending, error };
}
