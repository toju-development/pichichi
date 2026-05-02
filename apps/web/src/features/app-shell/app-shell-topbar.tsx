"use client";

import Link from "next/link";

import { NotificationBell } from "@/features/notifications";
import { useLogout } from "@/hooks/use-logout";
import { ROUTES } from "@/lib/routes";

/**
 * Topbar slot — visible en cada ruta autenticada.
 *
 * Selectores estables:
 *   - `<NotificationBell>` cablea bell + badge unread (Phase 5B.3)
 *   - profile menu / logout (Phase 3: logout cableado, perfil en Phase 6)
 */
export function AppShellTopbar() {
  const { mutate: logout, isPending } = useLogout();

  return (
    <header
      data-testid="app-shell-topbar"
      className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-border bg-surface px-4 md:px-8"
    >
      <Link
        href={ROUTES.app.dashboard}
        data-testid="app-shell-topbar-brand"
        className="text-base font-semibold text-primary md:hidden"
      >
        Pichichi
      </Link>
      <div className="ml-auto flex items-center gap-3">
        <NotificationBell />
        <Link
          href={ROUTES.app.profile}
          data-testid="app-shell-profile-button"
          aria-label="Perfil"
          className="inline-flex h-9 items-center justify-center rounded-full bg-primary-surface px-3 text-sm font-medium text-primary transition hover:bg-primary-surface-light"
        >
          Perfil
        </Link>
        <button
          type="button"
          data-testid="app-shell-logout-button"
          onClick={() => {
            void logout();
          }}
          disabled={isPending}
          aria-label="Cerrar sesión"
          className="inline-flex h-9 items-center justify-center rounded-full px-3 text-sm font-medium text-text-secondary transition hover:bg-primary-surface-light hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Saliendo…" : "Salir"}
        </button>
      </div>
    </header>
  );
}
