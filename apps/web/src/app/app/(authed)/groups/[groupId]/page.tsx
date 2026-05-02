"use client";

/**
 * Group detail page — `/app/groups/[groupId]`.
 *
 * Web-equivalent (Phase 5A.2 scope) de `apps/mobile/app/(tabs)/groups/[id].tsx`.
 * Esta versión porta SOLO:
 *   - Header (nombre, descripción, invite code para admin).
 *   - Lista de miembros (`<MemberList>`).
 *   - Danger zone: Salir, Editar (admin), Eliminar (admin).
 *
 * Phase 5B (deferred — NO implementar acá):
 *   - Tournaments del grupo (botón "Agregar torneo", `useGroupTournaments`,
 *     `useAddTournament`, `useRemoveTournament`).
 *   - Upcoming predictions (`useUpcomingPredictions`).
 *   - Leaderboard (`useLeaderboard` + ranking de miembros).
 *   - Member predictions screen (`/app/groups/{id}/members/{userId}`).
 *   - Remove member admin action.
 *
 * 404 / 403 handling literal de mobile (`[id].tsx:155-200`):
 *   - error de query con status 404|403 → invalida `groups.all`,
 *     replace a `/app/groups`, banner "Grupo no disponible".
 *   - error de mutación con status 404|403 → idem.
 *
 * Confirmaciones destructivas literales:
 *   - `leaveGroup`: ramas isLastMember / isAdmin / default (mensajes literales).
 *   - `deleteGroup`: ramas hasOtherMembers / sin otros (mensajes literales).
 *
 * APIs Next 16: en client component leemos `params` con `use()` (params es
 * Promise). Ref: `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/page.md`.
 */
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import {
  useDeleteGroup,
  useGroup,
  useGroupMembers,
  useGroupTournaments,
  useLeaveGroup,
  useRemoveMember,
  useRemoveTournament,
} from "@/hooks/use-groups";
import { checkRemoveTournament } from "@/api/groups";
import { queryKeys } from "@/hooks/query-keys";
import { useConfirmDialog } from "@/hooks/use-confirm-dialog";
import { useAuthStore } from "@/stores/auth-store";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/cn";
import { ConfirmDialog, ErrorState, LoadingScreen } from "@/features/shared";
import { AddTournamentModal, MemberList } from "@/features/groups";
import { LeaderboardList } from "@/features/leaderboard";
import { UpcomingPredictionsSection } from "@/features/predictions";
import {
  TOURNAMENT_STATUS_LABELS,
  TOURNAMENT_TYPE_LABELS,
} from "@/utils/match-helpers";

import type { TournamentDto } from "@pichichi/shared";

interface AxiosLikeError {
  response?: { status?: number };
}

interface GroupDetailPageProps {
  params: Promise<{ groupId: string }>;
}

