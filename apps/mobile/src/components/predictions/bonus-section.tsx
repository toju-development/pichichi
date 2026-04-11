/**
 * BonusSection — renders all bonus prediction cards + manages the edit modal.
 *
 * Displays a "Pronósticos Bonus" header with a point-value subtitle,
 * then a vertical list of BonusPredictionCard components (one per
 * bonus type defined in the tournament). The bonus types come from the
 * parent (via the tournament data), NOT hardcoded — so the section
 * renders whatever categories the backend provides.
 *
 * Fetches tournament teams and players data, then passes them down to:
 * - BonusPredictionCard (for externalId → display name resolution)
 * - BonusPredictionModal (for the structured FlatList picker)
 *
 * Owns the BonusPredictionModal open/close state: when a card is
 * tapped, this section opens the modal for that specific category.
 *
 * NativeWind v4 rule: className for spacing, StyleSheet for visuals.
 * NEVER mix `style` and `className` on the same element.
 */

import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { BonusPredictionDto, BonusTypeDto } from '@pichichi/shared';

import { BonusPredictionCard } from '@/components/predictions/bonus-prediction-card';
import { BonusPredictionModal } from '@/components/predictions/bonus-prediction-modal';
import {
  useTournamentPlayers,
  useTournamentTeams,
} from '@/hooks/use-tournaments';
import { COLORS } from '@/theme/colors';

// ─── Props ──────────────────────────────────────────────────────────────────

export interface BonusSectionProps {
  /** Bonus type definitions from the tournament (e.g. Champion, Top Scorer). */
  bonusTypes: BonusTypeDto[];
  /** The current user's bonus predictions for this group. */
  bonusPredictions: BonusPredictionDto[];
  /** Whether bonus predictions are locked (after first tournament match kicks off). */
  isLocked: boolean;
  /** The group ID — needed by the modal for the upsert mutation. */
  groupId: string;
  /** The tournament ID — used to fetch teams/players and passed to the modal. */
  tournamentId: string;
  /** NativeWind classes for external spacing (e.g. mb-6). */
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

  // Fetch teams and players for externalId resolution + modal picker
  const { data: teams = [] } = useTournamentTeams(tournamentId);
  const { data: players = [], isLoading: isPlayersLoading } =
    useTournamentPlayers(tournamentId);

  // Nothing to render if the tournament has no bonus types
  if (bonusTypes.length === 0) return null;

  // Build a lookup: bonusTypeId → prediction for O(1) matching
  const predictionsByTypeId = new Map<string, BonusPredictionDto>();
  for (const p of bonusPredictions) {
    predictionsByTypeId.set(p.bonusTypeId, p);
  }

  function handleEdit(bonusType: BonusTypeDto) {
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

  // Sort by the backend-defined sortOrder
  const sortedTypes = [...bonusTypes].sort(
    (a, b) => a.sortOrder - b.sortOrder,
  );

  const content = (
    <View>
      {/* ── Section header ──────────────────────────────────────────────── */}
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Pronósticos Bonus</Text>
        <View style={styles.pointsBadge}>
          <Text style={styles.pointsLabel}>
            {bonusTypes[0]?.points ?? 10} pts c/u
          </Text>
        </View>
      </View>

      {/* ── Vertical card list ──────────────────────────────────────────── */}
      <View style={styles.list}>
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
      </View>

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
    </View>
  );

  if (className) {
    return <View className={className}>{content}</View>;
  }

  return content;
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // ── Section header ──────────────────────────────────────────────────────
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  pointsBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: COLORS.gold.DEFAULT,
  },
  pointsLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text.primary,
    letterSpacing: 0.3,
  },

  // ── Vertical card list ───────────────────────────────────────────────
  list: {
    gap: 12,
  },
});
