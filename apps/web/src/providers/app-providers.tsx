"use client";

import type { ReactNode } from "react";

import { AuthProvider } from "@/providers/auth-provider";
import { AppGoogleOAuthProvider } from "@/providers/google-oauth-provider";
import { QueryProvider } from "@/providers/query-provider";
import { SocketProvider } from "@/providers/socket-provider";

/**
 * Provider tree para el segmento `/app/*`.
 *
 * Orden estable (diseño §2, §5, §6, §10):
 *
 *   QueryProvider              ── cache de TanStack Query disponible para todos
 *   └─ AppGoogleOAuthProvider  ── contexto de `<GoogleLogin />` (sólo login page)
 *      └─ AuthProvider         ── hidrata Zustand desde localStorage
 *         └─ SocketProvider    ── conecta socket cuando hay accessToken
 *            └─ children
 *
 * Por qué Query envuelve a Auth: el AuthProvider eventualmente disparará
 * `GET /users/me` via `useMe()` (Phase 6). Necesita QueryClient en contexto.
 *
 * Por qué Socket dentro de Auth: el socket lee `accessToken` del store y
 * conecta/desconecta cuando cambia. Necesita el store hidratado.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <AppGoogleOAuthProvider>
        <AuthProvider>
          <SocketProvider>{children}</SocketProvider>
        </AuthProvider>
      </AppGoogleOAuthProvider>
    </QueryProvider>
  );
}
