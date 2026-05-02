/**
 * MatchesByPhaseTabs smoke tests.
 *
 * Cubre:
 *   - buildTabs genera "Próximos" + tabs de cada phase, combinando THIRD_PLACE+FINAL en "3°/Final"
 *   - tab "Próximos" es el primero por defecto y fetchea status=LIVE,SCHEDULED
 *   - cambiar de tab muestra contenido nuevo
 *   - empty state cuando no hay matches
 *   - GROUP_STAGE muestra sub-filtro de grupos (chips A-L)
 *
 * Mockea `useMatches` directamente.
 */
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

import type {
  MatchDto,
  TournamentPhaseDto,
  MatchPhase,
} from "@pichichi/shared";

vi.mock("@/hooks/use-matches", () => ({
  useMatches: vi.fn(),
}));

import { useMatches } from "@/hooks/use-matches";
import { MatchesByPhaseTabs } from "@/features/matches/matches-by-phase-tabs";

const useMatchesMock = vi.mocked(useMatches);

function makePhase(
  phase: MatchPhase,
  sortOrder: number,
): TournamentPhaseDto {
  return {
    id: `ph-${phase}`,
    phase,
    multiplier: 1,
    sortOrder,
  };
}

function makeMatch(overrides: Partial<MatchDto> = {}): MatchDto {
  return {
    id: "m-1",
    tournamentId: "t-1",
    homeTeam: {
      id: "ta",
      name: "Argentina",
      shortName: "ARG",
      logoUrl: null,
    },
    awayTeam: {
      id: "tb",
      name: "Francia",
      shortName: "FRA",
      logoUrl: null,
    },
    phase: "GROUP_STAGE",
    groupName: "Grupo A",
    matchNumber: 1,
    scheduledAt: "2026-06-20T18:00:00.000Z",
    venue: null,
    city: null,
    status: "SCHEDULED",
    homeScore: null,
    awayScore: null,
    homeScorePenalties: null,
    awayScorePenalties: null,
    isExtraTime: false,
    homeTeamPlaceholder: null,
    awayTeamPlaceholder: null,
    externalId: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

beforeEach(() => {
  // Default: empty data, not loading, not error.
  useMatchesMock.mockReturnValue({
    data: [],
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);
});

afterEach(() => {
  cleanup();
  useMatchesMock.mockReset();
});

describe("MatchesByPhaseTabs", () => {
  it("genera tabs Próximos + Grupos + R16 + 3°/Final desde phases", () => {
    render(
      <MatchesByPhaseTabs
        tournamentId="t-1"
        phases={[
          makePhase("GROUP_STAGE", 1),
          makePhase("ROUND_OF_16", 2),
          makePhase("THIRD_PLACE", 3),
          makePhase("FINAL", 4),
        ]}
      />,
    );

    expect(screen.getByTestId("phase-tab-Próximos")).toBeInTheDocument();
    expect(screen.getByTestId("phase-tab-Grupos")).toBeInTheDocument();
    expect(screen.getByTestId("phase-tab-8vos")).toBeInTheDocument();
    expect(screen.getByTestId("phase-tab-3°/Final")).toBeInTheDocument();
  });

  it("Próximos es la tab activa por defecto y fetchea LIVE,SCHEDULED", () => {
    render(
      <MatchesByPhaseTabs
        tournamentId="t-1"
        phases={[makePhase("GROUP_STAGE", 1)]}
      />,
    );

    expect(useMatchesMock).toHaveBeenCalledWith({
      tournamentId: "t-1",
      status: "LIVE,SCHEDULED",
    });
    expect(screen.getByTestId("matches-by-phase-empty")).toBeInTheDocument();
  });

  it("cambia a tab Grupos y muestra sub-filtro de grupos", () => {
    useMatchesMock.mockReturnValue({
      data: [
        makeMatch({ id: "m-1", groupName: "Grupo A" }),
        makeMatch({ id: "m-2", groupName: "Grupo B" }),
      ],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    render(
      <MatchesByPhaseTabs
        tournamentId="t-1"
        phases={[makePhase("GROUP_STAGE", 1)]}
      />,
    );

    fireEvent.click(screen.getByTestId("phase-tab-Grupos"));

    expect(screen.getByTestId("group-sub-filter")).toBeInTheDocument();
    expect(screen.getByTestId("group-chip-Todos")).toBeInTheDocument();
    expect(screen.getByTestId("group-chip-A")).toBeInTheDocument();
    expect(screen.getByTestId("group-chip-B")).toBeInTheDocument();
  });

  it("muestra loading state cuando query.isLoading", () => {
    useMatchesMock.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: vi.fn(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    render(
      <MatchesByPhaseTabs
        tournamentId="t-1"
        phases={[makePhase("GROUP_STAGE", 1)]}
      />,
    );

    expect(screen.getByTestId("matches-by-phase-loading")).toBeInTheDocument();
  });

  it("renderiza nada si no hay phases", () => {
    const { container } = render(
      <MatchesByPhaseTabs tournamentId="t-1" phases={[]} />,
    );
    // Solo "Próximos" tab no es válida sin nada — pero buildTabs SIEMPRE
    // agrega Próximos. Si phases vacío, igual hay 1 tab.
    expect(container.querySelector("[data-testid='matches-by-phase-tabs']"))
      .toBeInTheDocument();
    expect(screen.getByTestId("phase-tab-Próximos")).toBeInTheDocument();
  });
});
