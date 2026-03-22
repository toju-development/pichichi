import { useQuery } from '@tanstack/react-query';

import * as tournamentsApi from '@/api/tournaments';

import { queryKeys } from './query-keys';

export function useTournaments() {
  return useQuery({
    queryKey: queryKeys.tournaments.all,
    queryFn: tournamentsApi.getTournaments,
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
