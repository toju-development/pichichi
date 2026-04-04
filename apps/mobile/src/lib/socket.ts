/**
 * Socket.IO singleton factory for real-time event communication.
 *
 * Mirrors the `api/client.ts` pattern:
 * - Lazy auth store getter to break circular dependencies
 * - Platform-aware URL resolution (Android 10.0.2.2)
 * - Singleton instance created once, shared across the app
 *
 * The socket is created with `autoConnect: false` — the SocketProvider
 * controls when to connect/disconnect based on auth state and AppState.
 *
 * NOTE: This is plain infrastructure code. No React imports, no hooks.
 * The provider layer handles lifecycle; this module handles creation.
 */

import { io } from 'socket.io-client';
import { Platform } from 'react-native';

import type { TypedSocket } from '@/types/socket-events';

// ─── Lazy auth store getter (same pattern as api/client.ts) ─────────────────
// Breaks circular dependency: lib/socket → stores/auth-store → api/* → ...
// The store is only resolved at runtime (inside auth callback), never at
// module evaluation time, so the cycle is harmless.

type AuthStoreApi = typeof import('@/stores/auth-store').useAuthStore;
let _authStore: AuthStoreApi | null = null;
function getAuthStore(): AuthStoreApi {
  if (!_authStore) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    _authStore = require('@/stores/auth-store').useAuthStore as AuthStoreApi;
  }
  return _authStore;
}

// ─── URL resolution ─────────────────────────────────────────────────────────

const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';

// Strip the /api/v1 suffix — Socket.IO connects to the server root, not the
// REST API path. The namespace `/events` is appended by socket.io-client.
const SERVER_URL = BASE_URL.replace(/\/api\/v1\/?$/, '');

const SOCKET_URL =
  Platform.OS === 'android'
    ? SERVER_URL.replace('localhost', '10.0.2.2')
    : SERVER_URL;

// ─── Singleton socket factory ───────────────────────────────────────────────

let socket: TypedSocket | null = null;

/**
 * Get the singleton socket instance. Creates it on first call (lazy init).
 *
 * The socket is created with `autoConnect: false` — call `socket.connect()`
 * explicitly from the provider when the user is authenticated.
 */
export function getSocket(): TypedSocket {
  if (!socket) {
    console.log(`[Socket] 🔌 Creating socket instance - URL: ${SOCKET_URL}/events`);
    socket = io(`${SOCKET_URL}/events`, {
      autoConnect: false,
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1_000,
      reconnectionDelayMax: 10_000,
      auth: (cb) => {
        const { accessToken } = getAuthStore().getState();
        cb({ token: accessToken });
      },
    }) as TypedSocket;
  }

  return socket;
}

/**
 * Disconnect and destroy the singleton socket instance.
 *
 * Called on logout to ensure no stale connections or token references
 * persist. A new socket will be created on next `getSocket()` call.
 */
export function destroySocket(): void {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}
