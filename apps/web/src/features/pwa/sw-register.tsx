"use client";

import { useEffect, useRef } from "react";

/**
 * Registra el Service Worker `/sw.js` cuando montamos el shell autenticado.
 *
 * Reglas (Spec web-pwa, Design §9):
 *   - Solo en browser (guard `typeof window` + feature detect `serviceWorker`).
 *   - Scope acotado a `/app/` — el shell PWA cubre el segmento autenticado,
 *     no la landing.
 *   - Idempotente — registramos una sola vez por mount usando `useRef`.
 *   - Fallback silencioso: si el registro falla (browser sin soporte, error
 *     transitorio), `console.warn` y la app sigue funcionando normal.
 *
 * Componente sin UI: retorna `null`.
 */
export function SWRegister(): null {
  const registeredRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    if (registeredRef.current) return;

    registeredRef.current = true;

    navigator.serviceWorker
      .register("/sw.js", { scope: "/app/" })
      .catch((err: unknown) => {
        // No romper la app si el SW falla — solo log defensivo.
        console.warn("[pwa] service worker registration failed:", err);
      });
  }, []);

  return null;
}
