import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import * as bonusPredictionsApi from '@/api/bonus-predictions';

import { queryKeys } from './query-keys';

export function useBonusPredictions(groupId: string) {
  return useQuery({
    queryKey: queryKeys.bonusPredictions.mine(groupId),
    queryFn: () => bonusPredictionsApi.getMyBonusPredictions(groupId),
    enabled: !!groupId,
  });
}

export function useGroupBonusPredictions(groupId: string) {
  return useQuery({
    queryKey: queryKeys.bonusPredictions.group(groupId),
    queryFn: () => bonusPredictionsApi.getGroupBonusPredictions(groupId),
    enabled: !!groupId,
  });
}

export function useUpsertBonusPrediction() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: bonusPredictionsApi.upsertBonusPrediction,
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({
        queryKey: queryKeys.bonusPredictions.mine(variables.groupId),
      });
      qc.invalidateQueries({
        queryKey: queryKeys.bonusPredictions.group(variables.groupId),
      });
    },
  });
}
