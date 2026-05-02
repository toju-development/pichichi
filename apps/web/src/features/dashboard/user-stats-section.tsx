/**
 * UserStatsSection web — port presentacional de `UserStatsSection` mobile.
 *
 * 4 columnas con igual peso visual: Puntos, Pronósticos, Precisión, Exactos.
 * Mobile usa íconos de `lucide-react-native`; en web NO agregamos
 * `lucide-react` como dep en 5A.1 — los íconos vuelven en 5A.2 si decidimos
 * sumarlo. Por ahora los slots quedan documentados con un comentario.
 */
import type { DashboardUserStatsDto } from "@pichichi/shared";

import { cn } from "@/lib/cn";

interface UserStatsSectionProps {
  stats: DashboardUserStatsDto;
  className?: string;
}

interface StatItemProps {
  value: string;
  label: string;
}

function StatItem({ value, label }: StatItemProps) {
  return (
    <div className="flex flex-1 flex-col items-center gap-1">
      {/* TODO 5A.2: ícono lucide-react acá una vez que se agregue la dep. */}
      <span className="text-xl font-extrabold text-text-primary">{value}</span>
      <span className="text-[10px] text-text-muted">{label}</span>
    </div>
  );
}

function StatDivider() {
  return <span aria-hidden className="h-8 w-px bg-border" />;
}

export function UserStatsSection({
  stats,
  className,
}: UserStatsSectionProps) {
  return (
    <section
      data-testid="dashboard-user-stats"
      className={cn(
        "rounded-2xl bg-surface px-4 py-3.5 shadow-sm",
        className,
      )}
    >
      <header className="mb-3 flex items-center gap-1.5">
        <h2 className="text-sm font-bold text-text-primary">
          Tus Estadísticas
        </h2>
      </header>
      <div className="flex items-center">
        <StatItem value={String(stats.totalPoints)} label="Puntos" />
        <StatDivider />
        <StatItem
          value={String(stats.totalPredictions)}
          label="Pronósticos"
        />
        <StatDivider />
        <StatItem
          value={`${Math.round(stats.accuracy)}%`}
          label="Precisión"
        />
        <StatDivider />
        <StatItem value={String(stats.exactCount)} label="Exactos" />
      </div>
    </section>
  );
}
