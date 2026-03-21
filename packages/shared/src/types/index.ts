// ─── Auth ────────────────────────────────────────────────────────────────────

export const AUTH_PROVIDER = {
  GOOGLE: 'GOOGLE',
  INSTAGRAM: 'INSTAGRAM',
  APPLE: 'APPLE',
} as const;

export type AuthProvider = (typeof AUTH_PROVIDER)[keyof typeof AUTH_PROVIDER];

// ─── Group Member Role ───────────────────────────────────────────────────────

export const GROUP_MEMBER_ROLE = {
  ADMIN: 'ADMIN',
  MEMBER: 'MEMBER',
} as const;

export type GroupMemberRole =
  (typeof GROUP_MEMBER_ROLE)[keyof typeof GROUP_MEMBER_ROLE];

// ─── Tournament Status ──────────────────────────────────────────────────────

export const TOURNAMENT_STATUS = {
  DRAFT: 'DRAFT',
  UPCOMING: 'UPCOMING',
  IN_PROGRESS: 'IN_PROGRESS',
  FINISHED: 'FINISHED',
  CANCELLED: 'CANCELLED',
} as const;

export type TournamentStatus =
  (typeof TOURNAMENT_STATUS)[keyof typeof TOURNAMENT_STATUS];

// ─── Tournament Type ─────────────────────────────────────────────────────────

export const TOURNAMENT_TYPE = {
  WORLD_CUP: 'WORLD_CUP',
  COPA_AMERICA: 'COPA_AMERICA',
  EURO: 'EURO',
  CHAMPIONS_LEAGUE: 'CHAMPIONS_LEAGUE',
  CUSTOM: 'CUSTOM',
} as const;

export type TournamentType =
  (typeof TOURNAMENT_TYPE)[keyof typeof TOURNAMENT_TYPE];

// ─── Match Phase ─────────────────────────────────────────────────────────────

export const MATCH_PHASE = {
  GROUP_STAGE: 'GROUP_STAGE',
  ROUND_OF_32: 'ROUND_OF_32',
  ROUND_OF_16: 'ROUND_OF_16',
  QUARTER_FINAL: 'QUARTER_FINAL',
  SEMI_FINAL: 'SEMI_FINAL',
  THIRD_PLACE: 'THIRD_PLACE',
  FINAL: 'FINAL',
} as const;

export type MatchPhase = (typeof MATCH_PHASE)[keyof typeof MATCH_PHASE];

// ─── Match Status ────────────────────────────────────────────────────────────

export const MATCH_STATUS = {
  SCHEDULED: 'SCHEDULED',
  LIVE: 'LIVE',
  FINISHED: 'FINISHED',
  POSTPONED: 'POSTPONED',
  CANCELLED: 'CANCELLED',
} as const;

export type MatchStatus = (typeof MATCH_STATUS)[keyof typeof MATCH_STATUS];

// ─── Prediction Point Type ──────────────────────────────────────────────────

export const PREDICTION_POINT_TYPE = {
  EXACT: 'EXACT',
  GOAL_DIFF: 'GOAL_DIFF',
  WINNER: 'WINNER',
  MISS: 'MISS',
} as const;

export type PredictionPointType =
  (typeof PREDICTION_POINT_TYPE)[keyof typeof PREDICTION_POINT_TYPE];

// ─── Notification Type ──────────────────────────────────────────────────────

export const NOTIFICATION_TYPE = {
  MATCH_REMINDER: 'MATCH_REMINDER',
  MATCH_RESULT: 'MATCH_RESULT',
  PREDICTION_DEADLINE: 'PREDICTION_DEADLINE',
  GROUP_INVITE: 'GROUP_INVITE',
  LEADERBOARD_CHANGE: 'LEADERBOARD_CHANGE',
  BONUS_REMINDER: 'BONUS_REMINDER',
} as const;

export type NotificationType =
  (typeof NOTIFICATION_TYPE)[keyof typeof NOTIFICATION_TYPE];
