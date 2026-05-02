/**
 * PredictionMatchCard component tests.
 *
 * Cubre paridad mobile:
 *   - render team names (o placeholders en italic si TBD)
 *   - click llama onPredict cuando NO está locked
 *   - click llama onMatchDetail cuando está locked (status LIVE)
 *   - dimming visual (opacity-60) cuando locked SIN prediction
 *   - showPhaseInfo controla phase label
 *   - data-testid `prediction-match-card-${matchId}` siempre presente
 */
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import type { MatchDto, PredictionDto } from "@pichichi/shared";

import { PredictionMatchCard } from "@/features/predictions/prediction-match-card";

function makeMatch(overrides: Partial<MatchDto> = {}): MatchDto {
  // Default: scheduled in the future, status SCHEDULED → NOT locked.
  const future = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
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
    scheduledAt: future,
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

const predictionFixture: PredictionDto = {
  id: "p-1",
  userId: "u-1",
  matchId: "m-1",
  groupId: "g-1",
  predictedHome: 2,
  predictedAway: 1,
  pointsEarned: 0,
  pointType: null,
  createdAt: "2026-06-11T12:00:00.000Z",
  updatedAt: "2026-06-11T12:00:00.000Z",
};

describe("PredictionMatchCard", () => {
  it("renderiza team names cuando hay teams asignados", () => {
    const match = makeMatch();
    render(
      <PredictionMatchCard
        match={match}
        prediction={null}
        onPredict={vi.fn()}
      />,
    );

    expect(screen.getByText("Argentina")).toBeInTheDocument();
    expect(screen.getByText("Francia")).toBeInTheDocument();
    expect(screen.getByTestId("prediction-match-card-m-1")).toBeInTheDocument();
  });

  it("renderiza placeholders cuando no hay teams (TBD)", () => {
    const match = makeMatch({
      homeTeam: null,
      awayTeam: null,
      homeTeamPlaceholder: "Ganador A1",
      awayTeamPlaceholder: "Ganador B2",
    });
    render(
      <PredictionMatchCard
        match={match}
        prediction={null}
        onPredict={vi.fn()}
      />,
    );

    expect(screen.getByText("Ganador A1")).toBeInTheDocument();
    expect(screen.getByText("Ganador B2")).toBeInTheDocument();
  });

  it("click dispara onPredict cuando NO está locked", () => {
    const onPredict = vi.fn();
    const onMatchDetail = vi.fn();
    const match = makeMatch();
    render(
      <PredictionMatchCard
        match={match}
        prediction={null}
        onPredict={onPredict}
        onMatchDetail={onMatchDetail}
      />,
    );

    fireEvent.click(screen.getByTestId("prediction-match-card-m-1"));
    expect(onPredict).toHaveBeenCalledWith(match);
    expect(onMatchDetail).not.toHaveBeenCalled();
  });

  it("click dispara onMatchDetail cuando está locked (status LIVE)", () => {
    const onPredict = vi.fn();
    const onMatchDetail = vi.fn();
    const match = makeMatch({ status: "LIVE" });
    render(
      <PredictionMatchCard
        match={match}
        prediction={null}
        onPredict={onPredict}
        onMatchDetail={onMatchDetail}
      />,
    );

    fireEvent.click(screen.getByTestId("prediction-match-card-m-1"));
    expect(onMatchDetail).toHaveBeenCalledWith(match);
    expect(onPredict).not.toHaveBeenCalled();
  });

  it("aplica opacity-60 cuando locked SIN prediction", () => {
    const match = makeMatch({ status: "LIVE" });
    render(
      <PredictionMatchCard
        match={match}
        prediction={null}
        onPredict={vi.fn()}
      />,
    );

    const card = screen.getByTestId("prediction-match-card-m-1");
    expect(card.className).toContain("opacity-60");
  });

  it("NO aplica dimming cuando locked CON prediction (la guardada se ve plena)", () => {
    const match = makeMatch({ status: "LIVE" });
    render(
      <PredictionMatchCard
        match={match}
        prediction={predictionFixture}
        onPredict={vi.fn()}
      />,
    );

    const card = screen.getByTestId("prediction-match-card-m-1");
    expect(card.className).not.toContain("opacity-60");
  });

  it("showPhaseInfo=true muestra el phase label", () => {
    const match = makeMatch({ phase: "GROUP_STAGE" });
    render(
      <PredictionMatchCard
        match={match}
        prediction={null}
        onPredict={vi.fn()}
        showPhaseInfo
      />,
    );

    // PHASE_LABELS.GROUP_STAGE === "Fase de Grupos"
    expect(screen.getByText("Fase de Grupos")).toBeInTheDocument();
  });
});
