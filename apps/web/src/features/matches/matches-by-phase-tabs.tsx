"use client";

/**
 * MatchesByPhaseTabs — port literal de la sección de tabs+content de
 * `apps/mobile/app/(tabs)/tournaments/[slug].tsx`.
 *
 * Construye tabs desde `tournament.phases`:
 *   - "Próximos" (virtual, primero) → SCHEDULED + LIVE de todo el torneo.
 *   - "Grupos" (GROUP_STAGE) → con sub-filtro A-L (chips).
 *   - Knockout single tabs → R32, 8vos, 4tos, Semis.
 *   - "3°/Final" combinado → THIRD_PLACE + FINAL fetcheados aparte y mergeados.
 *
 * Cada tab content fetchea su propia data con `useMatches` (port mobile).
 * Renderiza secciones agrupadas por fecha (`groupMatchesByDate`) con headers.
 *
 * Click en match con status !== 'SCHEDULED' abre `<MatchDetailModal>`
 * (idem mobile). SCHEDULED no abre modal — en este screen los matches no
 * son tappeables para predict (predict está en /predictions, no acá).
 *
 * Diferencias con mobile:
 * - Sin `RefreshControl`/`SectionList` — TanStack Query refetch on focus
 *   y lista DOM nativa.
 * - Sin `useMemo` (React Compiler).
 */

import { useState } from "react";

import type {
  MatchDto,
  MatchPhase,
  TournamentPhaseDto,
} from "@pichichi/shared";

import { cn } from "@/lib/cn";
import { useMatches } from "@/hooks/use-matches";
import {
  groupMatchesByDate,
  PHASE_LABELS,
  type MatchSection,
} from "@/utils/match-helpers";
import { EmptyState, ErrorState } from "@/features/shared";

import { MatchCard } from "./match-card";
import { MatchDetailModal } from "./match-detail-modal";

// ─── Constants ──────────────────────────────────────────────────────────────

const TAB_PHASE_LABELS: Record<string, string> = {
  GROUP_STAGE: "Grupos",
  ROUND_OF_32: "R32",
  ROUND_OF_16: "8vos",
  QUARTER_FINAL: "4tos",
  SEMI_FINAL: "Semis",
};

const ALL_GROUPS = "Todos" as const;

const COMBINED_PHASES: MatchPhase[] = ["THIRD_PLACE", "FINAL"];
const COMBINED_TAB_LABEL = "3°/Final";
const COMBINED_TAB_KEY = "COMBINED_FINALS";

const PROXIMOS_TAB_KEY = "__PROXIMOS__";

// ─── Types ──────────────────────────────────────────────────────────────────

interface TabDefinition {
  key: string;
  label: string;
  phases: MatchPhase[];
}

// ─── Tab builder ────────────────────────────────────────────────────────────

