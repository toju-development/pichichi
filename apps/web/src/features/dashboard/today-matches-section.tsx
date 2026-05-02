"use client";

/**
 * TodayMatchesSection web — port presentacional + click routing de mobile.
 *
 * Replica:
 *   - Deduplicación por `matchId` (un match puede aparecer en N grupos)
 *   - Multi-group "+N" badge
 *   - Indicador de predicción (Pronosticar / submitted con check / partial)
 *   - Empty state ("Sin partidos hoy")
 *   - Cuenta de matches en el header
 *   - **Phase 5B.6**: click routing 1:1 con mobile:
 *       - LIVE o FINISHED → `MatchDetailModal` (widget API-Football)
 *       - SCHEDULED + multi-group → `GroupPickerModal` → `ScorePredictionModal`
 *       - SCHEDULED + single group → `ScorePredictionModal` directo
 *
 * Port literal de `apps/mobile/src/components/home/TodayMatchesSection.tsx`
 * (líneas 370-510 wire). El converter `toMatchDto` espeja al de mobile y al
 * de `upcoming-predictions-section.tsx` web — futuro candidato a helper
 * compartido si aparece un tercer consumer.
 */

import { useState } from "react";

import type {
  DashboardTodayMatchDto,
  MatchDto,
  MatchTeamDto,
  PredictionDto,
} from "@pichichi/shared";

import { cn } from "@/lib/cn";

import { MatchDetailModal } from "@/features/matches/match-detail-modal";
import { ScorePredictionModal } from "@/features/predictions/score-prediction-modal";

import {
  GroupPickerModal,
  type GroupPickerEntry,
} from "./group-picker-modal";

// ─── Types ──────────────────────────────────────────────────────────────────

/** Re-export del tipo compartido con `GroupPickerModal` (mismo shape). */
type GroupEntry = GroupPickerEntry;

interface DeduplicatedMatch {
  match: DashboardTodayMatchDto;
  groups: GroupEntry[];
}

interface TodayMatchesSectionProps {
  matches: DashboardTodayMatchDto[];
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Build a minimal MatchDto from a DashboardTodayMatchDto for the prediction
 * modal. Espeja el converter de `upcoming-predictions-section.tsx` y de
 * mobile `TodayMatchesSection.tsx:50-74`.
 */
function toMatchDto(m: DashboardTodayMatchDto): MatchDto {
  const homeTeam: MatchTeamDto | null = m.homeTeam
    ? { ...m.homeTeam, shortName: m.homeTeam.name }
    : null;
  const awayTeam: MatchTeamDto | null = m.awayTeam
    ? { ...m.awayTeam, shortName: m.awayTeam.name }
    : null;

  return {
    id: m.matchId,
    tournamentId: "",
    homeTeam,
    awayTeam,
    phase: m.phase as MatchDto["phase"],
    groupName: null,
    matchNumber: null,
    scheduledAt: m.scheduledAt,
    venue: null,
    city: null,
    status: m.status as MatchDto["status"],
    homeScore: m.homeScore,
    awayScore: m.awayScore,
    homeScorePenalties: null,
    awayScorePenalties: null,
    isExtraTime: false,
    homeTeamPlaceholder: m.homePlaceholder,
    awayTeamPlaceholder: m.awayPlaceholder,
    externalId: m.externalId,
    createdAt: "",
    updatedAt: "",
  };
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function deduplicateMatches(
  matches: DashboardTodayMatchDto[],
): DeduplicatedMatch[] {
  const map = new Map<string, DeduplicatedMatch>();

  for (const m of matches) {
    const groupEntry: GroupEntry = {
      groupId: m.groupId,
      groupName: m.groupName,
      tournamentSlug: m.tournamentSlug,
      hasPrediction: m.hasPrediction,
      predictedHome: m.predictedHome,
      predictedAway: m.predictedAway,
    };

    const existing = map.get(m.matchId);
    if (existing) {
      existing.groups.push(groupEntry);
    } else {
      map.set(m.matchId, { match: m, groups: [groupEntry] });
    }
  }

  return Array.from(map.values());
}

// ─── Sub-components ─────────────────────────────────────────────────────────

interface TeamSideProps {
  team: DashboardTodayMatchDto["homeTeam"];
  placeholder: string | null;
  reverse?: boolean;
}

function TeamSide({ team, placeholder, reverse }: TeamSideProps) {
  if (!team) {
    return (
      <div
        className={cn(
          "flex flex-1 items-center gap-1.5",
          reverse && "flex-row-reverse",
        )}
      >
        <span className="truncate text-[11px] font-medium italic text-text-muted">
          {placeholder ?? "TBD"}
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-1 items-center gap-1.5",
        reverse && "flex-row-reverse",
      )}
    >
      <TeamLogo team={team} />
      <span className="truncate text-[11px] font-semibold text-text-primary">
        {team.name}
      </span>
    </div>
  );
}

function TeamLogo({
  team,
}: {
  team: NonNullable<DashboardTodayMatchDto["homeTeam"]>;
}) {
  if (team.logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={team.logoUrl}
        alt={team.name}
        width={24}
        height={24}
        className="h-6 w-6 rounded-full bg-background object-contain"
      />
    );
  }
  return (
    <span
      aria-hidden
      className="flex h-6 w-6 items-center justify-center rounded-full bg-background text-[10px] font-semibold text-text-muted"
    >
      {team.name.charAt(0).toUpperCase()}
    </span>
  );
}

