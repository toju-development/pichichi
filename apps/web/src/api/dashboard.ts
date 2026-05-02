/**
 * Dashboard API client.
 *
 * Port literal de `apps/mobile/src/api/dashboard.ts`. Mismo endpoint, misma
 * forma de calcular el timezone — el back necesita `tz` para resolver
 * "matches de hoy" según el huso del usuario, no del server.
 *
 * `Intl.DateTimeFormat().resolvedOptions().timeZone` está disponible en
 * cualquier browser moderno (no requiere polyfill ni guard SSR porque sólo
 * se invoca dentro del query function, ya en cliente vía TanStack Query).
 */
import type { DashboardResponseDto } from "@pichichi/shared";

import { api } from "./client";

export async function getDashboard(): Promise<DashboardResponseDto> {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC";
  const { data } = await api.get<DashboardResponseDto>("/dashboard", {
    params: { tz },
  });
  return data;
}
