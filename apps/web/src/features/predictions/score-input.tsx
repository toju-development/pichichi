"use client";

/**
 * ScoreInput — unified team + score section for match prediction (web).
 *
 * Adaptado de `apps/mobile/src/components/predictions/score-input.tsx`.
 * Diferencia clave: usamos `<input type="number">` (decisión explícita del
 * usuario) en lugar de `<Stepper>`, con rango 0-99.
 *
 * Layout: dos columnas (avatar + nombre + input numérico) separadas por un
 * en-dash centrado.
 */

import type { MatchTeamDto } from "@pichichi/shared";

import { cn } from "@/lib/cn";

// ─── Avatar (web equivalent of TeamAvatar) ──────────────────────────────────

function TeamAvatarWeb({
  team,
  size = 40,
}: {
  team: MatchTeamDto | null | undefined;
  size?: number;
}) {
  const initials = team?.name
    ? team.name
        .split(/\s+/)
        .slice(0, 2)
        .map((w) => w.charAt(0).toUpperCase())
        .join("")
    : "?";

  if (team?.logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={team.logoUrl}
        alt={team.name ?? ""}
        width={size}
        height={size}
        className="rounded-full bg-surface-muted object-contain"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className="flex items-center justify-center rounded-full bg-surface-muted text-xs font-bold text-text-secondary"
      style={{ width: size, height: size }}
      aria-hidden
    >
      {initials}
    </div>
  );
}

// ─── Props ──────────────────────────────────────────────────────────────────

interface ScoreInputProps {
  homeTeamName: string;
  awayTeamName: string;
  homeTeam?: MatchTeamDto | null;
  awayTeam?: MatchTeamDto | null;
  homeScore: number;
  awayScore: number;
  onHomeChange: (value: number) => void;
  onAwayChange: (value: number) => void;
  disabled?: boolean;
  minScore?: number;
  maxScore?: number;
}

function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

// ─── Component ──────────────────────────────────────────────────────────────

export function ScoreInput({
  homeTeamName,
  awayTeamName,
  homeTeam,
  awayTeam,
  homeScore,
  awayScore,
  onHomeChange,
  onAwayChange,
  disabled = false,
  minScore = 0,
  maxScore = 99,
}: ScoreInputProps) {
  return (
    <div
      className={cn(
        "flex w-full items-end gap-2",
        disabled && "pointer-events-none opacity-50",
      )}
      data-testid="score-input"
    >
      {/* Home team column */}
      <div className="flex flex-1 flex-col items-center gap-2">
        <TeamAvatarWeb team={homeTeam ?? null} size={40} />
        <span
          className="line-clamp-1 px-1 text-center text-sm font-bold text-text-primary"
          title={homeTeamName}
        >
          {homeTeamName}
        </span>
        <input
          type="number"
          min={minScore}
          max={maxScore}
          value={homeScore}
          inputMode="numeric"
          onChange={(e) => {
            const next = clamp(
              parseInt(e.target.value, 10),
              minScore,
              maxScore,
            );
            onHomeChange(next);
          }}
          disabled={disabled}
          data-testid="score-input-home"
          aria-label={`Goles de ${homeTeamName}`}
          className="h-12 w-20 rounded-lg border border-border bg-surface text-center text-2xl font-bold text-text-primary outline-none transition focus:border-primary disabled:opacity-50"
        />
      </div>

      {/* En-dash separator */}
      <div className="flex w-7 items-center justify-center pb-3">
        <span className="text-lg font-normal text-text-tertiary">–</span>
      </div>

      {/* Away team column */}
      <div className="flex flex-1 flex-col items-center gap-2">
        <TeamAvatarWeb team={awayTeam ?? null} size={40} />
        <span
          className="line-clamp-1 px-1 text-center text-sm font-bold text-text-primary"
          title={awayTeamName}
        >
          {awayTeamName}
        </span>
        <input
          type="number"
          min={minScore}
          max={maxScore}
          value={awayScore}
          inputMode="numeric"
          onChange={(e) => {
            const next = clamp(
              parseInt(e.target.value, 10),
              minScore,
              maxScore,
            );
            onAwayChange(next);
          }}
          disabled={disabled}
          data-testid="score-input-away"
          aria-label={`Goles de ${awayTeamName}`}
          className="h-12 w-20 rounded-lg border border-border bg-surface text-center text-2xl font-bold text-text-primary outline-none transition focus:border-primary disabled:opacity-50"
        />
      </div>
    </div>
  );
}
