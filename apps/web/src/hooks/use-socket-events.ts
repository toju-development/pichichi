/**
 * useSocketEvents — registra el listener `match:updated` y dispara
 * invalidaciones de TanStack Query cuando el backend broadcastea.
 *
 * Port literal de `apps/mobile/src/hooks/use-socket-events.ts`. Se llama
 * internamente desde `SocketProvider` — no es API pública.
 *
 * Estrategia: un evento → invalidar todos los prefijos relevantes.
 * TanStack sólo dispara re-render si el refetch trae datos distintos,
 * así que la invalidación amplia es barata.
 *
 * | Socket Event     | Query Keys Invalidated (prefix)                                    |
 * |------------------|--------------------------------------------------------------------|
 * | `match:updated`  | dashboard, matches, predictions, leaderboard, groups, notifications |
 */

import { useEffect } from "react";
import type { QueryClient } from "@tanstack/react-query";

import type {
  TypedSocket,
  MatchUpdatedPayload,
} from "@/types/socket-events";

export function useSocketEvents(
  socket: TypedSocket | null,
  queryClient: QueryClient
): void {
  useEffect(() => {
    if (!socket) return;

    const onMatchUpdated = (payload: MatchUpdatedPayload) => {
      console.log(
        `[Socket] 🔔 match:updated received - matchId: ${payload.matchId} - timestamp: ${new Date().toISOString()}`
      );
      console.log(
        "[Socket] 🔄 Invalidating queries: dashboard, matches, predictions, leaderboard, groups, notifications"
      );
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      void queryClient.invalidateQueries({ queryKey: ["matches"] });
      void queryClient.invalidateQueries({ queryKey: ["predictions"] });
      void queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
      void queryClient.invalidateQueries({ queryKey: ["groups"] });
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
      void queryClient.invalidateQueries({
        queryKey: ["notifications", "unread-count"],
      });
    };

    socket.on("match:updated", onMatchUpdated);

    return () => {
      socket.off("match:updated", onMatchUpdated);
    };
  }, [socket, queryClient]);
}
