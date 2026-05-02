/**
 * PlanLimitBanner — aviso inline cuando el user alcanzó el límite de
 * grupos creados según su plan.
 *
 * Port literal del Alert que mobile dispara en `handleCreatePress`
 * (`apps/mobile/app/(tabs)/groups/index.tsx:159-164`). En web lo
 * convertimos a banner persistente en la lista — no Alert modal — porque
 * el botón "Crear" sigue visible y no queremos un toast efímero.
 */
import { cn } from "@/lib/cn";

interface PlanLimitBannerProps {
  groupsCreatedCount: number;
  maxGroupsCreated: number;
  className?: string;
}

export function PlanLimitBanner({
  groupsCreatedCount,
  maxGroupsCreated,
  className,
}: PlanLimitBannerProps) {
  return (
    <div
      role="alert"
      data-testid="groups-plan-limit-banner"
      className={cn(
        "rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900",
        className,
      )}
    >
      <p className="font-semibold">Límite alcanzado</p>
      <p className="mt-0.5 text-amber-900/90">
        Tu plan permite crear hasta {maxGroupsCreated} grupos y ya tenés{" "}
        {groupsCreatedCount}. Podés unirte a grupos de otros usuarios con un
        código de invitación.
      </p>
    </div>
  );
}
