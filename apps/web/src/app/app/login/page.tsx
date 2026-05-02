import type { Metadata } from "next";

import { LoginForm } from "@/features/auth";

export const metadata: Metadata = {
  title: "Iniciar sesión",
};

/**
 * Pantalla pública de login — vive FUERA del route group `(authed)` a propósito,
 * para que el auth gate no la redirija a sí misma.
 *
 * Renderiza un Server Component minimal que monta el `<LoginForm>` cliente.
 * El form depende de `<GoogleOAuthProvider>` y `<AuthProvider>` que se
 * cablean en `app/app/layout.tsx → AppProviders`.
 */
export default function LoginPage() {
  return (
    <main
      data-testid="app-login-page"
      className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center"
    >
      <h1 className="text-2xl font-semibold text-text-primary">
        Iniciar sesión
      </h1>
      <p className="max-w-sm text-sm text-text-secondary">
        Ingresá con tu cuenta de Google para sumarte a Pichichi.
      </p>
      <LoginForm />
    </main>
  );
}
