/**
 * MemberPredictionsPage tests.
 *
 * Cubre paridad mobile + URL contract Next 16:
 *   - loading state (spinner + "Cargando predicciones...")
 *   - empty state ("Sin predicciones" + descripción literal)
 *   - loaded: header (avatar + displayName + totalPoints) + secciones por
 *     torneo + filas con score + badge.
 *   - displayName de query param antes de que el fetch resuelva.
 *
 * `params` se pasa como Promise resuelta — Next 16 lo expone como Promise y
 * el page lo consume con `use(params)`.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  act,
  cleanup,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Suspense, type ReactNode } from "react";

import type {
  MemberPredictionItemDto,
  MemberPredictionsResponseDto,
} from "@pichichi/shared";

const getMemberPredictionsMock = vi.fn();
const searchParamsGetMock = vi.fn<(key: string) => string | null>();

vi.mock("@/api", async () => {
  const actual = await vi.importActual<typeof import("@/api")>("@/api");
  return {
    ...actual,
    predictionsApi: {
      ...actual.predictionsApi,
      getMemberPredictions: (...args: unknown[]) =>
        getMemberPredictionsMock(...args),
    },
  };
});

vi.mock("next/navigation", () => ({
  useSearchParams: () => ({
    get: (key: string) => searchParamsGetMock(key),
  }),
}));

import MemberPredictionsPage from "../page";

function createWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={qc}>
        <Suspense fallback={null}>{children}</Suspense>
      </QueryClientProvider>
    );
  };
}

/**
 * Renderiza la page resolviendo `params` (Promise → `use()`) en un `act`
 * async para flushear los microtasks. Sin esto, React 19 deja el árbol
 * suspendido en `null` y los tests ven `<body><div /></body>`.
 */
async function renderPage(params: { groupId: string; memberId: string }) {
  const Wrapper = createWrapper();
  await act(async () => {
    render(
      <Wrapper>
        <MemberPredictionsPage params={Promise.resolve(params)} />
      </Wrapper>,
    );
  });
}

function makeItem(
  overrides: Partial<MemberPredictionItemDto> = {},
): MemberPredictionItemDto {
  return {
    id: "p-1",
    matchId: "m-1",
    predictedHome: 2,
    predictedAway: 1,
    pointsEarned: 5,
    pointType: "EXACT",
    match: {
      scheduledAt: "2026-06-15T18:00:00.000Z",
      status: "FINISHED",
      homeScore: 2,
      awayScore: 1,
      phase: "GROUP_STAGE",
      homeTeamName: "Argentina",
      awayTeamName: "Francia",
      homeTeamShortName: "ARG",
      awayTeamShortName: "FRA",
      homeTeamFlagUrl: null,
      awayTeamFlagUrl: null,
    },
    tournamentId: "t-1",
    tournamentName: "Mundial 2026",
    tournamentLogoUrl: null,
    ...overrides,
  };
}

