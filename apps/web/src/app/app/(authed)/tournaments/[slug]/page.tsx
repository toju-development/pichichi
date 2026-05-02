"use client";

/**
 * Tournament detail page — `/app/tournaments/[slug]`.
 *
 * Phase 5A.3 scope (decisión persistida): SOLO header + secciones de teams
 * y players. Las tabs de partidos por fase (Próximos / Grupos / R16 / etc),
 * el leaderboard del torneo y las predictions quedan para Phase 5B —
 * dejamos stubs literales para preservar el contrato visual.
 *
 * 404 / 403 → invalida `tournaments.bySlug(slug)`, replace a
 * `/app/tournaments`. Mismo patrón que groups/[groupId] (auto-redirect via
 * `queueMicrotask` para no setear state síncrono dentro del effect).
 *
 * APIs Next 16: en client component leemos `params` con `use()` (params es
 * Promise). Ref: `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/page.md`.
 */
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { useTournament } from "@/hooks/use-tournaments";
import { queryKeys } from "@/hooks/query-keys";
import { ROUTES } from "@/lib/routes";
import { ErrorState, LoadingScreen } from "@/features/shared";
import {
  MisGruposSection,
  PlayersSection,
  TeamsSection,
  TournamentHeader,
} from "@/features/tournaments";
import { MatchesByPhaseTabs } from "@/features/matches";

interface AxiosLikeError {
  response?: { status?: number };
}

interface TournamentDetailPageProps {
  params: Promise<{ slug: string }>;
}

export default function TournamentDetailPage({
  params,
}: TournamentDetailPageProps) {
  const { slug } = use(params);
  const router = useRouter();
  const qc = useQueryClient();

  const [isTournamentRemoved, setIsTournamentRemoved] = useState(false);

  const tournamentQuery = useTournament(slug);

  // ── Auto-redirect on 404/403 (mirror groups/[groupId] pattern) ─────────
  const hasNavigatedFor404 = useRef(false);
  useEffect(() => {
    if (isTournamentRemoved || hasNavigatedFor404.current) return;
    if (!tournamentQuery.isError) return;

    const status = (tournamentQuery.error as AxiosLikeError | null)?.response
      ?.status;
    if (status === 404 || status === 403) {
      hasNavigatedFor404.current = true;
      // setState dentro de effect → diferimos al próximo microtask para
      // cumplir `react-hooks/set-state-in-effect`. Idéntica estrategia
      // que groups/[groupId].
      queueMicrotask(() => setIsTournamentRemoved(true));
      qc.invalidateQueries({ queryKey: queryKeys.tournaments.bySlug(slug) });
      router.replace(ROUTES.app.tournaments);
    }
  }, [
    tournamentQuery.isError,
    tournamentQuery.error,
    isTournamentRemoved,
    qc,
    router,
    slug,
  ]);

  // ── Loading ────────────────────────────────────────────────────────────
  if (tournamentQuery.isLoading || isTournamentRemoved) {
    return <LoadingScreen testId="page-tournament-detail-loading" />;
  }

  // ── Error (non-404/403) ────────────────────────────────────────────────
  if (tournamentQuery.isError || !tournamentQuery.data) {
    return (
      <section
        data-testid="page-tournament-detail"
        className="flex flex-col gap-4"
      >
        <ErrorState
          testId="page-tournament-detail-error"
          title="No se pudo cargar el torneo"
          description="Probá de nuevo en unos segundos."
          onRetry={() => tournamentQuery.refetch()}
        />
        <Link
          href={ROUTES.app.tournaments}
          className="self-start text-xs font-semibold text-primary hover:underline"
        >
          ← Volver a torneos
        </Link>
      </section>
    );
  }

  const tournament = tournamentQuery.data;

  // ── Loaded ─────────────────────────────────────────────────────────────
  return (
    <section
      data-testid="page-tournament-detail"
      className="flex flex-col gap-6"
    >
      <TournamentHeader tournament={tournament} />

      {/*
       * Mis Grupos — los grupos del usuario que están jugando este torneo.
       * Renderiza null si no hay grupos / no autenticado (paridad mobile).
       * Click → `/app/groups/{groupId}/tournament/{slug}`.
       */}
      <MisGruposSection
        tournamentId={tournament.id}
        tournamentSlug={tournament.slug}
      />

      <TeamsSection tournamentId={tournament.id} />

      <PlayersSection tournamentId={tournament.id} />

      {/*
       * Partidos por fase (Phase 5B.2). Mobile no muestra leaderboard a nivel
       * torneo — el leaderboard es de grupo. Por eso eliminamos el stub de
       * tournament-leaderboard para mantener paridad con mobile.
       *
       * Phase 5B.5: MisGruposSection cableada arriba.
       * Phase 5B.6 deferred: GroupPicker en dashboard, useGroupTournaments UI.
       */}
      {tournament.phases?.length ? (
        <MatchesByPhaseTabs
          tournamentId={tournament.id}
          phases={tournament.phases}
        />
      ) : null}
    </section>
  );
}
