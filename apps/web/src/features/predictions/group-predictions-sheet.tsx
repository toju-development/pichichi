"use client";

/**
 * GroupPredictionsSheet — slide-up sheet (centrado en sm+) que muestra los
 * pronósticos de los miembros de un grupo para un partido.
 *
 * Port literal de `apps/mobile/src/components/predictions/group-predictions-sheet.tsx`.
 *
 * Estados (mismo orden que mobile):
 *   - loading: spinner + "Cargando pronósticos..."
 *   - locked (revealed=false): círculo + lock + "Pronósticos ocultos" +
 *     "Los pronósticos se revelan al inicio del partido"
 *   - revelado vacío: círculo + ojito + "Sin pronósticos" + "Nadie ha
 *     pronosticado este partido aún"
 *   - revelado con lista: filas con avatar + nombre (+(Vos) si current user)
 *     + score + badge EXACT/GOAL_DIFF/WINNER/MISS solo si match FINISHED.
 *
 * Web usa `useDialogA11y` (createPortal lo hace este componente) — mismo
 * contrato que `ScorePredictionModal` / `GroupPickerModal`.
 *
 * Reusa `useGroupPredictions(groupId, matchId)` que ya está portado en web.
 */

import { createPortal } from "react-dom";

import type {
  MatchDto,
  PredictionPointType,
  UserPredictionDto,
} from "@pichichi/shared";

import { useGroupPredictions } from "@/hooks/use-predictions";
import { useDialogA11y } from "@/hooks/use-dialog-a11y";
import { cn } from "@/lib/cn";

// ─── Props ──────────────────────────────────────────────────────────────────

interface GroupPredictionsSheetProps {
  visible: boolean;
  onClose: () => void;
  groupId: string;
  matchId: string;
  match: MatchDto;
  /** Display name del grupo — se muestra en el header. */
  groupName?: string;
  /** ID del usuario actual — usado para resaltar su fila. */
  currentUserId?: string;
}

// ─── Point-type display config ──────────────────────────────────────────────

interface PointTypeConfig {
  label: string;
  /** Tailwind text-color class. */
  textClass: string;
  /** Tailwind bg-color class. */
  bgClass: string;
}

// Paridad con `POINT_TYPE_CONFIG` de mobile. Equivalencias en tokens web
// (definidos en `apps/web/src/app/globals.css`):
// EXACT: success / #ECFDF5 → text-success / bg-success-soft
// GOAL_DIFF: primary / primary.light → text-primary / bg-primary-surface
// WINNER: warning / #FFFBEB → text-warning / bg-warning-surface
// MISS: text.muted / #F3F4F6 → text-text-tertiary / bg-surface-muted
const POINT_TYPE_CONFIG: Record<PredictionPointType, PointTypeConfig> = {
  EXACT: {
    label: "Exacto",
    textClass: "text-success",
    bgClass: "bg-success-soft",
  },
  GOAL_DIFF: {
    label: "Gol Dif",
    textClass: "text-primary",
    bgClass: "bg-primary-surface",
  },
  WINNER: {
    label: "Ganador",
    textClass: "text-warning",
    bgClass: "bg-warning-surface",
  },
  MISS: {
    label: "Errado",
    textClass: "text-text-tertiary",
    bgClass: "bg-surface-muted",
  },
};

// ─── Sub-components ─────────────────────────────────────────────────────────

function UserAvatar({
  displayName,
  isCurrentUser,
}: {
  displayName: string;
  isCurrentUser: boolean;
}) {
  const initial = displayName.charAt(0).toUpperCase();
  return (
    <span
      aria-hidden
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold",
        isCurrentUser
          ? "bg-primary text-text-on-primary"
          : "bg-primary-surface text-primary",
      )}
    >
      {initial}
    </span>
  );
}

function PredictionRow({
  item,
  isFinished,
  isCurrentUser,
}: {
  item: UserPredictionDto;
  isFinished: boolean;
  isCurrentUser: boolean;
}) {
  const pointConfig = item.pointType ? POINT_TYPE_CONFIG[item.pointType] : null;

  return (
    <div
      data-testid={`group-predictions-sheet-row-${item.userId}`}
      className={cn(
        "flex items-center gap-2 rounded-xl px-1 py-2.5",
        isCurrentUser && "bg-primary-surface",
      )}
    >
      {/* Avatar + Name */}
      <div className="flex flex-1 items-center gap-2.5">
        <UserAvatar
          displayName={item.displayName}
          isCurrentUser={isCurrentUser}
        />
        <div className="flex min-w-0 items-center gap-1">
          <span className="truncate text-sm font-semibold text-text-primary">
            {item.displayName}
          </span>
          {isCurrentUser ? (
            <span className="text-xs font-bold text-primary">(Vos)</span>
          ) : null}
        </div>
      </div>

      {/* Predicted score */}
      <div className="px-2">
        <span className="text-[15px] font-bold text-text-primary tracking-wide">
          {item.predictedHome} - {item.predictedAway}
        </span>
      </div>

      {/* Points badge — solo si FINISHED */}
      {isFinished && pointConfig ? (
        <div
          className={cn(
            "ml-2 flex min-w-[70px] items-center justify-center gap-1 rounded-md px-2 py-1",
            pointConfig.bgClass,
          )}
        >
          <span
            className={cn("text-[11px] font-semibold", pointConfig.textClass)}
          >
            {pointConfig.label}
          </span>
          <span
            className={cn("text-[11px] font-extrabold", pointConfig.textClass)}
          >
            +{item.pointsEarned}
          </span>
        </div>
      ) : isFinished ? (
        <div className="ml-2 flex min-w-[70px] items-center justify-center rounded-md bg-surface-muted px-2 py-1">
          <span className="text-[11px] font-semibold text-text-tertiary">-</span>
        </div>
      ) : null}
    </div>
  );
}

