/**
 * Shared DTO interfaces for the Pichichi platform.
 *
 * These are PURE TypeScript interfaces — no runtime dependencies.
 * They mirror what the API controllers return, so mobile and web
 * clients can type their API responses without importing NestJS or Prisma.
 *
 * The types reference the const-object types already defined in
 * `./index.ts` (e.g., AuthProvider, MatchPhase, etc.).
 */

import type {
  GroupMemberRole,
  TournamentStatus,
  TournamentType,
  MatchPhase,
  MatchStatus,
  PredictionPointType,
  NotificationType,
} from './index.js';

// ─── User ────────────────────────────────────────────────────────────────────

export interface UserDto {
  id: string;
  email: string;
  displayName: string;
  username: string;
  avatarUrl: string | null;
  createdAt: string;
}

export interface UpdateProfileDto {
  displayName?: string;
  avatarUrl?: string;
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface AuthResponseDto {
  accessToken: string;
  refreshToken: string;
  user: UserDto;
}

export interface RefreshTokenRequestDto {
  refreshToken: string;
}

// ─── Group ───────────────────────────────────────────────────────────────────

export interface GroupDto {
  id: string;
  name: string;
  description: string | null;
  inviteCode: string;
  createdBy: string;
  maxMembers: number;
  memberCount: number;
  userRole: GroupMemberRole;
  userPoints: number;
  createdAt: string;
}

export interface GroupMemberDto {
  id: string;
  userId: string;
  displayName: string;
  username: string;
  avatarUrl: string | null;
  role: GroupMemberRole;
  joinedAt: string;
}

// ─── Tournament ──────────────────────────────────────────────────────────────

export interface TournamentPhaseDto {
  id: string;
  phase: MatchPhase;
  multiplier: number;
  sortOrder: number;
}

export interface TournamentBonusTypeDto {
  id: string;
  key: string;
  label: string;
  points: number;
  sortOrder: number;
}

export interface TournamentDto {
  id: string;
  name: string;
  slug: string;
  type: TournamentType;
  description: string | null;
  logoUrl: string | null;
  startDate: string;
  endDate: string;
  status: TournamentStatus;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  phases?: TournamentPhaseDto[];
  bonusTypes?: TournamentBonusTypeDto[];
  teamCount?: number;
}

export interface TournamentTeamDto {
  id: string;
  teamId: string;
  name: string;
  shortName: string;
  flagUrl: string | null;
  groupLetter: string | null;
  isEliminated: boolean;
}

// ─── Team (nested in Match) ──────────────────────────────────────────────────

export interface MatchTeamDto {
  id: string;
  name: string;
  shortName: string;
  flagUrl: string | null;
}

// ─── Match ───────────────────────────────────────────────────────────────────

export interface MatchDto {
  id: string;
  tournamentId: string;
  homeTeam: MatchTeamDto | null;
  awayTeam: MatchTeamDto | null;
  phase: MatchPhase;
  groupLetter: string | null;
  matchNumber: number | null;
  scheduledAt: string;
  venue: string | null;
  city: string | null;
  status: MatchStatus;
  homeScore: number | null;
  awayScore: number | null;
  homeScorePenalties: number | null;
  awayScorePenalties: number | null;
  isExtraTime: boolean;
  homeTeamPlaceholder: string | null;
  awayTeamPlaceholder: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Prediction ──────────────────────────────────────────────────────────────

export interface PredictionMatchDto {
  id: string;
  scheduledAt: string;
  status: MatchStatus;
  homeTeamName: string | null;
  awayTeamName: string | null;
  homeTeamShortName: string | null;
  awayTeamShortName: string | null;
  homeTeamFlagUrl: string | null;
  awayTeamFlagUrl: string | null;
  homeScore: number | null;
  awayScore: number | null;
  phase: MatchPhase;
}

export interface PredictionDto {
  id: string;
  userId: string;
  matchId: string;
  groupId: string;
  predictedHome: number;
  predictedAway: number;
  pointsEarned: number;
  pointType: PredictionPointType | null;
  match?: PredictionMatchDto;
  createdAt: string;
  updatedAt: string;
}

export interface PredictionStatsDto {
  totalPoints: number;
  totalPredictions: number;
  exactCount: number;
  goalDiffCount: number;
  winnerCount: number;
  missCount: number;
}

export interface UserPredictionDto {
  id: string;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  predictedHome: number;
  predictedAway: number;
  pointsEarned: number;
  pointType: PredictionPointType | null;
}

export interface GroupPredictionsDto {
  matchId: string;
  groupId: string;
  matchStatus: MatchStatus;
  revealed: boolean;
  predictions: UserPredictionDto[];
}

// ─── Leaderboard ─────────────────────────────────────────────────────────────

export interface LeaderboardEntryDto {
  position: number;
  userId: string;
  displayName: string;
  username: string;
  avatarUrl: string | null;
  totalPoints: number;
  exactCount: number;
  goalDiffCount: number;
  winnerCount: number;
  missCount: number;
  bonusPoints: number;
  streak: number;
}

export interface LeaderboardDto {
  groupId: string;
  groupName: string;
  tournamentId: string | null;
  entries: LeaderboardEntryDto[];
  totalMembers: number;
}

// ─── Bonus Prediction ────────────────────────────────────────────────────────

export interface BonusTypeDto {
  id: string;
  key: string;
  label: string;
  points: number;
  sortOrder: number;
}

export interface BonusPredictionDto {
  id: string;
  userId: string;
  groupId: string;
  bonusTypeId: string;
  predictedValue: string;
  isCorrect: boolean | null;
  pointsEarned: number;
  lockedAt: string | null;
  bonusType?: BonusTypeDto;
  createdAt: string;
  updatedAt: string;
}

export interface UserBonusPredictionDto {
  id: string;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  bonusTypeId: string;
  predictedValue: string;
  isCorrect: boolean | null;
  pointsEarned: number;
}

export interface GroupBonusPredictionsDto {
  groupId: string;
  tournamentId: string;
  revealed: boolean;
  predictions: UserBonusPredictionDto[];
}

// ─── Notification ────────────────────────────────────────────────────────────

export interface NotificationDto {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  isRead: boolean;
  createdAt: string;
}

// ─── Pagination ──────────────────────────────────────────────────────────────

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResponseDto<T> {
  data: T[];
  meta: PaginationMeta;
}

// ─── API Error ───────────────────────────────────────────────────────────────

export interface ApiErrorResponseDto {
  statusCode: number;
  message: string | string[];
  error: string;
}
