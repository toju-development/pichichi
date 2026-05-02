/**
 * TournamentCard — listado de torneos.
 *
 * Port presentacional de `apps/mobile/app/(tabs)/tournaments/index.tsx`
 * (componente local `TournamentCard`). Mantiene la jerarquía: nombre del
 * torneo + chevron, fila con type pill + status pill, fila de meta con
 * fechas y team count.
 *
 * Cada card es un `<Link>` a `/app/tournaments/{slug}`.
 */
import Link from "next/link";

import type {
  TournamentDto,
  TournamentStatus,
  TournamentType,
} from "@pichichi/shared";

import { cn } from "@/lib/cn";
import { ROUTES } from "@/lib/routes";

// ─── Label maps (literal de mobile index.tsx) ──────────────────────────────

const STATUS_LABELS: Record<TournamentStatus, string> = {
  UPCOMING: "Próximamente",
  IN_PROGRESS: "En curso",
  FINISHED: "Finalizado",
  DRAFT: "Borrador",
  CANCELLED: "Cancelado",
};

const TYPE_LABELS: Record<TournamentType, string> = {
  WORLD_CUP: "Copa del Mundo",
  COPA_AMERICA: "Copa América",
  EURO: "Eurocopa",
  CHAMPIONS_LEAGUE: "Champions League",
  COPA_LIBERTADORES: "Copa Libertadores",
  CUSTOM: "Personalizado",
};

const SHORT_MONTHS = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
] as const;

/** Formats a date range like "25 Ene - 8 Nov 2026". */
function formatDateRange(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const startDay = start.getUTCDate();
  const startMonth = SHORT_MONTHS[start.getUTCMonth()];
  const endDay = end.getUTCDate();
  const endMonth = SHORT_MONTHS[end.getUTCMonth()];
  const endYear = end.getUTCFullYear();

  return `${startDay} ${startMonth} - ${endDay} ${endMonth} ${endYear}`;
}

function StatusBadge({ status }: { status: TournamentStatus }) {
  const label = STATUS_LABELS[status] ?? "Próximamente";
  const isLive = status === "IN_PROGRESS";

  return (
    <span
      data-testid={`tournament-card-status-${status.toLowerCase()}`}
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold",
        isLive
          ? "bg-success-soft text-success"
          : "bg-surface-muted text-text-secondary",
      )}
    >
      {label}
    </span>
  );
}

interface TournamentCardProps {
  tournament: TournamentDto;
}

export function TournamentCard({ tournament }: TournamentCardProps) {
  const typeLabel = TYPE_LABELS[tournament.type] ?? tournament.type;
  const dateRange = formatDateRange(tournament.startDate, tournament.endDate);
  const teamCount = tournament.teamCount;
  const teamLabel = teamCount === 1 ? "equipo" : "equipos";

  return (
    <Link
      href={ROUTES.app.tournamentDetail(tournament.slug)}
      data-testid={`tournament-card-${tournament.slug}`}
      className="block rounded-2xl border border-border bg-white px-4 py-3.5 shadow-sm transition hover:border-primary hover:shadow-md focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <h3
            data-testid="tournament-card-name"
            className="truncate text-[15px] font-bold text-text-primary"
          >
            {tournament.name}
          </h3>
          <span aria-hidden className="text-text-tertiary">
            ›
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-md bg-primary-surface px-2 py-0.5 text-[11px] font-semibold text-primary">
            {typeLabel}
          </span>
          <StatusBadge status={tournament.status} />
        </div>

        <div className="flex items-center justify-between gap-3 text-[11px] text-text-secondary">
          <span data-testid="tournament-card-dates">{dateRange}</span>
          {teamCount != null ? (
            <span data-testid="tournament-card-teams">
              {teamCount} {teamLabel}
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
