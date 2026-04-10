import { useQuery } from '@tanstack/react-query';

import * as matchesApi from '@/api/matches';

import { queryKeys } from './query-keys';

export function useMatches(params?: {
  tournamentId?: string;
  phase?: string;
  status?: string;
  date?: string;
  groupName?: string;
}) {
  return useQuery({
    queryKey: queryKeys.matches.all(params),
    queryFn: () => matchesApi.getMatches(params),
  });
}

export function useMatch(id: string) {
  return useQuery({
    queryKey: queryKeys.matches.detail(id),
    queryFn: () => matchesApi.getMatch(id),
    enabled: !!id,
  });
}

export function useUpcomingMatches() {
  return useQuery({
    queryKey: queryKeys.matches.upcoming,
    queryFn: matchesApi.getUpcoming,
  });
}

export function useLiveMatches() {
  return useQuery({
    queryKey: queryKeys.matches.live,
    queryFn: matchesApi.getLive,
  });
}
