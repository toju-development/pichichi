import type {
  TournamentDto,
  TournamentPlayerResponseDto,
  TournamentTeamDto,
} from '@pichichi/shared';

import { api } from './client';

export async function getTournaments(): Promise<TournamentDto[]> {
  const { data } = await api.get<TournamentDto[]>('/tournaments');
  return data;
}

export async function getTournamentBySlug(
  slug: string,
): Promise<TournamentDto> {
  const { data } = await api.get<TournamentDto>(`/tournaments/${slug}`);
  return data;
}

export async function getTournamentTeams(
  id: string,
): Promise<TournamentTeamDto[]> {
  const { data } = await api.get<TournamentTeamDto[]>(
    `/tournaments/${id}/teams`,
  );
  return data;
}

export async function getTournamentPlayers(
  tournamentId: string,
): Promise<TournamentPlayerResponseDto[]> {
  const { data } = await api.get<TournamentPlayerResponseDto[]>(
    `/tournaments/${tournamentId}/players`,
  );
  return data;
}
