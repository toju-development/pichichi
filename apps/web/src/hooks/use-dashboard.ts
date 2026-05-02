/**
 * Dashboard query hook.
 *
 * Port literal de `apps/mobile/src/hooks/use-dashboard.ts`.
 *
 * Notas:
 *   - `staleTime: 30_000` evita refetch agresivo entre navegaciones rápidas.
 *   - `refetchOnWindowFocus: true` SOBREESCRIBE el default global (`false`)
 *     definido en `query-client.ts`. Es intencional: el dashboard quiere
 *     refrescar cuando el user vuelve a la pestaña, igual que mobile cuando
 *     vuelve a foreground.
 *   - La key `queryKeys.dashboard.all` se reusa para invalidar desde
 *     write-side hooks (predictions, group join, etc.) — coincide con mobile.
 */
import { useQuery } from "@tanstack/react-query";

import { dashboardApi } from "@/api";

import { queryKeys } from "./query-keys";

export function useDashboard() {
  return useQuery({
    queryKey: queryKeys.dashboard.all,
    queryFn: dashboardApi.getDashboard,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });
}
