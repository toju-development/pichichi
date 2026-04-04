/**
 * Registers Socket.IO event listeners that invalidate TanStack Query caches
 * when real-time events arrive from the backend EventsGateway.
 *
 * Called internally by `SocketProvider` — not intended for direct use.
 * Receives the socket instance and query client as parameters (dependency
 * injection) to keep the hook testable without a React Context tree.
 *
 * Event → Query Key mapping (see design doc):
 *
 * | Socket Event                    | Query Keys Invalidated                                            |
 * |---------------------------------|-------------------------------------------------------------------|
 * | `match:score_update`            | ['matches', matchId], ['matches', 'live'], ['dashboard']          |
 * | `match:status_update`           | ['matches', matchId], ['matches','live'], ['matches','upcoming'], |
 * |                                 | ['dashboard']                                                     |
 * | `prediction:points_calculated`  | ['predictions'] (prefix), ['dashboard']                           |
 * | `leaderboard:update`            | ['leaderboard'] (prefix)                                          |
 * | `notification:new`              | ['notifications'] (prefix)                                        |
 */

import { useEffect } from 'react';
import type { QueryClient } from '@tanstack/react-query';

import type { TypedSocket } from '@/types/socket-events';

/**
 * Subscribe to all 5 server→client Socket.IO events and map each one to
 * the corresponding `queryClient.invalidateQueries()` calls.
 *
 * @param socket  - The typed Socket.IO client instance, or `null` when disconnected.
 * @param queryClient - TanStack Query client used to invalidate cached queries.
 */
export function useSocketEvents(
  socket: TypedSocket | null,
  queryClient: QueryClient,
): void {
  useEffect(() => {
    if (!socket) return;

    // ── match:score_update ──────────────────────────────────────────────
    const onMatchScoreUpdate = (payload: { id: string }) => {
      void queryClient.invalidateQueries({ queryKey: ['matches', payload.id] });
      void queryClient.invalidateQueries({ queryKey: ['matches', 'live'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    };

    // ── match:status_update ─────────────────────────────────────────────
    const onMatchStatusUpdate = (payload: { matchId: string }) => {
      void queryClient.invalidateQueries({
        queryKey: ['matches', payload.matchId],
      });
      void queryClient.invalidateQueries({ queryKey: ['matches', 'live'] });
      void queryClient.invalidateQueries({
        queryKey: ['matches', 'upcoming'],
      });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    };

    // ── prediction:points_calculated ────────────────────────────────────
    // Payload doesn't include groupId — use prefix-only invalidation.
    // This is acceptable because only rooms the user is in receive events.
    const onPredictionPointsCalculated = () => {
      void queryClient.invalidateQueries({ queryKey: ['predictions'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    };

    // ── leaderboard:update ──────────────────────────────────────────────
    // Prefix match catches ['leaderboard', groupId] and ['leaderboard', groupId, 'me'].
    const onLeaderboardUpdate = () => {
      void queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
    };

    // ── notification:new ────────────────────────────────────────────────
    // Prefix match catches ['notifications'] and ['notifications', 'unread-count'].
    const onNotificationNew = () => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
    };

    // Register all listeners
    socket.on('match:score_update', onMatchScoreUpdate);
    socket.on('match:status_update', onMatchStatusUpdate);
    socket.on('prediction:points_calculated', onPredictionPointsCalculated);
    socket.on('leaderboard:update', onLeaderboardUpdate);
    socket.on('notification:new', onNotificationNew);

    // Cleanup — remove all listeners when socket changes or on unmount
    return () => {
      socket.off('match:score_update', onMatchScoreUpdate);
      socket.off('match:status_update', onMatchStatusUpdate);
      socket.off('prediction:points_calculated', onPredictionPointsCalculated);
      socket.off('leaderboard:update', onLeaderboardUpdate);
      socket.off('notification:new', onNotificationNew);
    };
  }, [socket, queryClient]);
}
