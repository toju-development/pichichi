"use client";

/**
 * AddTournamentModal — modal slide-up para agregar un torneo a un grupo.
 *
 * Web-equivalent (Phase 5B.7-D) de
 * `apps/mobile/src/components/groups/add-tournament-modal.tsx` (355 lines).
 *
 * Lista los torneos jugables (status UPCOMING / IN_PROGRESS) que NO están
 * ya asociados al grupo y permite al admin tappear "Agregar" para linkearlos.
 *
 * Errores literales de mobile:
 *   - 403 (límite de plan): "Límite alcanzado" + mensaje del backend o
 *     fallback "Alcanzaste el límite de torneos de tu plan."
 *   - resto: "Error" + mensaje del backend o fallback genérico.
 *
 * Tokens web (vs mobile RGB literal):
 *   - primary / primary-surface / primary-surface-light / primary-dark
 *   - surface, border, text-text-primary/secondary/tertiary
 *
 * Patrón slide-up + a11y idéntico a `score-prediction-modal.tsx`:
 *   `useDialogA11y` + `createPortal(document.body)` + backdrop button.
 *
 * React Compiler ON: NO `useMemo` — el filter de availableTournaments se
 * deriva inline y el compiler memoiza.
 */

import { createPortal } from "react-dom";

import type { TournamentDto } from "@pichichi/shared";

import { useDialogA11y } from "@/hooks/use-dialog-a11y";
import { useAddTournament } from "@/hooks/use-groups";
import { usePlayableTournaments } from "@/hooks/use-tournaments";
import {
  TOURNAMENT_STATUS_LABELS,
  TOURNAMENT_TYPE_LABELS,
} from "@/utils/match-helpers";

// ─── Glyphs (inline SVG, sin deps externas) ─────────────────────────────────

function TrophyGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  );
}

function SpinnerGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" opacity="0.25" />
      <path d="M21 12a9 9 0 0 0-9-9" />
    </svg>
  );
}

// ─── Props ──────────────────────────────────────────────────────────────────

interface AddTournamentModalProps {
  open: boolean;
  onClose: () => void;
  groupId: string;
  /** Already-associated tournament IDs to filter out from the list. */
  currentTournamentIds: string[];
}

// ─── Component ──────────────────────────────────────────────────────────────

export function AddTournamentModal({
  open,
  onClose,
  groupId,
  currentTournamentIds,
}: AddTournamentModalProps) {
  const { data: playableTournaments, isLoading } = usePlayableTournaments();
  const addTournament = useAddTournament();

  const titleId = "add-tournament-modal-title";

  function handleClose() {
    addTournament.reset();
    onClose();
  }

  const { dialogRef } = useDialogA11y({
    open,
    onClose: handleClose,
  });

  function handleAdd(tournamentId: string) {
    addTournament.mutate(
      { groupId, tournamentId },
      {
        onSuccess: () => {
          if (typeof window !== "undefined") {
            window.alert("Torneo agregado al grupo.");
          }
          handleClose();
        },
        onError: (err: unknown) => {
          console.error("[AddTournamentModal] Error:", err);
          const axiosErr = err as {
            response?: { data?: { message?: string }; status?: number };
          };
          const status = axiosErr?.response?.status;

          if (typeof window === "undefined") return;

          if (status === 403) {
            window.alert(
              axiosErr?.response?.data?.message ??
                "Alcanzaste el límite de torneos de tu plan.",
            );
            return;
          }

          window.alert(
            axiosErr?.response?.data?.message ??
              "No se pudo agregar el torneo. Intentá de nuevo.",
          );
        },
      },
    );
  }

  if (!open) return null;
  if (typeof window === "undefined") return null;

  const availableTournaments =
    playableTournaments?.filter(
      (t) => !currentTournamentIds.includes(t.id),
    ) ?? [];

  const node = (
    <div
      data-testid="add-tournament-modal"
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Cerrar"
        onClick={handleClose}
        data-testid="add-tournament-modal-backdrop"
        className="absolute inset-0 bg-black/50"
      />

      {/* Panel */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl bg-surface shadow-lg sm:rounded-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 pb-4 pt-5">
          <h2
            id={titleId}
            className="text-xl font-bold text-text-primary"
          >
            Agregar torneo
          </h2>
          <button
            type="button"
            onClick={handleClose}
            data-testid="add-tournament-modal-cancel"
            className="px-1 py-1 text-[15px] font-medium text-primary hover:underline"
          >
            Cancelar
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col overflow-y-auto">
          {isLoading ? (
            <div
              data-testid="add-tournament-modal-loading"
              className="flex flex-col items-center justify-center px-8 py-12"
            >
              <SpinnerGlyph className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : availableTournaments.length === 0 ? (
            <div
              data-testid="add-tournament-modal-empty"
              className="flex flex-col items-center justify-center px-8 py-12 text-center"
            >
              <TrophyGlyph className="h-12 w-12 text-text-tertiary" />
              <p className="mt-4 text-base font-semibold text-text-primary">
                No hay torneos disponibles
              </p>
              <p className="mt-2 text-sm text-text-secondary">
                Todos los torneos ya están agregados a este grupo.
              </p>
            </div>
          ) : (
            <ul
              data-testid="add-tournament-modal-list"
              className="flex flex-col gap-2 px-5 py-6"
            >
              {availableTournaments.map((t) => (
                <TournamentRow
                  key={t.id}
                  tournament={t}
                  onAdd={() => handleAdd(t.id)}
                  isAdding={addTournament.isPending}
                />
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(node, document.body);
}

// ─── Subcomponents ──────────────────────────────────────────────────────────

interface TournamentRowProps {
  tournament: TournamentDto;
  onAdd: () => void;
  isAdding: boolean;
}

function TournamentRow({ tournament, onAdd, isAdding }: TournamentRowProps) {
  const typeLabel =
    TOURNAMENT_TYPE_LABELS[tournament.type] ?? tournament.type;
  const statusLabel =
    TOURNAMENT_STATUS_LABELS[tournament.status] ?? tournament.status;

  return (
    <li
      data-testid={`add-tournament-modal-row-${tournament.id}`}
      className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-white px-4 py-3"
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-surface-light">
          <TrophyGlyph className="h-5 w-5 text-primary" />
          {tournament.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={tournament.logoUrl}
              alt=""
              className="absolute inset-0 h-full w-full rounded-full object-cover"
            />
          ) : null}
        </div>
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="truncate text-sm font-semibold text-text-primary">
            {tournament.name}
          </span>
          <span className="truncate text-xs text-text-secondary">
            {typeLabel} · {statusLabel}
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={onAdd}
        disabled={isAdding}
        data-testid={`add-tournament-modal-add-${tournament.id}`}
        className="inline-flex h-9 shrink-0 items-center justify-center rounded-md border border-primary bg-white px-4 text-xs font-semibold text-primary transition hover:bg-primary-surface-light disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isAdding ? (
          <SpinnerGlyph className="h-4 w-4 animate-spin text-primary" />
        ) : (
          "Agregar"
        )}
      </button>
    </li>
  );
}
