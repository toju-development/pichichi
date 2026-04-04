/**
 * Registers a single Socket.IO event listener that invalidates TanStack
 * Query caches when the backend broadcasts `match:updated`.
 *
 * Called internally by `SocketProvider` — not intended for direct use.
 *
 * Strategy: one event arrives → invalidate all match-related query
 * prefixes. TanStack Query only triggers re-renders if the refetched
 * data actually differs from the cache, so broad invalidation is cheap.
 *
 * | Socket Event     | Query Keys Invalidated (prefix)                                    |
 * |------------------|--------------------------------------------------------------------|
 * | `match:updated`  | dashboard, matches, predictions, leaderboard, groups, notifications |
 */

import { useEffect } from 'react';
import type { QueryClient } from '@tanstack/react-query';

import type { TypedSocket, MatchUpdatedPayload } from '@/types/socket-events';

/**
 * Subscribe to `match:updated` and invalidate all relevant query caches.
 *
 * @param socket      - The typed Socket.IO client instance, or `null` when disconnected.
 * @param queryClient - TanStack Query client used to invalidate cached queries.
 */
export function useSocketEvents(
  socket: TypedSocket | null,
  queryClient: QueryClient,
): void {
  useEffect(() => {
    if (!socket) return;

    const onMatchUpdated = (payload: MatchUpdatedPayload) => {
      console.log(`[Socket] 🔔 match:updated received - matchId: ${payload.matchId} - timestamp: ${new Date().toISOString()}`);
      console.log('[Socket] 🔄 Invalidating queries: dashboard, matches, predictions, leaderboard, groups, notifications');
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      void queryClient.invalidateQueries({ queryKey: ['matches'] });
      void queryClient.invalidateQueries({ queryKey: ['predictions'] });
      void queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
      void queryClient.invalidateQueries({ queryKey: ['groups'] });
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
      void queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    };

    socket.on('match:updated', onMatchUpdated);

    return () => {
      socket.off('match:updated', onMatchUpdated);
    };
  }, [socket, queryClient]);
}
