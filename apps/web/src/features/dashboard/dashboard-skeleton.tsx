/**
 * Skeleton block para una sección del dashboard mientras carga.
 *
 * Réplica visual del `SectionSkeleton` mobile: barra de título + card con
 * dos líneas. Usamos `animate-pulse` de Tailwind 4.
 */
import { cn } from "@/lib/cn";

interface DashboardSectionSkeletonProps {
  className?: string;
  testId?: string;
}

export function DashboardSectionSkeleton({
  className,
  testId = "dashboard-section-skeleton",
}: DashboardSectionSkeletonProps) {
  return (
    <div
      data-testid={testId}
      className={cn("flex flex-col gap-3", className)}
      aria-hidden
    >
      <div className="h-[18px] w-40 animate-pulse rounded-md bg-border" />
      <div className="flex flex-col gap-2 rounded-2xl bg-surface p-5 shadow-sm">
        <div className="h-3.5 w-full animate-pulse rounded bg-border" />
        <div className="h-3.5 w-3/5 animate-pulse rounded bg-border" />
      </div>
    </div>
  );
}
