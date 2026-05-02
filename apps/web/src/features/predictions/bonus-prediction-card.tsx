"use client";

/**
 * BonusPredictionCard — port literal de
 * `apps/mobile/src/components/predictions/bonus-prediction-card.tsx`.
 *
 * Card de una sola categoría de bonus (Champion / Top Scorer / MVP / Revelation).
 * Muestra label, prediction actual (o "Sin pronóstico"), puntos disponibles y
 * estado de lock. Tappable para editar cuando NO está locked.
 *
 * Resuelve `predictedValue` (que guarda `String(externalId)`) a un nombre legible
 * vía los arrays de teams/players pasados como props:
 *   - Team bonus types (CHAMPION/REVELATION) → flag + team name
 *   - Player bonus types (TOP_SCORER/MVP) → player photo + name + team flag
 *   - Legacy free-text predictions (lookup falla) → raw predictedValue
 *
 * Pure presentational — recibe props derivadas, sin business logic propia.
 *
 * Diferencias justificadas web:
 *   - Iconos inline SVG (NO instalamos lucide-react). Mismos shapes y colores
 *     que mobile: Trophy (CHAMPION), CircleDot (TOP_SCORER), Star (MVP),
 *     Sparkles (REVELATION), Lock (locked sin prediction).
 *   - StyleSheet de mobile reemplazado por tokens Tailwind (bg-surface,
 *     text-text-primary, etc).
 *   - `<Pressable>` reemplazado por `<button type="button">` (tappable cuando
 *     no locked) o `<div>` (locked).
 *   - `<img>` de imágenes externas (logos/photos) con eslint-disable
 *     `@next/next/no-img-element` (no migramos a next/image en este scope).
 */

import type { ReactElement } from "react";

import type {
  BonusPredictionDto,
  BonusTypeDto,
  TournamentBonusTypeDto,
  TournamentPlayerResponseDto,
  TournamentTeamDto,
} from "@pichichi/shared";

import { cn } from "@/lib/cn";

// ─── Inline SVG icons (paridad con lucide-react de mobile) ─────────────────

interface IconProps {
  className?: string;
  size?: number;
}

function TrophyIcon({ className, size = 24 }: IconProps) {
  // lucide "trophy"
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  );
}

function CircleDotIcon({ className, size = 24 }: IconProps) {
  // lucide "circle-dot"
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
    </svg>
  );
}

function StarIcon({ className, size = 24 }: IconProps) {
  // lucide "star"
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function SparklesIcon({ className, size = 24 }: IconProps) {
  // lucide "sparkles"
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
      <path d="M20 3v4" />
      <path d="M22 5h-4" />
      <path d="M4 17v2" />
      <path d="M5 18H3" />
    </svg>
  );
}