function buildTabs(phases: TournamentPhaseDto[]): TabDefinition[] {
  const sorted = [...phases].sort((a, b) => a.sortOrder - b.sortOrder);

  const tabs: TabDefinition[] = [
    { key: PROXIMOS_TAB_KEY, label: "Próximos", phases: [] },
  ];

  let combinedAdded = false;

  for (const p of sorted) {
    if (COMBINED_PHASES.includes(p.phase as MatchPhase)) {
      if (!combinedAdded) {
        combinedAdded = true;
        tabs.push({
          key: COMBINED_TAB_KEY,
          label: COMBINED_TAB_LABEL,
          phases: [...COMBINED_PHASES],
        });
      }
      continue;
    }

    tabs.push({
      key: p.phase,
      label: TAB_PHASE_LABELS[p.phase] ?? PHASE_LABELS[p.phase] ?? p.phase,
      phases: [p.phase as MatchPhase],
    });
  }

  return tabs;
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function TabButton({
  label,
  isActive,
  onClick,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={`phase-tab-${label}`}
      aria-pressed={isActive}
      className={cn(
        "shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition",
        isActive
          ? "bg-primary text-text-on-primary"
          : "bg-surface text-text-secondary hover:text-text-primary",
      )}
    >
      {label}
    </button>
  );
}

function FilterChip({
  label,
  isActive,
  onClick,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={`group-chip-${label}`}
      aria-pressed={isActive}
      className={cn(
        "shrink-0 rounded-full border px-3 py-1 text-xs font-semibold transition",
        isActive
          ? "border-primary bg-primary-surface text-primary"
          : "border-border bg-surface text-text-secondary hover:text-text-primary",
      )}
    >
      {label}
    </button>
  );
}

function SectionedMatchList({
  sections,
  onMatchPress,
  showPhaseInfo,
}: {
  sections: MatchSection[];
  onMatchPress: (externalId: number | null) => void;
  showPhaseInfo: boolean;
}) {
  return (
    <div className="flex flex-col gap-4">
      {sections.map((section) => (
        <div key={section.dateKey} className="flex flex-col gap-2">
          <h3 className="px-1 text-xs font-bold uppercase tracking-wide text-text-secondary">
            {section.title}
          </h3>
          <div className="flex flex-col gap-2">
            {section.data.map((m) => (
              <MatchCard
                key={m.id}
                match={m}
                showPhaseInfo={showPhaseInfo}
                showPrediction={false}
                onClick={
                  m.status !== "SCHEDULED"
                    ? () => onMatchPress(m.externalId)
                    : undefined
                }
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ContentLoading() {
  return (
    <div
      data-testid="matches-by-phase-loading"
      className="rounded-2xl border border-border bg-surface px-4 py-6 text-center text-sm text-text-secondary"
    >
      Cargando partidos…
    </div>
  );
}

// ─── Tab content components ─────────────────────────────────────────────────

function ProximosContent({
  tournamentId,
  onMatchPress,
}: {
  tournamentId: string;
  onMatchPress: (externalId: number | null) => void;
}) {
  const query = useMatches({ tournamentId, status: "LIVE,SCHEDULED" });
  const sections = groupMatchesByDate(query.data ?? []);

  if (query.isLoading) return <ContentLoading />;
  if (query.isError) {
    return (
      <ErrorState
        testId="matches-by-phase-error"
        title="No se pudieron cargar los partidos"
        description="Probá de nuevo en unos segundos."
        onRetry={() => query.refetch()}
      />
    );
  }
  if (sections.length === 0) {
    return (
      <EmptyState
        testId="matches-by-phase-empty"
        title="No hay partidos próximos"
        description="Los próximos partidos aparecerán acá cuando estén programados."
      />
    );
  }
  return (
    <SectionedMatchList
      sections={sections}
      onMatchPress={onMatchPress}
      showPhaseInfo
    />
  );
}

function GruposContent({
  tournamentId,
  onMatchPress,
}: {
  tournamentId: string;
  onMatchPress: (externalId: number | null) => void;
}) {
  const [selectedGroupName, setSelectedGroupName] =
    useState<string>(ALL_GROUPS);

  const query = useMatches({
    tournamentId,
    phase: "GROUP_STAGE",
  });

  const allGroupMatches = query.data ?? [];
  const groupNames = [
    ...new Set(allGroupMatches.map((m) => m.groupName).filter(Boolean)),
  ].sort() as string[];

  const filteredMatches: MatchDto[] =
    selectedGroupName === ALL_GROUPS
      ? allGroupMatches
      : allGroupMatches.filter((m) => m.groupName === selectedGroupName);

  const sections = groupMatchesByDate(filteredMatches);

  function chipLabel(name: string): string {
    const parts = name.split(" ");
    return parts.length > 1 ? parts[parts.length - 1] : name;
  }

  return (
    <div className="flex flex-col gap-4">
      <div
        data-testid="group-sub-filter"
        className="flex flex-row gap-2 overflow-x-auto pb-1"
      >
        <FilterChip
          key={ALL_GROUPS}
          label={ALL_GROUPS}
          isActive={selectedGroupName === ALL_GROUPS}
          onClick={() => setSelectedGroupName(ALL_GROUPS)}
        />
        {groupNames.map((name) => (
          <FilterChip
            key={name}
            label={chipLabel(name)}
            isActive={selectedGroupName === name}
            onClick={() => setSelectedGroupName(name)}
          />
        ))}
      </div>

      {query.isLoading ? (
        <ContentLoading />
      ) : query.isError ? (
        <ErrorState
          testId="matches-by-phase-error"
          title="No se pudieron cargar los partidos"
          description="Probá de nuevo en unos segundos."
          onRetry={() => query.refetch()}
        />
      ) : sections.length === 0 ? (
        <EmptyState
          testId="matches-by-phase-empty"
          title="No hay partidos"
          description={
            selectedGroupName === ALL_GROUPS
              ? "No hay partidos en la fase de grupos."
              : `No hay partidos en ${selectedGroupName}.`
          }
        />
      ) : (
        <SectionedMatchList
          sections={sections}
          onMatchPress={onMatchPress}
          showPhaseInfo
        />
      )}
    </div>
  );
}

function KnockoutContent({
  tournamentId,
  phase,
  onMatchPress,
}: {
  tournamentId: string;
  phase: MatchPhase;
  onMatchPress: (externalId: number | null) => void;
}) {
  const query = useMatches({ tournamentId, phase });
  const sections = groupMatchesByDate(query.data ?? []);
  const phaseLabel = PHASE_LABELS[phase] ?? phase;

  if (query.isLoading) return <ContentLoading />;
  if (query.isError) {
    return (
      <ErrorState
        testId="matches-by-phase-error"
        title="No se pudieron cargar los partidos"
        description="Probá de nuevo en unos segundos."
        onRetry={() => query.refetch()}
      />
    );
  }
  if (sections.length === 0) {
    return (
      <EmptyState
        testId="matches-by-phase-empty"
        title={`No hay partidos de ${phaseLabel}`}
        description="Los partidos aparecerán cuando se definan los cruces."
      />
    );
  }
  return (
    <SectionedMatchList
      sections={sections}
      onMatchPress={onMatchPress}
      showPhaseInfo={false}
    />
  );
}

function CombinedFinalsContent({
  tournamentId,
  onMatchPress,
}: {
  tournamentId: string;
  onMatchPress: (externalId: number | null) => void;
}) {
  const thirdQuery = useMatches({ tournamentId, phase: "THIRD_PLACE" });
  const finalQuery = useMatches({ tournamentId, phase: "FINAL" });

  const isLoading = thirdQuery.isLoading || finalQuery.isLoading;
  const isError = thirdQuery.isError || finalQuery.isError;

  const all: MatchDto[] = [
    ...(thirdQuery.data ?? []),
    ...(finalQuery.data ?? []),
  ];
  const sections = groupMatchesByDate(all);

  if (isLoading) return <ContentLoading />;
  if (isError) {
    return (
      <ErrorState
        testId="matches-by-phase-error"
        title="No se pudieron cargar los partidos"
        description="Probá de nuevo en unos segundos."
        onRetry={() => {
          thirdQuery.refetch();
          finalQuery.refetch();
        }}
      />
    );
  }
  if (sections.length === 0) {
    return (
      <EmptyState
        testId="matches-by-phase-empty"
        title="No hay partidos de 3° Puesto / Final"
        description="Los partidos aparecerán cuando se definan los cruces."
      />
    );
  }
  return (
    <SectionedMatchList
      sections={sections}
      onMatchPress={onMatchPress}
      showPhaseInfo
    />
  );
}

// ─── Tab content router ─────────────────────────────────────────────────────

function TabContent({
  tab,
  tournamentId,
  onMatchPress,
}: {
  tab: TabDefinition;
  tournamentId: string;
  onMatchPress: (externalId: number | null) => void;
}) {
  if (tab.key === PROXIMOS_TAB_KEY) {
    return (
      <ProximosContent
        tournamentId={tournamentId}
        onMatchPress={onMatchPress}
      />
    );
  }

  if (tab.phases.length === 1 && tab.phases[0] === "GROUP_STAGE") {
    return (
      <GruposContent
        tournamentId={tournamentId}
        onMatchPress={onMatchPress}
      />
    );
  }

  if (tab.key === COMBINED_TAB_KEY) {
    return (
      <CombinedFinalsContent
        tournamentId={tournamentId}
        onMatchPress={onMatchPress}
      />
    );
  }

  if (tab.phases.length === 1) {
    return (
      <KnockoutContent
        tournamentId={tournamentId}
        phase={tab.phases[0]}
        onMatchPress={onMatchPress}
      />
    );
  }

  return null;
}

// ─── Main Component ─────────────────────────────────────────────────────────

export interface MatchesByPhaseTabsProps {
  tournamentId: string;
  phases: TournamentPhaseDto[];
}

export function MatchesByPhaseTabs({
  tournamentId,
  phases,
}: MatchesByPhaseTabsProps) {
  const tabs = buildTabs(phases);
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedExternalId, setSelectedExternalId] = useState<number | null>(
    null,
  );

  const activeTab = tabs[selectedTab] ?? tabs[0];

  if (tabs.length === 0) return null;

  return (
    <section
      data-testid="matches-by-phase-tabs"
      className="flex flex-col gap-4"
    >
      <div className="flex flex-row gap-2 overflow-x-auto pb-1">
        {tabs.map((tab, index) => (
          <TabButton
            key={tab.key}
            label={tab.label}
            isActive={selectedTab === index}
            onClick={() => setSelectedTab(index)}
          />
        ))}
      </div>

      {activeTab ? (
        <TabContent
          tab={activeTab}
          tournamentId={tournamentId}
          onMatchPress={setSelectedExternalId}
        />
      ) : null}

      <MatchDetailModal
        externalId={selectedExternalId}
        onClose={() => setSelectedExternalId(null)}
      />
    </section>
  );
}
