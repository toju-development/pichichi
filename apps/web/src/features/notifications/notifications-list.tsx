"use client";

/**
 * NotificationsList — encapsula `useNotifications` (infinite query) + UI.
 *
 * Equivalente web del cuerpo de `apps/mobile/app/notifications.tsx` (la
 * `FlatList`). Diferencias justificadas por plataforma:
 *   - Mobile usa `FlatList` con `onEndReached` + `ActivityIndicator`. Web
 *     usa lista DOM nativa con un botón "Cargar más" cuando `hasNextPage`.
 *     Es más simple, accesible (botón explícito), y testeable.
 *   - El "mark all as read on mount once" se hace en la PÁGINA (no acá),
 *     porque ese efecto pertenece al screen, no al listado reutilizable.
 *
 * Selectores estables:
 *   - `notifications-list` (root)
 *   - `notifications-list-loading`, `notifications-list-error`, `notifications-list-empty`
 *   - `notifications-list-load-more`
 *   - `notifications-list-loading-more`
 */

import { ErrorState, LoadingScreen, EmptyState } from "@/features/shared";
import { useNotifications } from "@/hooks/use-notifications";

import { NotificationItem } from "./notification-item";

export function NotificationsList() {
  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useNotifications();

  if (isLoading) {
    return (
      <LoadingScreen testId="notifications-list-loading" />
    );
  }

  if (isError) {
    return (
      <ErrorState
        testId="notifications-list-error"
        title="No se pudieron cargar las notificaciones"
        description="Probá de nuevo en unos segundos."
        onRetry={() => {
          void refetch();
        }}
      />
    );
  }

  // Flatten all pages into a single list (paridad mobile).
  const notifications = data?.pages.flat() ?? [];

  if (notifications.length === 0) {
    return (
      <EmptyState
        testId="notifications-list-empty"
        title="No tenés notificaciones"
        description="Cuando haya novedades en tus grupos y partidos, van a aparecer acá."
      />
    );
  }

  function handleLoadMore() {
    if (hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }

  return (
    <div
      data-testid="notifications-list"
      className="flex flex-col rounded-lg border border-border bg-surface"
    >
      {notifications.map((notification) => (
        <NotificationItem key={notification.id} notification={notification} />
      ))}

      {hasNextPage ? (
        <div className="flex items-center justify-center px-5 py-4">
          <button
            type="button"
            data-testid="notifications-list-load-more"
            onClick={handleLoadMore}
            disabled={isFetchingNextPage}
            className="inline-flex h-9 items-center justify-center rounded-md border border-border bg-surface px-4 text-sm font-medium text-primary transition hover:bg-primary-surface-light disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isFetchingNextPage ? (
              <span data-testid="notifications-list-loading-more">
                Cargando…
              </span>
            ) : (
              "Cargar más"
            )}
          </button>
        </div>
      ) : null}
    </div>
  );
}
