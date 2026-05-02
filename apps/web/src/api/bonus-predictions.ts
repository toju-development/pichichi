/**
 * Bonus predictions API client — port literal de
 * `apps/mobile/src/api/bonus-predictions.ts`.
 *
 * Mantiene mismos paths, shapes y nombres que mobile para que la
 * convención de query keys / invalidación valga idéntica en ambos
 * clientes.
 */
import type {
  BonusPredictionDto,
  GroupBonusPredictionsDto,
} from "@pichichi/shared";

import { api } from "./client";

export async function getMyBonusPredictions(
  groupId: string,
  tournamentId: string,
): Promise<BonusPredictionDto[]> {
  const { data } = await api.get<BonusPredictionDto[]>(
    `/bonus-predictions/group/${groupId}`,
    { params: { tournamentId } },
  );
  return data;
}

export async function getGroupBonusPredictions(
  groupId: string,
  tournamentId: string,
): Promise<GroupBonusPredictionsDto> {
  const { data } = await api.get<GroupBonusPredictionsDto>(
    `/bonus-predictions/group/${groupId}/all`,
    { params: { tournamentId } },
  );
  return data;
}

export async function upsertBonusPrediction(dto: {
  groupId: string;
  bonusTypeId: string;
  predictedValue: string;
}): Promise<BonusPredictionDto> {
  const { data } = await api.post<BonusPredictionDto>(
    "/bonus-predictions",
    dto,
  );
  return data;
}
