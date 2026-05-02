"use client";

/**
 * PredictionMatchCard — match card enriquecida con contexto de pronóstico.
 *
 * Port literal de `apps/mobile/src/components/predictions/prediction-match-card.tsx`.
 *
 * Lock logic + visual dimming siguen el mismo contrato que mobile vía
 * `isMatchLocked`. Cuando el match está locked Y se pasa `groupId`, se
 * muestra un botón "ojito" que abre `GroupPredictionsSheet`.
 *
 * HTML válido: el outer es `<div role="button">` (no `<button>`) para poder
 * anidar el botón "ojito" sin romper la semántica HTML — buttons no pueden
 * contener buttons.
 */

import { useState } from "react";

import type { MatchDto, PredictionDto } from "@pichichi/shared";

import { cn } from "@/lib/cn";
import { formatMatchDateTime, isMatchLocked, PHASE_LABELS } from "@/utils/match-helpers";

import { GroupPredictionsSheet } from "./group-predictions-sheet";
import { PredictionStatusBadge } from "./prediction-status-badge";

// ─── Props ──────────────────────────────────────────────────────────────────

export interface PredictionMatchCardProps {
  match: MatchDto;
  prediction: PredictionDto | null | undefined;
  /** Called when the user taps the card to open prediction entry. */
  onPredict: (match: MatchDto) => void;
  /** Called when tapping a locked card (LIVE / past cutoff). Optional. */
  onMatchDetail?: (match: MatchDto) => void;
  /** Group ID — when provided and match is locked, shows the social reveal button. */
  groupId?: string;
  /** Group display name — forwarded to GroupPredictionsSheet header. */
  groupName?: string;
  /** Current logged-in user ID — forwarded to GroupPredictionsSheet to highlight their row. */
  currentUserId?: string;
  /** Show the phase line at the top. */
  showPhaseInfo?: boolean;
  className?: string;
}

// ─── Sub-component ──────────────────────────────────────────────────────────

function TeamRow({
  name,
  placeholder,
  align,
}: {
  name: string | null | undefined;
  placeholder: string | null | undefined;
  align: "left" | "right";
}) {
  const display = name ?? placeholder ?? "TBD";
  const isPlaceholder = !name;

  return (
    <span
      className={cn(
        "line-clamp-1 flex-1 text-sm font-semibold",
        align === "left" ? "text-left" : "text-right",
        isPlaceholder
          ? "italic text-text-tertiary"
          : "text-text-primary",
      )}
    >
      {display}
    </span>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function PredictionMatchCard({
  match,
  prediction,
  onPredict,
  onMatchDetail,
  groupId,
  groupName,
  currentUserId,
  showPhaseInfo = false,
  className,
}: PredictionMatchCardProps) {
  const locked = isMatchLocked(match);
  const hasPrediction = prediction != null;

  const dimmed = locked && !hasPrediction;
  const showRevealButton = locked && !!groupId;

  const [sheetVisible, setSheetVisible] = useState(false);

  function activate() {
    if (locked) {
      if (onMatchDetail) onMatchDetail(match);
      return;
    }
    onPredict(match);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      activate();
    }
  }

  function handleRevealClick(e: React.MouseEvent<HTMLButtonElement>) {
    e.stopPropagation();
    setSheetVisible(true);
  }

  function handleRevealKeyDown(e: React.KeyboardEvent<HTMLButtonElement>) {
    // Evita que Enter/Space del ojito propague al outer div.
    e.stopPropagation();
  }

  const phaseLabel = PHASE_LABELS[match.phase] ?? match.phase;
  const dateLabel = formatMatchDateTime(match.scheduledAt);

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={activate}
        onKeyDown={handleKeyDown}
        data-testid={`prediction-match-card-${match.id}`}
        className={cn(
          "flex w-full cursor-pointer flex-col gap-3 rounded-2xl border border-border bg-surface p-4 text-left shadow-sm transition focus:outline-none focus:ring-2 focus:ring-primary/40",
          dimmed && "opacity-60",
          !locked && "hover:border-primary",
          className,
        )}
      >
        {showPhaseInfo ? (
          <span className="text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">
            {phaseLabel}
          </span>
        ) : null}

        <div className="flex items-center gap-3">
          <TeamRow
            name={match.homeTeam?.name}
            placeholder={match.homeTeamPlaceholder}
            align="left"
          />
          <span className="text-xs font-bold text-text-secondary">
            {dateLabel}
          </span>
          <TeamRow
            name={match.awayTeam?.name}
            placeholder={match.awayTeamPlaceholder}
            align="right"
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[10px] font-medium text-text-tertiary">
            {match.groupName ?? ""}
          </span>
          <div className="flex items-center gap-2">
            <PredictionStatusBadge
              prediction={prediction}
              matchStatus={match.status}
              isLocked={locked}
            />
            {showRevealButton ? (
              <button
                type="button"
                onClick={handleRevealClick}
                onKeyDown={handleRevealKeyDown}
                aria-label="Ver pronósticos del grupo"
                data-testid={`prediction-match-card-reveal-${match.id}`}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-surface text-primary transition hover:bg-primary-surface-light focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <RevealEyeIcon />
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {/* Group predictions sheet — only mounted when groupId is available. */}
      {groupId ? (
        <GroupPredictionsSheet
          visible={sheetVisible}
          onClose={() => setSheetVisible(false)}
          groupId={groupId}
          matchId={match.id}
          match={match}
          groupName={groupName}
          currentUserId={currentUserId}
        />
      ) : null}
    </>
  );
}

// ─── Inline glyph ───────────────────────────────────────────────────────────

function RevealEyeIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      width={18}
      height={18}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx={12} cy={12} r={3} />
    </svg>
  );
}
