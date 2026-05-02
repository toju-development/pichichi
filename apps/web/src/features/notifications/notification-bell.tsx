"use client";

/**
 * NotificationBell — bell icon con badge de unread count para el topbar.
 *
 * Port web del `apps/mobile/src/components/ui/notification-bell.tsx`.
 * Diferencias justificadas por plataforma:
 *   - Mobile usa `lucide-react-native` `Bell`. Web NO tiene `lucide-react`
 *     como dep (decisión persistida en engram). Acá usamos un `<svg>`
 *     inline con la misma silueta de `Bell` (path tomado de lucide).
 *   - Mobile `StyleSheet` (workaround NativeWind v4 ghost). Web usa
 *     Tailwind tokens del topbar para mantener consistencia visual.
 *   - Mobile `router.push('/notifications')` → web `<Link href={...}>`.
 *
 * Badge:
 *   - rojo, oculto si count === 0
 *   - "99+" cap si count > 99
 *   - aria-label cambia según unread (`Notificaciones, N sin leer`)
 *
 * Selectores estables para tests / smoke E2E:
 *   - `app-shell-notifications-button` (Link raíz)
 *   - `app-shell-notifications-badge` (span del contador, hidden si 0)
 */

import Link from "next/link";

import { useUnreadCount } from "@/hooks/use-notifications";
import { ROUTES } from "@/lib/routes";

export function NotificationBell() {
  const { data } = useUnreadCount();
  const count = data?.count ?? 0;

  const label = count > 99 ? "99+" : String(count);
  const ariaLabel =
    count > 0 ? `Notificaciones, ${count} sin leer` : "Notificaciones";

  return (
    <Link
      href={ROUTES.app.notifications}
      data-testid="app-shell-notifications-button"
      aria-label={ariaLabel}
      className="relative inline-flex h-9 w-9 items-center justify-center rounded-full text-text-secondary transition hover:bg-primary-surface-light hover:text-primary"
    >
      {/* Bell icon (lucide path, inline SVG) */}
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        width="20"
        height="20"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
      </svg>

      {count > 0 ? (
        <span
          data-testid="app-shell-notifications-badge"
          className="absolute -right-0.5 -top-0.5 inline-flex min-w-[18px] items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold leading-[18px] text-text-on-primary"
        >
          {label}
        </span>
      ) : (
        <span
          data-testid="app-shell-notifications-badge"
          className="hidden"
          aria-hidden
        />
      )}
    </Link>
  );
}