function CenterBlock({ match }: { match: DashboardTodayMatchDto }) {
  const isLive = match.isLocked && match.status !== "FINISHED";
  const isFinished = match.status === "FINISHED";
  const hasScore = match.homeScore != null && match.awayScore != null;

  if ((isLive || isFinished) && hasScore) {
    return (
      <div className="flex min-w-14 items-center justify-center gap-1 px-2.5">
        {isLive && !isFinished ? (
          <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-success" />
        ) : null}
        <span className="text-xl font-black text-text-primary">
          {match.homeScore} - {match.awayScore}
        </span>
      </div>
    );
  }

  return (
    <div className="flex min-w-14 items-center justify-center px-2.5">
      <span className="text-[15px] font-bold text-text-primary">
        {formatTime(match.scheduledAt)}
      </span>
    </div>
  );
}

interface PredictionIndicatorProps {
  match: DashboardTodayMatchDto;
  groups: GroupEntry[];
}

function PredictionIndicator({ match, groups }: PredictionIndicatorProps) {
  const isMultiGroup = groups.length > 1;
  const predictedCount = groups.filter((g) => g.hasPrediction).length;

  if (match.isLocked) {
    const firstPredicted = groups.find((g) => g.hasPrediction);
    if (firstPredicted) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-[#E8F5EE] px-2.5 py-1 text-xs font-semibold text-primary">
          <CheckGlyph />
          {firstPredicted.predictedHome} - {firstPredicted.predictedAway}
        </span>
      );
    }
    return null;
  }

  if (isMultiGroup) {
    if (predictedCount === groups.length) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-[#E8F5EE] px-2.5 py-1 text-xs font-semibold text-primary">
          <CheckGlyph />
          {predictedCount}/{groups.length}
        </span>
      );
    }
    if (predictedCount > 0) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-[#FFF3E0] px-2.5 py-1 text-xs font-bold text-[#E65100]">
          {predictedCount}/{groups.length}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center rounded-full bg-[#FFF3E0] px-3 py-1 text-xs font-bold tracking-wide text-[#E65100]">
        Pronosticar
      </span>
    );
  }

  // Single group
  const single = groups[0];
  if (single?.hasPrediction) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[#E8F5EE] px-2.5 py-1 text-xs font-semibold text-primary">
        <CheckGlyph />
        {single.predictedHome} - {single.predictedAway}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-full bg-[#FFF3E0] px-3 py-1 text-xs font-bold tracking-wide text-[#E65100]">
      Pronosticar
    </span>
  );
}

function CheckGlyph() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      width={12}
      height={12}
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 8.5L6.5 12L13 5" />
    </svg>
  );
}

// ─── Match card ─────────────────────────────────────────────────────────────

interface MatchCardProps {
  match: DashboardTodayMatchDto;
  groups: GroupEntry[];
  onOpenModal: (externalId: number | null) => void;
  onOpenPrediction: (match: DashboardTodayMatchDto, group: GroupEntry) => void;
  onOpenGroupPicker: (
    match: DashboardTodayMatchDto,
    groups: GroupEntry[],
  ) => void;
}

