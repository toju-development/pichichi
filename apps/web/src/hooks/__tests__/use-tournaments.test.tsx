/**
 * Smoke tests para los hooks de tournaments. Cubren paridad con mobile en lo
 * crítico:
 *   - `useTournaments` consume `tournamentsApi.getTournaments()` con la
 *     query key `queryKeys.tournaments.all`.
 *   - `usePlayableTournaments` envía `statuses: [UPCOMING, IN_PROGRESS]`
 *     y usa la query key `queryKeys.tournaments.playable`.
 *   - `useTournament(slug)` queda deshabilitado si `slug` es vacío.
 *   - `useTournamentTeams` y `useTournamentPlayers` ídem (gate por id).
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

import type {
  TournamentDto,
  TournamentPlayerResponseDto,
  TournamentTeamDto,
} from "@pichichi/shared";

const getTournamentsMock = vi.fn();
const getTournamentBySlugMock = vi.fn();
const getTournamentTeamsMock = vi.fn();
const getTournamentPlayersMock = vi.fn();

vi.mock("@/api", async () => {
  const actual = await vi.importActual<typeof import("@/api")>("@/api");
  return {
    ...actual,
    tournamentsApi: {
      ...actual.tournamentsApi,
      getTournaments: (...args: unknown[]) => getTournamentsMock(...args),
      getTournamentBySlug: (...args: unknown[]) =>
        getTournamentBySlugMock(...args),
      getTournamentTeams: (...args: unknown[]) =>
        getTournamentTeamsMock(...args),
      getTournamentPlayers: (...args: unknown[]) =>
        getTournamentPlayersMock(...args),
    },
  };
});

import { queryKeys } from "@/hooks/query-keys";
import {
  usePlayableTournaments,
  useTournament,
  useTournamentPlayers,
  useTournaments,
  useTournamentTeams,
} from "@/hooks/use-tournaments";

const tournamentFixture: TournamentDto = {
  id: "t-1",
  name: "Mundial 2026",
  slug: "mundial-2026",
  type: "WORLD_CUP",
  description: null,
  logoUrl: null,
  startDate: "2026-06-11T00:00:00.000Z",
  endDate: "2026-07-19T00:00:00.000Z",
  status: "UPCOMING",
  isActive: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  teamCount: 48,
};

const teamFixture: TournamentTeamDto = {
  id: "tt-1",
  teamId: "team-1",
  name: "Argentina",
  shortName: "ARG",
  logoUrl: null,
  groupName: "Grupo A",
  isEliminated: false,
  externalId: null,
};

const playerFixture: TournamentPlayerResponseDto = {
  id: "tp-1",
  playerId: "player-1",
  externalId: null,
  name: "Lionel Messi",
  photoUrl: null,
  position: "FWD",
  shirtNumber: 10,
  teamId: "team-1",
  teamName: "Argentina",
  teamLogoUrl: null,
  teamExternalId: null,
};

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  }
  return { qc, Wrapper };
}

describe("useTournaments", () => {
  beforeEach(() => {
    getTournamentsMock.mockReset();
  });

  it("consume tournamentsApi.getTournaments y devuelve la lista", async () => {
    getTournamentsMock.mockResolvedValue([tournamentFixture]);
    const { qc, Wrapper } = makeWrapper();

    const { result } = renderHook(() => useTournaments(), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual([tournamentFixture]);
    expect(getTournamentsMock).toHaveBeenCalledTimes(1);
    expect(qc.getQueryData(queryKeys.tournaments.all)).toEqual([
      tournamentFixture,
    ]);
  });
});

describe("usePlayableTournaments", () => {
  beforeEach(() => {
    getTournamentsMock.mockReset();
  });

  it("envía filtros UPCOMING + IN_PROGRESS y usa la query key playable", async () => {
    getTournamentsMock.mockResolvedValue([tournamentFixture]);
    const { qc, Wrapper } = makeWrapper();

    const { result } = renderHook(() => usePlayableTournaments(), {
      wrapper: Wrapper,
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(getTournamentsMock).toHaveBeenCalledTimes(1);
    expect(getTournamentsMock.mock.calls[0]?.[0]).toEqual({
      statuses: ["UPCOMING", "IN_PROGRESS"],
    });
    expect(qc.getQueryData(queryKeys.tournaments.playable)).toEqual([
      tournamentFixture,
    ]);
  });
});

describe("useTournament", () => {
  beforeEach(() => {
    getTournamentBySlugMock.mockReset();
  });

  it("no dispara la fetch cuando slug es vacío", async () => {
    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useTournament(""), {
      wrapper: Wrapper,
    });

    // Deshabilitado → no fetch, no loading.
    expect(result.current.fetchStatus).toBe("idle");
    expect(getTournamentBySlugMock).not.toHaveBeenCalled();
  });

  it("fetchea por slug y guarda con la query key bySlug", async () => {
    getTournamentBySlugMock.mockResolvedValue(tournamentFixture);
    const { qc, Wrapper } = makeWrapper();

    const { result } = renderHook(() => useTournament("mundial-2026"), {
      wrapper: Wrapper,
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(getTournamentBySlugMock).toHaveBeenCalledWith("mundial-2026");
    expect(
      qc.getQueryData(queryKeys.tournaments.bySlug("mundial-2026")),
    ).toEqual(tournamentFixture);
  });
});

describe("useTournamentTeams", () => {
  beforeEach(() => {
    getTournamentTeamsMock.mockReset();
  });

  it("no dispara la fetch cuando id es vacío", () => {
    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useTournamentTeams(""), {
      wrapper: Wrapper,
    });
    expect(result.current.fetchStatus).toBe("idle");
    expect(getTournamentTeamsMock).not.toHaveBeenCalled();
  });

  it("fetchea por id y guarda con la query key teams", async () => {
    getTournamentTeamsMock.mockResolvedValue([teamFixture]);
    const { qc, Wrapper } = makeWrapper();

    const { result } = renderHook(() => useTournamentTeams("t-1"), {
      wrapper: Wrapper,
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(getTournamentTeamsMock).toHaveBeenCalledWith("t-1");
    expect(qc.getQueryData(queryKeys.tournaments.teams("t-1"))).toEqual([
      teamFixture,
    ]);
  });
});

describe("useTournamentPlayers", () => {
  beforeEach(() => {
    getTournamentPlayersMock.mockReset();
  });

  it("no dispara la fetch cuando tournamentId es vacío", () => {
    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useTournamentPlayers(""), {
      wrapper: Wrapper,
    });
    expect(result.current.fetchStatus).toBe("idle");
    expect(getTournamentPlayersMock).not.toHaveBeenCalled();
  });

  it("fetchea por tournamentId y guarda con la query key players", async () => {
    getTournamentPlayersMock.mockResolvedValue([playerFixture]);
    const { qc, Wrapper } = makeWrapper();

    const { result } = renderHook(() => useTournamentPlayers("t-1"), {
      wrapper: Wrapper,
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(getTournamentPlayersMock).toHaveBeenCalledWith("t-1");
    expect(qc.getQueryData(queryKeys.tournaments.players("t-1"))).toEqual([
      playerFixture,
    ]);
  });
});
