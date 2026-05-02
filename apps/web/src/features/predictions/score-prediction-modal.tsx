"use client";

/**
 * ScorePredictionModal — modal slide-up para entrar/editar un pronóstico.
 *
 * Port adaptado de `apps/mobile/src/components/predictions/score-prediction-modal.tsx`.
 * Web usa `useDialogA11y` (createPortal lo hace este componente):
 *   - createPortal al body
 *   - backdrop button para cerrar
 *   - ESC para cerrar
 *   - body scroll bloqueado
 *   - role="dialog" + aria-modal + aria-labelledby
 *   - focus trap circular + focus restoration al cerrar
 *   - focus inicial sobre el primer `<input>` del panel
 *
 * Decisión: NO extraer un `DialogShell` compartido todavía. Los dos consumers
 * (ConfirmDialog y este) tienen layouts y semántica distintos: confirm
 * dialog es centrado pequeño con dos botones; este es slide-up con score
 * input + save button. Premature abstraction acoplaría mal. Si aparece un
 * tercer modal, refactorizamos.
 *
 * Re-checks lock boundary antes del submit (S12 del spec).
 * Pre-fills desde existing prediction o resetea a 0-0 (R6).
 *
 * Errors: usa `window.alert()` (mismo patrón que `group-detail-page` —
 * `Alert.alert` mobile equivalent). Toast global se sumará en Phase 6+.
 */

import { useState } from "react";
import { createPortal } from "react-dom";

import type { MatchDto, PredictionDto } from "@pichichi/shared";

import { useDialogA11y } from "@/hooks/use-dialog-a11y";
import { useUpsertPrediction } from "@/hooks/use-predictions";
import {
  formatMatchDateTime,
  isMatchLocked,
  PHASE_LABELS,
} from "@/utils/match-helpers";

import { ScoreInput } from "./score-input";

// ─── Props ──────────────────────────────────────────────────────────────────

interface ScorePredictionModalProps {
  open: boolean;
  onClose: () => void;
  match: MatchDto | null;
  prediction: PredictionDto | null | undefined;
  groupId: string;
}

// ─── Component ──────────────────────────────────────────────────────────────

export function ScorePredictionModal({
  open,
  onClose,
  match,
  prediction,
  groupId,
}: ScorePredictionModalProps) {
  // Pre-fill scores from existing prediction or reset to 0-0 (R6, S4).
  //
  // Patrón "adjust state during render" recomendado por React 19 docs:
  // https://react.dev/reference/react/useState#storing-information-from-previous-renders
  // Usamos `useState` para guardar la última `(open, prediction)` vista.
  // Cuando cambia (transición de cerrado→abierto, o cambia el prediction
  // mientras está abierto), reseteamos los scores DURANTE el render.
  // Esto evita el `useEffect` que disparaba `react-hooks/set-state-in-effect`.
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [lastSeenKey, setLastSeenKey] = useState<string | null>(null);

  const currentKey = open ? `${prediction?.id ?? "new"}` : null;
  if (currentKey !== lastSeenKey) {
    setLastSeenKey(currentKey);
    if (open) {
      setHomeScore(prediction ? prediction.predictedHome : 0);
      setAwayScore(prediction ? prediction.predictedAway : 0);
    }
  }

  const upsertPrediction = useUpsertPrediction();
  const titleId = "score-prediction-modal-title";

  function handleClose() {
    upsertPrediction.reset();
    onClose();
  }

  const { dialogRef } = useDialogA11y({
    open,
    onClose: handleClose,
    // Focus inicial al primer score input del modal (no al cancel button).
    // El trap sigue ciclando por TODOS los focusables; solo el target
    // inicial es distinto para mejor UX (el usuario abre el modal para
    // ingresar score).
    initialFocusSelector: "input",
  });

  function handleSubmit() {
    if (!match) return;

    // Re-check lock boundary before submit (S12)
    if (isMatchLocked(match)) {
      if (typeof window !== "undefined") {
        window.alert("Este partido ya no acepta pronósticos.");
      }
      handleClose();
      return;
    }

    upsertPrediction.mutate(
      {
        matchId: match.id,
        groupId,
        predictedHome: homeScore,
        predictedAway: awayScore,
      },
      {
        onSuccess: () => {
          handleClose();
        },
        onError: (err: unknown) => {
          console.error("[ScorePredictionModal] Error:", err);
          const axiosErr = err as {
            response?: { data?: { message?: string } };
          };
          if (typeof window !== "undefined") {
            window.alert(
              axiosErr?.response?.data?.message ??
                "No se pudo guardar el pronóstico. Intentá de nuevo.",
            );
          }
        },
      },
    );
  }

  if (!open) return null;
  if (!match) return null;
  if (typeof window === "undefined") return null;

  const homeTeamName =
    match.homeTeam?.name ?? match.homeTeamPlaceholder ?? "Local";
  const awayTeamName =
    match.awayTeam?.name ?? match.awayTeamPlaceholder ?? "Visitante";

  const phaseLabel = PHASE_LABELS[match.phase] ?? match.phase;
  const dateLabel = formatMatchDateTime(match.scheduledAt);

  const node = (
    <div
      data-testid="score-prediction-modal"
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Cerrar"
        onClick={handleClose}
        data-testid="score-prediction-modal-backdrop"
        className="absolute inset-0 bg-black/50"
      />

      {/* Panel */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 flex w-full max-w-md flex-col gap-0 rounded-t-2xl bg-surface shadow-lg sm:rounded-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 pb-4 pt-5">
          <h2
            id={titleId}
            className="text-xl font-bold text-text-primary"
          >
            Pronóstico
          </h2>
          <button
            type="button"
            onClick={handleClose}
            data-testid="score-prediction-modal-cancel"
            className="px-1 py-1 text-[15px] font-medium text-primary hover:underline"
          >
            Cancelar
          </button>
        </div>

        {/* Match info */}
        <div className="flex flex-col items-center px-5 pt-6">
          <span className="text-[13px] font-semibold uppercase tracking-wider text-text-secondary">
            {phaseLabel}
          </span>
          <span className="mt-1 text-xs font-normal text-text-tertiary">
            {dateLabel}
          </span>
        </div>

        {/* Score input */}
        <div className="px-5 pt-5">
          <ScoreInput
            homeTeamName={homeTeamName}
            awayTeamName={awayTeamName}
            homeTeam={match.homeTeam}
            awayTeam={match.awayTeam}
            homeScore={homeScore}
            awayScore={awayScore}
            onHomeChange={setHomeScore}
            onAwayChange={setAwayScore}
            disabled={upsertPrediction.isPending}
          />
        </div>

        {/* Footer */}
        <div className="px-5 pb-4 pt-9">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={upsertPrediction.isPending}
            data-testid="score-prediction-modal-submit"
            className="inline-flex h-11 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-text-on-primary transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            {upsertPrediction.isPending ? "Guardando…" : "Guardar pronóstico"}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(node, document.body);
}
