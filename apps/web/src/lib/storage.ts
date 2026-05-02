/**
 * SSR-safe wrapper sobre `localStorage` para persistir tokens.
 *
 * Web equivalente de `apps/mobile/src/lib/storage.ts`. La diferencia importante
 * es que `localStorage` NO existe durante el render en server (Next 16 SSR / RSC),
 * por eso cada acceso pasa primero por un guard `typeof window === 'undefined'`.
 *
 * NOTA: Zustand persist usa este storage indirectamente vía `createJSONStorage`,
 * pero exponemos también helpers crudos por si algún test o feature los necesita.
 *
 * Tokens en `localStorage` (no httpOnly cookies) — paridad con mobile y decisión
 * tomada en `openspec/changes/web-app-funcional/design.md` §4.
 */
const STORAGE_KEYS = {
  ACCESS_TOKEN: "pichichi_access_token",
  REFRESH_TOKEN: "pichichi_refresh_token",
} as const;

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function getAccessToken(): string | null {
  if (!isBrowser()) return null;
  try {
    return window.localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  } catch {
    return null;
  }
}

export function getRefreshToken(): string | null {
  if (!isBrowser()) return null;
  try {
    return window.localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  } catch {
    return null;
  }
}

export function setTokens(accessToken: string, refreshToken: string): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    window.localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
  } catch (error) {
    // Quota / private mode — best-effort, no rompemos el flujo de auth.
    console.warn("[storage] Failed to persist tokens:", error);
  }
}

export function clearTokens(): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    window.localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  } catch {
    // Silent — ya está limpio o storage no disponible.
  }
}

export const STORAGE_KEY_AUTH = "pichichi-auth" as const;
