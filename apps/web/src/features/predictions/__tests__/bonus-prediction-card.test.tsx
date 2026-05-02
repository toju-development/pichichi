/**
 * BonusPredictionCard smoke tests.
 *
 * Cubre:
 *   - sin prediction & sin lock → "Tocar para pronosticar", root = button (clickeable).
 *   - locked & sin prediction → root = div, "Sin pronóstico" con LockIcon.
 *   - con prediction sin scoring → texto en color primary.
 *   - prediction correcta (isCorrect=true) → texto en color success + chip "+pts".
 *   - prediction incorrecta (isCorrect=false) → texto en color danger.
 *   - resolución externalId → muestra display name del team/player.
 *   - onEdit dispara cuando NO está locked y se hace click.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import type {
  BonusPredictionDto,
  BonusTypeDto,
  TournamentPlayerResponseDto,
  TournamentTeamDto,
} from "@pichichi/shared";

import { BonusPredictionCard } from "@/features/predictions/bonus-prediction-card";

afterEach(() => {
  cleanup();
});

const championBonusType: BonusTypeDto = {
  id: "bt-champion",
  key: "CHAMPION",
  label: "Champion",
  points: 10,
  sortOrder: 1,
};

const topScorerBonusType: BonusTypeDto = {
  id: "bt-top-scorer",
  key: "TOP_SCORER",
  label: "Top Scorer",
  points: 10,
  sortOrder: 2,
};

const argentinaTeam: TournamentTeamDto = {
  id: "tt-arg",
  teamId: "team-arg",
  name: "Argentina",
  shortName: "ARG",
  logoUrl: "https://flag/arg.png",
  groupName: null,
  isEliminated: false,
  externalId: 26,
};

const messiPlayer: TournamentPlayerResponseDto = {
  id: "tp-messi",
  playerId: "p-messi",
  externalId: 154,
  name: "Lionel Messi",
  photoUrl: "https://photo/messi.png",
  position: "Attacker",
  shirtNumber: 10,
  teamId: "team-arg",
  teamName: "Argentina",
  teamLogoUrl: "https://flag/arg.png",
  teamExternalId: 26,
};

function makePrediction(
  overrides: Partial<BonusPredictionDto> = {},
): BonusPredictionDto {
  return {
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
    ...overrides,
  };
}

describe("BonusPredictionCard", () => {
  it("sin prediction y sin lock: muestra 'Tocar para pronosticar' y dispara onEdit", () => {
    const onEdit = vi.fn();
    render(
      <BonusPredictionCard
        bonusType={championBonusType}
        prediction={null}
        isLocked={false}
        onEdit={onEdit}
        teams={[argentinaTeam]}
        players={[]}
      />,
    );

    const card = screen.getByTestId("bonus-prediction-card-champion");
    expect(card.tagName).toBe("BUTTON");
    expect(card).toHaveAttribute("data-locked", "false");
    expect(card.textContent).toContain("Tocar para pronosticar");

    fireEvent.click(card);
    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it("locked y sin prediction: root = div, muestra 'Sin pronóstico'", () => {
    const onEdit = vi.fn();
    render(
      <BonusPredictionCard
        bonusType={championBonusType}
        prediction={null}
        isLocked={true}
        onEdit={onEdit}
        teams={[argentinaTeam]}
        players={[]}
      />,
    );

    const card = screen.getByTestId("bonus-prediction-card-champion");
    expect(card.tagName).toBe("DIV");
    expect(card).toHaveAttribute("data-locked", "true");
    expect(
      screen.getByTestId("bonus-prediction-card-locked-empty"),
    ).toBeInTheDocument();
    expect(card.textContent).toContain("Sin pronóstico");
  });

  it("resuelve externalId del team a display name (CHAMPION)", () => {
    render(
      <BonusPredictionCard
        bonusType={championBonusType}
        prediction={makePrediction({ predictedValue: "26" })}
        isLocked={false}
        onEdit={() => {}}
        teams={[argentinaTeam]}
        players={[]}
      />,
    );

    const value = screen.getByTestId("bonus-prediction-card-value");
    expect(value.textContent).toBe("Argentina");
    // sin scoring → primary
    expect(value.className).toContain("text-primary");
  });

  it("resuelve externalId del player a display name (TOP_SCORER)", () => {
    render(
      <BonusPredictionCard
        bonusType={topScorerBonusType}
        prediction={makePrediction({
          bonusTypeId: "bt-top-scorer",
          predictedValue: "154",
        })}
        isLocked={false}
        onEdit={() => {}}
        teams={[argentinaTeam]}
        players={[messiPlayer]}
      />,
    );

    const value = screen.getByTestId("bonus-prediction-card-value");
    expect(value.textContent).toBe("Lionel Messi");
  });

  it("prediction correcta (isCorrect=true): success + chip '+pts'", () => {
    render(
      <BonusPredictionCard
        bonusType={championBonusType}
        prediction={makePrediction({
          isCorrect: true,
          pointsEarned: 10,
        })}
        isLocked={true}
        onEdit={() => {}}
        teams={[argentinaTeam]}
        players={[]}
      />,
    );

    const value = screen.getByTestId("bonus-prediction-card-value");
    expect(value.className).toContain("text-success");

    const chip = screen.getByTestId("bonus-prediction-card-earned");
    expect(chip.textContent).toBe("+10pts");
  });

  it("prediction incorrecta (isCorrect=false): danger, sin chip", () => {
    render(
      <BonusPredictionCard
        bonusType={championBonusType}
        prediction={makePrediction({
          isCorrect: false,
          pointsEarned: 0,
        })}
        isLocked={true}
        onEdit={() => {}}
        teams={[argentinaTeam]}
        players={[]}
      />,
    );

    const value = screen.getByTestId("bonus-prediction-card-value");
    expect(value.className).toContain("text-danger");
    expect(
      screen.queryByTestId("bonus-prediction-card-earned"),
    ).not.toBeInTheDocument();
  });

  it("legacy free-text (externalId no resuelve): muestra raw predictedValue", () => {
    render(
      <BonusPredictionCard
        bonusType={championBonusType}
        prediction={makePrediction({ predictedValue: "Brazil (legacy)" })}
        isLocked={false}
        onEdit={() => {}}
        teams={[argentinaTeam]}
        players={[]}
      />,
    );

    expect(
      screen.getByTestId("bonus-prediction-card-value").textContent,
    ).toBe("Brazil (legacy)");
  });
});
