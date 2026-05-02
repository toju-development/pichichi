"use client";

/**
 * Per-group tournament page — `/app/groups/[groupId]/tournament/[slug]`.
 *
 * Port literal de `apps/mobile/app/(tabs)/groups/tournament/[slug].tsx`
 * (878 líneas mobile). Estructura:
 *   1. Header con nombre del torneo + subtitle `tipoTorneo · group.name`.
 *   2. Tab bar de 4 botones (icono): Pronósticos / Resultados / Bonus / Ranking.
 *   3. Pronósticos: LIVE arriba (sección "En vivo 🔴"), después
 *      SCHEDULED locked ("Bloqueado 🔒"), después predictable agrupados
 *      por fecha asc.
 *   4. Resultados: FINISHED agrupados por fecha desc.
 *   5. Bonus: `<BonusSection>` full-tab.
 *   6. Ranking: `<LeaderboardList groupId={...}>`.
 *
 * 404 / 403 handling: si group o tournament fallan con esos status,
 * invalidamos la query y replace al detalle de grupo o `/app/groups`
 * (mismo patrón que tournaments/[slug]).
 *
 * APIs Next 16: client component → `params` es Promise → `use(params)`.
 * Ref: `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/page.md`.
 *
 * React Compiler: NO usamos useMemo/useCallback. Los maps y filtros se
 * computan inline y el compiler memoiza automáticamente.
 *
 * Paridad mobile (4 tabs decidida explícitamente, NO 3 — el detalle "3 tabs"
 * en la primera versión de tasks.md era un error; mobile siempre tuvo 4).
 */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import type { MatchDto, PredictionDto } from "@pichichi/shared";

import { MatchDetailModal } from "@/features/matches/match-detail-modal";
import { LeaderboardList } from "@/features/leaderboard/leaderboard-list";
import {
  BonusSection,
  PredictionMatchCard,
  ScorePredictionModal,
} from "@/features/predictions";
import { EmptyState, ErrorState, LoadingScreen } from "@/features/shared";
import { useBonusPredictions } from "@/hooks/use-bonus-predictions";
import { useGroup } from "@/hooks/use-groups";
import { useMatches } from "@/hooks/use-matches";
import { usePredictions } from "@/hooks/use-predictions";
import { useTournament } from "@/hooks/use-tournaments";
import { queryKeys } from "@/hooks/query-keys";
import { cn } from "@/lib/cn";
import { ROUTES } from "@/lib/routes";
import { useAuthStore } from "@/stores/auth-store";
import {
  areBonusesLocked,
  getFinishedMatches,
  getLiveMatches,
  getLockedScheduledMatches,
  getPredictableMatches,
  groupMatchesByDate,
  groupMatchesByDateDesc,
  type MatchSection,
  TOURNAMENT_TYPE_LABELS,
} from "@/utils/match-helpers";

interface AxiosLikeError {
  response?: { status?: number };
}

interface GroupTournamentPageProps {
  params: Promise<{ groupId: string; slug: string }>;
}

// ─── Tabs ───────────────────────────────────────────────────────────────────

type Tab = "pronosticos" | "resultados" | "bonus" | "ranking";

interface TabDefinition {
  key: Tab;
  label: string;
  Icon: () => React.ReactElement;
}

// Inline SVGs — sin `lucide-react` dep (decisión registrada en Phase 5B.4).
// Iconos copiados de lucide.dev: CircleDot, CircleCheck, Star, BarChart3.
function CircleDotIcon() {
  return (
    <svg
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx={12} cy={12} r={10} />
      <circle cx={12} cy={12} r={1} />
    </svg>
  );
}

