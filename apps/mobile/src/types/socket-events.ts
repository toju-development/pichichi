/**
 * Socket.IO event type definitions for the mobile client.
 *
 * The backend emits a single broadcast event `match:updated` with
 * `{ matchId }`. The client invalidates all match-related query caches
 * and lets TanStack Query re-fetch only what actually changed.
 *
 * No rooms, no client→server events — the socket is receive-only.
 */

import type { Socket } from 'socket.io-client';

// ─── Server → Client Event Payloads ─────────────────────────────────────────

/** Payload for the single `match:updated` broadcast event. */
export interface MatchUpdatedPayload {
  matchId: string;
}

// ─── Event Maps ──────────────────────────────────────────────────────────────

/** Server → Client events emitted by the backend EventsGateway. */
export interface ServerToClientEvents {
  'match:updated': (payload: MatchUpdatedPayload) => void;
}

/** Client → Server events — none (receive-only socket). */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ClientToServerEvents {}

// ─── Typed Socket Instance ───────────────────────────────────────────────────

/** Fully typed Socket.IO client instance for the Pichichi mobile app. */
export type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;
