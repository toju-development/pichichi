"use client";

import type { ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";

import { queryClient } from "@/hooks/query-client";

/**
 * QueryProvider — envuelve el árbol con el `QueryClient` singleton.
 *
 * El cliente se importa como singleton de módulo (`hooks/query-client.ts`)
 * en vez de crearse con `useState(() => new QueryClient())` porque:
 *
 *  - `app/app/layout.tsx` es Server Component y `AppProviders` es el único
 *    Client Component que toca esto. No hay riesgo de compartir cliente
 *    entre requests SSR concurrentes — el QueryClient sólo se evalúa en
 *    el browser (este archivo es `"use client"` y queryClient se usa via
 *    `QueryClientProvider`, no en SSR data fetching).
 *  - Mantenemos paridad con mobile, que usa singleton.
 *  - No hay hidratación de TanStack Query desde el server (no usamos
 *    `dehydrate`/`HydrationBoundary`).
 *
 * Si en el futuro se introduce SSR data prefetching, migrar a
 * `useState(() => new QueryClient())` + `HydrationBoundary` por request.
 */
export function QueryProvider({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
