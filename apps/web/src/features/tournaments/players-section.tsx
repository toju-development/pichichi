/**
 * PlayersSection — muestra los jugadores del torneo agrupados por equipo.
 *
 * Construido a partir de `useTournamentPlayers(tournamentId)`. Mismo razonamiento
 * que `TeamsSection`: en mobile el hook sólo se usaba dentro del bonus-section
 * de predictions; en web lo exponemos como sección visible del detail.
 *
 * Render simple — agrupa por `teamName`, lista los jugadores con dorsal,
 * posición y nombre. No paginamos: lo hace el endpoint si hace falta.
 */
"use client";

import type { TournamentPlayerResponseDto } from "@pichichi/shared";

import { useTournamentPlayers } from "@/hooks/use-tournaments";

interface PlayersSectionProps {
  tournamentId: string;
}

function groupPlayersByTeam(
  players: TournamentPlayerResponseDto[],
): Array<{ teamId: string; teamName: string; players: TournamentPlayerResponseDto[] }> {
  const map = new Map<
    string,
    { teamId: string; teamName: string; players: TournamentPlayerResponseDto[] }
  >();
  for (const p of players) {
    const existing = map.get(p.teamId);
    if (existing) {
      existing.players.push(p);
    } else {
      map.set(p.teamId, {
        teamId: p.teamId,
        teamName: p.teamName,
        players: [p],
      });
    }
  }
  return [...map.values()].sort((a, b) =>
    a.teamName.localeCompare(b.teamName),
  );
}

export function PlayersSection({ tournamentId }: PlayersSectionProps) {
  const playersQuery = useTournamentPlayers(tournamentId);

  return (
    <section
      data-testid="tournament-players-section"
      className="flex flex-col gap-3"
    >
      <h2 className="text-sm font-bold uppercase tracking-wide text-text-secondary">
        Jugadores
      </h2>

      {playersQuery.isLoading ? (
        <p
          data-testid="tournament-players-loading"
          className="text-sm text-text-secondary"
        >
          Cargando jugadores…
        </p>
      ) : playersQuery.isError ? (
        <p
          data-testid="tournament-players-error"
          className="text-sm text-danger"
        >
          No se pudieron cargar los jugadores.
        </p>
      ) : (playersQuery.data?.length ?? 0) === 0 ? (
        <p
          data-testid="tournament-players-empty"
          className="text-sm text-text-secondary"
        >
          Aún no hay jugadores cargados para este torneo.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {groupPlayersByTeam(playersQuery.data ?? []).map(
            ({ teamId, teamName, players }) => (
              <div
                key={teamId}
                data-testid={`tournament-players-team-${teamId}`}
                className="flex flex-col gap-2"
              >
                <h3 className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">
                  {teamName}
                </h3>
                <ul className="flex flex-col gap-1.5">
                  {players.map((player) => (
                    <li
                      key={player.id}
                      data-testid={`tournament-player-${player.id}`}
                      className="flex items-center gap-3 rounded-lg border border-border bg-white px-3 py-2"
                    >
                      <span
                        aria-hidden
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-muted text-[11px] font-bold text-text-primary"
                      >
                        {player.shirtNumber ?? "—"}
                      </span>
                      <span className="flex-1 text-sm font-medium text-text-primary">
                        {player.name}
                      </span>
                      {player.position ? (
                        <span className="text-[11px] font-semibold uppercase tracking-wide text-text-tertiary">
                          {player.position}
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
