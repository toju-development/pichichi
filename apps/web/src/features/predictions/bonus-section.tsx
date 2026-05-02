"use client";

/**
 * BonusSection — port literal de
 * `apps/mobile/src/components/predictions/bonus-section.tsx`.
 *
 * Renderiza header "Pronósticos Bonus" + badge de puntos + lista vertical de
 * `<BonusPredictionCard>` (uno por bonus type del torneo). Owns el estado
 * open/close del `<BonusPredictionModal>`.
 *
 * Los `bonusTypes` vienen del torneo (no hardcoded) — la sección renderiza lo
 * que el backend defina.
 *
 * Fetch interno de teams + players para resolver `externalId → display name`
 * en las cards y para el picker del modal.
 *
 * Diferencias justificadas web:
 *   - StyleSheet → tokens Tailwind.
 *   - `<View>` → `<section>` / `<div>`.
 */

import { useState } from "react";

import type {
  BonusPredictionDto,
  BonusTypeDto,
  TournamentBonusTypeDto,
} from "@pichichi/shared";

import { cn } from "@/lib/cn";
import {
  useTournamentPlayers,
  useTournamentTeams,
} from "@/hooks/use-tournaments";

import { BonusPredictionCard } from "./bonus-prediction-card";
import { BonusPredictionModal } from "./bonus-prediction-modal";

// ─── Props ──────────────────────────────────────────────────────────────────

export interface BonusSectionProps {
  /** Bonus type definitions from the tournament (e.g. Champion, Top Scorer). */
  bonusTypes: Array<BonusTypeDto | TournamentBonusTypeDto>;
  /** The current user's bonus predictions for this group. */
  bonusPredictions: BonusPredictionDto[];
  /** Whether bonus predictions are locked (after first tournament match kicks off). */
  isLocked: boolean;
  /** The group ID — needed by the modal for the upsert mutation. */
  groupId: string;
  /** The tournament ID — used to fetch teams/players and passed to the modal. */
  tournamentId: string;
  /** Optional Tailwind classes for external spacing (e.g. mb-6). */
  className?: string;
}

// ─── Modal State ────────────────────────────────────────────────────────────

interface ModalState {
  visible: boolean;
  /** bonusType.id — used as bonusTypeId in the mutation. */
  bonusTypeId: string | null;
  /** bonusType.key — e.g. CHAMPION, TOP_SCORER, MVP, REVELATION. */
  bonusTypeKey: string | null;
  /** Human-readable label for the modal header. */
  bonusTypeLabel: string | null;
  /** Current predicted value for pre-fill (null if no prediction). */
  currentValue: string | null;
}

const INITIAL_MODAL_STATE: ModalState = {
  visible: false,
  bonusTypeId: null,
  bonusTypeKey: null,
  bonusTypeLabel: null,
  currentValue: null,
};

// ─── Component ──────────────────────────────────────────────────────────────

export function BonusSection({
  bonusTypes,
  bonusPredictions,
  isLocked,
  groupId,
  tournamentId,
  className,
}: BonusSectionProps) {
  const [modal, setModal] = useState<ModalState>(INITIAL_MODAL_STATE);

  // Fetch teams and players for externalId resolution + modal picker.
  const { data: teams = [] } = useTournamentTeams(tournamentId);
  const { data: players = [], isLoading: isPlayersLoading } =
    useTournamentPlayers(tournamentId);

  // Nothing to render if the tournament has no bonus types.
  if (bonusTypes.length === 0) return null;

  // Lookup: bonusTypeId → prediction (O(1) matching).
  const predictionsByTypeId = new Map<string, BonusPredictionDto>();
  for (const p of bonusPredictions) {
    predictionsByTypeId.set(p.bonusTypeId, p);
  }

  function handleEdit(bonusType: BonusTypeDto | TournamentBonusTypeDto) {
    const existing = predictionsByTypeId.get(bonusType.id);
    setModal({
      visible: true,
      bonusTypeId: bonusType.id,
      bonusTypeKey: bonusType.key,
      bonusTypeLabel: bonusType.label,
      currentValue: existing?.predictedValue ?? null,
    });
  }

  function handleCloseModal() {
    setModal(INITIAL_MODAL_STATE);
  }

  // Sort by backend-defined sortOrder (paridad mobile).
  const sortedTypes = [...bonusTypes].sort(
    (a, b) => a.sortOrder - b.sortOrder,
  );

  return (
    <section
      data-testid="bonus-section"
      className={cn("flex flex-col", className)}
    >
      {/* ── Section header ──────────────────────────────────────────────── */}
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold text-text-primary">
          Pronósticos Bonus
        </h2>
        <span
          className="rounded-xl bg-amber-300 px-2.5 py-1 text-xs font-bold tracking-wide text-text-primary"
          data-testid="bonus-section-points-badge"
        >
          {bonusTypes[0]?.points ?? 10} pts c/u
        </span>
      </div>

      {/* ── Vertical card list ──────────────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        {sortedTypes.map((bonusType) => (
          <BonusPredictionCard
            key={bonusType.id}
            bonusType={bonusType}
            prediction={predictionsByTypeId.get(bonusType.id)}
            isLocked={isLocked}
            onEdit={() => handleEdit(bonusType)}
            teams={teams}
            players={players}
          />
        ))}
      </div>

      {/* ── Bonus prediction modal ──────────────────────────────────────── */}
      <BonusPredictionModal
        visible={modal.visible}
        onClose={handleCloseModal}
        bonusTypeId={modal.bonusTypeId}
        bonusTypeKey={modal.bonusTypeKey}
        bonusTypeLabel={modal.bonusTypeLabel}
        currentValue={modal.currentValue}
        groupId={groupId}
        tournamentId={tournamentId}
        teams={teams}
        players={players}
        isPlayersLoading={isPlayersLoading}
      />
    </section>
  );
}
