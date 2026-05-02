/**
 * Bonus predictions query hooks.
 *
 * Port literal de `apps/mobile/src/hooks/use-bonus-predictions.ts`.
 * Mismas keys, misma estrategia de invalidación por prefijo (`byGroup`)
 * en el upsert. Cualquier cambio acá DEBE replicarse en mobile.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { bonusPredictionsApi } from "@/api";

import { queryKeys } from "./query-keys";

export function useBonusPredictions(groupId: string, tournamentId: string) {
  return useQuery({
    queryKey: queryKeys.bonusPredictions.mine(groupId, tournamentId),
    queryFn: () =>
      bonusPredictionsApi.getMyBonusPredictions(groupId, tournamentId),
    enabled: !!groupId && !!tournamentId,
  });
}

export function useGroupBonusPredictions(
  groupId: string,
  tournamentId: string,
) {
  return useQuery({
    queryKey: queryKeys.bonusPredictions.group(groupId, tournamentId),
    queryFn: () =>
      bonusPredictionsApi.getGroupBonusPredictions(groupId, tournamentId),
    enabled: !!groupId && !!tournamentId,
  });
}

export function useUpsertBonusPrediction() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: bonusPredictionsApi.upsertBonusPrediction,
    onSuccess: (_data, variables) => {
      // Invalidate all bonus prediction queries for this group (prefix match).
      qc.invalidateQueries({
        queryKey: queryKeys.bonusPredictions.byGroup(variables.groupId),
      });
    },
  });
}
