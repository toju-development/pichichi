/**
 * StatCard — single metric tile.
 *
 * Port web del `StatCard` interno de `apps/mobile/app/(tabs)/profile.tsx`
 * (líneas 43-55). Mobile usa `View` + `StyleSheet`; web usa Tailwind tokens
 * (`bg-surface`, `border-border`, primary para los íconos).
 */

import type { ReactNode } from "react";

export interface StatCardProps {
  icon: ReactNode;
  value: string;
  label: string;
  /** Stable selector for E2E (`profile-stat-card-{key}`). */
  testId?: string;
}

export function StatCard({ icon, value, label, testId }: StatCardProps) {
  return (
    <div
      data-testid={testId}
      className="flex flex-col items-center gap-2 rounded-xl border border-border bg-surface px-4 py-4 shadow-sm"
    >
      <div className="text-primary" aria-hidden>
        {icon}
      </div>
      <span className="truncate text-2xl font-bold text-text-primary">
        {value}
      </span>
      <span className="truncate text-xs font-medium text-text-secondary">
        {label}
      </span>
    </div>
  );
}
