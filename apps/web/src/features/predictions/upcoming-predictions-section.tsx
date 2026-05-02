"use client";

/**
 * UpcomingPredictionsSection — sección de "Próximos a pronosticar" para el
 * detail de grupo (web).
 *
 * Port adaptado de `apps/mobile/src/components/groups/upcoming-predictions-section.tsx`.
 *
 * Diferencia vs mobile: el componente mobile recibe `matches` por prop y la
 * página parent fetchea. Web consume el hook `useUpcomingPredictions(groupId)`
 * directo (más cohesivo en Next.js client components — la página parent ya
 * tiene mucho código). El contrato visible es el mismo.
 *
 * Hidden cuando no hay matches que mostrar (returns null).
 *
 * Al tappear un card abre `ScorePredictionModal` con `prediction={null}` y un
 * `MatchDto` mínimo construido desde `DashboardTodayMatchDto` via `toMatchDto`.
 */

import { useState } from "react";

import type {
  DashboardTodayMatchDto,
  MatchDto,
  MatchTeamDto,
} from "@pichichi/shared";

import { useUpcomingPredictions } from "@/hooks/use-groups";
import { cn } from "@/lib/cn";

import { ScorePredictionModal } from "./score-prediction-modal";

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Build a minimal MatchDto from a DashboardTodayMatchDto for the prediction modal. */
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

// ─── TeamSide ───────────────────────────────────────────────────────────────

function TeamSide({
  team,
  placeholder,
  reverse,
}: {
  team: DashboardTodayMatchDto["homeTeam"];
  placeholder: string | null;
  reverse?: boolean;
}) {
  if (!team) {
    return (
      <div
        className={cn(
          "flex flex-1 items-center gap-1.5",
          reverse && "flex-row-reverse",
        )}
      >
        <span className="line-clamp-1 text-[11px] font-medium italic text-text-tertiary">
          {placeholder ?? "TBD"}
        </span>
      </div>
    );
  }

  const initials = team.name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join("");

  const avatar = team.logoUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={team.logoUrl}
      alt={team.name}
      width={24}
      height={24}
      className="h-6 w-6 rounded-full bg-surface-muted object-contain"
    />
  ) : (
    <div
      className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-muted text-[10px] font-bold text-text-secondary"
      aria-hidden
    >
      {initials}
    </div>
  );

  return (
    <div
      className={cn(
        "flex flex-1 items-center gap-1.5",
        reverse && "flex-row-reverse",
      )}
    >
      {avatar}
      <span className="line-clamp-1 text-[11px] font-semibold text-text-primary">
        {team.name}
      </span>
    </div>
  );
}

// ─── Props ──────────────────────────────────────────────────────────────────

interface UpcomingPredictionsSectionProps {
  groupId: string;
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function UpcomingPredictionsSection({
  groupId,
}: UpcomingPredictionsSectionProps) {
  const [predictionMatch, setPredictionMatch] =
    useState<DashboardTodayMatchDto | null>(null);

  const { data: matches } = useUpcomingPredictions(groupId);

  if (!matches || matches.length === 0) return null;

  return (
    <section
      data-testid="upcoming-predictions-section"
      className="flex flex-col gap-3"
    >
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Clock icon (inline SVG, sin lucide) */}
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-primary"
            aria-hidden
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <h2 className="text-lg font-bold text-text-primary">
            Pr{"\u00F3"}ximos a pronosticar
          </h2>
        </div>
        <span
          data-testid="upcoming-predictions-count"
          className="rounded-lg bg-primary-surface px-2.5 py-0.5 text-[11px] font-bold text-primary"
        >
          {matches.length}
        </span>
      </div>

      {/* Match cards */}
      <ul className="flex flex-col gap-2.5">
        {matches.map((match) => (
          <li
            key={match.matchId}
            className="rounded-2xl border border-border bg-surface shadow-sm"
          >
            <button
              type="button"
              onClick={() => setPredictionMatch(match)}
              data-testid={`upcoming-prediction-card-${match.matchId}`}
              className="flex w-full flex-col gap-2.5 p-4 text-left transition hover:opacity-80"
            >
              <div className="flex items-center justify-between">
                <TeamSide
                  team={match.homeTeam}
                  placeholder={match.homePlaceholder}
                />
                <div className="flex min-w-14 items-center justify-center px-2.5">
                  <span className="text-[15px] font-bold text-text-primary">
                    {formatTime(match.scheduledAt)}
                  </span>
                </div>
                <TeamSide
                  team={match.awayTeam}
                  placeholder={match.awayPlaceholder}
                  reverse
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="line-clamp-1 flex-1 pr-2 text-[10px] font-medium text-text-tertiary">
                  {match.tournamentName}
                </span>
                <span className="rounded-full bg-warning-surface px-3 py-1 text-xs font-bold tracking-wide text-warning">
                  Pronosticar
                </span>
              </div>
            </button>
          </li>
        ))}
      </ul>

      {/* Score prediction modal */}
      <ScorePredictionModal
        open={predictionMatch !== null}
        match={predictionMatch ? toMatchDto(predictionMatch) : null}
        prediction={null}
        groupId={groupId}
        onClose={() => setPredictionMatch(null)}
      />
    </section>
  );
}
