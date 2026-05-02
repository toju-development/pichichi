"use client";

/**
 * Badge displaying the current state/result of a user's prediction on a match.
 *
 * Port literal de `apps/mobile/src/components/predictions/prediction-status-badge.tsx`.
 * Renders one of seven visual states:
 *   1. **No prediction, open**            → "+ Pronosticar" hint
 *   2. **Predicted, match not started**   → predicted score (accent)
 *   3. **Locked with prediction**         → predicted score (muted)
 *   4. **Live with prediction**           → predicted score (muted)
 *   5. **Scored, match finished**         → score + point-type label + points
 *   6. **Locked, no prediction**          → 🔒 Bloqueado
 *   7. **Finished, no prediction**        → "Sin pronóstico" muted
 *   8. **Live, no prediction**            → live dot + "En vivo"
 *
 * Pure presentational — receives derived props, owns zero business logic.
 * Tailwind 4 tokens map to mobile COLORS (primary, success, warning, danger).
 */

import type {
  MatchStatus,
  PredictionDto,
  PredictionPointType,
} from "@pichichi/shared";

import { cn } from "@/lib/cn";

// ─── Point-type display config ──────────────────────────────────────────────

interface PointTypeConfig {
  label: string;
  /** Tailwind classes for icon + label + points text. */
  textClass: string;
  icon: string;
}

const POINT_TYPE_CONFIG: Record<PredictionPointType, PointTypeConfig> = {
  EXACT: { label: "Exacto", textClass: "text-success", icon: "\u2713" },
  GOAL_DIFF: {
    label: "Gol Dif",
    textClass: "text-primary",
    icon: "\u2248",
  },
  WINNER: { label: "Ganador", textClass: "text-warning", icon: "\u2713" },
  MISS: { label: "Errado", textClass: "text-danger", icon: "\u2717" },
};

// ─── Props ──────────────────────────────────────────────────────────────────

export interface PredictionStatusBadgeProps {
  prediction: PredictionDto | null | undefined;
  matchStatus: MatchStatus;
  isLocked: boolean;
}

// ─── State derivation ───────────────────────────────────────────────────────

type BadgeState =
  | { kind: "open" }
  | { kind: "predicted"; home: number; away: number }
  | {
      kind: "scored";
      home: number;
      away: number;
      pointType: PredictionPointType;
      points: number;
    }
  | { kind: "locked" }
  | { kind: "locked-predicted"; home: number; away: number }
  | { kind: "finished-no-prediction" }
  | { kind: "live" }
  | { kind: "live-predicted"; home: number; away: number };

function deriveBadgeState(
  prediction: PredictionDto | null | undefined,
  matchStatus: MatchStatus,
  isLocked: boolean,
): BadgeState {
  const isFinished = matchStatus === "FINISHED";
  const isLive = matchStatus === "LIVE";

  if (prediction) {
    if (isFinished && prediction.pointType != null) {
      return {
        kind: "scored",
        home: prediction.predictedHome,
        away: prediction.predictedAway,
        pointType: prediction.pointType,
        points: prediction.pointsEarned,
      };
    }

    if (isLive) {
      return {
        kind: "live-predicted",
        home: prediction.predictedHome,
        away: prediction.predictedAway,
      };
    }

    if (isLocked) {
      return {
        kind: "locked-predicted",
        home: prediction.predictedHome,
        away: prediction.predictedAway,
      };
    }

    return {
      kind: "predicted",
      home: prediction.predictedHome,
      away: prediction.predictedAway,
    };
  }

  if (isFinished) return { kind: "finished-no-prediction" };
  if (isLive) return { kind: "live" };
  if (isLocked) return { kind: "locked" };
  return { kind: "open" };
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function PredictionStatusBadge({
  prediction,
  matchStatus,
  isLocked,
}: PredictionStatusBadgeProps) {
  const state = deriveBadgeState(prediction, matchStatus, isLocked);

  switch (state.kind) {
    case "open":
      return (
        <span
          data-testid="prediction-badge-open"
          className="inline-flex items-center self-center rounded-xl border border-warning bg-transparent px-3.5 py-1.5 text-xs font-bold tracking-wide text-warning"
        >
          + Pronosticar
        </span>
      );

    case "predicted":
      return (
        <span
          data-testid="prediction-badge-predicted"
          className="inline-flex items-center gap-1.5 rounded-xl bg-primary-surface-light px-3.5 py-1.5"
        >
          <span className="text-[11px] font-medium text-primary">
            Tu pronóstico
          </span>
          <span className="text-[13px] font-bold tracking-wide text-primary">
            {state.home} - {state.away}
          </span>
        </span>
      );

    case "locked-predicted":
      return (
        <span
          data-testid="prediction-badge-locked-predicted"
          className="inline-flex items-center gap-1.5 rounded-lg bg-surface-muted px-2.5 py-1"
        >
          <span className="text-[11px] font-medium text-text-secondary">
            Tu pronóstico
          </span>
          <span className="text-[13px] font-bold tracking-wide text-text-secondary">
            {state.home} - {state.away}
          </span>
        </span>
      );

    case "live-predicted":
      return (
        <span
          data-testid="prediction-badge-live-predicted"
          className="inline-flex items-center gap-1.5 rounded-lg bg-surface-muted px-2.5 py-1"
        >
          <span className="text-[11px] font-medium text-text-secondary">
            Tu pronóstico
          </span>
          <span className="text-[13px] font-bold tracking-wide text-text-secondary">
            {state.home} - {state.away}
          </span>
        </span>
      );

    case "scored": {
      const config = POINT_TYPE_CONFIG[state.pointType];
      return (
        <span
          data-testid="prediction-badge-scored"
          className="inline-flex items-center gap-1 rounded-lg bg-surface-muted px-2 py-1"
        >
          <span className={cn("text-xs font-bold", config.textClass)}>
            {config.icon}
          </span>
          <span className="text-xs font-semibold text-text-secondary">
            {state.home} - {state.away}
          </span>
          <span
            className={cn(
              "text-[11px] font-bold tracking-wide",
              config.textClass,
            )}
          >
            {config.label}
          </span>
          {state.points > 0 ? (
            <span
              className={cn(
                "text-[11px] font-extrabold tracking-wide",
                config.textClass,
              )}
            >
              +{state.points}pts
            </span>
          ) : (
            <span className="text-[11px] font-semibold tracking-wide text-text-tertiary">
              0pts
            </span>
          )}
        </span>
      );
    }

    case "locked":
      return (
        <span
          data-testid="prediction-badge-locked"
          className="inline-flex items-center gap-1 rounded-lg bg-surface-muted px-2 py-1"
        >
          <span className="text-[11px]" aria-hidden>
            {"\uD83D\uDD12"}
          </span>
          <span className="text-xs font-semibold tracking-wide text-text-tertiary">
            Bloqueado
          </span>
        </span>
      );

    case "finished-no-prediction":
      return (
        <span
          data-testid="prediction-badge-finished-no-prediction"
          className="inline-flex items-center self-center rounded-xl bg-surface-muted px-3.5 py-1.5 text-xs font-medium text-text-tertiary"
        >
          Sin pronóstico
        </span>
      );

    case "live":
      return (
        <span
          data-testid="prediction-badge-live"
          className="inline-flex items-center gap-1 rounded-lg bg-surface-muted px-2 py-1"
        >
          <span
            className="inline-block h-1.5 w-1.5 rounded-full bg-danger"
            aria-hidden
          />
          <span className="text-[11px] font-bold tracking-wide text-danger">
            En vivo
          </span>
        </span>
      );
  }
}
