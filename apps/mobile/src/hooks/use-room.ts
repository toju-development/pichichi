/**
 * Join/leave a Socket.IO room tied to screen focus and socket lifecycle.
 *
 * Uses `useFocusEffect` from expo-router so the room is joined when the
 * screen gains focus (tab switch, push, back navigation) and left when
 * it loses focus — not just on mount/unmount.
 *
 * Handles:
 * - `null` roomName → no-op (allows conditional room subscription)
 * - Socket reconnection → re-joins the room on every `connect` event
 * - Cleanup on blur/unmount → emits `room:leave`
 *
 * @example
 * ```tsx
 * // In a match detail screen:
 * useRoom(matchId ? `match:${matchId}` : null);
 *
 * // In a group screen:
 * useRoom(groupId ? `group:${groupId}` : null);
 * ```
 */

import { useCallback } from 'react';
import { useFocusEffect } from 'expo-router';

import { useSocket } from '@/hooks/use-socket';

/**
 * Join a Socket.IO room when the screen is focused, leave when it blurs.
 *
 * @param roomName - The room to join (e.g. `"match:abc-123"`), or `null` to skip.
 */
export function useRoom(roomName: string | null): void {
  const { socket } = useSocket();

  useFocusEffect(
    useCallback(() => {
      if (!roomName || !socket) return;

      // Join the room — works on both initial focus and reconnections
      // that happened before this callback ran.
      socket.emit('room:join', { room: roomName });

      // If the socket reconnects while the screen is focused, re-join.
      // Socket.IO clears server-side rooms on disconnect, so every
      // `connect` event (which fires on reconnect too) needs a re-join.
      const onReconnect = () => {
        socket.emit('room:join', { room: roomName });
      };

      socket.on('connect', onReconnect);

      // Cleanup — leave room on blur or unmount
      return () => {
        socket.off('connect', onReconnect);
        socket.emit('room:leave', { room: roomName });
      };
    }, [roomName, socket]),
  );
}
