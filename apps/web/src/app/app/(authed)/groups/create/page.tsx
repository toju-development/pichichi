"use client";

/**
 * Create group page — `/app/groups/create`.
 *
 * Web-equivalent del modal `CreateGroupModal` de mobile. Consume `<GroupForm
 * mode="create">` y `useCreateGroup`. Tras crear, navega al detalle del
 * nuevo grupo.
 *
 * Error handling literal de mobile (`create-group-modal.tsx:158-179`):
 *   - status 403 → "Límite alcanzado", usa `response.data.message` si viene,
 *     fallback "Alcanzaste el límite de grupos de tu plan.".
 *   - cualquier otro → mensaje del server o "No se pudo crear el grupo.
 *     Intentá de nuevo.".
 *
 * NO portamos selección de torneos (Phase 5A.3).
 */
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useCreateGroup } from "@/hooks/use-groups";
import { useAuthStore } from "@/stores/auth-store";
import { ROUTES } from "@/lib/routes";
import { GroupForm, type GroupFormValues } from "@/features/groups";

interface AxiosLikeError {
  response?: {
    status?: number;
    data?: { message?: string };
  };
}

function extractServerMessage(error: unknown): {
  status: number | undefined;
  message: string | undefined;
} {
  const axiosErr = error as AxiosLikeError | null;
  return {
    status: axiosErr?.response?.status,
    message: axiosErr?.response?.data?.message,
  };
}

export default function CreateGroupPage() {
  const router = useRouter();
  const planLimit = useAuthStore((s) => s.user?.plan.maxMembersPerGroup ?? 10);

  const createGroup = useCreateGroup();
  const [submitError, setSubmitError] = useState<string | null>(null);

  function handleSubmit(values: GroupFormValues) {
    setSubmitError(null);

    createGroup.mutate(values, {
      onSuccess: (group) => {
        router.replace(ROUTES.app.groupDetail(group.id));
      },
      onError: (err) => {
        const { status, message } = extractServerMessage(err);
        if (status === 403) {
          setSubmitError(
            message ?? "Alcanzaste el límite de grupos de tu plan.",
          );
          return;
        }
        setSubmitError(message ?? "No se pudo crear el grupo. Intentá de nuevo.");
      },
    });
  }

  return (
    <section
      data-testid="page-groups-create"
      className="flex flex-col gap-6"
    >
      <header className="flex flex-col gap-1">
        <Link
          href={ROUTES.app.groups}
          data-testid="page-groups-create-back"
          className="text-xs font-semibold text-primary hover:underline"
        >
          ← Volver a grupos
        </Link>
        <h1 className="text-xl font-semibold text-text-primary">Crear grupo</h1>
        <p className="text-sm text-text-secondary">
          Elegí un nombre y un cupo de miembros. Vas a poder agregar torneos
          después de crearlo.
        </p>
      </header>

      <GroupForm
        mode="create"
        planLimit={planLimit}
        isSubmitting={createGroup.isPending}
        submitError={submitError}
        onCancel={() => router.push(ROUTES.app.groups)}
        onSubmit={handleSubmit}
      />
    </section>
  );
}
