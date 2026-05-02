/**
 * TournamentHeader — header del detalle de un torneo.
 *
 * Port presentacional del header de `apps/mobile/app/(tabs)/tournaments/[slug].tsx`
 * (`ScreenHeader title={tournament.name} subtitle={typeLabel}`). Web no usa
 * gradient: convención de detail pages (ver groups/[groupId]) — un h1 limpio
 * + status pill + back link. Mantenemos las MISMAS labels que mobile para
 * paridad visual de copy.
 */
import Link from "next/link";

import type {
  TournamentDto,
  TournamentStatus,
  TournamentType,
} from "@pichichi/shared";

import { cn } from "@/lib/cn";
import { ROUTES } from "@/lib/routes";

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

interface TournamentHeaderProps {
  tournament: TournamentDto;
}

export function TournamentHeader({ tournament }: TournamentHeaderProps) {
  const typeLabel = TYPE_LABELS[tournament.type] ?? tournament.type;
  const statusLabel = STATUS_LABELS[tournament.status] ?? "Próximamente";
  const isLive = tournament.status === "IN_PROGRESS";
  const dateRange = formatDateRange(tournament.startDate, tournament.endDate);

  return (
    <header
      data-testid="tournament-detail-header"
      className="flex flex-col gap-2"
    >
      <Link
        href={ROUTES.app.tournaments}
        data-testid="tournament-detail-back"
        className="text-xs font-semibold text-primary hover:underline"
      >
        ← Volver a torneos
      </Link>

      <div className="flex flex-col gap-1">
        <h1
          data-testid="tournament-detail-name"
          className="text-2xl font-extrabold text-text-primary"
        >
          {tournament.name}
        </h1>
        <p
          data-testid="tournament-detail-type"
          className="text-sm text-text-secondary"
        >
          {typeLabel}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span
          data-testid={`tournament-detail-status-${tournament.status.toLowerCase()}`}
          className={cn(
            "inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold",
            isLive
              ? "bg-success-soft text-success"
              : "bg-surface-muted text-text-secondary",
          )}
        >
          {statusLabel}
        </span>
        <span
          data-testid="tournament-detail-dates"
          className="text-xs text-text-secondary"
        >
          {dateRange}
        </span>
        {tournament.teamCount != null ? (
          <span
            data-testid="tournament-detail-team-count"
            className="text-xs text-text-secondary"
          >
            · {tournament.teamCount}{" "}
            {tournament.teamCount === 1 ? "equipo" : "equipos"}
          </span>
        ) : null}
      </div>
    </header>
  );
}
