"use client";

/**
 * Join group page — `/app/groups/join`.
 *
 * Web-equivalent del modal `JoinGroupModal` de mobile. Consume `<JoinForm>`
 * y `useJoinGroup`. Tras unirse, navega al detalle del grupo.
 *
 * Branching de errores literal de mobile (`join-group-modal.tsx:89-114`):
 *   - status 404 || msg includes "not found"/"invalid" → "Código inválido /
 *     No se encontró un grupo con ese código…".
 *   - status 409 || msg includes "already"           → "Ya sos miembro / Ya
 *     estás en este grupo.".
 *   - msg includes "full"/"capacity"/"máximo"        → "Grupo lleno…".
 *   - default                                         → server message o
 *     fallback "No se pudo unir al grupo. Intentá de nuevo.".
 */
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useJoinGroup } from "@/hooks/use-groups";
import { ROUTES } from "@/lib/routes";
import { JoinForm } from "@/features/groups";

interface AxiosLikeError {
  response?: {
    status?: number;
    data?: { message?: string };
  };
}

function classifyJoinError(error: unknown): string {
  const axiosErr = error as AxiosLikeError | null;
  const status = axiosErr?.response?.status;
  const message = axiosErr?.response?.data?.message;
  const lower = message?.toLowerCase() ?? "";

  if (status === 404 || lower.includes("not found") || lower.includes("invalid")) {
    return "Código inválido. No se encontró un grupo con ese código. Verificá que esté bien escrito.";
  }
  if (status === 409 || lower.includes("already")) {
    return "Ya estás en este grupo.";
  }
  if (
    lower.includes("full") ||
    lower.includes("capacity") ||
    lower.includes("máximo")
  ) {
    return "Este grupo ya alcanzó el máximo de miembros.";
  }
  return message ?? "No se pudo unir al grupo. Intentá de nuevo.";
}

export default function JoinGroupPage() {
  const router = useRouter();
  const joinGroup = useJoinGroup();
  const [submitError, setSubmitError] = useState<string | null>(null);

  function handleSubmit(inviteCode: string) {
    setSubmitError(null);

    joinGroup.mutate(inviteCode, {
      onSuccess: (group) => {
        router.replace(ROUTES.app.groupDetail(group.id));
      },
      onError: (err) => {
        setSubmitError(classifyJoinError(err));
      },
    });
  }

  return (
    <section data-testid="page-groups-join" className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <Link
          href={ROUTES.app.groups}
          data-testid="page-groups-join-back"
          className="text-xs font-semibold text-primary hover:underline"
        >
          ← Volver a grupos
        </Link>
        <h1 className="text-xl font-semibold text-text-primary">
          Unirme a un grupo
        </h1>
      </header>

      <JoinForm
        isSubmitting={joinGroup.isPending}
        submitError={submitError}
        onCancel={() => router.push(ROUTES.app.groups)}
        onSubmit={handleSubmit}
      />
    </section>
  );
}
