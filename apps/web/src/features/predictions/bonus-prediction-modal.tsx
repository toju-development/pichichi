"use client";

/**
 * BonusPredictionModal — port literal de
 * `apps/mobile/src/components/predictions/bonus-prediction-modal.tsx`,
 * usando el patrón consolidado de `score-prediction-modal.tsx`:
 *   - createPortal(document.body)
 *   - backdrop button para cerrar
 *   - ESC para cerrar
 *   - body scroll bloqueado
 *   - focus-trap circular
 *   - focus restoration al elemento que lo abrió
 *   - role="dialog" + aria-modal + aria-labelledby
 *
 * Picker estructurado (NO TextInput libre):
 *   - Team mode (CHAMPION/REVELATION): single-step team list → submit directo
 *   - Player mode (TOP_SCORER/MVP): two-step (team → player) → submit
 *
 * Recibe teams[] y players[] via props (BonusSection los inyecta una sola vez).
 * Guarda `String(externalId)` como `predictedValue` — NUNCA nombres.
 * Filtra entidades sin `externalId`.
 *
 * Errors: window.alert() (mismo patrón que score-prediction-modal y mobile
 * `Alert.alert`). Toast global se sumará en Phase 6+.
 */

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import type {
  TournamentPlayerResponseDto,
  TournamentTeamDto,
} from "@pichichi/shared";

import { useUpsertBonusPrediction } from "@/hooks/use-bonus-predictions";
import { cn } from "@/lib/cn";

// Selector idéntico al de score-prediction-modal — fuente única de verdad
// del focus trap.
const FOCUSABLE_SELECTOR =
  'input:not([disabled]), button:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])';

// ─── Constants (paridad mobile) ─────────────────────────────────────────────

const BONUS_TYPE_KEY = {
  CHAMPION: "CHAMPION",
  TOP_SCORER: "TOP_SCORER",
  MVP: "MVP",
  REVELATION: "REVELATION",
} as const;

const PICKER_MODE = {
  TEAM: "team",
  PLAYER: "player",
} as const;

type PickerMode = (typeof PICKER_MODE)[keyof typeof PICKER_MODE];

const PICKER_STEP = {
  TEAM_LIST: "team-list",
  PLAYER_SELECT: "player-select",
} as const;

type PickerStep = (typeof PICKER_STEP)[keyof typeof PICKER_STEP];

/** Maps bonusTypeKey → picker mode (mismo mapeo que mobile). */
const KEY_TO_MODE: Record<string, PickerMode> = {
  [BONUS_TYPE_KEY.CHAMPION]: PICKER_MODE.TEAM,
  [BONUS_TYPE_KEY.REVELATION]: PICKER_MODE.TEAM,
  [BONUS_TYPE_KEY.TOP_SCORER]: PICKER_MODE.PLAYER,
  [BONUS_TYPE_KEY.MVP]: PICKER_MODE.PLAYER,
};

/** Maps API position strings to Spanish display labels (port mobile). */
const POSITION_LABELS: Record<string, string> = {
  Goalkeeper: "Arquero",
  Defender: "Defensor",
  Midfielder: "Mediocampista",
  Attacker: "Delantero",
};

// ─── Props ──────────────────────────────────────────────────────────────────

interface BonusPredictionModalProps {
  visible: boolean;
  onClose: () => void;
  bonusTypeId: string | null;
  bonusTypeKey: string | null;
  bonusTypeLabel: string | null;
  currentValue: string | null;
  groupId: string;
  tournamentId: string;
  teams: TournamentTeamDto[];
  players: TournamentPlayerResponseDto[];
  isPlayersLoading: boolean;
}

// ─── Component ──────────────────────────────────────────────────────────────

