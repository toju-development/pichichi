"use client";

/**
 * MatchCard — port literal de `apps/mobile/src/components/matches/match-card.tsx`.
 *
 * Card visual que renderiza un único partido con teams + score (o "vs"),
 * fecha/venue, badge de phase/group, badge LIVE, status badge para
 * POSTPONED/CANCELLED, indicador de prediction (Listo / Sin predicción) y
 * slot opcional `bottomRight` / `footer`.
 *
 * Diferencias vs mobile:
 * - DOM (`<div>`/`<button>`) + Tailwind classes en vez de View/Text/StyleSheet.
 * - El click se delega a un `<button>` raíz cuando `onClick` está definido,
 *   o a un `<div>` cuando no — manteniendo a11y igual que mobile (Pressable
 *   condicional).
 * - Pulso del LIVE dot via `animate-pulse` Tailwind (mobile no anima, era
 *   un dot estático — pero en web el feedback visual ayuda).
 *
 * Avatar de equipo: web no tiene `<TeamAvatar>` componente — usamos `<img>`
 * con fallback a iniciales. Mantiene el mismo look (círculo 24px borde).
 */

import type { MatchDto, MatchTeamDto } from "@pichichi/shared";

import { cn } from "@/lib/cn";

// ─── Phase labels (Spanish) ─────────────────────────────────────────────────

const PHASE_LABELS: Record<string, string> = {
  GROUP_STAGE: "Fase de Grupos",
  ROUND_OF_32: "32avos",
  ROUND_OF_16: "Octavos",
  QUARTER_FINAL: "Cuartos",
  SEMI_FINAL: "Semifinal",
  THIRD_PLACE: "3er Puesto",
  FINAL: "Final",
};

const STATUS_LABELS: Record<string, string> = {
  POSTPONED: "Aplazado",
  CANCELLED: "Cancelado",
};

const DAY_ABBR = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"] as const;
const MONTH_ABBR = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
] as const;

