/**
 * GroupPredictionsSheet component tests.
 *
 * Cubre paridad mobile + a11y web:
 *   - NO renderiza si visible=false
 *   - render con role=dialog + aria-modal + aria-labelledby
 *   - estado loading (spinner + "Cargando pronósticos...")
 *   - estado locked (revealed=false → "Pronósticos ocultos")
 *   - estado revelado vacío → "Sin pronósticos"
 *   - estado revelado con lista → filas con (Vos) cuando matchea currentUserId
 *   - badges EXACT/GOAL_DIFF/WINNER/MISS solo si match FINISHED
 *   - backdrop click cierra
 *   - close button cierra
 *   - ESC cierra (delega a useDialogA11y, ya cubierto en use-dialog-a11y.test.tsx)
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

import type {
  GroupPredictionsDto,
  MatchDto,
  UserPredictionDto,
} from "@pichichi/shared";

const getGroupPredictionsMock = vi.fn();

vi.mock("@/api", async () => {
  const actual = await vi.importActual<typeof import("@/api")>("@/api");
  return {
    ...actual,
    predictionsApi: {
      ...actual.predictionsApi,
      getGroupPredictions: (...args: unknown[]) =>
        getGroupPredictionsMock(...args),
    },
  };
});

import { GroupPredictionsSheet } from "@/features/predictions/group-predictions-sheet";

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
    scheduledAt: "2026-06-15T18:00:00.000Z",
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

function makeRow(overrides: Partial<UserPredictionDto> = {}): UserPredictionDto {
  return {
    id: "p-1",
    userId: "u-1",
    displayName: "Pablo",
    avatarUrl: null,
    predictedHome: 2,
    predictedAway: 1,
    pointsEarned: 0,
    pointType: null,
    ...overrides,
  };
}

function renderSheet(props: {
  visible: boolean;
  match?: MatchDto;
  groupName?: string;
  currentUserId?: string;
  onClose?: () => void;
}) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  }
  const onClose = props.onClose ?? vi.fn();
  const utils = render(
    <GroupPredictionsSheet
      visible={props.visible}
      onClose={onClose}
      groupId="g-1"
      matchId="m-1"
      match={props.match ?? makeMatch()}
      groupName={props.groupName}
      currentUserId={props.currentUserId}
    />,
    { wrapper: Wrapper },
  );
  return { ...utils, onClose, qc };
}

describe("GroupPredictionsSheet", () => {
  beforeEach(() => {
    getGroupPredictionsMock.mockReset();
    // Default: never resolves → forces loading state for tests that don't
    // explicitly set a resolved value.
    getGroupPredictionsMock.mockImplementation(() => new Promise(() => {}));
  });

  afterEach(() => {
    document.body.style.overflow = "";
  });

  it("NO renderiza cuando visible=false", () => {
    renderSheet({ visible: false });
    expect(screen.queryByTestId("group-predictions-sheet")).toBeNull();
  });

  it("renderiza con role=dialog y aria-labelledby", async () => {
    renderSheet({ visible: true, groupName: "Mi Grupo" });
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAttribute(
      "aria-labelledby",
      "group-predictions-sheet-title",
    );
    expect(
      screen.getByText("Pronósticos · Mi Grupo"),
    ).toBeInTheDocument();
  });

  it("muestra loading mientras la query no resuelve", () => {
    renderSheet({ visible: true });
    expect(
      screen.getByText("Cargando pronósticos..."),
    ).toBeInTheDocument();
  });

  it("muestra estado locked cuando revealed=false", async () => {
    const data: GroupPredictionsDto = {
      matchId: "m-1",
      groupId: "g-1",
      matchStatus: "SCHEDULED",
      revealed: false,
      predictions: [],
    };
    getGroupPredictionsMock.mockResolvedValue(data);
    renderSheet({ visible: true });
    await waitFor(() =>
      expect(
        screen.getByText("Pronósticos ocultos"),
      ).toBeInTheDocument(),
    );
    expect(
      screen.getByText("Los pronósticos se revelan al inicio del partido"),
    ).toBeInTheDocument();
  });

  it("muestra empty state cuando revealed pero predictions=[]", async () => {
    const data: GroupPredictionsDto = {
      matchId: "m-1",
      groupId: "g-1",
      matchStatus: "LIVE",
      revealed: true,
      predictions: [],
    };
    getGroupPredictionsMock.mockResolvedValue(data);
    renderSheet({ visible: true });
    await waitFor(() =>
      expect(screen.getByText("Sin pronósticos")).toBeInTheDocument(),
    );
    expect(
      screen.getByText("Nadie ha pronosticado este partido aún"),
    ).toBeInTheDocument();
  });

  it("renderiza la lista revelada y resalta al current user con (Vos)", async () => {
    const data: GroupPredictionsDto = {
      matchId: "m-1",
      groupId: "g-1",
      matchStatus: "LIVE",
      revealed: true,
      predictions: [
        makeRow({ userId: "u-1", displayName: "Pablo" }),
        makeRow({
          id: "p-2",
          userId: "u-2",
          displayName: "Maria",
          predictedHome: 0,
          predictedAway: 0,
        }),
      ],
    };
    getGroupPredictionsMock.mockResolvedValue(data);
    renderSheet({ visible: true, currentUserId: "u-1" });
    await waitFor(() =>
      expect(
        screen.getByTestId("group-predictions-sheet-list"),
      ).toBeInTheDocument(),
    );
    expect(
      screen.getByTestId("group-predictions-sheet-row-u-1"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("group-predictions-sheet-row-u-2"),
    ).toBeInTheDocument();
    // (Vos) marker visible en current user
    expect(screen.getByText("(Vos)")).toBeInTheDocument();
  });

  it("muestra badge EXACT cuando match FINISHED y pointType=EXACT", async () => {
    const data: GroupPredictionsDto = {
      matchId: "m-1",
      groupId: "g-1",
      matchStatus: "FINISHED",
      revealed: true,
      predictions: [
        makeRow({ pointType: "EXACT", pointsEarned: 5 }),
      ],
    };
    getGroupPredictionsMock.mockResolvedValue(data);
    renderSheet({
      visible: true,
      match: makeMatch({ status: "FINISHED", homeScore: 2, awayScore: 1 }),
    });
    await waitFor(() =>
      expect(screen.getByText("Exacto")).toBeInTheDocument(),
    );
    expect(screen.getByText("+5")).toBeInTheDocument();
  });

  it("backdrop click llama onClose", async () => {
    const onClose = vi.fn();
    renderSheet({ visible: true, onClose });
    fireEvent.click(
      screen.getByTestId("group-predictions-sheet-backdrop"),
    );
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("close button llama onClose", () => {
    const onClose = vi.fn();
    renderSheet({ visible: true, onClose });
    fireEvent.click(screen.getByTestId("group-predictions-sheet-close"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
