/**
 * TanStack Query client singleton para la PWA web.
 *
 * Port literal de `apps/mobile/src/hooks/query-client.ts` con un único
 * ajuste justificado: `refetchOnWindowFocus: false`.
 *
 * En mobile el motivo era "no existe window focus, gasta batería". En web
 * sí existe, pero mantenemos el flag desactivado para igualar el
 * comportamiento de mobile y evitar invalidaciones cruzadas con el socket
 * que ya escucha `match:updated` y dispara refetches dirigidos.
 *
 * Defaults:
 * - 5 min staleTime: evita re-fetches al cambiar de pantalla.
 * - 30 min gcTime: mantiene cache caliente para back/forward navigation.
 * - retry: respeta status no-retryables (400, 401, 403, 404, 409, 422),
 *   reintenta otros hasta 2 veces.
 * - mutations: sin retry (idempotencia no garantizada).
 */

import { QueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";

const FIVE_MINUTES = 5 * 60 * 1000;
const THIRTY_MINUTES = 30 * 60 * 1000;

/** HTTP statuses permanentes — reintentar no cambia el resultado. */
const NON_RETRYABLE_STATUSES = new Set([400, 401, 403, 404, 409, 422]);

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: FIVE_MINUTES,
      gcTime: THIRTY_MINUTES,
      retry: (failureCount, error) => {
        const status = (error as AxiosError)?.response?.status;
        if (status && NON_RETRYABLE_STATUSES.has(status)) return false;
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});
