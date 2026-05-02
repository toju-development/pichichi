/**
 * Socket.IO singleton factory para la PWA web.
 *
 * Adaptado de `apps/mobile/src/lib/socket.ts`:
 * - Sin `Platform.OS` (no hay Android emulador en web).
 * - Usa `env.apiUrlOptional()` en vez de `process.env.EXPO_PUBLIC_API_URL`.
 * - Browser-safe: chequea `typeof window` antes de crear el cliente.
 * - SIN `require()` lazy: en bundlers ESM (Next/Webpack) los ciclos se
 *   resuelven via live bindings. Importamos el store directo y leemos
 *   con `.getState()` dentro del callback `auth` (mismo patrón que
 *   `api/client.ts` en Phase 3).
 *
 * Se crea con `autoConnect: false` — el `SocketProvider` controla
 * cuándo conectar/desconectar según auth state y `visibilitychange`.
 */

import { io } from "socket.io-client";

import { env } from "@/lib/env";
import { useAuthStore } from "@/stores/auth-store";
import type { TypedSocket } from "@/types/socket-events";

// ─── URL resolution ─────────────────────────────────────────────────────────

function resolveSocketUrl(): string {
  const baseUrl = env.apiUrlOptional() || "http://localhost:3000/api/v1";
  // Strip `/api/v1` suffix — Socket.IO conecta al server root, no al REST API.
  // El namespace `/events` lo agrega `socket.io-client`.
  return baseUrl.replace(/\/api\/v1\/?$/, "");
}

// ─── Singleton socket factory ───────────────────────────────────────────────

let socket: TypedSocket | null = null;

/**
 * Devuelve el socket singleton. Lo crea en la primera llamada (lazy init).
 *
 * Browser-only: si se invoca durante SSR (sin `window`), retorna `null`
 * y el provider espera al efecto que corre en cliente.
 */
export function getSocket(): TypedSocket | null {
  if (typeof window === "undefined") return null;

  if (!socket) {
    const serverUrl = resolveSocketUrl();
    console.log(
      `[Socket] 🔌 Creating socket instance - URL: ${serverUrl}/events`
    );
    socket = io(`${serverUrl}/events`, {
      autoConnect: false,
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1_000,
      reconnectionDelayMax: 10_000,
      auth: (cb) => {
        const { accessToken } = useAuthStore.getState();
        cb({ token: accessToken });
      },
    }) as TypedSocket;
  }

  return socket;
}

/**
 * Desconecta y destruye la instancia singleton.
 *
 * Se llama en logout para evitar que queden conexiones colgadas o
 * tokens viejos. La próxima `getSocket()` crea una instancia nueva.
 */
export function destroySocket(): void {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}

/**
 * Helper de tests — fuerza el reset del singleton entre suites.
 * No usar fuera de `__tests__`.
 */
export function __resetSocketForTests(): void {
  socket = null;
}
