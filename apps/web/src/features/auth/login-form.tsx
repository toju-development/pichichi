"use client";

import { GoogleLogin } from "@react-oauth/google";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuth } from "@/hooks/use-auth";
import { useLoginWithGoogle } from "@/hooks/use-login";
import { ROUTES } from "@/lib/routes";

/**
 * Formulario de login con el botón nativo "Continuar con Google".
 *
 * Flujo:
 *   1. `<GoogleLogin />` (de `@react-oauth/google`) renderiza el botón oficial
 *      de Google y abre el flow de Google Identity Services (GIS).
 *   2. En `onSuccess` recibimos `credentialResponse.credential`, que es un
 *      **ID token** (JWT firmado por Google). NO es un access token.
 *   3. Mandamos ese `credential` a `POST /auth/google`. El backend lo verifica
 *      con `googleClient.verifyIdToken({ idToken, audience: GOOGLE_CLIENT_ID })`,
 *      que SÓLO acepta ID tokens (no access tokens).
 *   4. Si la respuesta es ok, `useLoginWithGoogle` setea estado en el store y
 *      redirigimos a `/app`.
 *
 * Paridad con mobile: en `apps/mobile/app/(auth)/login.tsx`, después de
 * `GoogleSignin.signIn()` mandamos `userInfo.data.idToken` (también un ID token)
 * al mismo endpoint. Web y mobile envían exactamente el mismo tipo de token.
 *
 * Edge: si el usuario YA está autenticado (ej. abre /app/login con sesión
 * vigente), redirigimos a `/app` apenas se complete la hidratación.
 */
export function LoginForm() {
  const router = useRouter();
  const { isAuthenticated, isHydrated } = useAuth();
  const { mutate: loginMutate, isPending, error } = useLoginWithGoogle();
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (isHydrated && isAuthenticated) {
      router.replace(ROUTES.app.dashboard);
    }
  }, [isAuthenticated, isHydrated, router]);

  const errorMessage = localError ?? error?.message ?? null;

  return (
    <div
      data-testid="app-login-form"
      className="flex w-full max-w-sm flex-col items-center gap-4"
    >
      <div
        data-testid="app-login-google-button"
        className="flex w-full items-center justify-center"
      >
        {isHydrated ? (
          <GoogleLogin
            onSuccess={async (credentialResponse) => {
              setLocalError(null);
              const idToken = credentialResponse.credential;
              if (!idToken) {
                setLocalError(
                  "No pudimos completar el login con Google. Intentá de nuevo.",
                );
                return;
              }
              try {
                await loginMutate(idToken);
                router.replace(ROUTES.app.dashboard);
              } catch {
                // El error ya queda capturado en `error` del hook.
              }
            }}
            onError={() => {
              setLocalError(
                "No pudimos completar el login con Google. Intentá de nuevo.",
              );
            }}
            theme="filled_blue"
            size="large"
            width="320"
            text="continue_with"
            shape="pill"
            locale="es"
          />
        ) : null}
        {isPending ? (
          <span
            data-testid="app-login-pending"
            className="ml-3 text-sm text-secondary"
            aria-live="polite"
          >
            Iniciando sesión…
          </span>
        ) : null}
      </div>
      {errorMessage ? (
        <p
          data-testid="app-login-error"
          role="alert"
          className="text-sm text-danger"
        >
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
