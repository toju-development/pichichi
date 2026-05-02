/**
 * Leaderboard API wrappers — port literal de `apps/mobile/src/api/leaderboard.ts`.
 *
 * Mismas firmas que mobile. Web sólo usa `getLeaderboard(groupId)` por ahora;
 * `getMyPosition` y `getGlobalLeaderboard` quedan disponibles para futuras
 * vistas (perfil/ranking global) — porteados para mantener paridad 1:1.
 */
import type {
  GlobalLeaderboardDto,
  LeaderboardDto,
  LeaderboardEntryDto,
} from "@pichichi/shared";

import { api } from "./client";

export async function getLeaderboard(
  groupId: string,
): Promise<LeaderboardDto> {
  const { data } = await api.get<LeaderboardDto>(
    `/leaderboard/group/${groupId}`,
  );
  return data;
}

export async function getMyPosition(
  groupId: string,
): Promise<LeaderboardEntryDto> {
  const { data } = await api.get<LeaderboardEntryDto>(
    `/leaderboard/group/${groupId}/me`,
  );
  return data;
}

export async function getGlobalLeaderboard(
  limit: number,
  offset: number,
): Promise<GlobalLeaderboardDto> {
  const { data } = await api.get<GlobalLeaderboardDto>(
    "/leaderboard/global",
    { params: { limit, offset } },
  );
  return data;
}
