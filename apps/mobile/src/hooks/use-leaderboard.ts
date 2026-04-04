import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import type { LeaderboardEntryDto } from '@pichichi/shared';

import * as leaderboardApi from '@/api/leaderboard';
import { useAuthStore } from '@/stores/auth-store';

import { queryKeys } from './query-keys';

export function useLeaderboard(groupId: string) {
  return useQuery({
    queryKey: queryKeys.leaderboard.byGroup(groupId),
    queryFn: () => leaderboardApi.getLeaderboard(groupId),
    enabled: !!groupId,
  });
}

export function useMyPosition(groupId: string) {
  return useQuery({
    queryKey: queryKeys.leaderboard.myPosition(groupId),
    queryFn: () => leaderboardApi.getMyPosition(groupId),
    enabled: !!groupId,
  });
}

const PAGE_SIZE = 20;

/**
 * Paginated infinite query for the global leaderboard.
 * Loads 20 entries at a time; `fetchNextPage` loads the next batch.
 *
 * `currentUserEntry` is extracted from the first page response
 * and stays stable across page fetches.
 */
export function useGlobalLeaderboard() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const query = useInfiniteQuery({
    queryKey: queryKeys.leaderboard.global,
    queryFn: ({ pageParam = 0 }) =>
      leaderboardApi.getGlobalLeaderboard(PAGE_SIZE, pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      if (lastPage.entries.length < PAGE_SIZE) return undefined;
      return (lastPageParam as number) + PAGE_SIZE;
    },
    enabled: isAuthenticated,
  });

  // Extract currentUserEntry from the first page (always present in every response,
  // but we only need it once — it's the same across all pages).
  const currentUserEntry: LeaderboardEntryDto | null =
    query.data?.pages[0]?.currentUserEntry ?? null;

  return { ...query, currentUserEntry };
}