function MatchCard({
  match,
  groups,
  onOpenModal,
  onOpenPrediction,
  onOpenGroupPicker,
}: MatchCardProps) {
  const isLive = match.isLocked && match.status !== "FINISHED";
  const isFinished = match.status === "FINISHED";
  const firstGroup = groups[0]!;
  const isMultiGroup = groups.length > 1;

  // Click routing literal de mobile lines 384-393.
  const handleClick = () => {
    if (isLive || isFinished) {
      onOpenModal(match.externalId);
    } else if (isMultiGroup) {
      onOpenGroupPicker(match, groups);
    } else {
      onOpenPrediction(match, firstGroup);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      data-testid={`dashboard-match-card-${match.matchId}`}
      className={cn(
        "block w-full rounded-2xl border border-border bg-white p-4 text-left shadow-sm transition hover:opacity-90",
        isLive && "border-success",
      )}
    >
      {isLive ? (
        <div className="mb-2 flex items-center gap-1.5">
          <span aria-hidden className="h-2 w-2 rounded-full bg-success" />
          <span className="text-[11px] font-extrabold tracking-wide text-success">
            EN VIVO
          </span>
        </div>
      ) : null}

      <div className="flex items-center justify-between">
        <TeamSide team={match.homeTeam} placeholder={match.homePlaceholder} />
        <CenterBlock match={match} />
        <TeamSide
          team={match.awayTeam}
          placeholder={match.awayPlaceholder}
          reverse
        />
      </div>

      <div className="mt-2.5 flex items-center justify-between">
        <div className="mr-2 flex flex-1 flex-col">
          {match.tournamentName ? (
            <span className="mt-0.5 truncate text-[10px] font-medium text-[#9CA3AF]">
              {match.tournamentName}
            </span>
          ) : null}
          <div className="mt-0.5 flex items-center gap-1.5">
            <span className="truncate text-[11px] font-bold text-primary">
              {firstGroup.groupName}
            </span>
            {isMultiGroup ? (
              <span className="rounded-md bg-primary-surface px-1.5 py-0.5 text-[10px] font-bold text-primary">
                +{groups.length - 1}
              </span>
            ) : null}
          </div>
        </div>
        <PredictionIndicator match={match} groups={groups} />
      </div>
    </button>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────

export function TodayMatchesSection({ matches }: TodayMatchesSectionProps) {
  const [selectedExternalId, setSelectedExternalId] = useState<number | null>(
    null,
  );
  const [pickerState, setPickerState] = useState<{
    match: DashboardTodayMatchDto;
    groups: GroupEntry[];
  } | null>(null);
  const [predictionState, setPredictionState] = useState<{
    match: DashboardTodayMatchDto;
    group: GroupEntry;
  } | null>(null);

  const deduplicated = deduplicateMatches(matches);

  // Handlers — port literal mobile lines 444-456.
  const handleOpenPrediction = (
    match: DashboardTodayMatchDto,
    group: GroupEntry,
  ) => {
    setPredictionState({ match, group });
  };

  const handleOpenGroupPicker = (
    match: DashboardTodayMatchDto,
    groups: GroupEntry[],
  ) => {
    setPickerState({ match, groups });
  };

  const handleGroupSelected = (group: GroupEntry) => {
    if (pickerState) {
      handleOpenPrediction(pickerState.match, group);
    }
  };

  // Build PredictionDto-like prefill from selected group, mismo shape que mobile.
  const predictionForModal: PredictionDto | null =
    predictionState?.group.hasPrediction
      ? {
          id: "",
          matchId: predictionState.match.matchId,
          groupId: predictionState.group.groupId,
          userId: "",
          predictedHome: predictionState.group.predictedHome ?? 0,
          predictedAway: predictionState.group.predictedAway ?? 0,
          pointsEarned: 0,
          pointType: null,
          createdAt: "",
          updatedAt: "",
        }
      : null;

  // ── Empty state ────────────────────────────────────────────────────────
  if (deduplicated.length === 0) {
    return (
      <section
        data-testid="dashboard-today-matches"
        className="flex flex-col gap-3"
      >
        <h2 className="text-lg font-bold text-text-primary">
          Partidos del Día
        </h2>
        <div className="flex flex-col items-center gap-1.5 rounded-2xl border border-dashed border-border bg-surface px-6 py-8 text-center">
          <span aria-hidden className="text-2xl">
            📅
          </span>
          <p className="text-[15px] font-semibold text-text-primary">
            Sin partidos hoy
          </p>
          <p className="text-[13px] leading-snug text-text-muted">
            Cuando haya partidos programados,
            <br />
            van a aparecer acá
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      data-testid="dashboard-today-matches"
      className="flex flex-col gap-2.5"
    >
      <header className="mb-1 flex items-center justify-between">
        <h2 className="text-lg font-bold text-text-primary">
          Partidos del Día
        </h2>
        <span className="inline-flex min-w-[28px] items-center justify-center rounded-xl bg-primary-surface px-2.5 py-0.5 text-[13px] font-bold text-primary">
          {deduplicated.length}
        </span>
      </header>

      {deduplicated.map(({ match, groups }) => (
        <MatchCard
          key={match.matchId}
          match={match}
          groups={groups}
          onOpenModal={setSelectedExternalId}
          onOpenPrediction={handleOpenPrediction}
          onOpenGroupPicker={handleOpenGroupPicker}
        />
      ))}

      {/* Group picker bottom sheet (multi-group SCHEDULED) */}
      <GroupPickerModal
        visible={pickerState !== null}
        groups={pickerState?.groups ?? []}
        onSelect={handleGroupSelected}
        onClose={() => setPickerState(null)}
      />

      {/* Score prediction modal (single-group SCHEDULED, o post group-picker) */}
      <ScorePredictionModal
        open={predictionState !== null}
        match={predictionState ? toMatchDto(predictionState.match) : null}
        prediction={predictionForModal}
        groupId={predictionState?.group.groupId ?? ""}
        onClose={() => setPredictionState(null)}
      />

      {/* Match detail modal (LIVE / FINISHED) */}
      <MatchDetailModal
        externalId={selectedExternalId}
        onClose={() => setSelectedExternalId(null)}
      />
    </section>
  );
}
