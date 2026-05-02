/**
 * BonusSection smoke tests.
 *
 * Cubre:
 *   - bonusTypes vacío → no renderiza nada (return null).
 *   - bonusTypes presentes → renderiza header, badge de puntos y un card por type.
 *   - sortOrder respetado en el render.
 *   - click en una card no-locked dispara open del modal.
 *
 * Mockea `useTournamentTeams`, `useTournamentPlayers` (sin tocar red) y el
 * BonusPredictionModal (para evitar createPortal en jsdom y enfocarnos en la
 * sección).
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import type {
  BonusPredictionDto,
  TournamentBonusTypeDto,
} from "@pichichi/shared";

vi.mock("@/hooks/use-tournaments", () => ({
  useTournamentTeams: vi.fn(() => ({ data: [], isLoading: false })),
  useTournamentPlayers: vi.fn(() => ({ data: [], isLoading: false })),
}));

vi.mock("@/features/predictions/bonus-prediction-modal", () => ({
  BonusPredictionModal: ({
    visible,
    bonusTypeKey,
  }: {
    visible: boolean;
    bonusTypeKey: string | null;
  }) => (
    <div
      data-testid="bonus-prediction-modal-stub"
      data-visible={visible ? "true" : "false"}
      data-bonus-type-key={bonusTypeKey ?? ""}
    />
  ),
}));

import { BonusSection } from "@/features/predictions/bonus-section";

afterEach(() => {
  cleanup();
});

const championType: TournamentBonusTypeDto = {
  id: "bt-champion",
  key: "CHAMPION",
  label: "Champion",
  points: 10,
  sortOrder: 1,
};

const topScorerType: TournamentBonusTypeDto = {
  id: "bt-top-scorer",
  key: "TOP_SCORER",
  label: "Top Scorer",
  points: 10,
  sortOrder: 2,
};

const mvpType: TournamentBonusTypeDto = {
  id: "bt-mvp",
  key: "MVP",
  label: "Most Valuable Player",
  points: 10,
  sortOrder: 3,
};

const fixturePrediction: BonusPredictionDto = {
  id: "bp-1",
  userId: "u-1",
  groupId: "g-1",
  bonusTypeId: "bt-champion",
  predictedValue: "26",
  isCorrect: null,
  pointsEarned: 0,
  lockedAt: null,
  createdAt: "2026-06-11T12:00:00.000Z",
  updatedAt: "2026-06-11T12:00:00.000Z",
};

describe("BonusSection", () => {
  it("retorna null cuando no hay bonus types", () => {
    const { container } = render(
      <BonusSection
        bonusTypes={[]}
        bonusPredictions={[]}
        isLocked={false}
        groupId="g-1"
        tournamentId="t-1"
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renderiza header + badge + un card por bonus type, ordenado por sortOrder", () => {
    // Pasamos en orden inverso para validar que se ordena por sortOrder.
    render(
      <BonusSection
        bonusTypes={[mvpType, championType, topScorerType]}
        bonusPredictions={[fixturePrediction]}
        isLocked={false}
        groupId="g-1"
        tournamentId="t-1"
      />,
    );

    expect(screen.getByTestId("bonus-section")).toBeInTheDocument();
    expect(screen.getByText("Pronósticos Bonus")).toBeInTheDocument();
    expect(
      screen.getByTestId("bonus-section-points-badge").textContent,
    ).toBe("10 pts c/u");

    const cards = screen.getAllByTestId(
      /^bonus-prediction-card-(champion|top_scorer|mvp)$/,
    );
    expect(cards).toHaveLength(3);

    // Verificar orden visual: champion (1) → top_scorer (2) → mvp (3).
    expect(cards[0].getAttribute("data-testid")).toBe(
      "bonus-prediction-card-champion",
    );
    expect(cards[1].getAttribute("data-testid")).toBe(
      "bonus-prediction-card-top_scorer",
    );
    expect(cards[2].getAttribute("data-testid")).toBe(
      "bonus-prediction-card-mvp",
    );
  });

  it("click en card no-locked abre el modal con el bonusTypeKey correcto", () => {
    render(
      <BonusSection
        bonusTypes={[championType, topScorerType]}
        bonusPredictions={[]}
        isLocked={false}
        groupId="g-1"
        tournamentId="t-1"
      />,
    );

    // Modal arranca cerrado.
    const modalBefore = screen.getByTestId("bonus-prediction-modal-stub");
    expect(modalBefore.getAttribute("data-visible")).toBe("false");

    fireEvent.click(screen.getByTestId("bonus-prediction-card-top_scorer"));

    const modalAfter = screen.getByTestId("bonus-prediction-modal-stub");
    expect(modalAfter.getAttribute("data-visible")).toBe("true");
    expect(modalAfter.getAttribute("data-bonus-type-key")).toBe("TOP_SCORER");
  });
});
