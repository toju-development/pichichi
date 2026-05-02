/**
 * Socket.IO event types para la PWA web.
 *
 * Port literal de `apps/mobile/src/types/socket-events.ts`. El backend
 * sólo emite `match:updated` con `{ matchId }`. El cliente invalida las
 * query caches relevantes y deja que TanStack re-fetchee lo que cambió.
 *
 * Receive-only: no hay eventos client→server.
 *
 * TODO (post Phase 4): considerar promover a `@pichichi/shared` para
 * eliminar la duplicación con mobile. No se hace ahora porque cambiar
 * shared dispara cambios en mobile (out of scope de `web-app-funcional`).
 */

import type { Socket } from "socket.io-client";

/** Payload del único broadcast `match:updated`. */
export interface MatchUpdatedPayload {
  matchId: string;
}

/** Server → Client events emitidos por el backend `EventsGateway`. */
export interface ServerToClientEvents {
  "match:updated": (payload: MatchUpdatedPayload) => void;
}

/** Client → Server events — ninguno (socket receive-only). */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ClientToServerEvents {}

/** Socket.IO client tipado para la PWA web. */
export type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;
