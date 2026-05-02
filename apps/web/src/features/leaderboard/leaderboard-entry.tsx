"use client";

/**
 * LeaderboardEntry — single row in the group leaderboard.
 *
 * Port literal de `apps/mobile/src/components/leaderboard/leaderboard-entry.tsx`.
 *
 * Renderiza badge de posición (gold/silver para top 2), avatar del usuario,
 * nombre, total points y exact-prediction count. Resalta la fila del current
 * user con `rowHighlighted` style (background primary-surface).
 */

import type { LeaderboardEntryDto } from "@pichichi/shared";

import { cn } from "@/lib/cn";

// ─── Props ──────────────────────────────────────────────────────────────────

export interface LeaderboardEntryProps {
  entry: LeaderboardEntryDto;
  /** Highlights the row when it belongs to the authenticated user. */
  isCurrentUser: boolean;
  /** External classes for spacing (e.g. mb-2). */
  className?: string;
}

// ─── Position colors (medal hex for top 2) ─────────────────────────────────

const POSITION_COLORS: Record<number, string> = {
  1: "#FFD166", // gold
  2: "#C0C0C0", // silver
};

// ─── Sub-components ─────────────────────────────────────────────────────────

function PositionBadge({ position }: { position: number }) {
  const color = POSITION_COLORS[position];
  return (
    <div className="flex w-6 items-center justify-center">
      <span
        className="text-base font-extrabold text-text-primary"
        style={color != null ? { color } : undefined}
      >
        {position}
      </span>
    </div>
  );
}

function UserAvatar({
  displayName,
  avatarUrl,
}: {
  displayName: string;
  avatarUrl: string | null;
}) {
  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt={displayName}
        className="ml-1.5 h-10 w-10 rounded-full object-cover"
      />
    );
  }
  return (
    <div className="ml-1.5 flex h-10 w-10 items-center justify-center rounded-full bg-primary-surface">
      <span className="text-[15px] font-bold text-primary">
        {displayName.charAt(0).toUpperCase()}
      </span>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function LeaderboardEntry({
  entry,
  isCurrentUser,
  className,
}: LeaderboardEntryProps) {
  const { position, displayName, avatarUrl, totalPoints, exactCount } = entry;

  return (
    <div
      data-testid="leaderboard-entry"
      data-current-user={isCurrentUser ? "true" : undefined}
      className={cn(
        "flex items-center px-4 py-3.5",
        isCurrentUser
          ? "rounded-xl bg-primary-surface"
          : "border-b border-border",
        className,
      )}
    >
      <PositionBadge position={position} />

      <UserAvatar displayName={displayName} avatarUrl={avatarUrl} />

      <div className="ml-3 mr-2 flex flex-1 flex-col">
        <span
          className={cn(
            "truncate text-sm text-text-primary",
            isCurrentUser ? "font-bold" : "font-semibold",
          )}
        >
          {displayName}
        </span>
        <span className="mt-0.5 text-[11px] font-medium text-text-secondary">
          {exactCount} {exactCount === 1 ? "exacto" : "exactos"}
        </span>
      </div>

      <div className="flex min-w-[40px] shrink-0 flex-col items-end">
        <span className="text-xl font-extrabold leading-6 text-primary">
          {totalPoints}
        </span>
        <span className="text-[11px] font-normal leading-[14px] text-text-tertiary">
          pts
        </span>
      </div>
    </div>
  );
}
