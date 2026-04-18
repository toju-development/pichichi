import type {
  GroupPredictionsDto,
  MemberPredictionsResponseDto,
  PredictionDto,
  PredictionStatsDto,
} from '@pichichi/shared';

import { api } from './client';

export async function upsertPrediction(dto: {
  matchId: string;
  groupId: string;
  predictedHome: number;
  predictedAway: number;
}): Promise<PredictionDto> {
  const { data } = await api.post<PredictionDto>('/predictions', dto);
  return data;
}

export async function getMyPredictions(
  groupId: string,
): Promise<PredictionDto[]> {
  const { data } = await api.get<PredictionDto[]>(
    `/predictions/group/${groupId}`,
  );
  return data;
}

export async function getGroupPredictions(
  groupId: string,
  matchId: string,
): Promise<GroupPredictionsDto> {
  const { data } = await api.get<GroupPredictionsDto>(
    `/predictions/group/${groupId}/match/${matchId}`,
  );
  return data;
}

export async function getMyStats(
  groupId: string,
): Promise<PredictionStatsDto> {
  const { data } = await api.get<PredictionStatsDto>(
    `/predictions/group/${groupId}/stats`,
  );
  return data;
}

export async function getMemberPredictions(
  groupId: string,
  userId: string,
): Promise<MemberPredictionsResponseDto> {
  const { data } = await api.get<MemberPredictionsResponseDto>(
    `/predictions/group/${groupId}/member/${userId}`,
  );
  return data;
}
