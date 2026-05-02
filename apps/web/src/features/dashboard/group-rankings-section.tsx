/**
 * GroupRankingsSection web — port presentacional de mobile.
 *
 * Renderiza:
 *   - Empty state con CTAs ("Tengo un código" / "Crear grupo") como
 *     `<Link>` a `/app/groups?action=join|create`. Las modals reales
 *     se abren en Phase 5A.2 leyendo `useSearchParams`.
 *   - Lista de cards con groupName, miembros y puntos del user.
 *
 * NO replica (Phase 5B):
 *   - Click en card que navega al detalle del grupo
 *   - Link "Ver todos" (mobile navega a /(tabs)/groups)
 *
 * Decisión 5A.1: las cards quedan como `<article>` estáticos para no
 * mezclar layout con behaviour modal. El "Ver todos" sí lo dejamos como
 * `<Link>` porque la ruta `/app/groups` ya existe (placeholder).
 */
import Link from "next/link";

import type { DashboardGroupRankingDto } from "@pichichi/shared";

import { ROUTES } from "@/lib/routes";

interface GroupRankingsSectionProps {
  groups: DashboardGroupRankingDto[];
}

function GroupCard({ group }: { group: DashboardGroupRankingDto }) {
  const memberLabel = group.totalMembers === 1 ? "miembro" : "miembros";

  return (
    <article
      data-testid={`dashboard-group-card-${group.groupId}`}
      className="rounded-2xl border border-border bg-white px-4 py-3.5 shadow-sm"
    >
      <div className="flex items-center justify-between">
        <div className="mr-3 flex flex-1 flex-col">
          <span className="truncate text-sm font-bold text-text-primary">
            {group.groupName}
          </span>
          <span className="mt-0.5 text-[11px] font-medium text-[#6B7280]">
            {group.totalMembers} {memberLabel}
          </span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-lg font-extrabold text-primary">
            {group.userPoints}
          </span>
          <span className="text-[11px] font-medium text-[#6B7280]">pts</span>
        </div>
      </div>
    </article>
  );
}

export function GroupRankingsSection({ groups }: GroupRankingsSectionProps) {
  if (groups.length === 0) {
    return (
      <section
        data-testid="dashboard-group-rankings"
        className="flex flex-col gap-3"
      >
        <h2 className="text-lg font-bold text-text-primary">Mis Grupos</h2>
        <div className="flex flex-col items-center gap-1.5 rounded-2xl border border-border bg-surface px-5 py-7 text-center">
          <span aria-hidden className="text-3xl">
            👥
          </span>
          <p className="mt-2 text-base font-bold text-text-primary">
            ¡Sumate al prode!
          </p>
          <p className="text-[13px] leading-snug text-text-secondary">
            Creá un grupo o ingresá con el código de un amigo
          </p>
          <div className="mt-4 flex w-full gap-2.5">
            <Link
              href={`${ROUTES.app.groups}?action=join`}
              data-testid="dashboard-empty-cta-join"
              className="flex-1 rounded-md border border-primary px-4 py-2 text-center text-sm font-semibold text-primary transition hover:bg-primary-surface"
            >
              Tengo un código
            </Link>
            <Link
              href={`${ROUTES.app.groups}?action=create`}
              data-testid="dashboard-empty-cta-create"
              className="flex-1 rounded-md bg-primary px-4 py-2 text-center text-sm font-semibold text-text-on-primary transition hover:bg-primary-dark"
            >
              Crear grupo
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      data-testid="dashboard-group-rankings"
      className="flex flex-col gap-2.5"
    >
      <header className="mb-1 flex items-center justify-between">
        <h2 className="text-lg font-bold text-text-primary">Mis Grupos</h2>
        <Link
          href={ROUTES.app.groups}
          className="text-sm font-semibold text-primary"
        >
          Ver todos
        </Link>
      </header>

      {groups.map((group) => (
        <GroupCard key={group.groupId} group={group} />
      ))}
    </section>
  );
}
