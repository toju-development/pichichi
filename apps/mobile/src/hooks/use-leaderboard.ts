import { useQuery } from '@tanstack/react-query';

import * as leaderboardApi from '@/api/leaderboard';

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
