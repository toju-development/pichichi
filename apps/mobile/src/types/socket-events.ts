/**
 * Socket.IO event type definitions for the mobile client.
 *
 * Maps the 5 server→client events emitted by the backend EventsGateway
 * and the 2 client→server room management events.
 *
 * Reuses shared DTOs where the payload matches the backend response shape.
 * Custom payload types are defined for events where the backend constructs
 * a different shape than the standard DTO.
 */

import type { Socket } from 'socket.io-client';
import type { MatchDto, MatchStatus, NotificationDto } from '@pichichi/shared';

// ─── Server → Client Event Payloads ─────────────────────────────────────────

/**
 * `match:score_update` — Backend sends the full MatchResponseDto.
 * Reuses MatchDto from shared package (same shape).
 */
export type MatchScoreUpdatePayload = MatchDto;

/**
 * `match:status_update` — Backend sends { matchId, status }.
 * @see matches.service.ts lines 223-226
 */
export interface MatchStatusUpdatePayload {
  matchId: string;
  status: MatchStatus;
}

/**
 * `prediction:points_calculated` — Backend spreads scoring data + adds matchId.
 * @see scoring.service.ts line 154, gateway line 84
 */
export interface PredictionPointsCalculatedPayload {
  matchId: string;
  totalPredictions: number;
  results: {
    exact: number;
    goalDiff: number;
    winner: number;
    miss: number;
  };
}

/**
 * `leaderboard:update` — Backend sends matchId + reason for the update.
 * @see scoring.service.ts lines 158-161
 */
export interface LeaderboardUpdatePayload {
  matchId: string;
  reason: string;
}

/**
 * `notification:new` — Backend sends the full NotificationResponseDto.
 * Reuses NotificationDto from shared package (same shape).
 */
export type NotificationNewPayload = NotificationDto;

// ─── Event Maps ──────────────────────────────────────────────────────────────

/** Server → Client events emitted by the backend EventsGateway. */
export interface ServerToClientEvents {
  'match:score_update': (payload: MatchScoreUpdatePayload) => void;
  'match:status_update': (payload: MatchStatusUpdatePayload) => void;
  'prediction:points_calculated': (
    payload: PredictionPointsCalculatedPayload,
  ) => void;
  'leaderboard:update': (payload: LeaderboardUpdatePayload) => void;
  'notification:new': (payload: NotificationNewPayload) => void;
}

/** Client → Server events for room management. */
export interface ClientToServerEvents {
  'room:join': (payload: { room: string }) => void;
  'room:leave': (payload: { room: string }) => void;
}

// ─── Typed Socket Instance ───────────────────────────────────────────────────

/** Fully typed Socket.IO client instance for the Pichichi mobile app. */
export type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;