function CircleCheckIcon() {
  return (
    <svg
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx={12} cy={12} r={10} />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function BarChartIcon() {
  return (
    <svg
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 3v18h18" />
      <path d="M7 16V9" />
      <path d="M12 16v-5" />
      <path d="M17 16v-3" />
    </svg>
  );
}

const TABS: TabDefinition[] = [
  { key: "pronosticos", label: "Pronósticos", Icon: CircleDotIcon },
  { key: "resultados", label: "Resultados", Icon: CircleCheckIcon },
  { key: "bonus", label: "Bonus", Icon: StarIcon },
  { key: "ranking", label: "Ranking", Icon: BarChartIcon },
];

// ─── Page ───────────────────────────────────────────────────────────────────

export default function GroupTournamentPage({
  params,
}: GroupTournamentPageProps) {
  const { groupId, slug } = use(params);
  const router = useRouter();
  const qc = useQueryClient();

  const [isRemoved, setIsRemoved] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("pronosticos");
  const [selectedMatch, setSelectedMatch] = useState<MatchDto | null>(null);
  const [selectedExternalId, setSelectedExternalId] = useState<number | null>(
    null,
  );

  const groupQuery = useGroup(groupId, !isRemoved);
  const tournamentQuery = useTournament(slug);
  const currentUserId = useAuthStore((s) => s.user?.id);

  // ── Auto-redirect on 404/403 (mismo patrón que tournaments/[slug]) ────
  const hasNavigated = useRef(false);
  useEffect(() => {
    if (isRemoved || hasNavigated.current) return;

    const groupStatus = (groupQuery.error as AxiosLikeError | null)?.response
      ?.status;
    const tournamentStatus = (tournamentQuery.error as AxiosLikeError | null)
      ?.response?.status;

    if (groupStatus === 404 || groupStatus === 403) {
      hasNavigated.current = true;
      queueMicrotask(() => setIsRemoved(true));
      qc.invalidateQueries({ queryKey: queryKeys.groups.detail(groupId) });
      router.replace(ROUTES.app.groups);
      return;
    }

    if (tournamentStatus === 404 || tournamentStatus === 403) {
      hasNavigated.current = true;
      queueMicrotask(() => setIsRemoved(true));
      qc.invalidateQueries({ queryKey: queryKeys.tournaments.bySlug(slug) });
      router.replace(ROUTES.app.groupDetail(groupId));
    }
  }, [
    groupQuery.error,
    tournamentQuery.error,
    isRemoved,
    qc,
    router,
    groupId,
    slug,
  ]);

  const tournamentId = tournamentQuery.data?.id;

  // Las queries dependientes de tournamentId arrancan cuando ya tenemos torneo.
  const matchesQuery = useMatches(
    tournamentId ? { tournamentId } : undefined,
  );
  const predictionsQuery = usePredictions(groupId);
  const bonusQuery = useBonusPredictions(groupId, tournamentId ?? "");

  // ── Loading ────────────────────────────────────────────────────────────
  if (groupQuery.isLoading || tournamentQuery.isLoading || isRemoved) {
    return <LoadingScreen testId="page-group-tournament-loading" />;
  }

  // ── Error (non-404/403) ────────────────────────────────────────────────
  if (
    groupQuery.isError ||
    !groupQuery.data ||
    tournamentQuery.isError ||
    !tournamentQuery.data
  ) {
    return (
      <section
        data-testid="page-group-tournament"
        className="flex flex-col gap-4"
      >
        <ErrorState
          testId="page-group-tournament-error"
          title="No se pudo cargar el torneo del grupo"
          description="Probá de nuevo en unos segundos."
          onRetry={() => {
            void groupQuery.refetch();
            void tournamentQuery.refetch();
          }}
        />
        <Link
          href={ROUTES.app.groupDetail(groupId)}
          className="self-start text-xs font-semibold text-primary hover:underline"
        >
          ← Volver al grupo
        </Link>
      </section>
    );
  }

  const group = groupQuery.data;
  const tournament = tournamentQuery.data;

  const matches = matchesQuery.data ?? [];
  const predictions = predictionsQuery.data ?? [];

  // ── Derived data — inline (React Compiler memoiza automáticamente) ────

  const liveMatches = getLiveMatches(matches);
  const lockedScheduledMatches = getLockedScheduledMatches(matches);
  const predictableMatches = getPredictableMatches(matches);
  const finishedMatches = getFinishedMatches(matches);

  const predictableSections = groupMatchesByDate(predictableMatches);

  // Pronósticos: live arriba, locked después, después predictable por fecha asc.
  // Paridad literal con mobile (líneas 242-264).
  const pronosticosSections: MatchSection[] = [];
  if (liveMatches.length > 0) {
    pronosticosSections.push({
      title: "En vivo 🔴",
      dateKey: "__LIVE__",
      data: liveMatches,
    });
  }
  if (lockedScheduledMatches.length > 0) {
    pronosticosSections.push({
      title: "Bloqueado 🔒",
      dateKey: "__LOCKED__",
      data: lockedScheduledMatches,
    });
  }
  pronosticosSections.push(...predictableSections);

  const resultsSections = groupMatchesByDateDesc(finishedMatches);

  const predictionsByMatchId = new Map<string, PredictionDto>();
  for (const p of predictions) {
    predictionsByMatchId.set(p.matchId, p);
  }

  const bonusLocked = areBonusesLocked(matches);
  const bonusPredictions = bonusQuery.data ?? [];
  const bonusTypes = tournament.bonusTypes ?? [];

  const typeLabel =
    TOURNAMENT_TYPE_LABELS[tournament.type] ?? tournament.type;
  const headerSubtitle = [typeLabel, group.name].filter(Boolean).join(" · ");

  const isLoadingMatchData =
    matchesQuery.isLoading || predictionsQuery.isLoading;

  // Find the prediction for the selected match (modal pre-fill).
  const selectedMatchPrediction = selectedMatch
    ? predictionsByMatchId.get(selectedMatch.id) ?? null
    : null;

  function handlePredictMatch(match: MatchDto) {
    setSelectedMatch(match);
  }

  function handleMatchDetail(match: MatchDto) {
    setSelectedExternalId(match.externalId);
  }

  function handleCloseModal() {
    setSelectedMatch(null);
  }

  // ── Loaded ─────────────────────────────────────────────────────────────
  return (
    <section
      data-testid="page-group-tournament"
      className="flex flex-col gap-6"
    >
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="flex flex-col gap-1">
        <Link
          href={ROUTES.app.groupDetail(groupId)}
          className="text-xs font-semibold text-primary hover:underline"
        >
          ← {group.name}
        </Link>
        <h1
          className="line-clamp-1 text-xl font-semibold text-text-primary"
          data-testid="page-group-tournament-title"
        >
          {tournament.name}
        </h1>
        {headerSubtitle ? (
          <p className="text-sm text-text-secondary">{headerSubtitle}</p>
        ) : null}
      </header>

      {/* ── Tab bar (icon-only, mirror mobile) ──────────────────────────── */}
      <nav
        role="tablist"
        aria-label="Secciones del torneo"
        data-testid="group-tournament-tabs"
        className="flex gap-3 overflow-x-auto border-b border-border pb-3"
      >
        {TABS.map((tab) => {
          const Icon = tab.Icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-label={tab.label}
              data-testid={`group-tournament-tab-${tab.key}`}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full transition",
                isActive
                  ? "bg-primary text-text-on-primary"
                  : "text-text-tertiary hover:bg-surface",
              )}
            >
              <Icon />
            </button>
          );
        })}
      </nav>

      {/* ── Tab content ─────────────────────────────────────────────────── */}
      <div role="tabpanel" data-testid={`group-tournament-panel-${activeTab}`}>
        {activeTab === "pronosticos" ? (
          <PronosticosTab
            sections={pronosticosSections}
            predictionsByMatchId={predictionsByMatchId}
            isLoading={isLoadingMatchData}
            onPredictMatch={handlePredictMatch}
            onMatchDetail={handleMatchDetail}
            groupId={groupId}
            groupName={group.name}
            currentUserId={currentUserId}
          />
        ) : activeTab === "resultados" ? (
          <ResultadosTab
            sections={resultsSections}
            predictionsByMatchId={predictionsByMatchId}
            isLoading={isLoadingMatchData}
            onMatchDetail={handleMatchDetail}
            groupId={groupId}
            groupName={group.name}
            currentUserId={currentUserId}
          />
        ) : activeTab === "bonus" ? (
          <BonusTab
            bonusTypes={bonusTypes}
            bonusPredictions={bonusPredictions}
            bonusLocked={bonusLocked}
            groupId={groupId}
            tournamentId={tournament.id}
            isLoading={bonusQuery.isLoading}
          />
        ) : (
          <LeaderboardList groupId={groupId} />
        )}
      </div>

      {/* ── Score prediction modal ──────────────────────────────────────── */}
      <ScorePredictionModal
        open={selectedMatch != null}
        match={selectedMatch}
        prediction={selectedMatchPrediction}
        groupId={groupId}
        onClose={handleCloseModal}
      />

      {/* ── Match detail modal ──────────────────────────────────────────── */}
      <MatchDetailModal
        externalId={selectedExternalId}
        onClose={() => setSelectedExternalId(null)}
      />
    </section>
  );
}

