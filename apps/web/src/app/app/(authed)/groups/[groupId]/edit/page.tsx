"use client";

/**
 * Edit group page — `/app/groups/[groupId]/edit`.
 *
 * Web-equivalent del modal `EditGroupModal` de mobile. Consume `<GroupForm
 * mode="edit">` y `useUpdateGroup`. Sólo envía el diff vs estado actual; si
 * el form no cambió nada, vuelve a la página de detalle sin mutar.
 *
 * Guard de permisos: si el user no es admin, redirige al detalle. Mobile no
 * expone el botón de editar para no-admins, así que esto es defensa en
 * profundidad.
 *
 * 404/403 handling igual que detail: mutación con status 404|403 → invalida
 * `groups.all`, replace a `/app/groups`.
 */
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { useGroup, useGroupMembers, useUpdateGroup } from "@/hooks/use-groups";
import { queryKeys } from "@/hooks/query-keys";
import { useAuthStore } from "@/stores/auth-store";
import { ROUTES } from "@/lib/routes";
import { ErrorState, LoadingScreen } from "@/features/shared";
import { GroupForm, type GroupFormValues } from "@/features/groups";

interface AxiosLikeError {
  response?: { status?: number; data?: { message?: string } };
}

interface EditGroupPageProps {
  params: Promise<{ groupId: string }>;
}

export default function EditGroupPage({ params }: EditGroupPageProps) {
  const { groupId } = use(params);
  const router = useRouter();
  const qc = useQueryClient();

  const planLimit = useAuthStore((s) => s.user?.plan.maxMembersPerGroup ?? 10);

  const groupQuery = useGroup(groupId);
  const membersQuery = useGroupMembers(groupId);
  const updateGroup = useUpdateGroup();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const group = groupQuery.data;
  const members = membersQuery.data;
  const isAdmin = group?.userRole === "ADMIN";

  // Bounce non-admins back to detail (defensa en profundidad).
  useEffect(() => {
    if (!groupQuery.isSuccess) return;
    if (!isAdmin) {
      router.replace(ROUTES.app.groupDetail(groupId));
    }
  }, [groupQuery.isSuccess, isAdmin, groupId, router]);

  // 404/403 → list, igual que detail.
  useEffect(() => {
    if (!groupQuery.isError) return;
    const status = (groupQuery.error as AxiosLikeError | null)?.response?.status;
    if (status === 404 || status === 403) {
      qc.invalidateQueries({ queryKey: queryKeys.groups.all });
      router.replace(ROUTES.app.groups);
    }
  }, [groupQuery.isError, groupQuery.error, qc, router]);

  if (groupQuery.isLoading || membersQuery.isLoading) {
    return <LoadingScreen testId="page-group-edit-loading" />;
  }

  if (groupQuery.isError || !group) {
    return (
      <section
        data-testid="page-group-edit"
        className="flex flex-col gap-4"
      >
        <ErrorState
          testId="page-group-edit-error"
          title="No se pudo cargar el grupo"
          description="Probá de nuevo en unos segundos."
          onRetry={() => groupQuery.refetch()}
        />
        <Link
          href={ROUTES.app.groupDetail(groupId)}
          className="self-start text-xs font-semibold text-primary hover:underline"
        >
          ← Volver al grupo
        </Link>
      </section>
    );
  }

  if (!isAdmin) {
    // Effect arriba ya replaceó; render seguro vacío hasta el navigation tick.
    return null;
  }

  const memberCount = members?.length ?? group.memberCount;

  function handleSubmit(
    diff: Partial<GroupFormValues>,
    nothingChanged: boolean,
  ) {
    setSubmitError(null);

    if (nothingChanged) {
      router.replace(ROUTES.app.groupDetail(groupId));
      return;
    }

    updateGroup.mutate(
      { id: groupId, data: diff },
      {
        onSuccess: () => {
          router.replace(ROUTES.app.groupDetail(groupId));
        },
        onError: (err) => {
          const status = (err as AxiosLikeError | null)?.response?.status;
          const message = (err as AxiosLikeError | null)?.response?.data?.message;
          if (status === 404 || status === 403) {
            qc.invalidateQueries({ queryKey: queryKeys.groups.all });
            router.replace(ROUTES.app.groups);
            return;
          }
          setSubmitError(
            message ?? "No se pudo actualizar el grupo. Intentá de nuevo.",
          );
        },
      },
    );
  }

  return (
    <section data-testid="page-group-edit" className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <Link
          href={ROUTES.app.groupDetail(groupId)}
          data-testid="page-group-edit-back"
          className="text-xs font-semibold text-primary hover:underline"
        >
          ← Volver al grupo
        </Link>
        <h1 className="text-xl font-semibold text-text-primary">Editar grupo</h1>
        <p className="text-sm text-text-secondary">
          Cambiá los datos del grupo. Sólo se enviarán los campos modificados.
        </p>
      </header>

      <GroupForm
        mode="edit"
        planLimit={planLimit}
        memberCount={memberCount}
        initialValues={{
          name: group.name,
          description: group.description ?? "",
          maxMembers: group.maxMembers,
        }}
        isSubmitting={updateGroup.isPending}
        submitError={submitError}
        onCancel={() => router.push(ROUTES.app.groupDetail(groupId))}
        onSubmit={handleSubmit}
      />
    </section>
  );
}