function makeResponse(
  overrides: Partial<MemberPredictionsResponseDto> = {},
): MemberPredictionsResponseDto {
  return {
    userId: "u-1",
    displayName: "Pepe Lopez",
    avatarUrl: null,
    totalPoints: 42,
    predictions: [makeItem()],
    ...overrides,
  };
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

beforeEach(() => {
  searchParamsGetMock.mockReturnValue(null);
});

describe("MemberPredictionsPage", () => {
  it("renderiza loading state mientras la query corre", async () => {
    getMemberPredictionsMock.mockImplementation(
      () => new Promise(() => {}),
    );
    await renderPage({ groupId: "g-1", memberId: "u-1" });

    expect(
      screen.getByTestId("page-member-predictions-loading"),
    ).toBeInTheDocument();
    expect(screen.getByText("Cargando predicciones...")).toBeInTheDocument();
  });

  it("renderiza empty state cuando data.predictions está vacío", async () => {
    getMemberPredictionsMock.mockResolvedValue(
      makeResponse({ predictions: [] }),
    );
    await renderPage({ groupId: "g-1", memberId: "u-1" });

    await waitFor(() => {
      expect(
        screen.getByTestId("page-member-predictions-empty"),
      ).toBeInTheDocument();
    });
    expect(screen.getByText("Sin predicciones")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Este miembro aún no tiene predicciones en partidos finalizados o en vivo.",
      ),
    ).toBeInTheDocument();
  });

  it("usa displayName del query param antes de que el fetch resuelva", async () => {
    searchParamsGetMock.mockImplementation((key) =>
      key === "displayName" ? "Carlos Tevez" : null,
    );
    getMemberPredictionsMock.mockImplementation(
      () => new Promise(() => {}),
    );
    await renderPage({ groupId: "g-1", memberId: "u-1" });

    expect(
      screen.getByTestId("page-member-predictions-title"),
    ).toHaveTextContent("Carlos Tevez");
  });

  it("loaded: muestra summary (nombre + total) + sección por torneo + fila con score y badge EXACT", async () => {
    getMemberPredictionsMock.mockResolvedValue(makeResponse());
    await renderPage({ groupId: "g-1", memberId: "u-1" });

    await waitFor(() => {
      expect(
        screen.getByTestId("page-member-predictions-summary"),
      ).toBeInTheDocument();
    });
    expect(
      screen.getByTestId("page-member-predictions-summary-name"),
    ).toHaveTextContent("Pepe Lopez");
    expect(
      screen.getByTestId("page-member-predictions-summary-total"),
    ).toHaveTextContent("42 pts");
    expect(
      screen.getByTestId("member-prediction-section-t-1"),
    ).toHaveTextContent("Mundial 2026");
    expect(screen.getByTestId("member-prediction-p-1")).toBeInTheDocument();
    expect(screen.getByText("Exacto")).toBeInTheDocument();
    expect(screen.getByText("+5")).toBeInTheDocument();
  });

  it("loaded: agrupa predictions por tournamentId en secciones distintas", async () => {
    getMemberPredictionsMock.mockResolvedValue(
      makeResponse({
        predictions: [
          makeItem({ id: "p-1", tournamentId: "t-1", tournamentName: "Mundial" }),
          makeItem({
            id: "p-2",
            matchId: "m-2",
            tournamentId: "t-2",
            tournamentName: "Copa América",
            pointType: "MISS",
            pointsEarned: 0,
          }),
        ],
      }),
    );
    await renderPage({ groupId: "g-1", memberId: "u-1" });

    await waitFor(() => {
      expect(
        screen.getByTestId("member-prediction-section-t-1"),
      ).toBeInTheDocument();
    });
    expect(
      screen.getByTestId("member-prediction-section-t-2"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("member-prediction-section-t-2"),
    ).toHaveTextContent("Copa América");
    expect(screen.getByText("Errado")).toBeInTheDocument();
  });

  it("loaded LIVE: muestra badge 'En vivo' en lugar del de puntos", async () => {
    getMemberPredictionsMock.mockResolvedValue(
      makeResponse({
        predictions: [
          makeItem({
            id: "p-live",
            pointType: null,
            pointsEarned: 0,
            match: {
              scheduledAt: "2026-06-15T18:00:00.000Z",
              status: "LIVE",
              homeScore: 1,
              awayScore: 0,
              phase: "GROUP_STAGE",
              homeTeamName: "Argentina",
              awayTeamName: "Francia",
              homeTeamShortName: "ARG",
              awayTeamShortName: "FRA",
              homeTeamFlagUrl: null,
              awayTeamFlagUrl: null,
            },
          }),
        ],
      }),
    );
    await renderPage({ groupId: "g-1", memberId: "u-1" });

    await waitFor(() => {
      expect(screen.getByTestId("member-prediction-p-live")).toBeInTheDocument();
    });
    expect(screen.getByText("EN VIVO")).toBeInTheDocument();
    expect(screen.getByText("En vivo")).toBeInTheDocument();
  });

  it("back link apunta al detalle del grupo", async () => {
    getMemberPredictionsMock.mockResolvedValue(makeResponse());
    await renderPage({ groupId: "g-42", memberId: "u-1" });

    await waitFor(() => {
      expect(
        screen.getByTestId("page-member-predictions-back"),
      ).toBeInTheDocument();
    });
    expect(
      screen.getByTestId("page-member-predictions-back"),
    ).toHaveAttribute("href", "/app/groups/g-42");
  });
});
