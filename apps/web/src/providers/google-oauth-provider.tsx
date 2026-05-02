"use client";

import { GoogleOAuthProvider } from "@react-oauth/google";
import type { ReactNode } from "react";

import { env } from "@/lib/env";

/**
 * Wrapper que provee el contexto de Google Identity Services a todo `/app/*`.
 *
 * Usa el client ID público (`NEXT_PUBLIC_GOOGLE_CLIENT_ID`). Si la env var no
 * está seteada en ejecución (por ejemplo, build sin secrets), igual renderizamos
 * children con un client ID vacío — `<GoogleLogin />` fallará en runtime, pero
 * no rompemos el árbol.
 */
export function AppGoogleOAuthProvider({ children }: { children: ReactNode }) {
  const clientId = env.googleClientIdOptional();
  return (
    <GoogleOAuthProvider clientId={clientId}>{children}</GoogleOAuthProvider>
  );
}
