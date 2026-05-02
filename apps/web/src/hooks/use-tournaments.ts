/**
 * Tournaments query hooks.
 *
 * Port literal de `apps/mobile/src/hooks/use-tournaments.ts`. Mantiene los
 * MISMOS query keys y los MISMOS nombres de hook que mobile — requisito
 * de paridad para que las reglas de invalidación funcionen igual en ambos
 * clientes.
 *
 * Cualquier cambio acá DEBE replicarse en mobile (y viceversa).
 */
import { useQuery } from "@tanstack/react-query";
import { TOURNAMENT_STATUS } from "@pichichi/shared";

import { tournamentsApi } from "@/api";

import { queryKeys } from "./query-keys";

export function useTournaments() {
  return useQuery({
    queryKey: queryKeys.tournaments.all,
    queryFn: () => tournamentsApi.getTournaments(),
  });
}

export function usePlayableTournaments() {
  return useQuery({
    queryKey: queryKeys.tournaments.playable,
    queryFn: () =>
      tournamentsApi.getTournaments({
        statuses: [TOURNAMENT_STATUS.UPCOMING, TOURNAMENT_STATUS.IN_PROGRESS],
      }),
  });
}

export function useTournament(slug: string) {
  return useQuery({
    queryKey: queryKeys.tournaments.bySlug(slug),
    queryFn: () => tournamentsApi.getTournamentBySlug(slug),
    enabled: !!slug,
  });
}

export function useTournamentTeams(id: string) {
  return useQuery({
    queryKey: queryKeys.tournaments.teams(id),
    queryFn: () => tournamentsApi.getTournamentTeams(id),
    enabled: !!id,
  });
}

export function useTournamentPlayers(tournamentId: string) {
  return useQuery({
    queryKey: queryKeys.tournaments.players(tournamentId),
    queryFn: () => tournamentsApi.getTournamentPlayers(tournamentId),
    enabled: !!tournamentId,
  });
}
