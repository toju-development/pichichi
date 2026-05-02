/**
 * ScorePredictionModal component tests.
 *
 * Cubre paridad mobile + a11y web:
 *   - NO renderiza si open=false
 *   - NO renderiza si match=null aún con open=true
 *   - render con role=dialog + aria-modal + aria-labelledby
 *   - pre-fill desde existing prediction (R6)
 *   - pre-fill 0-0 cuando prediction es null (R6, S4)
 *   - cancel button cierra el modal y resetea mutación
 *   - backdrop click cierra
 *   - ESC cierra
 *   - submit dispara upsertPrediction con payload correcto
 *   - re-check de lock antes del submit (S12) → window.alert + close
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

import type { MatchDto, PredictionDto } from "@pichichi/shared";

const upsertPredictionMock = vi.fn();

vi.mock("@/api", async () => {
  const actual = await vi.importActual<typeof import("@/api")>("@/api");
  return {
    ...actual,
    predictionsApi: {
      ...actual.predictionsApi,
      upsertPrediction: (...args: unknown[]) => upsertPredictionMock(...args),
    },
  };
});

import { ScorePredictionModal } from "@/features/predictions/score-prediction-modal";

function makeMatch(overrides: Partial<MatchDto> = {}): MatchDto {
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
  predictedHome: 3,
  predictedAway: 2,
  pointsEarned: 0,
  pointType: null,
  createdAt: "2026-06-11T12:00:00.000Z",
  updatedAt: "2026-06-11T12:00:00.000Z",
};

function renderModal(props: {
  open: boolean;
  match: MatchDto | null;
  prediction?: PredictionDto | null;
  onClose?: () => void;
}) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  }
  const onClose = props.onClose ?? vi.fn();
  const utils = render(
    <ScorePredictionModal
      open={props.open}
      onClose={onClose}
      match={props.match}
      prediction={props.prediction ?? null}
      groupId="g-1"
    />,
    { wrapper: Wrapper },
  );
  return { ...utils, onClose, qc };
}

describe("ScorePredictionModal", () => {
  beforeEach(() => {
    upsertPredictionMock.mockReset();
  });

  afterEach(() => {
    // Restore overflow that the modal mutated on body
    document.body.style.overflow = "";
  });

  it("NO renderiza cuando open=false", () => {
    renderModal({ open: false, match: makeMatch() });
    expect(screen.queryByTestId("score-prediction-modal")).toBeNull();
  });

  it("NO renderiza cuando match=null aún con open=true", () => {
    renderModal({ open: true, match: null });
    expect(screen.queryByTestId("score-prediction-modal")).toBeNull();
  });

  it("render con role=dialog + aria-modal + aria-labelledby", () => {
    renderModal({ open: true, match: makeMatch() });

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAttribute(
      "aria-labelledby",
      "score-prediction-modal-title",
    );
    expect(screen.getByText("Pronóstico")).toBeInTheDocument();
  });

  it("pre-fill desde existing prediction (R6)", () => {
    renderModal({
      open: true,
      match: makeMatch(),
      prediction: predictionFixture,
    });

    const home = screen.getByTestId("score-input-home") as HTMLInputElement;
    const away = screen.getByTestId("score-input-away") as HTMLInputElement;
    expect(home.value).toBe("3");
    expect(away.value).toBe("2");
  });

  it("pre-fill 0-0 cuando prediction es null (R6, S4)", () => {
    renderModal({ open: true, match: makeMatch(), prediction: null });

    const home = screen.getByTestId("score-input-home") as HTMLInputElement;
    const away = screen.getByTestId("score-input-away") as HTMLInputElement;
    expect(home.value).toBe("0");
    expect(away.value).toBe("0");
  });

  it("cancel button cierra el modal", () => {
    const onClose = vi.fn();
    renderModal({ open: true, match: makeMatch(), onClose });

    fireEvent.click(screen.getByTestId("score-prediction-modal-cancel"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("backdrop click cierra el modal", () => {
    const onClose = vi.fn();
    renderModal({ open: true, match: makeMatch(), onClose });

    fireEvent.click(screen.getByTestId("score-prediction-modal-backdrop"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("ESC cierra el modal", () => {
    const onClose = vi.fn();
    renderModal({ open: true, match: makeMatch(), onClose });

    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("submit dispara upsertPrediction con payload correcto y cierra al success", async () => {
    upsertPredictionMock.mockResolvedValue(predictionFixture);
    const onClose = vi.fn();
    renderModal({
      open: true,
      match: makeMatch(),
      prediction: predictionFixture,
      onClose,
    });

    fireEvent.click(screen.getByTestId("score-prediction-modal-submit"));

    await waitFor(() => {
      expect(upsertPredictionMock).toHaveBeenCalledTimes(1);
    });

    expect(upsertPredictionMock.mock.calls[0]?.[0]).toEqual({
      matchId: "m-1",
      groupId: "g-1",
      predictedHome: 3,
      predictedAway: 2,
    });

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });

  it("re-check de lock antes del submit (S12): si match locked, alert + close, NO upsert", () => {
    const alertSpy = vi
      .spyOn(window, "alert")
      .mockImplementation(() => undefined);
    const onClose = vi.fn();

    renderModal({
      open: true,
      match: makeMatch({ status: "LIVE" }), // LIVE → locked
      onClose,
    });

    fireEvent.click(screen.getByTestId("score-prediction-modal-submit"));

    expect(alertSpy).toHaveBeenCalledWith(
      "Este partido ya no acepta pronósticos.",
    );
    expect(upsertPredictionMock).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);

    alertSpy.mockRestore();
  });

  // ─── a11y: focus management ────────────────────────────────────────────────

  it("focus inicial al primer score input (home) cuando abre", () => {
    renderModal({ open: true, match: makeMatch() });
    const home = screen.getByTestId("score-input-home");
    expect(document.activeElement).toBe(home);
  });

  it("traps focus inside modal: Tab desde el último focusable cicla al primero", () => {
    renderModal({ open: true, match: makeMatch() });

    const submit = screen.getByTestId("score-prediction-modal-submit");
    const cancel = screen.getByTestId("score-prediction-modal-cancel");

    // Mover el foco al último focusable (submit) y disparar Tab → cicla al primero (cancel).
    submit.focus();
    expect(document.activeElement).toBe(submit);

    fireEvent.keyDown(document, { key: "Tab" });
    expect(document.activeElement).toBe(cancel);
  });

  it("traps focus inside modal: Shift+Tab desde el primer focusable cicla al último", () => {
    renderModal({ open: true, match: makeMatch() });

    const cancel = screen.getByTestId("score-prediction-modal-cancel");
    const submit = screen.getByTestId("score-prediction-modal-submit");

    cancel.focus();
    expect(document.activeElement).toBe(cancel);

    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(submit);
  });

  it("restores focus al elemento que abrió el modal cuando cierra", () => {
    // Trigger button externo que "abre" el modal.
    const trigger = document.createElement("button");
    trigger.setAttribute("data-testid", "external-trigger");
    trigger.textContent = "Open";
    document.body.appendChild(trigger);
    trigger.focus();
    expect(document.activeElement).toBe(trigger);

    const onClose = vi.fn();
    const { rerender, qc } = renderModal({
      open: true,
      match: makeMatch(),
      onClose,
    });

    // Mientras está abierto el foco se mueve al primer input del modal.
    expect(document.activeElement).toBe(screen.getByTestId("score-input-home"));

    // Cerrar el modal (cleanup del effect debe restaurar el foco al trigger).
    rerender(
      <QueryClientProvider client={qc}>
        <ScorePredictionModal
          open={false}
          onClose={onClose}
          match={makeMatch()}
          prediction={null}
          groupId="g-1"
        />
      </QueryClientProvider>,
    );

    expect(document.activeElement).toBe(trigger);

    document.body.removeChild(trigger);
  });
});
