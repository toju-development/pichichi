/**
 * AddTournamentModal smoke tests.
 *
 * Cubre paridad mobile:
 *   - loading state (spinner)
 *   - empty state ("No hay torneos disponibles" + descripción literal)
 *   - filtering: torneos en `currentTournamentIds` se excluyen
 *   - add success → window.alert + onClose
 *   - error 403 → window.alert con mensaje del backend
 *   - error genérico → fallback "No se pudo agregar el torneo. Intentá de nuevo."
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

import type { TournamentDto } from "@pichichi/shared";

import { AddTournamentModal } from "../add-tournament-modal";

const getTournamentsMock = vi.fn();
const addTournamentMock = vi.fn();

vi.mock("@/api", async () => {
  const actual = await vi.importActual<typeof import("@/api")>("@/api");
  return {
    ...actual,
    tournamentsApi: {
      ...actual.tournamentsApi,
      getTournaments: (...args: unknown[]) => getTournamentsMock(...args),
    },
    groupsApi: {
      ...actual.groupsApi,
      addTournament: (...args: unknown[]) => addTournamentMock(...args),
    },
  };
});

function createWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  };
}

function makeTournament(
  overrides: Partial<TournamentDto> = {},
): TournamentDto {
  return {
    id: "t-1",
    slug: "mundial-2026",
    name: "Mundial 2026",
    description: null,
    type: "WORLD_CUP",
    status: "UPCOMING",
    startDate: "2026-06-01",
    endDate: "2026-07-15",
    logoUrl: null,
    coverImageUrl: null,
    isOfficial: true,
    ...overrides,
  } as TournamentDto;
}

let alertMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  alertMock = vi.fn();
  vi.stubGlobal("alert", alertMock);
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe("AddTournamentModal", () => {
  it("renderiza loading state mientras la query corre", () => {
    getTournamentsMock.mockImplementation(() => new Promise(() => {}));
    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <AddTournamentModal
          open
          onClose={vi.fn()}
          groupId="g-1"
          currentTournamentIds={[]}
        />
      </Wrapper>,
    );

    expect(
      screen.getByTestId("add-tournament-modal-loading"),
    ).toBeInTheDocument();
  });

  it("renderiza empty state cuando no hay torneos disponibles", async () => {
    getTournamentsMock.mockResolvedValue([]);
    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <AddTournamentModal
          open
          onClose={vi.fn()}
          groupId="g-1"
          currentTournamentIds={[]}
        />
      </Wrapper>,
    );

    await waitFor(() => {
      expect(
        screen.getByTestId("add-tournament-modal-empty"),
      ).toBeInTheDocument();
    });
    expect(
      screen.getByText("No hay torneos disponibles"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Todos los torneos ya están agregados a este grupo."),
    ).toBeInTheDocument();
  });

  it("filtra torneos que ya están en currentTournamentIds", async () => {
    getTournamentsMock.mockResolvedValue([
      makeTournament({ id: "t-1", name: "Mundial" }),
      makeTournament({ id: "t-2", name: "Copa América" }),
    ]);
    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <AddTournamentModal
          open
          onClose={vi.fn()}
          groupId="g-1"
          currentTournamentIds={["t-1"]}
        />
      </Wrapper>,
    );

    await waitFor(() => {
      expect(
        screen.getByTestId("add-tournament-modal-row-t-2"),
      ).toBeInTheDocument();
    });
    expect(
      screen.queryByTestId("add-tournament-modal-row-t-1"),
    ).not.toBeInTheDocument();
  });

  it("add success: llama window.alert + onClose", async () => {
    getTournamentsMock.mockResolvedValue([makeTournament()]);
    addTournamentMock.mockResolvedValue({ ok: true });
    const onClose = vi.fn();
    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <AddTournamentModal
          open
          onClose={onClose}
          groupId="g-1"
          currentTournamentIds={[]}
        />
      </Wrapper>,
    );

    await waitFor(() => {
      expect(
        screen.getByTestId("add-tournament-modal-add-t-1"),
      ).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId("add-tournament-modal-add-t-1"));

    await waitFor(() => {
      expect(addTournamentMock).toHaveBeenCalledWith("g-1", "t-1");
    });
    await waitFor(() => {
      expect(alertMock).toHaveBeenCalledWith("Torneo agregado al grupo.");
    });
    expect(onClose).toHaveBeenCalled();
  });

  it("error 403: muestra mensaje del backend", async () => {
    getTournamentsMock.mockResolvedValue([makeTournament()]);
    addTournamentMock.mockRejectedValue({
      response: {
        status: 403,
        data: { message: "Tu plan permite máximo 1 torneo." },
      },
    });
    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <AddTournamentModal
          open
          onClose={vi.fn()}
          groupId="g-1"
          currentTournamentIds={[]}
        />
      </Wrapper>,
    );

    await waitFor(() => {
      expect(
        screen.getByTestId("add-tournament-modal-add-t-1"),
      ).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId("add-tournament-modal-add-t-1"));

    await waitFor(() => {
      expect(alertMock).toHaveBeenCalledWith(
        "Tu plan permite máximo 1 torneo.",
      );
    });
  });

  it("error genérico: usa fallback literal mobile", async () => {
    getTournamentsMock.mockResolvedValue([makeTournament()]);
    addTournamentMock.mockRejectedValue({ response: { status: 500 } });
    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <AddTournamentModal
          open
          onClose={vi.fn()}
          groupId="g-1"
          currentTournamentIds={[]}
        />
      </Wrapper>,
    );

    await waitFor(() => {
      expect(
        screen.getByTestId("add-tournament-modal-add-t-1"),
      ).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId("add-tournament-modal-add-t-1"));

    await waitFor(() => {
      expect(alertMock).toHaveBeenCalledWith(
        "No se pudo agregar el torneo. Intentá de nuevo.",
      );
    });
  });
});