function formatMatchDate(iso: string): string {
  const d = new Date(iso);
  const day = DAY_ABBR[d.getDay()];
  const date = d.getDate();
  const month = MONTH_ABBR[d.getMonth()];
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${day} ${date} ${month} \u00B7 ${hours}:${minutes}`;
}

// ─── Props ──────────────────────────────────────────────────────────────────

export interface MatchCardProps {
  match: MatchDto;
  hasPrediction?: boolean;
  showPhaseInfo?: boolean;
  showPrediction?: boolean;
  bottomRight?: React.ReactNode;
  footer?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function TeamAvatar({ team }: { team: MatchTeamDto }) {
  if (team.logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={team.logoUrl}
        alt={team.name}
        className="h-6 w-6 shrink-0 rounded-full object-cover"
      />
    );
  }
  return (
    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-surface">
      <span className="text-[10px] font-bold text-primary">
        {team.name.charAt(0).toUpperCase()}
      </span>
    </div>
  );
}

function TeamSide({
  team,
  placeholder,
  reverse,
}: {
  team: MatchTeamDto | null;
  placeholder: string | null;
  reverse?: boolean;
}) {
  if (!team) {
    return (
      <div
        className={cn(
          "flex flex-1 items-center gap-1.5",
          reverse ? "flex-row-reverse" : "flex-row",
        )}
      >
        <span className="line-clamp-1 shrink text-sm font-medium italic text-text-tertiary">
          {placeholder ?? "TBD"}
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-1 items-center gap-1.5",
        reverse ? "flex-row-reverse" : "flex-row",
      )}
    >
      <TeamAvatar team={team} />
      <span className="line-clamp-1 shrink text-sm font-semibold text-text-primary">
        {team.name}
      </span>
    </div>
  );
}

function ScoreBlock({
  homeScore,
  awayScore,
  isExtraTime,
  homeScorePenalties,
  awayScorePenalties,
  isFinished,
}: {
  homeScore: number;
  awayScore: number;
  isExtraTime: boolean;
  homeScorePenalties: number | null;
  awayScorePenalties: number | null;
  isFinished: boolean;
}) {
  const hasPenalties =
    homeScorePenalties != null && awayScorePenalties != null;

  const homeIsWinner = isFinished && homeScore > awayScore;
  const homeIsLoser = isFinished && homeScore < awayScore;
  const awayIsWinner = isFinished && awayScore > homeScore;
  const awayIsLoser = isFinished && awayScore < homeScore;

  return (
    <div className="flex min-w-[56px] flex-col items-center px-1">
      <div className="flex flex-row items-center">
        <span
          className={cn(
            "text-[22px] font-extrabold",
            homeIsWinner && "text-primary",
            homeIsLoser && "text-text-tertiary",
            !homeIsWinner && !homeIsLoser && "text-text-primary",
          )}
        >
          {homeScore}
        </span>
        <span className="mx-1 text-lg font-normal text-text-tertiary">-</span>
        <span
          className={cn(
            "text-[22px] font-extrabold",
            awayIsWinner && "text-primary",
            awayIsLoser && "text-text-tertiary",
            !awayIsWinner && !awayIsLoser && "text-text-primary",
          )}
        >
          {awayScore}
        </span>
      </div>

      {isExtraTime && !hasPenalties ? (
        <span className="mt-0.5 text-[10px] font-semibold text-text-secondary">
          (ET)
        </span>
      ) : null}

      {hasPenalties ? (
        <span className="mt-0.5 text-[10px] font-semibold text-text-secondary">
          ({homeScorePenalties} - {awayScorePenalties} pen.)
        </span>
      ) : null}
    </div>
  );
}

function LiveBadge() {
  return (
    <div className="flex flex-row items-center self-start">
      <div className="mr-1.5 h-2 w-2 animate-pulse rounded-full bg-success" />
      <span className="text-[11px] font-extrabold uppercase tracking-wider text-success">
        EN VIVO
      </span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <div className="flex min-w-[70px] items-center justify-center rounded-lg bg-background px-2.5 py-1">
      <span className="text-[11px] font-bold uppercase tracking-wide text-text-secondary">
        {STATUS_LABELS[status] ?? status}
      </span>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function MatchCard({
  match,
  hasPrediction = false,
  showPhaseInfo = false,
  showPrediction = true,
  bottomRight,
  footer,
  onClick,
  className,
}: MatchCardProps) {
  const {
    homeTeam,
    awayTeam,
    homeTeamPlaceholder,
    awayTeamPlaceholder,
    phase,
    groupName,
    status,
    homeScore,
    awayScore,
    homeScorePenalties,
    awayScorePenalties,
    isExtraTime,
    scheduledAt,
    venue,
    city,
  } = match;

  const isScheduled = status === "SCHEDULED";
  const isLive = status === "LIVE";
  const isFinished = status === "FINISHED";
  const isMuted = status === "POSTPONED" || status === "CANCELLED";
  const hasScore =
    (isLive || isFinished) && homeScore != null && awayScore != null;

  const phaseLabel = PHASE_LABELS[phase] ?? phase;
  const groupLabel = groupName ?? null;
  const phaseInfoText = groupLabel
    ? `${groupLabel}  \u00B7  ${phaseLabel}`
    : phaseLabel;

  const venueParts = [venue, city].filter(Boolean);
  const venueLine = venueParts.length > 0 ? venueParts.join(", ") : null;

  const showPredictionIndicator = isScheduled || isLive;

  const inner = (
    <div className={cn(isMuted && "opacity-55")}>
      {showPhaseInfo ? (
        <div className="mb-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
            {phaseInfoText}
          </span>
        </div>
      ) : null}

      {isLive ? (
        <div className="mb-1.5">
          <LiveBadge />
        </div>
      ) : null}

      <div className="flex min-h-[44px] flex-row items-center justify-between">
        <TeamSide team={homeTeam} placeholder={homeTeamPlaceholder} />

        {hasScore ? (
          <ScoreBlock
            homeScore={homeScore}
            awayScore={awayScore}
            isExtraTime={isExtraTime}
            homeScorePenalties={homeScorePenalties}
            awayScorePenalties={awayScorePenalties}
            isFinished={isFinished}
          />
        ) : isMuted ? (
          <StatusBadge status={status} />
        ) : (
          <div className="flex min-w-[56px] items-center justify-center px-1">
            <span className="text-base font-medium text-text-tertiary">vs</span>
          </div>
        )}

        <TeamSide team={awayTeam} placeholder={awayTeamPlaceholder} reverse />
      </div>

      <div className="mt-2 flex flex-row items-center justify-between">
        <span className="text-xs font-medium text-text-secondary">
          {formatMatchDate(scheduledAt)}
        </span>
        {venueLine ? (
          <span className="ml-2 line-clamp-1 flex-1 text-right text-[11px] font-normal text-text-tertiary">
            {venueLine}
          </span>
        ) : null}
      </div>

      {showPrediction && footer == null && bottomRight != null ? (
        <div className="mt-1.5 flex justify-end">{bottomRight}</div>
      ) : showPrediction && footer == null && showPredictionIndicator ? (
        hasPrediction ? (
          <div className="mt-1.5 flex justify-end">
            <div className="flex flex-row items-center">
              <span className="mr-1 text-[13px] font-bold text-success">
                {"\u2713"}
              </span>
              <span className="text-xs font-semibold text-success">Listo</span>
            </div>
          </div>
        ) : (
          <div className="mt-1.5 flex justify-end">
            <span className="text-xs font-medium text-text-tertiary">
              Sin predicción
            </span>
          </div>
        )
      ) : null}

      {footer != null ? (
        <div className="mt-2 flex items-center justify-center">{footer}</div>
      ) : null}
    </div>
  );

  const baseShell =
    "block w-full rounded-2xl border border-border bg-surface p-4 text-left shadow-sm transition";

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        data-testid={`match-card-${match.id}`}
        className={cn(baseShell, "hover:border-primary", className)}
      >
        {inner}
      </button>
    );
  }

  return (
    <div
      data-testid={`match-card-${match.id}`}
      className={cn(baseShell, className)}
    >
      {inner}
    </div>
  );
}