function LockIcon({ className, size = 14 }: IconProps) {
  // lucide "lock"
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

// ─── Category icon mapping ─────────────────────────────────────────────────

interface CategoryIcon {
  Icon: (props: IconProps) => ReactElement;
  /** Tailwind text-* color class (paridad con `color: '#FFD166'` etc de mobile). */
  colorClass: string;
}

const CATEGORY_ICONS: Record<string, CategoryIcon> = {
  // #FFD166 → amber-300 visual paridad
  CHAMPION: { Icon: TrophyIcon, colorClass: "text-amber-300" },
  // #9CA3AF → text-text-muted (gray)
  TOP_SCORER: { Icon: CircleDotIcon, colorClass: "text-text-muted" },
  MVP: { Icon: StarIcon, colorClass: "text-amber-300" },
  // #E65100 → orange-700
  REVELATION: { Icon: SparklesIcon, colorClass: "text-orange-700" },
};

// ─── Category label translations ───────────────────────────────────────────

/** Maps backend bonus keys/labels (English) → Spanish display labels. */
const BONUS_LABELS: Record<string, string> = {
  // By key (uppercase)
  CHAMPION: "Campeón",
  TOP_SCORER: "Goleador",
  MVP: "MVP",
  REVELATION: "Revelación",
  // By label string (backend may send these)
  Champion: "Campeón",
  "Top Scorer": "Goleador",
  "Most Valuable Player": "MVP",
  "Revelation Team": "Revelación",
};

// ─── Bonus type → picker mode mapping ──────────────────────────────────────

const TEAM_BONUS_KEYS = new Set(["CHAMPION", "REVELATION"]);
const PLAYER_BONUS_KEYS = new Set(["TOP_SCORER", "MVP"]);

// ─── ExternalId → display name resolution ──────────────────────────────────

interface ResolvedDisplay {
  displayName: string;
  logoUrl: string | null;
  photoUrl: string | null;
}

/**
 * Resolves a `predictedValue` (which stores `String(externalId)`) into a
 * human-readable display name. Falls back to raw `predictedValue` when lookup
 * fails (legacy free-text predictions).
 */
function resolvePredictionDisplay(
  predictedValue: string,
  bonusTypeKey: string,
  teams: TournamentTeamDto[],
  players: TournamentPlayerResponseDto[],
): ResolvedDisplay {
  const key = bonusTypeKey.toUpperCase();

  if (TEAM_BONUS_KEYS.has(key)) {
    const team = teams.find((t) => String(t.externalId) === predictedValue);
    if (team) {
      return { displayName: team.name, logoUrl: team.logoUrl, photoUrl: null };
    }
  }

  if (PLAYER_BONUS_KEYS.has(key)) {
    const player = players.find(
      (p) => String(p.externalId) === predictedValue,
    );
    if (player) {
      return {
        displayName: player.name,
        logoUrl: player.teamLogoUrl,
        photoUrl: player.photoUrl,
      };
    }
  }

  // Legacy free-text prediction or unknown externalId — show raw value.
  return { displayName: predictedValue, logoUrl: null, photoUrl: null };
}

// ─── Props ──────────────────────────────────────────────────────────────────

export interface BonusPredictionCardProps {
  /** The bonus type definition (key, label, points). */
  bonusType: BonusTypeDto | TournamentBonusTypeDto;
  /** The user's prediction for this category, or null/undefined if none. */
  prediction: BonusPredictionDto | null | undefined;
  /** Whether bonus predictions are locked (after tournament starts). */
  isLocked: boolean;
  /** Called when the user clicks to edit. Not called when locked. */
  onEdit: () => void;
  /** Tournament teams — used to resolve externalId → display name for team bonus types. */
  teams: TournamentTeamDto[];
  /** Tournament players — used to resolve externalId → display name for player bonus types. */
  players: TournamentPlayerResponseDto[];
  /** Optional Tailwind classes for external spacing (e.g. mb-3). */
  className?: string;
}

// ─── Main Component ────────────────────────────────────────────────────────

export function BonusPredictionCard({
  bonusType,
  prediction,
  isLocked,
  onEdit,
  teams,
  players,
  className,
}: BonusPredictionCardProps) {
  const hasPrediction =
    prediction != null && prediction.predictedValue !== "";
  const normalizedKey = bonusType.key.toUpperCase();
  const categoryIcon =
    CATEGORY_ICONS[normalizedKey] ??
    ({ Icon: TrophyIcon, colorClass: "text-text-muted" } satisfies CategoryIcon);
  const displayLabel =
    BONUS_LABELS[normalizedKey] ??
    BONUS_LABELS[bonusType.label] ??
    bonusType.label;

  const isScored = prediction?.isCorrect != null;
  const isCorrect = prediction?.isCorrect === true;

  const resolved = hasPrediction
    ? resolvePredictionDisplay(
        prediction.predictedValue,
        bonusType.key,
        teams,
        players,
      )
    : null;

  const cardContent = (
    <div className="overflow-hidden rounded-[14px] border border-border bg-surface px-4 py-3.5">
      <div className="flex items-center justify-between">
        {/* Left: icon + label + points */}
        <div className="flex min-w-0 flex-shrink items-center gap-2.5">
          <categoryIcon.Icon
            size={24}
            className={categoryIcon.colorClass}
          />
          <div className="min-w-0 flex-shrink">
            <p className="truncate text-[15px] font-semibold text-text-primary">
              {displayLabel}
            </p>
            <p className="mt-px text-[11px] font-semibold text-text-muted">
              {bonusType.points} pts
            </p>
          </div>
        </div>

        {/* Right: prediction value + status */}
        <div className="ml-3 flex flex-shrink-0 items-end">
          {isLocked && !hasPrediction ? (
            <div
              className="flex items-center gap-1"
              data-testid="bonus-prediction-card-locked-empty"
            >
              <LockIcon size={14} className="text-text-muted" />
              <span className="text-xs font-normal text-text-muted">
                Sin pronóstico
              </span>
            </div>
          ) : hasPrediction && resolved ? (
            <div className="flex items-center gap-1.5">
              {resolved.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={resolved.photoUrl}
                  alt=""
                  className="h-6 w-6 rounded-full object-cover"
                />
              ) : resolved.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={resolved.logoUrl}
                  alt=""
                  className="h-3.5 w-5 rounded-sm object-cover"
                />
              ) : null}
              <span
                data-testid="bonus-prediction-card-value"
                className={cn(
                  "text-[15px] font-semibold",
                  !isScored && "text-primary",
                  isScored && isCorrect && "text-success",
                  isScored && !isCorrect && "text-danger",
                )}
              >
                {resolved.displayName}
              </span>
              {resolved.photoUrl && resolved.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={resolved.logoUrl}
                  alt=""
                  className="h-3 w-4 rounded-[1px] object-cover"
                />
              ) : null}
              {isScored && isCorrect && prediction.pointsEarned > 0 ? (
                <span
                  data-testid="bonus-prediction-card-earned"
                  className="rounded-md bg-primary-surface-light px-1.5 py-0.5 text-[11px] font-extrabold tracking-wide text-success"
                >
                  +{prediction.pointsEarned}pts
                </span>
              ) : null}
            </div>
          ) : (
            <span className="text-xs font-medium italic text-text-secondary">
              Tocar para pronosticar
            </span>
          )}
        </div>
      </div>
    </div>
  );

  if (isLocked) {
    return (
      <div
        data-testid={`bonus-prediction-card-${bonusType.key.toLowerCase()}`}
        data-locked="true"
        className={cn("opacity-60", className)}
      >
        {cardContent}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onEdit}
      data-testid={`bonus-prediction-card-${bonusType.key.toLowerCase()}`}
      data-locked="false"
      className={cn(
        "block w-full text-left transition active:opacity-70 hover:border-primary",
        className,
      )}
    >
      {cardContent}
    </button>
  );
}
