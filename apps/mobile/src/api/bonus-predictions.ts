import type {
  BonusPredictionDto,
  GroupBonusPredictionsDto,
} from '@pichichi/shared';

import { api } from './client';

export async function getMyBonusPredictions(
  groupId: string,
): Promise<BonusPredictionDto[]> {
  const { data } = await api.get<BonusPredictionDto[]>(
    `/bonus-predictions/group/${groupId}`,
  );
  return data;
}

export async function getGroupBonusPredictions(
  groupId: string,
): Promise<GroupBonusPredictionsDto> {
  const { data } = await api.get<GroupBonusPredictionsDto>(
    `/bonus-predictions/group/${groupId}/all`,
  );
  return data;
}

export async function upsertBonusPrediction(dto: {
  groupId: string;
  bonusTypeId: string;
  predictedValue: string;
}): Promise<BonusPredictionDto> {
  const { data } = await api.post<BonusPredictionDto>(
    '/bonus-predictions',
    dto,
  );
  return data;
}
