/**
 * Matches API wrappers — port literal de `apps/mobile/src/api/matches.ts`.
 *
 * Read-only en web (las mutations las hace el backend desde sync jobs).
 * Mismas firmas que mobile para mantener paridad de invalidaciones.
 */
import type { MatchDto } from "@pichichi/shared";

import { api } from "./client";

interface GetMatchesParams {
  tournamentId?: string;
  phase?: string;
  status?: string;
  date?: string;
  groupName?: string;
}

export async function getMatches(
  params?: GetMatchesParams,
): Promise<MatchDto[]> {
  const { data } = await api.get<MatchDto[]>("/matches", { params });
  return data;
}

export async function getMatch(id: string): Promise<MatchDto> {
  const { data } = await api.get<MatchDto>(`/matches/${id}`);
  return data;
}

export async function getUpcoming(): Promise<MatchDto[]> {
  const { data } = await api.get<MatchDto[]>("/matches/upcoming");
  return data;
}

export async function getLive(): Promise<MatchDto[]> {
  const { data } = await api.get<MatchDto[]>("/matches/live");
  return data;
}
