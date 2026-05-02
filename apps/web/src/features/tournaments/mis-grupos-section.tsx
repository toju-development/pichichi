"use client";

/**
 * MisGruposSection — port literal de
 * `apps/mobile/app/(tabs)/tournaments/[slug].tsx:173-211`.
 *
 * Lista los grupos del usuario actual que están participando en este torneo.
 * Cada card linkea a `/app/groups/{groupId}/tournament/{slug}`.
 *
 * Render gating (paridad mobile):
 *   - usuario no autenticado → no renderiza nada
 *   - cargando → no renderiza nada (no flicker)
 *   - sin grupos → no renderiza nada
 *
 * Diferencias justificadas web:
 *   - `<ScrollView horizontal>` → contenedor `flex` con `overflow-x-auto`.
 *   - `<Pressable>` → `<Link>` de Next (web es URL-driven).
 *   - icono inline SVG (sin `lucide-react` dep — ver decisión Phase 5B.4).
 */

import Link from "next/link";

import { useMyGroupsByTournament } from "@/hooks/use-groups";
import { useAuthStore } from "@/stores/auth-store";
import { ROUTES } from "@/lib/routes";

// ─── Props ──────────────────────────────────────────────────────────────────

export interface MisGruposSectionProps {
  tournamentId: string;
  tournamentSlug: string;
}

// ─── Icon ───────────────────────────────────────────────────────────────────

function UsersIcon() {
  return (
    <svg
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx={9} cy={7} r={4} />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

// ─── Component ──────────────────────────────────────────────────────────────

export function MisGruposSection({
  tournamentId,
  tournamentSlug,
}: MisGruposSectionProps) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { data: groups, isLoading } = useMyGroupsByTournament(tournamentId);

  // Don't render anything if not authenticated, still loading, or no groups
  // (paridad literal con mobile MisGruposSection).
  if (!isAuthenticated || isLoading || !groups?.length) {
    return null;
  }

  return (
    <section
      data-testid="mis-grupos-section"
      className="flex flex-col gap-3"
    >
      <h2 className="text-sm font-bold uppercase tracking-wide text-text-secondary">
        Mis Grupos
      </h2>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {groups.map((group) => (
          <Link
            key={group.id}
            href={ROUTES.app.groupTournament(group.id, tournamentSlug)}
            data-testid={`mis-grupos-card-${group.id}`}
            className="flex min-w-[160px] flex-row items-center gap-2 rounded-2xl border border-border bg-surface px-3 py-2 text-sm font-semibold text-text-primary shadow-sm transition hover:border-primary"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
              <UsersIcon />
            </span>
            <span className="line-clamp-1">{group.name}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
