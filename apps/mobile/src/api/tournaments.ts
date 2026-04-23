import type {
  TournamentDto,
  TournamentPlayerResponseDto,
  TournamentStatus,
  TournamentTeamDto,
} from '@pichichi/shared';

import { api } from './client';

type GetTournamentsFilters = {
  statuses?: TournamentStatus[];
};

export async function getTournaments(
  filters?: GetTournamentsFilters,
): Promise<TournamentDto[]> {
  const params = filters?.statuses?.length
    ? {
        // API supports CSV and repeated params. Mobile uses CSV for
        // predictable query keys and simpler client serialization.
        statuses: filters.statuses.join(','),
      }
    : undefined;

  const { data } = await api.get<TournamentDto[]>('/tournaments', { params });
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
