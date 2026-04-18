import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import * as predictionsApi from '@/api/predictions';

import { queryKeys } from './query-keys';

export function usePredictions(groupId: string) {
  return useQuery({
    queryKey: queryKeys.predictions.byGroup(groupId),
    queryFn: () => predictionsApi.getMyPredictions(groupId),
    enabled: !!groupId,
  });
}

export function useGroupPredictions(groupId: string, matchId: string) {
  return useQuery({
    queryKey: queryKeys.predictions.groupMatch(groupId, matchId),
    queryFn: () => predictionsApi.getGroupPredictions(groupId, matchId),
    enabled: !!groupId && !!matchId,
  });
}

export function usePredictionStats(groupId: string) {
  return useQuery({
    queryKey: queryKeys.predictions.stats(groupId),
    queryFn: () => predictionsApi.getMyStats(groupId),
    enabled: !!groupId,
  });
}

export function useUpsertPrediction() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: predictionsApi.upsertPrediction,
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({
        queryKey: queryKeys.predictions.byGroup(variables.groupId),
      });
      qc.invalidateQueries({
        queryKey: queryKeys.predictions.groupMatch(
          variables.groupId,
          variables.matchId,
        ),
      });
      qc.invalidateQueries({
        queryKey: queryKeys.predictions.stats(variables.groupId),
      });
      // Predictions affect leaderboard
      qc.invalidateQueries({
        queryKey: queryKeys.leaderboard.byGroup(variables.groupId),
      });
      // Refresh home dashboard (today matches predictions)
      qc.invalidateQueries({
        queryKey: queryKeys.dashboard.all,
      });
    },
  });
}
