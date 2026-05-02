/**
 * BonusPredictionModal smoke tests.
 *
 * Cubre paridad con mobile + patrón consolidado del score-prediction-modal:
 *   - Team mode (CHAMPION): click en team → submit directo con `String(externalId)`.
 *   - Player mode (TOP_SCORER): step 1 (team) → step 2 (player) → submit con `String(externalId)`.
 *   - Botón "Volver" del step 2 vuelve al team list.
 *   - Backdrop click cierra el modal (onClose).
 *   - ESC cierra el modal (onClose).
 *   - Filtra teams/players sin externalId.
 *
 * Mockea `useUpsertBonusPrediction` para inspeccionar variables del mutate.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import type {
  TournamentPlayerResponseDto,
  TournamentTeamDto,
} from "@pichichi/shared";

const mutateMock = vi.fn();
const resetMock = vi.fn();

vi.mock("@/hooks/use-bonus-predictions", () => ({
  useUpsertBonusPrediction: () => ({
    mutate: mutateMock,
    reset: resetMock,
    isPending: false,
  }),
}));

import { BonusPredictionModal } from "@/features/predictions/bonus-prediction-modal";

const argentina: TournamentTeamDto = {
  id: "tt-arg",
  teamId: "team-arg",
  name: "Argentina",
  shortName: "ARG",
  logoUrl: null,
  groupName: null,
  isEliminated: false,
  externalId: 26,
};

const brazil: TournamentTeamDto = {
  id: "tt-bra",
  teamId: "team-bra",
  name: "Brazil",
  shortName: "BRA",
  logoUrl: null,
  groupName: null,
  isEliminated: false,
  externalId: 6,
};

const teamWithoutExternalId: TournamentTeamDto = {
  id: "tt-x",
  teamId: "team-x",
  name: "Ghost",
  shortName: "GHS",
  logoUrl: null,
  groupName: null,
  isEliminated: false,
  externalId: null,
};

const messi: TournamentPlayerResponseDto = {
  id: "tp-messi",
  playerId: "p-messi",
  externalId: 154,
  name: "Lionel Messi",
  photoUrl: null,
  position: "Attacker",
  shirtNumber: 10,
  teamId: "team-arg",
  teamName: "Argentina",
  teamLogoUrl: null,
  teamExternalId: 26,
};

const messiNoExtId: TournamentPlayerResponseDto = {
  ...messi,
  id: "tp-x",
  playerId: "p-x",
  externalId: null,
  name: "Phantom",
};

afterEach(() => {
  cleanup();
  mutateMock.mockReset();
  resetMock.mockReset();
});

describe("BonusPredictionModal — TEAM mode", () => {
  it("click en team submit directo con String(externalId)", () => {
    const onClose = vi.fn();
    render(
      <BonusPredictionModal
        visible
        onClose={onClose}
        bonusTypeId="bt-champion"
        bonusTypeKey="CHAMPION"
        bonusTypeLabel="Campeón"
        currentValue={null}
        groupId="g-1"
        tournamentId="t-1"
        teams={[argentina, brazil, teamWithoutExternalId]}
        players={[]}
        isPlayersLoading={false}
      />,
    );

    expect(screen.getByTestId("bonus-prediction-modal")).toBeInTheDocument();
    expect(
      screen.getByTestId("bonus-prediction-modal-team-list"),
    ).toBeInTheDocument();

    // Team sin externalId NO renderiza.
    expect(
      screen.queryByTestId("bonus-prediction-modal-team-team-x"),
    ).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByTestId("bonus-prediction-modal-team-team-arg"),
    );

    expect(mutateMock).toHaveBeenCalledTimes(1);
    expect(mutateMock.mock.calls[0]?.[0]).toEqual({
      groupId: "g-1",
      bonusTypeId: "bt-champion",
      predictedValue: "26",
    });
  });

  it("backdrop click cierra el modal", () => {
    const onClose = vi.fn();
    render(
      <BonusPredictionModal
        visible
        onClose={onClose}
        bonusTypeId="bt-champion"
        bonusTypeKey="CHAMPION"
        bonusTypeLabel="Campeón"
        currentValue={null}
        groupId="g-1"
        tournamentId="t-1"
        teams={[argentina]}
        players={[]}
        isPlayersLoading={false}
      />,
    );

    fireEvent.click(
      screen.getByTestId("bonus-prediction-modal-backdrop"),
    );
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("ESC cierra el modal", () => {
    const onClose = vi.fn();
    render(
      <BonusPredictionModal
        visible
        onClose={onClose}
        bonusTypeId="bt-champion"
        bonusTypeKey="CHAMPION"
        bonusTypeLabel="Campeón"
        currentValue={null}
        groupId="g-1"
        tournamentId="t-1"
        teams={[argentina]}
        players={[]}
        isPlayersLoading={false}
      />,
    );

    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe("BonusPredictionModal — PLAYER mode", () => {
  it("step 1 (team) → step 2 (player) → submit con String(externalId)", () => {
    const onClose = vi.fn();
    render(
      <BonusPredictionModal
        visible
        onClose={onClose}
        bonusTypeId="bt-top-scorer"
        bonusTypeKey="TOP_SCORER"
        bonusTypeLabel="Goleador"
        currentValue={null}
        groupId="g-1"
        tournamentId="t-1"
        teams={[argentina]}
        players={[messi, messiNoExtId]}
        isPlayersLoading={false}
      />,
    );

    // Step 1: muestra team list, NO submit aún.
    expect(
      screen.getByTestId("bonus-prediction-modal-team-list"),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByTestId("bonus-prediction-modal-team-team-arg"),
    );
    expect(mutateMock).not.toHaveBeenCalled();

    // Step 2: muestra player list, botón back disponible.
    expect(
      screen.getByTestId("bonus-prediction-modal-player-list"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("bonus-prediction-modal-back"),
    ).toBeInTheDocument();

    // Player sin externalId NO renderiza.
    expect(
      screen.queryByTestId("bonus-prediction-modal-player-tp-x"),
    ).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByTestId("bonus-prediction-modal-player-tp-messi"),
    );

    expect(mutateMock).toHaveBeenCalledTimes(1);
    expect(mutateMock.mock.calls[0]?.[0]).toEqual({
      groupId: "g-1",
      bonusTypeId: "bt-top-scorer",
      predictedValue: "154",
    });
  });

  it("botón back vuelve del step 2 al team list", () => {
    render(
      <BonusPredictionModal
        visible
        onClose={() => {}}
        bonusTypeId="bt-top-scorer"
        bonusTypeKey="TOP_SCORER"
        bonusTypeLabel="Goleador"
        currentValue={null}
        groupId="g-1"
        tournamentId="t-1"
        teams={[argentina]}
        players={[messi]}
        isPlayersLoading={false}
      />,
    );

    fireEvent.click(
      screen.getByTestId("bonus-prediction-modal-team-team-arg"),
    );
    expect(
      screen.getByTestId("bonus-prediction-modal-player-list"),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("bonus-prediction-modal-back"));

    expect(
      screen.getByTestId("bonus-prediction-modal-team-list"),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId("bonus-prediction-modal-player-list"),
    ).not.toBeInTheDocument();
  });
});

describe("BonusPredictionModal — visibility guards", () => {
  it("no renderiza cuando visible=false", () => {
    const { container } = render(
      <BonusPredictionModal
        visible={false}
        onClose={() => {}}
        bonusTypeId="bt-champion"
        bonusTypeKey="CHAMPION"
        bonusTypeLabel="Campeón"
        currentValue={null}
        groupId="g-1"
        tournamentId="t-1"
        teams={[argentina]}
        players={[]}
        isPlayersLoading={false}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("no renderiza cuando bonusTypeId es null", () => {
    const { container } = render(
      <BonusPredictionModal
        visible
        onClose={() => {}}
        bonusTypeId={null}
        bonusTypeKey="CHAMPION"
        bonusTypeLabel="Campeón"
        currentValue={null}
        groupId="g-1"
        tournamentId="t-1"
        teams={[argentina]}
        players={[]}
        isPlayersLoading={false}
      />,
    );
    expect(container.firstChild).toBeNull();
  });
});
