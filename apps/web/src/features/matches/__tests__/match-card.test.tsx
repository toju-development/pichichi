/**
 * MatchCard component smoke tests.
 *
 * Cubre paridad mobile:
 *   - render team names cuando hay teams
 *   - render placeholders ("TBD" / texto custom) cuando teams null
 *   - "vs" cuando SCHEDULED, score cuando LIVE/FINISHED
 *   - LIVE badge cuando status === "LIVE"
 *   - StatusBadge cuando POSTPONED / CANCELLED
 *   - root <button> cuando hay onClick (dispara handler)
 *   - root <div> cuando NO hay onClick
 *   - data-testid `match-card-${id}` siempre presente
 */
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import type { MatchDto } from "@pichichi/shared";

import { MatchCard } from "@/features/matches/match-card";

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

describe("MatchCard", () => {
  it("renderiza team names y 'vs' cuando SCHEDULED", () => {
    render(<MatchCard match={makeMatch()} />);
    expect(screen.getByText("Argentina")).toBeInTheDocument();
    expect(screen.getByText("Francia")).toBeInTheDocument();
    expect(screen.getByText("vs")).toBeInTheDocument();
    expect(screen.getByTestId("match-card-m-1")).toBeInTheDocument();
  });

  it("renderiza placeholder TBD cuando team es null sin placeholder", () => {
    render(
      <MatchCard
        match={makeMatch({ homeTeam: null, awayTeam: null })}
      />,
    );
    const tbds = screen.getAllByText("TBD");
    expect(tbds.length).toBeGreaterThanOrEqual(2);
  });

  it("renderiza placeholder custom cuando team es null con placeholder", () => {
    render(
      <MatchCard
        match={makeMatch({
          homeTeam: null,
          awayTeam: null,
          homeTeamPlaceholder: "Ganador A1",
          awayTeamPlaceholder: "Ganador B2",
        })}
      />,
    );
    expect(screen.getByText("Ganador A1")).toBeInTheDocument();
    expect(screen.getByText("Ganador B2")).toBeInTheDocument();
  });

  it("renderiza score y LIVE badge cuando status LIVE", () => {
    render(
      <MatchCard
        match={makeMatch({ status: "LIVE", homeScore: 2, awayScore: 1 })}
      />,
    );
    expect(screen.getByText("EN VIVO")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.queryByText("vs")).not.toBeInTheDocument();
  });

  it("renderiza StatusBadge 'Aplazado' cuando POSTPONED", () => {
    render(<MatchCard match={makeMatch({ status: "POSTPONED" })} />);
    expect(screen.getByText("Aplazado")).toBeInTheDocument();
  });

  it("dispara onClick cuando se clickea (root <button>)", () => {
    const onClick = vi.fn();
    render(<MatchCard match={makeMatch()} onClick={onClick} />);
    const card = screen.getByTestId("match-card-m-1");
    expect(card.tagName).toBe("BUTTON");
    fireEvent.click(card);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("usa root <div> cuando NO hay onClick", () => {
    render(<MatchCard match={makeMatch()} />);
    const card = screen.getByTestId("match-card-m-1");
    expect(card.tagName).toBe("DIV");
  });

  it("muestra phaseInfo cuando showPhaseInfo=true", () => {
    render(
      <MatchCard
        match={makeMatch({ phase: "GROUP_STAGE", groupName: "Grupo A" })}
        showPhaseInfo
      />,
    );
    expect(
      screen.getByText(/Grupo A.*Fase de Grupos/),
    ).toBeInTheDocument();
  });

  it("muestra 'Sin predicción' cuando showPrediction y SCHEDULED sin prediction", () => {
    render(<MatchCard match={makeMatch()} hasPrediction={false} />);
    expect(screen.getByText("Sin predicción")).toBeInTheDocument();
  });

  it("muestra 'Listo' cuando hasPrediction=true", () => {
    render(<MatchCard match={makeMatch()} hasPrediction />);
    expect(screen.getByText("Listo")).toBeInTheDocument();
  });
});
