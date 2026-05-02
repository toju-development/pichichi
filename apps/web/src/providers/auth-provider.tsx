"use client";

import { useSyncExternalStore, type ReactNode } from "react";

import { LoadingScreen } from "@/features/shared/loading-screen";
import { useMe } from "@/hooks/use-user";
import { useAuthStore } from "@/stores/auth-store";

/**
 * AuthProvider — gatea el render hasta que Zustand persist termine de hidratar
 * desde `localStorage`.
 *
 * Detalles importantes:
 *   - En SSR `useAuthStore.persist.hasHydrated()` siempre devuelve `false`,
 *     entonces el primer render del cliente coincide con el server output
 *     (LoadingScreen) y no rompemos hydration mismatch.
 *   - Suscribimos al persist con `useSyncExternalStore` — la API idiomática
 *     de React 18+/19 para fuentes externas. El `subscribe` cablea
 *     `persist.onFinishHydration`; el snapshot lee `persist.hasHydrated()`.
 *     Este patrón evita el setState síncrono dentro de un useEffect (que la
 *     rule `react-hooks/set-state-in-effect` rechaza con razón).
 *   - Phase 5A.1: una vez que hidrata, montamos `<MeBootstrap />` como sibling
 *     de `{children}`. Ese componente llama `useMe()` y refresca el user
 *     persistido contra el back. Misma lógica que mobile.
 */
function subscribePersist(onChange: () => void): () => void {
  // `onFinishHydration` devuelve la unsubscribe function del listener.
  return useAuthStore.persist.onFinishHydration(onChange);
}

function getPersistSnapshot(): boolean {
  return useAuthStore.persist.hasHydrated();
}

function getPersistServerSnapshot(): boolean {
  // En SSR el persist nunca corrió → reportamos `false` para mostrar el
  // LoadingScreen y mantener parity con el primer render cliente.
  return false;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const hasHydrated = useSyncExternalStore(
    subscribePersist,
    getPersistSnapshot,
    getPersistServerSnapshot,
  );

  if (!hasHydrated && !isHydrated) {
    return <LoadingScreen testId="auth-hydration-loading" />;
  }

  return (
    <>
      <MeBootstrap />
      {children}
    </>
  );
}

/**
 * Componente sin UI que dispara `useMe()` para refrescar el user persistido.
 *
 * Va montado DENTRO del `AuthProvider` (después del gate de hidratación) y al
 * MISMO nivel de `{children}` para que el query se dispare una sola vez por
 * sesión y no en cada cambio de ruta.
 *
 * El query queda `enabled: isAuthenticated`, así que en logout queda `idle`
 * automáticamente — sin lógica extra.
 */
function MeBootstrap() {
  useMe();
  return null;
}
