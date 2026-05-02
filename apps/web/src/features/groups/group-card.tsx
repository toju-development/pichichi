/**
 * GroupCard — listado de grupos del usuario.
 *
 * Port presentacional de `apps/mobile/app/(tabs)/groups/index.tsx`
 * (componente local `GroupCard` + `RoleBadge`). Mantiene la jerarquía:
 * nombre del grupo grande, fila inferior con member count + role badge.
 *
 * Cada card es un `<Link>` a `/app/groups/{id}` para navegar al detalle.
 */
import Link from "next/link";

import type { GroupDto } from "@pichichi/shared";

import { cn } from "@/lib/cn";
import { ROUTES } from "@/lib/routes";

interface GroupCardProps {
  group: GroupDto;
}

function RoleBadge({ role }: { role: string }) {
  const isAdmin = role === "ADMIN";

  return (
    <span
      data-testid={`group-card-role-${isAdmin ? "admin" : "member"}`}
      className={cn(
        "inline-flex items-center rounded-md px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide",
        isAdmin
          ? "bg-primary-dark text-accent"
          : "bg-primary-surface text-primary",
      )}
    >
      {isAdmin ? "Admin" : "Miembro"}
    </span>
  );
}

export function GroupCard({ group }: GroupCardProps) {
  const memberLabel = group.memberCount === 1 ? "miembro" : "miembros";

  return (
    <Link
      href={ROUTES.app.groupDetail(group.id)}
      data-testid={`group-card-${group.id}`}
      className="block rounded-2xl border border-border bg-white px-4 py-3.5 shadow-sm transition hover:border-primary hover:shadow-md focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <div className="flex flex-col gap-1.5">
        <h3 className="truncate text-[15px] font-bold text-text-primary">
          {group.name}
        </h3>
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-text-secondary">
            {group.memberCount} {memberLabel}
          </span>
          <RoleBadge role={group.userRole} />
        </div>
      </div>
    </Link>
  );
}
