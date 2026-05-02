/**
 * TodayMatchesSection click routing tests (Phase 5B.6).
 *
 * Verifica el gating literal de mobile lines 384-393:
 *   - LIVE / FINISHED → MatchDetailModal (con externalId)
 *   - SCHEDULED + multi-group → GroupPickerModal
 *   - SCHEDULED + single-group → ScorePredictionModal directo
 *
 * Mockeamos los modales hijos para asilar el routing y evitar dependencias
 * de network/env (MatchDetailModal usa env.apiUrl()) y de QueryClient
 * (ScorePredictionModal usa useUpsertPrediction).
 */
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import type { DashboardTodayMatchDto } from "@pichichi/shared";

// ─── Mocks ──────────────────────────────────────────────────────────────────

const matchDetailModalMock = vi.fn();
vi.mock("@/features/matches/match-detail-modal", () => ({
  MatchDetailModal: (props: { externalId: number | null }) => {
    matchDetailModalMock(props);
    return props.externalId !== null ? (
      <div data-testid="mock-match-detail-modal">
        externalId={props.externalId}
      </div>
    ) : null;
  },
}));

const scorePredictionModalMock = vi.fn();
vi.mock("@/features/predictions/score-prediction-modal", () => ({
  ScorePredictionModal: (props: {
    open: boolean;
    groupId: string;
    match: { id: string } | null;
  }) => {
    scorePredictionModalMock(props);
    return props.open ? (
      <div data-testid="mock-score-prediction-modal">
        groupId={props.groupId} matchId={props.match?.id ?? ""}
      </div>
    ) : null;
  },
}));

import { TodayMatchesSection } from "@/features/dashboard/today-matches-section";

// ─── Fixtures ───────────────────────────────────────────────────────────────

function makeMatch(
  overrides: Partial<DashboardTodayMatchDto> = {},
): DashboardTodayMatchDto {
  return {
    matchId: "m-1",
    externalId: 1234,
    homeTeam: { id: "ta", name: "Argentina", logoUrl: null },
    awayTeam: { id: "tb", name: "Francia", logoUrl: null },
    homePlaceholder: null,
    awayPlaceholder: null,
    scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    status: "SCHEDULED",
    homeScore: null,
    awayScore: null,
    phase: "GROUP_STAGE",
    tournamentName: "World Cup 2026",
    tournamentSlug: "world-cup-2026",
    groupId: "g-1",
    groupName: "Los del finde",
    hasPrediction: false,
    predictedHome: null,
    predictedAway: null,
    isLocked: false,
    ...overrides,
  };
}

describe("TodayMatchesSection click routing (Phase 5B.6)", () => {
  it("muestra empty state cuando no hay matches", () => {
    render(<TodayMatchesSection matches={[]} />);
    expect(screen.getByText("Sin partidos hoy")).toBeInTheDocument();
  });

  it("click en match LIVE abre MatchDetailModal con externalId", () => {
    const live = makeMatch({
      matchId: "m-live",
      externalId: 9999,
      status: "LIVE",
      isLocked: true,
      homeScore: 1,
      awayScore: 0,
    });

    render(<TodayMatchesSection matches={[live]} />);

    fireEvent.click(screen.getByTestId("dashboard-match-card-m-live"));

    const modal = screen.getByTestId("mock-match-detail-modal");
    expect(modal.textContent).toContain("externalId=9999");
    // Score prediction modal NO debe haberse abierto
    expect(screen.queryByTestId("mock-score-prediction-modal")).toBeNull();
  });

  it("click en match FINISHED abre MatchDetailModal", () => {
    const finished = makeMatch({
      matchId: "m-fin",
      externalId: 4242,
      status: "FINISHED",
      isLocked: true,
      homeScore: 2,
      awayScore: 1,
    });

    render(<TodayMatchesSection matches={[finished]} />);

    fireEvent.click(screen.getByTestId("dashboard-match-card-m-fin"));

    expect(screen.getByTestId("mock-match-detail-modal").textContent).toContain(
      "externalId=4242",
    );
  });

  it("click en match SCHEDULED single-group abre ScorePredictionModal directo", () => {
    const scheduled = makeMatch({ matchId: "m-sched", groupId: "g-only" });

    render(<TodayMatchesSection matches={[scheduled]} />);

    fireEvent.click(screen.getByTestId("dashboard-match-card-m-sched"));

    // GroupPicker NO debe haberse abierto
    expect(screen.queryByTestId("group-picker-modal")).toBeNull();
    // ScorePredictionModal sí
    const modal = screen.getByTestId("mock-score-prediction-modal");
    expect(modal.textContent).toContain("groupId=g-only");
    expect(modal.textContent).toContain("matchId=m-sched");
  });

  it("click en match SCHEDULED multi-group abre GroupPicker, luego selección abre ScorePredictionModal", () => {
    // El mismo matchId aparece en 2 grupos → dedup produce una card con 2 groups.
    const matchA = makeMatch({
      matchId: "m-multi",
      groupId: "g-1",
      groupName: "Los del finde",
    });
    const matchB = makeMatch({
      matchId: "m-multi",
      groupId: "g-2",
      groupName: "Oficina",
    });

    render(<TodayMatchesSection matches={[matchA, matchB]} />);

    // Click en la card → abre GroupPickerModal
    fireEvent.click(screen.getByTestId("dashboard-match-card-m-multi"));

    expect(screen.getByTestId("group-picker-modal")).toBeInTheDocument();
    expect(
      screen.getByText("¿En qué grupo querés pronosticar?"),
    ).toBeInTheDocument();
    // Aún NO se abrió la prediction modal
    expect(screen.queryByTestId("mock-score-prediction-modal")).toBeNull();

    // Click en row "Oficina" (g-2) → cierra picker + abre prediction modal con g-2
    fireEvent.click(screen.getByTestId("group-picker-row-g-2"));

    const modal = screen.getByTestId("mock-score-prediction-modal");
    expect(modal.textContent).toContain("groupId=g-2");
    expect(modal.textContent).toContain("matchId=m-multi");
  });
});
