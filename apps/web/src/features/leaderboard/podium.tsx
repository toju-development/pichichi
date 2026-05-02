"use client";

/**
 * Podium — hero display for the top 3 users in the group ranking.
 *
 * Port literal de `apps/mobile/src/components/leaderboard/podium.tsx` —
 * mismas medals 🥇🥈🥉, mismos colores hex (gold/silver/bronze) y
 * misma altura relativa de pedestales (1° elevado).
 *
 * Web usa `<img>`/`<div>` + Tailwind classes en vez de `Image`/`View`/
 * StyleSheet. Mantenemos los hex inline porque NO son tokens del tema —
 * son colores específicos del podio (medals).
 */

import type { LeaderboardEntryDto } from "@pichichi/shared";

import { cn } from "@/lib/cn";

// ─── Constants ──────────────────────────────────────────────────────────────

const MEDALS: Record<number, string> = {
  1: "🥇",
  2: "🥈",
  3: "🥉",
};

/** Pedestal height in px — 1° más alto, 2° medio, 3° más bajo. */
const PEDESTAL_HEIGHTS: Record<number, number> = {
  1: 80,
  2: 56,
  3: 40,
};

/** Avatar size in px — 1° más grande. */
const AVATAR_SIZES: Record<number, number> = {
  1: 72,
  2: 56,
  3: 56,
};

const PEDESTAL_COLORS: Record<number, string> = {
  1: "#FFD166", // gold
  2: "#C0C0C0", // silver
  3: "#CD7F32", // bronze
};

const BORDER_COLORS: Record<number, string> = {
  1: "#FFD166",
  2: "#C0C0C0",
  3: "#CD7F32",
};

// ─── Props ──────────────────────────────────────────────────────────────────

export interface PodiumProps {
  entries: LeaderboardEntryDto[];
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function PodiumAvatar({
  displayName,
  avatarUrl,
  size,
  borderColor,
}: {
  displayName: string;
  avatarUrl: string | null;
  size: number;
  borderColor: string;
}) {
  const sizeStyle = { width: size, height: size, borderColor };

  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt={displayName}
        style={sizeStyle}
        className="rounded-full border-[3px] object-cover"
      />
    );
  }

  return (
    <div
      style={sizeStyle}
      className="flex items-center justify-center rounded-full border-[3px] bg-primary-surface"
    >
      <span
        style={{ fontSize: size * 0.38 }}
        className="font-bold text-primary"
      >
        {displayName.charAt(0).toUpperCase()}
      </span>
    </div>
  );
}

function PodiumPosition({ entry }: { entry: LeaderboardEntryDto }) {
  const { position, displayName, avatarUrl, totalPoints } = entry;
  const medal = MEDALS[position] ?? "";
  const pedestalHeight = PEDESTAL_HEIGHTS[position] ?? 40;
  const avatarSize = AVATAR_SIZES[position] ?? 56;
  const pedestalColor = PEDESTAL_COLORS[position] ?? "#0B6E4F";
  const borderColor = BORDER_COLORS[position] ?? "#E5E7EB";
  const isFirst = position === 1;

  return (
    <div className="flex flex-1 flex-col items-center">
      <PodiumAvatar
        displayName={displayName}
        avatarUrl={avatarUrl}
        size={avatarSize}
        borderColor={borderColor}
      />

      <span className="mt-1.5 text-2xl">{medal}</span>

      <span
        className={cn(
          "mt-1 line-clamp-2 px-1 text-center font-semibold text-text-primary",
          isFirst ? "text-[13px] font-bold" : "text-xs",
        )}
      >
        {displayName}
      </span>

      <span
        className={cn(
          "mt-0.5 font-bold",
          isFirst ? "text-sm" : "text-xs text-text-secondary",
        )}
        style={isFirst ? { color: "#FFD166" } : undefined}
      >
        {totalPoints} pts
      </span>

      <div
        style={{
          height: pedestalHeight,
          backgroundColor: pedestalColor,
        }}
        className={cn(
          "mt-2.5 flex items-center justify-center rounded-t-lg",
          isFirst ? "w-[90%]" : "w-[85%]",
        )}
      >
        <span
          className={cn(
            "font-extrabold",
            isFirst ? "text-2xl" : "text-xl",
          )}
          style={{ color: "rgba(0, 0, 0, 0.25)" }}
        >
          {position}
        </span>
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function Podium({ entries }: PodiumProps) {
  if (entries.length === 0) {
    return null;
  }

  const sorted = [...entries].sort((a, b) => a.position - b.position);
  const first = sorted[0];
  const second = sorted[1];
  const third = sorted[2];

  return (
    <div
      data-testid="podium"
      className="px-4 pb-2 pt-6"
    >
      <div className="flex items-end justify-center">
        {second ? (
          <PodiumPosition entry={second} />
        ) : (
          <div className="flex flex-1 flex-col items-center" />
        )}

        {first ? <PodiumPosition entry={first} /> : null}

        {third ? (
          <PodiumPosition entry={third} />
        ) : (
          <div className="flex flex-1 flex-col items-center" />
        )}
      </div>
    </div>
  );
}
