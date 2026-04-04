/**
 * Socket.IO provider — manages real-time connection lifecycle.
 *
 * Responsibilities:
 * - Connect/disconnect socket in response to auth state changes
 * - Disconnect on app background, reconnect + full invalidation on foreground
 * - Wire server→client event listeners via useSocketEvents hook
 *
 * Placement in provider hierarchy (see _layout.tsx):
 *   QueryClientProvider > AuthProvider > SocketProvider > Slot
 *
 * The socket instance lives in a ref (no re-renders on socket events).
 * Only `isConnected` is in state to trigger consumer re-renders when needed.
 */

import {
  createContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';

import { useSocketEvents } from '@/hooks/use-socket-events';
import { getSocket, destroySocket } from '@/lib/socket';
import { useAuthStore } from '@/stores/auth-store';
import type { TypedSocket } from '@/types/socket-events';

// ─── Context ─────────────────────────────────────────────────────────────────

interface SocketContextValue {
  socket: TypedSocket | null;
  isConnected: boolean;
}

export const SocketContext = createContext<SocketContextValue>({
  socket: null,
  isConnected: false,
});

// ─── Provider ────────────────────────────────────────────────────────────────

interface SocketProviderProps {
  children: ReactNode;
}

export function SocketProvider({ children }: SocketProviderProps) {
  const socketRef = useRef<TypedSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const queryClient = useQueryClient();

  const accessToken = useAuthStore((s) => s.accessToken);

  // ── Auth-driven connect/disconnect ──────────────────────────────────────

  useEffect(() => {
    if (accessToken) {
      // Authenticated — create and connect
      const socket = getSocket();
      socketRef.current = socket;

      const onConnect = () => {
        console.log(`[Socket] ✅ Connected - id: ${socket.id}`);
        setIsConnected(true);
      };

      const onDisconnect = (reason: string) => {
        console.log(`[Socket] ❌ Disconnected - reason: ${reason}`);
        setIsConnected(false);
      };

      const onConnectError = (error: Error) => {
        console.log(`[Socket] ⚠️ Connection error: ${error.message}`);
      };

      socket.on('connect', onConnect);
      socket.on('disconnect', onDisconnect);
      socket.on('connect_error', onConnectError);
      socket.connect();

      return () => {
        socket.off('connect', onConnect);
        socket.off('disconnect', onDisconnect);
        socket.off('connect_error', onConnectError);
      };
    }

    // Not authenticated — tear down socket entirely
    destroySocket();
    socketRef.current = null;
    setIsConnected(false);

    return undefined;
  }, [accessToken]);

  // ── AppState listener (background/foreground) ───────────────────────────
  // Disconnect on background to save battery. Reconnect + full cache
  // invalidation on foreground to catch any events missed while sleeping.

  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      (nextAppState: AppStateStatus) => {
        const socket = socketRef.current;

        if (
          appStateRef.current.match(/active/) &&
          nextAppState.match(/inactive|background/)
        ) {
          // Going to background → disconnect
          console.log(`[Socket] 📱 AppState: ${nextAppState} - disconnecting`);
          socket?.disconnect();
        }

        if (
          appStateRef.current.match(/inactive|background/) &&
          nextAppState === 'active'
        ) {
          // Returning to foreground → reconnect + invalidate all cached queries
          if (socket && accessToken) {
            console.log(`[Socket] 📱 AppState: ${nextAppState} - connecting`);
            socket.connect();
            void queryClient.invalidateQueries();
          }
        }

        appStateRef.current = nextAppState;
      },
    );

    return () => {
      subscription.remove();
    };
  }, [accessToken, queryClient]);

  // ── Wire event→query invalidation listeners ────────────────────────────

  useSocketEvents(socketRef.current, queryClient);

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <SocketContext.Provider
      value={{ socket: socketRef.current, isConnected }}
    >
      {children}
    </SocketContext.Provider>
  );
}