function CenteredState({
  iconKind,
  title,
  description,
}: {
  iconKind: "lock" | "reveal" | "spinner";
  title?: string;
  description?: string;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
      {iconKind === "spinner" ? (
        <SpinnerGlyph />
      ) : (
        <div className="mb-4 flex h-[72px] w-[72px] items-center justify-center rounded-full bg-surface">
          {iconKind === "lock" ? <LockGlyph /> : <RevealGlyph />}
        </div>
      )}
      {title ? (
        <p className="text-center text-lg font-bold text-text-primary">
          {title}
        </p>
      ) : null}
      {description ? (
        <p className="mt-2 max-w-[260px] text-center text-sm text-text-secondary">
          {description}
        </p>
      ) : null}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function GroupPredictionsSheet({
  visible,
  onClose,
  groupId,
  matchId,
  match,
  groupName,
  currentUserId,
}: GroupPredictionsSheetProps) {
  const { data, isLoading } = useGroupPredictions(groupId, matchId);
  const { dialogRef } = useDialogA11y({ open: visible, onClose });

  const isFinished = match.status === "FINISHED";

  const homeTeamName =
    match.homeTeam?.name ?? match.homeTeamPlaceholder ?? "Local";
  const awayTeamName =
    match.awayTeam?.name ?? match.awayTeamPlaceholder ?? "Visitante";

  const headerTitle = groupName
    ? `Pronósticos · ${groupName}`
    : "Pronósticos del grupo";
  const titleId = "group-predictions-sheet-title";

  if (!visible) return null;
  if (typeof window === "undefined") return null;

  function renderContent() {
    if (isLoading) {
      return (
        <CenteredState
          iconKind="spinner"
          description="Cargando pronósticos..."
        />
      );
    }

    if (data && !data.revealed) {
      return (
        <CenteredState
          iconKind="lock"
          title="Pronósticos ocultos"
          description="Los pronósticos se revelan al inicio del partido"
        />
      );
    }

    if (data && data.revealed && data.predictions.length === 0) {
      return (
        <CenteredState
          iconKind="reveal"
          title="Sin pronósticos"
          description="Nadie ha pronosticado este partido aún"
        />
      );
    }

    if (data && data.revealed) {
      return (
        <ul
          data-testid="group-predictions-sheet-list"
          className="flex flex-col gap-1 px-5 pb-8 pt-3"
        >
          {data.predictions.map((item, idx) => (
            <li key={item.id}>
              <PredictionRow
                item={item}
                isFinished={isFinished}
                isCurrentUser={!!currentUserId && item.userId === currentUserId}
              />
              {idx < data.predictions.length - 1 ? (
                <hr className="my-1 border-t border-border" />
              ) : null}
            </li>
          ))}
        </ul>
      );
    }

    return null;
  }

  const node = (
    <div
      data-testid="group-predictions-sheet"
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Cerrar"
        onClick={onClose}
        data-testid="group-predictions-sheet-backdrop"
        className="absolute inset-0 bg-black/50"
      />

      {/* Panel */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl bg-background shadow-lg sm:rounded-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-surface px-5 pb-4 pt-5">
          <h2
            id={titleId}
            className="mr-3 flex-1 truncate text-lg font-bold text-text-primary"
          >
            {headerTitle}
          </h2>
          <button
            type="button"
            onClick={onClose}
            data-testid="group-predictions-sheet-close"
            className="px-1 py-1 text-[15px] font-medium text-primary hover:underline"
          >
            Cerrar
          </button>
        </div>

        {/* Match info */}
        <div className="flex items-center justify-center gap-2.5 border-b border-border bg-surface px-5 py-3.5">
          <div className="flex flex-1 items-center justify-end gap-1.5 truncate">
            <span className="truncate text-sm font-semibold text-text-primary">
              {homeTeamName}
            </span>
          </div>

          {isFinished &&
          match.homeScore != null &&
          match.awayScore != null ? (
            <span className="rounded-md bg-primary-surface px-2 py-0.5 text-[15px] font-extrabold tracking-wide text-primary">
              {match.homeScore} - {match.awayScore}
            </span>
          ) : (
            <span className="px-1 text-sm font-medium text-text-tertiary">vs</span>
          )}

          <div className="flex flex-1 items-center gap-1.5 truncate">
            <span className="truncate text-sm font-semibold text-text-primary">
              {awayTeamName}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col overflow-y-auto">
          {renderContent()}
        </div>
      </div>
    </div>
  );

  return createPortal(node, document.body);
}

// ─── Inline glyphs ──────────────────────────────────────────────────────────

function LockGlyph() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      width={32}
      height={32}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-text-tertiary"
    >
      <rect x={3} y={11} width={18} height={11} rx={2} ry={2} />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function RevealGlyph() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      width={32}
      height={32}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-text-tertiary"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx={12} cy={12} r={3} />
    </svg>
  );
}

function SpinnerGlyph() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      width={36}
      height={36}
      className="animate-spin text-primary"
    >
      <circle
        cx={12}
        cy={12}
        r={10}
        stroke="currentColor"
        strokeWidth={3}
        strokeOpacity={0.25}
        fill="none"
      />
      <path
        d="M22 12a10 10 0 0 1-10 10"
        stroke="currentColor"
        strokeWidth={3}
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
