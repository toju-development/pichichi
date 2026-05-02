"use client";

/**
 * Groups list page — `/app/groups`.
 *
 * Port literal de `apps/mobile/app/(tabs)/groups/index.tsx` adaptado a la
 * convención web: en lugar de modales locales, los flujos de creación y
 * de unirse viven en `/app/groups/create` y `/app/groups/join`.
 *
 * Honra el contrato del dashboard (`GroupRankingsSection`) que linkea a
 * `/app/groups?action=create|join`: si llega ese query param, redirige
 * automáticamente a la subruta correspondiente. Para `?action=create`,
 * la redirección sólo se dispara si el plan permite crear (mirror del
 * gate de mobile en `handleCreatePress`).
 *
 * Plan-limit gate (literal mobile, línea 156):
 *   groupsCreatedCount = groups.filter(g => g.createdBy === user.id).length;
 *   canCreateGroup = groupsCreatedCount < user.plan.maxGroupsCreated;
 *
 * NOTA: las APIs `params` y `searchParams` en Next 16 son Promises. Esta
 * page consume `useSearchParams()` (sync) para client-side reactividad
 * sobre `?action`.
 */
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

import { useMyGroups } from "@/hooks/use-groups";
import { useAuthStore } from "@/stores/auth-store";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/cn";
import { EmptyState, ErrorState, LoadingScreen } from "@/features/shared";
import { GroupCard, PlanLimitBanner } from "@/features/groups";

export default function GroupsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const action = searchParams.get("action");

  const user = useAuthStore((s) => s.user);
  const maxGroupsCreated = user?.plan.maxGroupsCreated ?? 3;

  const groupsQuery = useMyGroups();
  const groups = groupsQuery.data;

  const groupsCreatedCount = (groups ?? []).filter(
    (g) => g.createdBy === user?.id,
  ).length;
  const canCreateGroup = groupsCreatedCount < maxGroupsCreated;

  // Honor dashboard CTA contract: ?action=create|join → push to subroute.
  useEffect(() => {
    if (!action) return;
    if (action === "join") {
      router.replace(ROUTES.app.groupsJoin);
      return;
    }
    if (action === "create" && canCreateGroup) {
      router.replace(ROUTES.app.groupsCreate);
    }
    // If action=create but plan-limit reached, fall through and let the
    // banner explain why nothing happened.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [action, canCreateGroup]);

  if (groupsQuery.isLoading) {
    return <LoadingScreen testId="page-groups-loading" />;
  }

  if (groupsQuery.isError) {
    return (
      <section data-testid="page-groups" className="flex flex-col gap-4">
        <Header />
        <ErrorState
          testId="page-groups-error"
          title="Error al cargar grupos"
          description="No se pudieron cargar tus grupos. Probá de nuevo."
          onRetry={() => groupsQuery.refetch()}
        />
      </section>
    );
  }

  const hasGroups = (groups?.length ?? 0) > 0;

  return (
    <section data-testid="page-groups" className="flex flex-col gap-4">
      <Header />

      {!canCreateGroup ? (
        <PlanLimitBanner
          groupsCreatedCount={groupsCreatedCount}
          maxGroupsCreated={maxGroupsCreated}
        />
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Link
          href={ROUTES.app.groupsCreate}
          aria-disabled={!canCreateGroup}
          tabIndex={canCreateGroup ? 0 : -1}
          onClick={(event) => {
            if (!canCreateGroup) event.preventDefault();
          }}
          data-testid="groups-cta-create"
          className={cn(
            "inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-text-on-primary transition",
            canCreateGroup
              ? "hover:bg-primary-dark"
              : "cursor-not-allowed opacity-50",
          )}
        >
          Crear grupo
        </Link>
        <Link
          href={ROUTES.app.groupsJoin}
          data-testid="groups-cta-join"
          className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-white px-4 text-sm font-semibold text-text-primary transition hover:border-primary hover:text-primary"
        >
          Unirme con código
        </Link>
      </div>

      {hasGroups ? (
        <ul
          data-testid="groups-list"
          className="flex flex-col gap-2"
        >
          {(groups ?? []).map((group) => (
            <li key={group.id}>
              <GroupCard group={group} />
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          testId="page-groups-empty"
          title="No tenés grupos todavía"
          description="Creá un grupo para jugar con amigos o unite con un código de invitación."
          action={
            <Link
              href={ROUTES.app.groupsJoin}
              data-testid="page-groups-empty-join"
              className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-white px-4 text-sm font-semibold text-text-primary transition hover:border-primary hover:text-primary"
            >
              ¿Tenés un código? Unirme
            </Link>
          }
        />
      )}
    </section>
  );
}

function Header() {
  return (
    <header className="flex flex-col gap-1">
      <h1 className="text-xl font-semibold text-text-primary">Mis grupos</h1>
      <p className="text-sm text-text-secondary">
        Gestioná tus grupos y unite con un código de invitación.
      </p>
    </header>
  );
}