export function BonusPredictionModal({
  visible,
  onClose,
  bonusTypeId,
  bonusTypeKey,
  bonusTypeLabel,
  currentValue,
  groupId,
  teams,
  players,
  isPlayersLoading,
}: BonusPredictionModalProps) {
  const [step, setStep] = useState<PickerStep>(PICKER_STEP.TEAM_LIST);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  const upsertBonusPrediction = useUpsertBonusPrediction();
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = "bonus-prediction-modal-title";

  // ── Derived state ───────────────────────────────────────────────────────

  const mode: PickerMode = bonusTypeKey
    ? (KEY_TO_MODE[bonusTypeKey.toUpperCase()] ?? PICKER_MODE.TEAM)
    : PICKER_MODE.TEAM;

  const displayLabel = bonusTypeLabel ?? "Pronóstico bonus";

  // Filter teams sin externalId, sort alfabético.
  const filteredTeams = teams
    .filter((t) => t.externalId != null)
    .sort((a, b) => a.name.localeCompare(b.name));

  // Filter players del team seleccionado, sin externalId.
  const filteredPlayers = selectedTeamId
    ? players
        .filter((p) => p.teamId === selectedTeamId && p.externalId != null)
        .sort((a, b) => a.name.localeCompare(b.name))
    : [];

  const selectedTeam = selectedTeamId
    ? filteredTeams.find((t) => t.teamId === selectedTeamId) ?? null
    : null;

  // ── Blocked state checks ────────────────────────────────────────────────

  const isTeamsBlocked = filteredTeams.length === 0;
  const isPlayersBlocked =
    mode === PICKER_MODE.PLAYER &&
    step === PICKER_STEP.PLAYER_SELECT &&
    filteredPlayers.length === 0 &&
    !isPlayersLoading;

  // ── Handlers ────────────────────────────────────────────────────────────

  function resetState() {
    setStep(PICKER_STEP.TEAM_LIST);
    setSelectedTeamId(null);
    upsertBonusPrediction.reset();
  }

  function handleClose() {
    resetState();
    onClose();
  }

  function handleTeamSelect(team: TournamentTeamDto) {
    if (mode === PICKER_MODE.TEAM) {
      // Direct team selection — submit immediately.
      submitPrediction(String(team.externalId));
    } else {
      // Player mode — go to step 2.
      setSelectedTeamId(team.teamId);
      setStep(PICKER_STEP.PLAYER_SELECT);
    }
  }

  function handlePlayerSelect(player: TournamentPlayerResponseDto) {
    submitPrediction(String(player.externalId));
  }

  function handleBackToTeams() {
    setSelectedTeamId(null);
    setStep(PICKER_STEP.TEAM_LIST);
  }

  function submitPrediction(predictedValue: string) {
    if (!bonusTypeId) return;

    upsertBonusPrediction.mutate(
      {
        groupId,
        bonusTypeId,
        predictedValue,
      },
      {
        onSuccess: () => {
          handleClose();
        },
        onError: (err: unknown) => {
          console.error("[BonusPredictionModal] Error:", err);
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

  // ── a11y: ESC + body scroll lock + focus trap + focus restoration ───────
  useEffect(() => {
    if (!visible) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;

    function getFocusables(): HTMLElement[] {
      const root = dialogRef.current;
      if (!root) return [];
      return Array.from(
        root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      );
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        handleClose();
        return;
      }

      if (event.key !== "Tab") return;

      const focusables = getFocusables();
      if (focusables.length === 0) return;

      const first = focusables[0]!;
      const last = focusables[focusables.length - 1]!;
      const active = document.activeElement as HTMLElement | null;

      if (!active || !dialogRef.current?.contains(active)) {
        event.preventDefault();
        first.focus();
        return;
      }

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);

    // Initial focus al primer focusable del modal (botón Cerrar).
    const focusables = getFocusables();
    focusables[0]?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      previouslyFocused?.focus?.();
    };
    // `handleClose` es estable por contrato; el lifecycle lo dicta `visible`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // ── Don't render when no bonusTypeId ────────────────────────────────────

  if (!visible) return null;
  if (!bonusTypeId) return null;
  if (typeof window === "undefined") return null;

  const isSubmitting = upsertBonusPrediction.isPending;

  const node = (
    <div
      data-testid="bonus-prediction-modal"
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Cerrar"
        onClick={handleClose}
        data-testid="bonus-prediction-modal-backdrop"
        className="absolute inset-0 bg-black/50"
      />

      {/* Panel */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl bg-background shadow-lg sm:rounded-2xl"
      >
        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between border-b border-border px-5 pb-4 pt-5">
          <h2
            id={titleId}
            className="text-xl font-bold text-text-primary"
          >
            {displayLabel}
          </h2>
          <button
            type="button"
            onClick={handleClose}
            data-testid="bonus-prediction-modal-close"
            className="px-1 py-1 text-base font-medium text-primary hover:underline"
          >
            Cerrar
          </button>
        </div>

        {/* ── Sub-header for player step 2 (back + team name) ─────── */}
        {mode === PICKER_MODE.PLAYER &&
        step === PICKER_STEP.PLAYER_SELECT &&
        selectedTeam ? (
          <div className="flex items-center border-b border-border px-5 py-3">
            <button
              type="button"
              onClick={handleBackToTeams}
              data-testid="bonus-prediction-modal-back"
              className="mr-3 text-2xl text-primary hover:underline"
              aria-label="Volver a equipos"
            >
              ←
            </button>
            {selectedTeam.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={selectedTeam.logoUrl}
                alt=""
                className="mr-2 h-4 w-6 rounded-sm object-cover"
              />
            ) : null}
            <span className="text-base font-semibold text-text-primary">
              {selectedTeam.name}
            </span>
          </div>
        ) : null}

        {/* ── Saving indicator ────────────────────────────────────── */}
        {isSubmitting ? (
          <div
            className="flex flex-col items-center py-4"
            data-testid="bonus-prediction-modal-saving"
          >
            <span className="text-sm text-text-muted">Guardando…</span>
          </div>
        ) : null}

        {/* ── Body content ────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto">
          {step === PICKER_STEP.TEAM_LIST ? (
            <TeamList
              teams={filteredTeams}
              currentValue={currentValue}
              isBlocked={isTeamsBlocked}
              isSubmitting={isSubmitting}
              showSelectHint={mode === PICKER_MODE.PLAYER}
              onSelect={handleTeamSelect}
            />
          ) : null}

          {step === PICKER_STEP.PLAYER_SELECT ? (
            <PlayerList
              players={filteredPlayers}
              currentValue={currentValue}
              isBlocked={isPlayersBlocked}
              isLoading={isPlayersLoading}
              isSubmitting={isSubmitting}
              onSelect={handlePlayerSelect}
            />
          ) : null}
        </div>
      </div>
    </div>
  );

  return createPortal(node, document.body);
}

// ─── TeamList sub-component ─────────────────────────────────────────────────

interface TeamListProps {
  teams: TournamentTeamDto[];
  currentValue: string | null;
  isBlocked: boolean;
  isSubmitting: boolean;
  /** Show "Elegí un equipo" hint (player mode step 1). */
  showSelectHint: boolean;
  onSelect: (team: TournamentTeamDto) => void;
}

function TeamList({
  teams,
  currentValue,
  isBlocked,
  isSubmitting,
  showSelectHint,
  onSelect,
}: TeamListProps) {
  if (isBlocked) {
    return (
      <div
        className="flex flex-1 items-center justify-center px-5 py-10"
        data-testid="bonus-prediction-modal-teams-blocked"
      >
        <span className="text-base text-text-muted">
          Equipos no disponibles
        </span>
      </div>
    );
  }

  return (
    <ul
      data-testid="bonus-prediction-modal-team-list"
      className="flex flex-col gap-2 px-5 py-3"
    >
      {showSelectHint ? (
        <li className="mb-1 text-sm text-text-secondary">
          Elegí un equipo para ver sus jugadores
        </li>
      ) : null}

      {teams.map((item) => {
        const isSelected =
          currentValue != null && currentValue === String(item.externalId);

        return (
          <li key={item.teamId}>
            <button
              type="button"
              onClick={() => onSelect(item)}
              disabled={isSubmitting}
              data-testid={`bonus-prediction-modal-team-${item.teamId}`}
              className={cn(
                "flex w-full items-center rounded-xl border px-4 py-3.5 text-left transition active:opacity-70",
                isSelected
                  ? "border-primary bg-primary-surface-light"
                  : "border-border bg-surface hover:border-primary",
                isSubmitting && "cursor-not-allowed opacity-50",
              )}
            >
              {item.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.logoUrl}
                  alt=""
                  className="mr-3 h-4 w-6 rounded-sm object-cover"
                />
              ) : (
                <span className="mr-3 inline-block h-4 w-6 rounded-sm bg-border" />
              )}
              <span
                className={cn(
                  "flex-1 truncate text-base font-medium",
                  isSelected ? "text-primary" : "text-text-primary",
                )}
              >
                {item.name}
              </span>
              {isSelected ? (
                <span className="text-sm font-semibold text-primary">
                  ✓
                </span>
              ) : null}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

// ─── PlayerList sub-component ───────────────────────────────────────────────

interface PlayerListProps {
  players: TournamentPlayerResponseDto[];
  currentValue: string | null;
  isBlocked: boolean;
  isLoading: boolean;
  isSubmitting: boolean;
  onSelect: (player: TournamentPlayerResponseDto) => void;
}

function PlayerList({
  players,
  currentValue,
  isBlocked,
  isLoading,
  isSubmitting,
  onSelect,
}: PlayerListProps) {
  if (isLoading) {
    return (
      <div
        className="flex flex-1 flex-col items-center justify-center py-10"
        data-testid="bonus-prediction-modal-players-loading"
      >
        <span className="mt-3 text-sm text-text-muted">
          Cargando jugadores…
        </span>
      </div>
    );
  }

  if (isBlocked) {
    return (
      <div
        className="flex flex-1 items-center justify-center px-5 py-10"
        data-testid="bonus-prediction-modal-players-blocked"
      >
        <span className="text-base text-text-muted">
          Jugadores no disponibles
        </span>
      </div>
    );
  }

  return (
    <ul
      data-testid="bonus-prediction-modal-player-list"
      className="flex flex-col gap-2 px-5 py-3"
    >
      {players.map((item) => {
        const isSelected =
          currentValue != null && currentValue === String(item.externalId);

        const positionLabel = item.position
          ? (POSITION_LABELS[item.position] ?? item.position)
          : null;

        return (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => onSelect(item)}
              disabled={isSubmitting}
              data-testid={`bonus-prediction-modal-player-${item.id}`}
              className={cn(
                "flex w-full items-center rounded-xl border px-4 py-3 text-left transition active:opacity-70",
                isSelected
                  ? "border-primary bg-primary-surface-light"
                  : "border-border bg-surface hover:border-primary",
                isSubmitting && "cursor-not-allowed opacity-50",
              )}
            >
              {/* Player photo */}
              {item.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.photoUrl}
                  alt=""
                  className="mr-3 h-10 w-10 rounded-full bg-border object-cover"
                />
              ) : (
                <span className="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-border text-sm text-text-muted">
                  ⚽
                </span>
              )}

              {/* Name + position column */}
              <span className="flex flex-1 flex-col">
                <span
                  className={cn(
                    "truncate text-base font-medium",
                    isSelected ? "text-primary" : "text-text-primary",
                  )}
                >
                  {item.name}
                </span>
                {positionLabel ? (
                  <span className="mt-0.5 text-xs text-text-secondary">
                    {positionLabel}
                    {item.shirtNumber != null
                      ? ` · #${item.shirtNumber}`
                      : ""}
                  </span>
                ) : null}
              </span>

              {isSelected ? (
                <span className="text-sm font-semibold text-primary">
                  ✓
                </span>
              ) : null}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
