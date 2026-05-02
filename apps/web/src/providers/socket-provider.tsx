"use client";

/**
 * SocketProvider — administra el ciclo de vida de la conexión Socket.IO.
 *
 * Adaptado de `apps/mobile/src/providers/socket-provider.tsx`:
 *
 * Diferencias vs mobile (justificadas en diseño §6):
 * - `AppState` (RN) ⟶ `visibilitychange` + `online/offline` (web).
 *   `document.hidden` cubre el equivalente background/foreground;
 *   `online/offline` cubre pérdida real de red (que en mobile gestiona
 *   directamente Socket.IO via `reconnection`, pero en web vale el
 *   feedback explícito).
 * - El socket sólo existe en cliente: `getSocket()` retorna `null` en
 *   SSR, así que el provider arranca con `socket: null` y el efecto
 *   resuelve la instancia recién en mount.
 *
 * Responsabilidades:
 * - Conectar/desconectar el socket cuando cambia `accessToken`.
 * - Desconectar al ir a background, reconectar + invalidar cache al volver.
 * - Cablear el listener server→client via `useSocketEvents`.
 *
 * Orden en el árbol (ver `app-providers.tsx`):
 *   QueryProvider > GoogleOAuth > AuthProvider > SocketProvider > children
 *
 * El socket vive en `useState` para que los consumers vía Context y el
 * hook `useSocketEvents` se re-rendericen al cambiar la conexión.
 * Un `socketRef` paralelo se mantiene sincronizado para que los listeners
 * de `visibilitychange`/`online` puedan leer el socket actual sin
 * re-registrarse en cada cambio (y sin caer en `react-hooks/refs`, que
 * sólo prohíbe leer `.current` durante render — leerlo dentro de un
 * callback de event listener está permitido).
 */

import {
  createContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";

import { useSocketEvents } from "@/hooks/use-socket-events";
import { destroySocket, getSocket } from "@/lib/socket";
import { useAuthStore } from "@/stores/auth-store";
import type { TypedSocket } from "@/types/socket-events";

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
  const [socket, setSocket] = useState<TypedSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // `socketRef` espeja el state para uso DENTRO de event listeners
  // (visibility/online). Lo seteamos sincrónicamente en el efecto de auth
  // antes de cualquier `queueMicrotask`, así los listeners ven el socket
  // sin esperar al re-render. NUNCA leemos `socketRef.current` durante
  // render — eso es exactamente lo que la rule `react-hooks/refs` prohíbe.
  // Para render usamos `socket` (state) — Context y `useSocketEvents`.
  const socketRef = useRef<TypedSocket | null>(null);

  const queryClient = useQueryClient();

  const accessToken = useAuthStore((s) => s.accessToken);

  // ── Auth-driven connect/disconnect ──────────────────────────────────────
  //
  // Sólo depende de `accessToken`. NO incluimos `socket` como dep — este
  // efecto es el ÚNICO que escribe el state `socket`, así que agregarlo
  // como dep generaría un loop infinito.

  useEffect(() => {
    if (accessToken) {
      const nextSocket = getSocket();
      if (!nextSocket) return; // SSR / sin window — no debería pasar en este efecto.

      // Sync inmediato del ref (sin re-render) — los listeners de
      // visibility/online ya pueden leerlo en este mismo tick.
      socketRef.current = nextSocket;

      // Diferimos el setState para no caer en `react-hooks/set-state-in-effect`.
      // El microtask corre antes del próximo paint, así que los consumers
      // del Context ven el socket en el siguiente render sin lag perceptible.
      queueMicrotask(() => setSocket(nextSocket));

      const onConnect = () => {
        console.log(`[Socket] ✅ Connected - id: ${nextSocket.id}`);
        setIsConnected(true);
      };

      const onDisconnect = (reason: string) => {
        console.log(`[Socket] ❌ Disconnected - reason: ${reason}`);
        setIsConnected(false);
      };

      const onConnectError = (error: Error) => {
        console.log(`[Socket] ⚠️ Connection error: ${error.message}`);
      };

      nextSocket.on("connect", onConnect);
      nextSocket.on("disconnect", onDisconnect);
      nextSocket.on("connect_error", onConnectError);
      nextSocket.connect();

      return () => {
        nextSocket.off("connect", onConnect);
        nextSocket.off("disconnect", onDisconnect);
        nextSocket.off("connect_error", onConnectError);
      };
    }

    // No autenticado — destruir socket, limpiar ref + state.
    destroySocket();
    socketRef.current = null;
    queueMicrotask(() => {
      setSocket(null);
      setIsConnected(false);
    });

    return undefined;
  }, [accessToken]);

  // ── Visibility listener (background/foreground browser equivalent) ──────
  // Desconecta cuando la pestaña queda oculta, reconecta + invalida cache
  // al volver a foco. Igual semántica que `AppState` en mobile.
  //
  // Leemos el socket vía `socketRef.current` DENTRO del callback (no
  // durante render), por dos razones:
  //   1) Evitar tener que re-registrar listeners cada vez que cambia el
  //      socket (teardown/setup innecesarios en cada login/logout).
  //   2) En el primer mount, `setSocket` está deferreado en microtask.
  //      Si el listener cerrara sobre el state `socket`, dispararse antes
  //      del segundo render lo vería como `null`. El ref está sincronizado
  //      ya — esto importa para tests síncronos y para race conditions
  //      reales en mount rápido.

  useEffect(() => {
    if (typeof document === "undefined") return;

    const onVisibilityChange = () => {
      const current = socketRef.current;

      if (document.hidden) {
        // Pestaña oculta → desconectar.
        console.log("[Socket] 📱 visibilitychange: hidden - disconnecting");
        current?.disconnect();
        return;
      }

      // Pestaña visible → reconectar + invalidar todo si hay sesión activa.
      if (current && accessToken) {
        console.log(
          "[Socket] 📱 visibilitychange: visible - connecting + invalidating"
        );
        current.connect();
        void queryClient.invalidateQueries();
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [accessToken, queryClient]);

  // ── online/offline listener ──────────────────────────────────────────────
  // Cuando el browser pierde y recupera red, forzamos reconexión explícita
  // e invalidamos cache para alinearnos con el server.

  useEffect(() => {
    if (typeof window === "undefined") return;

    const onOnline = () => {
      const current = socketRef.current;
      if (current && accessToken) {
        console.log("[Socket] 🌐 online - reconnecting + invalidating");
        current.connect();
        void queryClient.invalidateQueries();
      }
    };

    const onOffline = () => {
      console.log("[Socket] 🌐 offline");
    };

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [accessToken, queryClient]);

  // ── Wire event→query invalidation listeners ────────────────────────────
  //
  // `useSocketEvents` SÍ consume `socket` (state) porque su effect interno
  // depende de la identidad del socket para registrar/limpiar `match:updated`.
  // Acá NO podemos usar el ref — el hook necesita re-correr cuando el
  // socket cambia de identidad, y un ref no dispara re-render.

  useSocketEvents(socket, queryClient);

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}
