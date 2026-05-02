"use client";

/**
 * Notifications page — `/app/notifications`.
 *
 * Port literal del screen `apps/mobile/app/notifications.tsx`.
 *
 * Comportamiento:
 *   - On mount (una sola vez): dispara `useMarkAllAsRead` para resetear el
 *     badge del bell. Usamos `markedRef` para garantizar que solo corra una
 *     vez aún bajo React 19 StrictMode (mismo patrón que mobile).
 *   - Render delegado a `<NotificationsList />` (encapsula loading/error/
 *     empty/load-more). La página solo aporta el header + el efecto.
 *
 * Decisión sobre `metadata`:
 *   En este proyecto las pages dentro de `(authed)` son Client Components
 *   (mismo patrón que `tournaments/[slug]/page.tsx`), por lo que NO podemos
 *   exportar `metadata` desde acá ("use client" + metadata son mutuamente
 *   excluyentes en una misma file). El `<title>` de la pestaña queda en el
 *   layout/root metadata; mantenemos paridad con mobile (mobile tampoco
 *   maneja metadata HTML).
 */

import { useEffect, useRef } from "react";

import { NotificationsList } from "@/features/notifications";
import { useMarkAllAsRead } from "@/hooks/use-notifications";

export default function NotificationsPage() {
  const markAllAsRead = useMarkAllAsRead();
  const markedRef = useRef(false);

  // Mark all as read on mount — once, even under StrictMode double-invoke.
  useEffect(() => {
    if (markedRef.current) return;
    markedRef.current = true;
    markAllAsRead.mutate();
  }, [markAllAsRead]);

  return (
    <section data-testid="page-notifications" className="flex flex-col gap-4">
      <header className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-text-primary">
          Notificaciones
        </h1>
        <p className="text-sm text-text-secondary">
          Avisos de partidos, predicciones y resultados.
        </p>
      </header>

      <NotificationsList />
    </section>
  );
}
