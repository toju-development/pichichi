/**
 * useNetworkStatus — suscripción al estado online/offline del browser.
 *
 * Equivalente web del hook mobile (que usa `@react-native-community/netinfo`).
 * En browser usamos `navigator.onLine` + eventos `online`/`offline`.
 *
 * Implementación con `useSyncExternalStore` (idiomático React 18+/19):
 *   - `subscribe`: registra los listeners `online`/`offline` y devuelve el
 *     cleanup. React invalida el snapshot cuando el callback es disparado.
 *   - `getSnapshot` (cliente): lee `navigator.onLine` directo.
 *   - `getServerSnapshot`: en SSR asumimos online (`true`). El primer commit
 *     en cliente alinea el valor real sin disparar setState dentro de un
 *     useEffect (que viola la rule `react-hooks/set-state-in-effect`).
 *
 * Devuelve `{ isOffline }` para mantener la API previa.
 */

import { useSyncExternalStore } from "react";

function subscribe(onChange: () => void): () => void {
  if (typeof window === "undefined") {
    return () => {
      // no-op
    };
  }

  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);

  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
}

function getSnapshot(): boolean {
  // `navigator.onLine` no es 100% confiable pero alcanza como heurística
  // (mismo trade-off que `NetInfo.fetch` en mobile).
  if (typeof navigator === "undefined") return true;
  return navigator.onLine;
}

function getServerSnapshot(): boolean {
  // SSR: asumimos online para evitar hydration mismatch.
  return true;
}

export function useNetworkStatus() {
  const isOnline = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  return { isOffline: !isOnline };
}
