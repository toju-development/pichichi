"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { AppShell } from "@/features/app-shell/app-shell";
import { InstallPrompt, SWRegister } from "@/features/pwa";
import { LoadingScreen } from "@/features/shared/loading-screen";
import { useAuth } from "@/hooks/use-auth";
import { ROUTES } from "@/lib/routes";

/**
 * Layout autenticado del route group `(authed)`.
 *
 * Auth gate client-side:
 *   - Si todavía no hidratamos persist → LoadingScreen (evita flicker).
 *   - Si hidratamos y NO hay sesión → `router.replace('/app/login')`.
 *   - Si hay sesión → renderizamos el AppShell con children.
 *
 * Usamos `router.replace` (Client Component, Next 16) en lugar de `redirect()`,
 * que sólo aplica a Server Components / Server Actions.
 */
export default function AuthedLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isHydrated } = useAuth();

  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.replace(ROUTES.app.login);
    }
  }, [isAuthenticated, isHydrated, router]);

  if (!isHydrated) {
    return <LoadingScreen testId="authed-loading" />;
  }

  if (!isAuthenticated) {
    // Mientras el effect dispara la redirección, no renderizamos children.
    return <LoadingScreen testId="authed-redirecting" label="Redirigiendo…" />;
  }

  return (
    <AppShell>
      <SWRegister />
      <InstallPrompt />
      {children}
    </AppShell>
  );
}
