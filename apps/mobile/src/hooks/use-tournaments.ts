import { useQuery } from '@tanstack/react-query';
import { TOURNAMENT_STATUS } from '@pichichi/shared';

import * as tournamentsApi from '@/api/tournaments';

import { queryKeys } from './query-keys';

export function useTournaments() {
  return useQuery({
    queryKey: queryKeys.tournaments.all,
    queryFn: () => tournamentsApi.getTournaments(),
  });
}

export function usePlayableTournaments() {
  return useQuery({
    queryKey: queryKeys.tournaments.playable,
    queryFn: () =>
      tournamentsApi.getTournaments({
        statuses: [TOURNAMENT_STATUS.UPCOMING, TOURNAMENT_STATUS.IN_PROGRESS],
      }),
  });
}

export function useTournament(slug: string) {
  return useQuery({
    queryKey: queryKeys.tournaments.bySlug(slug),
    queryFn: () => tournamentsApi.getTournamentBySlug(slug),
    enabled: !!slug,
  });
}

export function useTournamentTeams(id: string) {
  return useQuery({
    queryKey: queryKeys.tournaments.teams(id),
    queryFn: () => tournamentsApi.getTournamentTeams(id),
    enabled: !!id,
  });
}

export function useTournamentPlayers(tournamentId: string) {
  return useQuery({
    queryKey: queryKeys.tournaments.players(tournamentId),
    queryFn: () => tournamentsApi.getTournamentPlayers(tournamentId),
    enabled: !!tournamentId,
  });
}
