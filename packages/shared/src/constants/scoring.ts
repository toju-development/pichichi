/**
 * Default scoring values for predictions.
 *
 * These are defaults — actual values are configured per tournament
 * via TournamentPhase.multiplier and TournamentBonusType.points.
 */

export const DEFAULT_SCORING = {
  /** Exact score match (e.g., predicted 2-1, result 2-1) */
  EXACT: 5,
  /** Correct goal difference (e.g., predicted 3-1, result 2-0) */
  GOAL_DIFF: 3,
  /** Correct winner only (e.g., predicted 2-0, result 1-0) */
  WINNER: 1,
  /** Wrong prediction */
  MISS: 0,
} as const;

export type ScoringKey = keyof typeof DEFAULT_SCORING;

/**
 * Default phase multipliers for knockout stages.
 */
export const DEFAULT_PHASE_MULTIPLIERS = {
  GROUP_STAGE: 1,
  ROUND_OF_32: 1,
  ROUND_OF_16: 2,
  QUARTER_FINAL: 2,
  SEMI_FINAL: 3,
  THIRD_PLACE: 2,
  FINAL: 3,
} as const;

/**
 * Default bonus prediction points.
 */
export const DEFAULT_BONUS_POINTS = 10;