// ─── Pronósticos Tab ────────────────────────────────────────────────────────

function PronosticosTab({
  sections,
  predictionsByMatchId,
  isLoading,
  onPredictMatch,
  onMatchDetail,
  groupId,
  groupName,
  currentUserId,
}: {
  sections: MatchSection[];
  predictionsByMatchId: Map<string, PredictionDto>;
  isLoading: boolean;
  onPredictMatch: (match: MatchDto) => void;
  onMatchDetail: (match: MatchDto) => void;
  groupId: string;
  groupName: string;
  currentUserId: string | undefined;
}) {
  if (isLoading) {
    return (
      <div
        data-testid="group-tournament-pronosticos-loading"
        className="rounded-2xl border border-border bg-surface px-4 py-4 text-sm text-text-secondary"
      >
        Cargando pronósticos…
      </div>
    );
  }

  if (sections.length === 0) {
    return (
      <EmptyState
        testId="group-tournament-pronosticos-empty"
        title="No hay partidos pendientes"
        description="No hay partidos pendientes de pronóstico."
      />
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {sections.map((section) => (
        <section
          key={section.dateKey}
          data-testid={`group-tournament-section-${section.dateKey}`}
          className="flex flex-col gap-3"
        >
          <h3 className="text-sm font-semibold text-text-primary">
            {section.title}
          </h3>
          <div className="flex flex-col gap-3">
            {section.data.map((match) => (
              <PredictionMatchCard
                key={match.id}
                match={match}
                prediction={predictionsByMatchId.get(match.id)}
                onPredict={onPredictMatch}
                onMatchDetail={onMatchDetail}
                groupId={groupId}
                groupName={groupName}
                currentUserId={currentUserId}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

// ─── Resultados Tab ─────────────────────────────────────────────────────────

function ResultadosTab({
  sections,
  predictionsByMatchId,
  isLoading,
  onMatchDetail,
  groupId,
  groupName,
  currentUserId,
}: {
  sections: MatchSection[];
  predictionsByMatchId: Map<string, PredictionDto>;
  isLoading: boolean;
  onMatchDetail: (match: MatchDto) => void;
  groupId: string;
  groupName: string;
  currentUserId: string | undefined;
}) {
  if (isLoading) {
    return (
      <div
        data-testid="group-tournament-resultados-loading"
        className="rounded-2xl border border-border bg-surface px-4 py-4 text-sm text-text-secondary"
      >
        Cargando resultados…
      </div>
    );
  }

  if (sections.length === 0) {
    return (
      <EmptyState
        testId="group-tournament-resultados-empty"
        title="Aún no hay resultados"
        description="Los resultados aparecerán acá cuando finalicen los partidos."
      />
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {sections.map((section) => (
        <section
          key={section.dateKey}
          data-testid={`group-tournament-section-${section.dateKey}`}
          className="flex flex-col gap-3"
        >
          <h3 className="text-sm font-semibold text-text-primary">
            {section.title}
          </h3>
          <div className="flex flex-col gap-3">
            {section.data.map((match) => (
              <PredictionMatchCard
                key={match.id}
                match={match}
                prediction={predictionsByMatchId.get(match.id)}
                // Resultados: card no es tappable para predecir (locked/finished).
                // Mobile pasa `() => {}` y MatchDetailModal se abre vía onMatchDetail.
                onPredict={() => {}}
                onMatchDetail={onMatchDetail}
                groupId={groupId}
                groupName={groupName}
                currentUserId={currentUserId}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

// ─── Bonus Tab ──────────────────────────────────────────────────────────────

function BonusTab({
  bonusTypes,
  bonusPredictions,
  bonusLocked,
  groupId,
  tournamentId,
  isLoading,
}: {
  bonusTypes: import("@pichichi/shared").TournamentBonusTypeDto[];
  bonusPredictions: import("@pichichi/shared").BonusPredictionDto[];
  bonusLocked: boolean;
  groupId: string;
  tournamentId: string;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div
        data-testid="group-tournament-bonus-loading"
        className="rounded-2xl border border-border bg-surface px-4 py-4 text-sm text-text-secondary"
      >
        Cargando bonus…
      </div>
    );
  }

  if (bonusTypes.length === 0) {
    return (
      <EmptyState
        testId="group-tournament-bonus-empty"
        title="Sin bonus disponibles"
        description="Este torneo no tiene pronósticos bonus."
      />
    );
  }

  return (
    <BonusSection
      bonusTypes={bonusTypes}
      bonusPredictions={bonusPredictions}
      isLocked={bonusLocked}
      groupId={groupId}
      tournamentId={tournamentId}
    />
  );
}
