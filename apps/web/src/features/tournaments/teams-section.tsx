/**
 * TeamsSection — muestra los equipos del torneo agrupados por `groupName`.
 *
 * Construido a partir de `useTournamentTeams(tournamentId)`. Mobile sólo
 * usa el hook dentro de `bonus-section.tsx`; en web lo exponemos como
 * sección visible del detail siguiendo el pedido explícito del producto.
 *
 * Estados: loading, error (mensaje literal), empty, lista agrupada por
 * `groupName` (sin grupo → "Sin grupo asignado").
 */
"use client";

import type { TournamentTeamDto } from "@pichichi/shared";

import { useTournamentTeams } from "@/hooks/use-tournaments";

interface TeamsSectionProps {
  tournamentId: string;
}

const NO_GROUP_LABEL = "Sin grupo asignado";

function groupTeamsByGroupName(
  teams: TournamentTeamDto[],
): Array<{ groupName: string; teams: TournamentTeamDto[] }> {
  const map = new Map<string, TournamentTeamDto[]>();
  for (const team of teams) {
    const key = team.groupName ?? NO_GROUP_LABEL;
    const existing = map.get(key);
    if (existing) {
      existing.push(team);
    } else {
      map.set(key, [team]);
    }
  }
  return [...map.entries()]
    .sort(([a], [b]) => {
      if (a === NO_GROUP_LABEL) return 1;
      if (b === NO_GROUP_LABEL) return -1;
      return a.localeCompare(b);
    })
    .map(([groupName, teams]) => ({ groupName, teams }));
}

export function TeamsSection({ tournamentId }: TeamsSectionProps) {
  const teamsQuery = useTournamentTeams(tournamentId);

  return (
    <section
      data-testid="tournament-teams-section"
      className="flex flex-col gap-3"
    >
      <h2 className="text-sm font-bold uppercase tracking-wide text-text-secondary">
        Equipos
      </h2>

      {teamsQuery.isLoading ? (
        <p
          data-testid="tournament-teams-loading"
          className="text-sm text-text-secondary"
        >
          Cargando equipos…
        </p>
      ) : teamsQuery.isError ? (
        <p
          data-testid="tournament-teams-error"
          className="text-sm text-danger"
        >
          No se pudieron cargar los equipos.
        </p>
      ) : (teamsQuery.data?.length ?? 0) === 0 ? (
        <p
          data-testid="tournament-teams-empty"
          className="text-sm text-text-secondary"
        >
          Aún no hay equipos cargados para este torneo.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {groupTeamsByGroupName(teamsQuery.data ?? []).map(
            ({ groupName, teams }) => (
              <div
                key={groupName}
                data-testid={`tournament-teams-group-${groupName}`}
                className="flex flex-col gap-2"
              >
                <h3 className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">
                  {groupName}
                </h3>
                <ul className="flex flex-col gap-1.5">
                  {teams.map((team) => (
                    <li
                      key={team.id}
                      data-testid={`tournament-team-${team.id}`}
                      className="flex items-center gap-3 rounded-lg border border-border bg-white px-3 py-2"
                    >
                      {team.logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={team.logoUrl}
                          alt=""
                          className="h-6 w-6 rounded-full bg-surface-muted object-contain"
                        />
                      ) : (
                        <span
                          aria-hidden
                          className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-muted text-[10px] font-semibold text-text-secondary"
                        >
                          {team.shortName.slice(0, 3).toUpperCase()}
                        </span>
                      )}
                      <span className="flex-1 text-sm font-medium text-text-primary">
                        {team.name}
                      </span>
                      {team.isEliminated ? (
                        <span
                          data-testid={`tournament-team-${team.id}-eliminated`}
                          className="inline-flex items-center rounded-md bg-surface-muted px-2 py-0.5 text-[10px] font-semibold text-text-tertiary"
                        >
                          Eliminado
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            ),
          )}
        </div>
      )}
    </section>
  );
}
