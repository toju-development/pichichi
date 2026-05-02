"use client";

/**
 * Dashboard page — Phase 5A.1.
 *
 * Port de `apps/mobile/app/(tabs)/index.tsx`. Tres secciones (stats, partidos,
 * grupos) alimentadas por `useDashboard()`. Cada sección tiene su propia
 * máquina de estados:
 *   - `data?.X === undefined`  → skeleton
 *   - `data.X === null`        → section error inline
 *   - else                      → render presentacional
 *
 * Estados full-screen (loading inicial / error sin data) usan los componentes
 * shared (`LoadingScreen` / `ErrorState`).
 *
 * NO renderizamos NotificationBell — slot reservado para Phase 5B/6.
 */
import { ErrorState } from "@/features/shared";
import {
  DashboardSectionError,
  DashboardSectionSkeleton,
  GroupRankingsSection,
  TodayMatchesSection,
  UserStatsSection,
} from "@/features/dashboard";
import { useDashboard } from "@/hooks/use-dashboard";

export default function DashboardPage() {
  const { data, isLoading, error, refetch } = useDashboard();

  // Full-screen loading (sólo en first-load; refetch silencioso por refetchOnWindowFocus).
  if (isLoading) {
    return (
      <section
        data-testid="page-dashboard"
        className="flex flex-col gap-6"
      >
        <DashboardHeader />
        <DashboardSectionSkeleton testId="dashboard-skeleton-stats" />
        <DashboardSectionSkeleton testId="dashboard-skeleton-matches" />
        <DashboardSectionSkeleton testId="dashboard-skeleton-groups" />
      </section>
    );
  }

  // Full-screen error: no data al menos. Si hay data parcial, las secciones
  // se autogestionan con `null`.
  if (error && !data) {
    return (
      <section
        data-testid="page-dashboard"
        className="flex flex-col gap-6"
      >
        <DashboardHeader />
        <ErrorState
          testId="dashboard-error"
          title="Error al cargar el dashboard"
          description="Ocurrió un problema al traer tu actividad. Reintentá en un toque."
          onRetry={() => {
            void refetch();
          }}
        />
      </section>
    );
  }

  return (
    <section data-testid="page-dashboard" className="flex flex-col gap-6">
      <DashboardHeader />

      {/* ── User Stats ─────────────────────────────────────────────── */}
      {data?.stats === undefined ? (
        <DashboardSectionSkeleton testId="dashboard-skeleton-stats" />
      ) : data.stats === null ? (
        <DashboardSectionError
          label="estadísticas"
          testId="dashboard-error-stats"
        />
      ) : (
        <UserStatsSection stats={data.stats} />
      )}

      {/* ── Today Matches ──────────────────────────────────────────── */}
      {data?.todayMatches === undefined ? (
        <DashboardSectionSkeleton testId="dashboard-skeleton-matches" />
      ) : data.todayMatches === null ? (
        <DashboardSectionError
          label="partidos de hoy"
          testId="dashboard-error-matches"
        />
      ) : (
        <TodayMatchesSection matches={data.todayMatches} />
      )}

      {/* ── Group Rankings ─────────────────────────────────────────── */}
      {data?.groups === undefined ? (
        <DashboardSectionSkeleton testId="dashboard-skeleton-groups" />
      ) : data.groups === null ? (
        <DashboardSectionError
          label="grupos"
          testId="dashboard-error-groups"
        />
      ) : (
        <GroupRankingsSection groups={data.groups} />
      )}
    </section>
  );
}

function DashboardHeader() {
  return (
    <header className="flex items-center justify-between">
      <h1 className="text-xl font-bold text-text-primary">Pichichi</h1>
      {/* TODO Phase 5B/6: <NotificationBell /> en este slot. */}
    </header>
  );
}