export default function GroupDetailPage({ params }: GroupDetailPageProps) {
  const { groupId } = use(params);
  const router = useRouter();
  const qc = useQueryClient();

  const currentUserId = useAuthStore((s) => s.user?.id);

  // `enabled` flag turns off background refetches AS SOON AS we trigger a
  // destructive mutation, mirroring mobile's `isGroupRemoved` pattern. Without
  // this, the cache invalidation from `useDeleteGroup`/`useLeaveGroup` would
  // refire `useGroup`/`useGroupMembers` and produce a flash of 404.
  const [isGroupRemoved, setIsGroupRemoved] = useState(false);

  const groupQuery = useGroup(groupId, !isGroupRemoved);
  const membersQuery = useGroupMembers(groupId, !isGroupRemoved);

  const leaveGroup = useLeaveGroup();
  const deleteGroup = useDeleteGroup();
  const removeMember = useRemoveMember();
  const removeTournament = useRemoveTournament();

  const { confirm, dialogProps } = useConfirmDialog();

  const group = groupQuery.data;
  const members = membersQuery.data;
  const isAdmin = group?.userRole === "ADMIN";

  // Tournaments del grupo (admin-only UI). Se gatea con `enabled` cuando
  // el grupo no es admin para no disparar la query inútil; tampoco corre
  // mientras `isGroupRemoved` (mismo patrón que `useGroup`).
  const tournamentsQuery = useGroupTournaments(
    groupId,
    !isGroupRemoved && isAdmin === true,
  );
  const tournaments = tournamentsQuery.data;

  const [addTournamentOpen, setAddTournamentOpen] = useState(false);

  // ── Auto-redirect on 404/403 (mirror mobile [id].tsx:152-173) ──────────
  const hasNavigatedFor404 = useRef(false);
  useEffect(() => {
    if (isGroupRemoved || hasNavigatedFor404.current) return;
    if (!groupQuery.isError) return;

    const status = (groupQuery.error as AxiosLikeError | null)?.response?.status;
    if (status === 404 || status === 403) {
      hasNavigatedFor404.current = true;
      // `setIsGroupRemoved` no se puede llamar síncrono dentro del effect
      // (rule `react-hooks/set-state-in-effect`). El `hasNavigatedFor404`
      // ref ya gatea re-runs, así que diferimos el setState al microtask
      // siguiente. La invalidación + replace siguen siendo síncronos —
      // ninguno toca state local.
      queueMicrotask(() => setIsGroupRemoved(true));
      qc.invalidateQueries({ queryKey: queryKeys.groups.all });
      router.replace(ROUTES.app.groups);
    }
  }, [groupQuery.isError, groupQuery.error, isGroupRemoved, qc, router]);

  function handleMutationError(err: unknown, fallbackMsg: string) {
    const status = (err as AxiosLikeError | null)?.response?.status;
    if (status === 404 || status === 403) {
      qc.invalidateQueries({ queryKey: queryKeys.groups.all });
      router.replace(ROUTES.app.groups);
      return;
    }
    setIsGroupRemoved(false);
    // Best-effort surfacing — web tiene browser alert disponible; un toast
    // global se sumará en Phase 5B.
    if (typeof window !== "undefined") {
      window.alert(fallbackMsg);
    }
  }

  function handleLeave() {
    if (!group || leaveGroup.isPending) return;

    const isLastMember = (members?.length ?? 0) <= 1;
    let description: string;
    if (isLastMember) {
      description =
        "Sos el último miembro del grupo. Si te vas, el grupo se eliminará. ¿Estás seguro?";
    } else if (isAdmin) {
      description =
        "Sos administrador de este grupo. Si te vas, se asignará otro admin automáticamente. ¿Estás seguro?";
    } else {
      description = "¿Estás seguro de que querés salir de este grupo?";
    }

    void (async () => {
      const ok = await confirm({
        title: "Salir del grupo",
        description,
        confirmLabel: "Salir",
        cancelLabel: "Cancelar",
        variant: "danger",
      });
      if (!ok) return;

      setIsGroupRemoved(true);
      leaveGroup.mutate(group.id, {
        onSuccess: () => {
          router.replace(ROUTES.app.groups);
        },
        onError: (err) => {
          handleMutationError(err, "No se pudo salir del grupo. Intentá de nuevo.");
        },
      });
    })();
  }

  function handleKickMember(member: { userId: string; displayName: string }) {
    // Gating mirror exact de mobile [id].tsx:315 —
    //   `if (!group || !isAdmin || member.userId === currentUserId) return;`
    if (!group || !isAdmin || removeMember.isPending) return;
    if (member.userId === currentUserId) return;

    void (async () => {
      const ok = await confirm({
        title: member.displayName,
        description: "¿Querés expulsar a este miembro del grupo?",
        confirmLabel: "Expulsar",
        cancelLabel: "Cancelar",
        variant: "danger",
      });
      if (!ok) return;

      removeMember.mutate(
        { groupId: group.id, userId: member.userId },
        {
          onSuccess: () => {
            // Paridad mobile (Alert.alert "Listo / X fue expulsado del grupo.")
            if (typeof window !== "undefined") {
              window.alert(`${member.displayName} fue expulsado del grupo.`);
            }
          },
          onError: (err) => {
            handleMutationError(
              err,
              "No se pudo expulsar al miembro. Intentá de nuevo.",
            );
          },
        },
      );
    })();
  }

  function handleRemoveTournament(tournament: TournamentDto) {
    if (!group || !isAdmin || removeTournament.isPending) return;

    void (async () => {
      let result: {
        canRemove: boolean;
        predictionsCount: number;
        reason: string | null;
      };
      try {
        result = await checkRemoveTournament(group.id, tournament.id);
      } catch {
        if (typeof window !== "undefined") {
          window.alert("No se pudo verificar el estado del torneo.");
        }
        return;
      }

      if (!result.canRemove) {
        if (typeof window !== "undefined") {
          window.alert("El torneo está en curso o finalizado.");
        }
        return;
      }

      const description =
        result.predictionsCount > 0
          ? `Se borrarán ${result.predictionsCount} predicciones. ¿Estás seguro?`
          : `¿Eliminar ${tournament.name} del grupo?`;

      const ok = await confirm({
        title: "Eliminar torneo",
        description,
        confirmLabel: "Eliminar",
        cancelLabel: "Cancelar",
        variant: "danger",
      });
      if (!ok) return;

      removeTournament.mutate(
        { groupId: group.id, tournamentId: tournament.id },
        {
          onError: () => {
            if (typeof window !== "undefined") {
              window.alert("No se pudo eliminar el torneo. Intentá de nuevo.");
            }
          },
        },
      );
    })();
  }

  function handleDelete() {
    if (!group || deleteGroup.isPending) return;

    const otherMemberCount = (members?.length ?? group.memberCount) - 1;
    const hasOtherMembers = otherMemberCount > 0;

    const description = hasOtherMembers
      ? `Este grupo tiene ${otherMemberCount} ${
          otherMemberCount === 1 ? "miembro más" : "miembros más"
        }. Si lo eliminás, todos los miembros serán removidos. ¿Estás seguro?`
      : "Si el grupo tiene predicciones será archivado, si no será eliminado permanentemente. ¿Estás seguro?";

    void (async () => {
      const ok = await confirm({
        title: "Eliminar grupo",
        description,
        confirmLabel: "Eliminar",
        cancelLabel: "Cancelar",
        variant: "danger",
      });
      if (!ok) return;

      setIsGroupRemoved(true);
      deleteGroup.mutate(group.id, {
        onSuccess: () => {
          router.replace(ROUTES.app.groups);
        },
        onError: (err) => {
          handleMutationError(err, "No se pudo eliminar el grupo. Intentá de nuevo.");
        },
      });
    })();
  }

  // ── Loading ────────────────────────────────────────────────────────────
  if (groupQuery.isLoading || isGroupRemoved) {
    return <LoadingScreen testId="page-group-detail-loading" />;
  }

  // ── Error (non-404/403) ─────────────────────────────────────────────────
  if (groupQuery.isError || !group) {
    return (
      <section
        data-testid="page-group-detail"
        className="flex flex-col gap-4"
      >
        <ErrorState
          testId="page-group-detail-error"
          title="No se pudo cargar el grupo"
          description="Probá de nuevo en unos segundos."
          onRetry={() => groupQuery.refetch()}
        />
        <Link
          href={ROUTES.app.groups}
          className="self-start text-xs font-semibold text-primary hover:underline"
        >
          ← Volver a grupos
        </Link>
      </section>
    );
  }

  // ── Loaded ─────────────────────────────────────────────────────────────
  const memberCountLabel =
    group.memberCount === 1 ? "1 miembro" : `${group.memberCount} miembros`;

  return (
    <section
      data-testid="page-group-detail"
      className="flex flex-col gap-6"
    >
      <header className="flex flex-col gap-2">
        <Link
          href={ROUTES.app.groups}
          data-testid="page-group-detail-back"
          className="text-xs font-semibold text-primary hover:underline"
        >
          ← Volver a grupos
        </Link>
        <div className="flex flex-col gap-1">
          <h1
            data-testid="group-detail-name"
            className="text-2xl font-extrabold text-text-primary"
          >
            {group.name}
          </h1>
          {group.description ? (
            <p className="text-sm text-text-secondary">{group.description}</p>
          ) : (
            <p className="text-sm text-text-tertiary">Grupo de predicciones</p>
          )}
          <p className="text-xs font-medium text-text-secondary">
            {memberCountLabel} · cupo {group.maxMembers}
          </p>
        </div>

        {isAdmin && group.inviteCode ? (
          <InviteCodeBlock code={group.inviteCode} />
        ) : null}
      </header>

      <UpcomingPredictionsSection groupId={group.id} />

      {isAdmin ? (
        <section
          data-testid="group-detail-tournaments-section"
          className="flex flex-col gap-3"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wide text-text-secondary">
              Torneos del grupo
              <span className="ml-2 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary-surface px-1.5 text-[11px] font-bold text-primary">
                {tournaments?.length ?? 0}
              </span>
            </h2>
            <button
              type="button"
              onClick={() => setAddTournamentOpen(true)}
              data-testid="group-detail-tournaments-add"
              className="text-xs font-semibold text-primary hover:underline"
            >
              Agregar
            </button>
          </div>

          {tournamentsQuery.isLoading ? (
            <p
              data-testid="group-detail-tournaments-loading"
              className="text-sm text-text-secondary"
            >
              Cargando torneos…
            </p>
          ) : !tournaments || tournaments.length === 0 ? (
            <div
              data-testid="group-detail-tournaments-empty"
              className="rounded-2xl border border-border bg-white px-4 py-3 text-sm text-text-secondary"
            >
              No hay torneos asociados.
            </div>
          ) : (
            <ul
              data-testid="group-detail-tournaments-list"
              className="flex flex-col gap-2"
            >
              {tournaments.map((t) => {
                const canRemove =
                  t.status === "DRAFT" || t.status === "UPCOMING";
                const typeLabel =
                  TOURNAMENT_TYPE_LABELS[t.type] ?? t.type;
                const statusLabel =
                  TOURNAMENT_STATUS_LABELS[t.status] ?? t.status;

                return (
                  <li
                    key={t.id}
                    data-testid={`group-detail-tournament-${t.id}`}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-white px-4 py-3"
                  >
                    <Link
                      href={ROUTES.app.groupTournament(group.id, t.slug)}
                      className="flex min-w-0 flex-1 items-center gap-3"
                    >
                      <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-surface-light">
                        <span className="text-base font-bold text-primary">
                          {t.name.charAt(0).toUpperCase()}
                        </span>
                        {t.logoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={t.logoUrl}
                            alt=""
                            className="absolute inset-0 h-full w-full rounded-full object-cover"
                          />
                        ) : null}
                      </div>
                      <div className="flex min-w-0 flex-col gap-0.5">
                        <span className="truncate text-sm font-semibold text-text-primary">
                          {t.name}
                        </span>
                        <span className="truncate text-xs text-text-secondary">
                          {typeLabel} · {statusLabel}
                        </span>
                      </div>
                    </Link>

                    {canRemove ? (
                      <button
                        type="button"
                        onClick={() => handleRemoveTournament(t)}
                        disabled={removeTournament.isPending}
                        data-testid={`group-detail-tournament-${t.id}-remove`}
                        aria-label={`Eliminar ${t.name}`}
                        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-danger transition hover:bg-danger/10 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-4 w-4"
                          aria-hidden="true"
                        >
                          <path d="M3 6h18" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                          <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      ) : null}

      {/*
       * Leaderboard del grupo (Phase 5B.2 — port literal de mobile).
       * Mobile lo muestra como `pointsByUser` map embebido en la screen;
       * en web va como sección dedicada con podium + lista completa.
       *
       * Phase 5B (siguientes deferred):
       * - 5B.2: Bonus predictions (campeón, goleador, etc.).
       * - 5B.3: GroupPredictionsSheet (reveal post-lock con predicciones de otros).
       * - 5B.5: Per-member predictions navigation.
       * - 5B.6: Tournaments del grupo (`useGroupTournaments`, `useAddTournament`).
       */}
      <LeaderboardList groupId={group.id} />

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-text-secondary">
          Miembros
        </h2>
        {membersQuery.isLoading ? (
          <p className="text-sm text-text-secondary">Cargando miembros…</p>
        ) : membersQuery.isError ? (
          <p className="text-sm text-danger">
            No se pudieron cargar los miembros.
          </p>
        ) : (
          <MemberList
            members={members ?? []}
            currentUserId={currentUserId}
            isAdmin={isAdmin}
            onKick={handleKickMember}
            isKickPending={removeMember.isPending}
            onMemberClick={(member) =>
              router.push(
                `${ROUTES.app.groupMemberPredictions(group.id, member.userId)}?displayName=${encodeURIComponent(member.displayName)}`,
              )
            }
          />
        )}
      </section>

      <section
        data-testid="group-detail-danger-zone"
        className="flex flex-col gap-2 rounded-2xl border border-border bg-white px-4 py-4"
      >
        <h2 className="text-sm font-bold uppercase tracking-wide text-text-secondary">
          Acciones
        </h2>

        {isAdmin ? (
          <Link
            href={ROUTES.app.groupEdit(group.id)}
            data-testid="group-detail-action-edit"
            className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-white px-4 text-sm font-semibold text-text-primary transition hover:border-primary hover:text-primary"
          >
            Editar grupo
          </Link>
        ) : null}

        <button
          type="button"
          onClick={handleLeave}
          disabled={leaveGroup.isPending}
          data-testid="group-detail-action-leave"
          className={cn(
            "inline-flex h-10 items-center justify-center rounded-md border border-border bg-white px-4 text-sm font-semibold text-text-primary transition",
            leaveGroup.isPending
              ? "cursor-not-allowed opacity-50"
              : "hover:border-danger hover:text-danger",
          )}
        >
          {leaveGroup.isPending ? "Saliendo…" : "Salir del grupo"}
        </button>

        {isAdmin ? (
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleteGroup.isPending}
            data-testid="group-detail-action-delete"
            className={cn(
              "inline-flex h-10 items-center justify-center rounded-md bg-danger px-4 text-sm font-semibold text-white transition",
              deleteGroup.isPending
                ? "cursor-not-allowed opacity-50"
                : "hover:bg-danger/90",
            )}
          >
            {deleteGroup.isPending ? "Eliminando…" : "Eliminar grupo"}
          </button>
        ) : null}
      </section>

      {/* Hint text only useful for admins to share the invite code below. */}
      {currentUserId ? null : null}

      <ConfirmDialog {...dialogProps} testId="group-detail-confirm" />

      {isAdmin ? (
        <AddTournamentModal
          open={addTournamentOpen}
          onClose={() => setAddTournamentOpen(false)}
          groupId={group.id}
          currentTournamentIds={tournaments?.map((t) => t.id) ?? []}
        />
      ) : null}
    </section>
  );
}

function InviteCodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (typeof navigator === "undefined" || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore — user can still read the code on screen.
    }
  }

  return (
    <div
      data-testid="group-detail-invite-code"
      className="mt-2 flex items-center justify-between gap-3 rounded-2xl border border-primary-surface bg-primary-surface/40 px-4 py-3"
    >
      <div className="flex flex-col gap-0.5">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-primary">
          Código de invitación
        </span>
        <span className="text-xl font-extrabold tracking-[0.2em] text-text-primary">
          {code}
        </span>
      </div>
      <button
        type="button"
        onClick={handleCopy}
        data-testid="group-detail-copy-code"
        className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-3 text-xs font-semibold text-text-on-primary transition hover:bg-primary-dark"
      >
        {copied ? "¡Copiado!" : "Copiar"}
      </button>
    </div>
  );
}
