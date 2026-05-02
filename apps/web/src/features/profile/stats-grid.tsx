/**
 * StatsGrid — 3×2 grid de stats del usuario.
 *
 * Port literal de `apps/mobile/app/(tabs)/profile.tsx` (líneas 113-194):
 *   1. Pronósticos  → totalPredictions
 *   2. Exactos      → exactCount
 *   3. Puntos       → totalPoints
 *   4. Aciertos     → accuracy %
 *   5. Ranking      → currentUserEntry.position (`#N` o `–`)
 *   6. Grupos       → groupCount
 *
 * Mobile usa íconos `lucide-react-native`; web NO tiene `lucide-react` como
 * dep (decisión persistida desde 5A.1 — se mantiene). Acá definimos íconos
 * SVG inline con paths de lucide para mantener paridad visual.
 */

import type { DashboardUserStatsDto } from "@pichichi/shared";

import { StatCard } from "./stat-card";

interface StatsGridProps {
  stats: DashboardUserStatsDto | null | undefined;
  position: number | null | undefined;
}

const ICON_SIZE = 22;

const iconProps = {
  width: ICON_SIZE,
  height: ICON_SIZE,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function PredictionIcon() {
  // lucide `clipboard-list`
  return (
    <svg aria-hidden {...iconProps}>
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="M12 11h4" />
      <path d="M12 16h4" />
      <path d="M8 11h.01" />
      <path d="M8 16h.01" />
    </svg>
  );
}

function PointsIcon() {
  // lucide `star`
  return (
    <svg aria-hidden {...iconProps}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function TrophyIcon() {
  // lucide `trophy`
  return (
    <svg aria-hidden {...iconProps}>
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  );
}

function GroupIcon() {
  // lucide `users`
  return (
    <svg aria-hidden {...iconProps}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function CheckIcon() {
  // lucide `check-circle`
  return (
    <svg aria-hidden {...iconProps}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function TargetIcon() {
  // lucide `target`
  return (
    <svg aria-hidden {...iconProps}>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

export function StatsGrid({ stats, position }: StatsGridProps) {
  const totalPredictions = stats?.totalPredictions ?? 0;
  const exactCount = stats?.exactCount ?? 0;
  const totalPoints = stats?.totalPoints ?? 0;
  const accuracy = Math.round(stats?.accuracy ?? 0);
  const groupCount = stats?.groupCount ?? 0;

  return (
    <div
      data-testid="profile-stats-grid"
      className="grid grid-cols-2 gap-3 sm:grid-cols-3"
    >
      <StatCard
        testId="profile-stat-card-predictions"
        icon={<PredictionIcon />}
        value={String(totalPredictions)}
        label="Pronósticos"
      />
      <StatCard
        testId="profile-stat-card-exact"
        icon={<CheckIcon />}
        value={String(exactCount)}
        label="Exactos"
      />
      <StatCard
        testId="profile-stat-card-points"
        icon={<PointsIcon />}
        value={String(totalPoints)}
        label="Puntos"
      />
      <StatCard
        testId="profile-stat-card-accuracy"
        icon={<TargetIcon />}
        value={`${accuracy}%`}
        label="Aciertos"
      />
      <StatCard
        testId="profile-stat-card-ranking"
        icon={<TrophyIcon />}
        value={position != null ? `#${position}` : "–"}
        label="Ranking"
      />
      <StatCard
        testId="profile-stat-card-groups"
        icon={<GroupIcon />}
        value={String(groupCount)}
        label="Grupos"
      />
    </div>
  );
}
