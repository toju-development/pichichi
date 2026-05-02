import type { GroupPredictionsDto, PredictionDto, PredictionStatsDto } from "@pichichi/shared";

import { MOCK_GROUP_PRIMARY } from "./groups";
import { MOCK_MATCH_SCHEDULED } from "./matches";
import { MOCK_USER } from "./users";

/**
 * Empty prediction set by default — the prediction E2E flow seeds the user
 * casting a fresh score, so we don't preload existing predictions.
 */
export const MOCK_PREDICTIONS_EMPTY: PredictionDto[] = [];

export const MOCK_GROUP_PREDICTIONS_EMPTY: GroupPredictionsDto = {
  matchId: MOCK_MATCH_SCHEDULED.id,
  groupId: MOCK_GROUP_PRIMARY.id,
  matchStatus: MOCK_MATCH_SCHEDULED.status,
  revealed: false,
  predictions: [],
};

export const MOCK_PREDICTION_CREATED: PredictionDto = {
  id: "prediction-new",
  userId: MOCK_USER.id,
  matchId: MOCK_MATCH_SCHEDULED.id,
  groupId: MOCK_GROUP_PRIMARY.id,
  predictedHome: 2,
  predictedAway: 1,
  pointsEarned: 0,
  pointType: null,
  createdAt: "2026-05-01T10:00:00.000Z",
  updatedAt: "2026-05-01T10:00:00.000Z",
};

export const MOCK_PREDICTION_STATS: PredictionStatsDto = {
  totalPoints: 0,
  totalPredictions: 0,
  exactCount: 0,
  goalDiffCount: 0,
  winnerCount: 0,
  missCount: 0,
};
