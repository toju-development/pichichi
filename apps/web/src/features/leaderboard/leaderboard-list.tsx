"use client";

/**
 * LeaderboardList — group ranking list, port literal de
 * `apps/mobile/src/components/leaderboard/leaderboard-list.tsx`.
 *
 * Diferencias con mobile (regla "mobile feature → omitir si no aplica
 * nativamente a web"):
 * - SIN `FlatList`/`RefreshControl`: la lista es DOM nativo, scroll natural,
 *   y TanStack Query refetch on focus se encarga del refresh — no hay
 *   "pull-to-refresh" en web.
 * - El componente trae su propio `useLeaderboard(groupId)` así la página
 *   no orquesta la query. Mobile recibe entries por props porque la screen
 *   las usa para `pointsByUser` map; en web esto no aplica.
 *
 * Resaltado del current user: usamos `useAuthStore.user.id` igual que
 * mobile (`<LeaderboardEntry isCurrentUser={item.userId === currentUserId} />`).
 */

import { useLeaderboard } from "@/hooks/use-leaderboard";
import { useAuthStore } from "@/stores/auth-store";
import { EmptyState, ErrorState } from "@/features/shared";

import { LeaderboardEntry } from "./leaderboard-entry";
import { Podium } from "./podium";

// ─── Props ──────────────────────────────────────────────────────────────────

export interface LeaderboardListProps {
  groupId: string;
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function LeaderboardList({ groupId }: LeaderboardListProps) {
  const currentUserId = useAuthStore((s) => s.user?.id);
  const query = useLeaderboard(groupId);

  if (query.isLoading) {
    return (
      <div
        data-testid="leaderboard-list-loading"
        className="rounded-2xl border border-border bg-surface px-4 py-4 text-sm text-text-secondary"
      >
        Cargando ranking…
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <ErrorState
        testId="leaderboard-list-error"
        title="No se pudo cargar el ranking"
        description="Probá de nuevo en unos segundos."
        onRetry={() => query.refetch()}
      />
    );
  }

  const { entries } = query.data;

  return (
    <section
      data-testid="leaderboard-list"
      className="flex flex-col gap-3"
    >
      <header className="flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wide text-text-secondary">
          Ranking
        </h2>
      </header>

      {entries.length === 0 ? (
        <EmptyState
          testId="leaderboard-list-empty"
          title="Sin ranking disponible"
          description="El ranking se actualizará cuando se registren pronósticos."
        />
      ) : (
        <div className="flex flex-col">
          {/* Top 3 podium */}
          {entries.length >= 1 ? (
            <Podium entries={entries.slice(0, 3)} />
          ) : null}

          {/* Full list (incluye top 3 también, mismo comportamiento que mobile) */}
          <div className="rounded-2xl border border-border bg-white">
            {entries.map((entry) => (
              <LeaderboardEntry
                key={entry.userId}
                entry={entry}
                isCurrentUser={entry.userId === currentUserId}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
