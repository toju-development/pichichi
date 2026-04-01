/**
 * Card displaying a single bonus prediction category (e.g. Champion, Top Scorer).
 *
 * Shows the category label, current prediction value (or "Sin pronóstico"),
 * points available, and lock state. Tappable to edit when unlocked.
 *
 * Pure presentational — receives derived props, owns zero business logic.
 *
 * IMPORTANT — NativeWind v4 ghost-card fix:
 * ALL visual properties live in StyleSheet so they are applied on the FIRST
 * frame. Never mix `style` and `className` on the same element.
 */

import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { BonusPredictionDto, BonusTypeDto } from '@pichichi/shared';

import { COLORS } from '@/theme/colors';

// ─── Category icons (emoji) ────────────────────────────────────────────────

const CATEGORY_ICONS: Record<string, string> = {
  CHAMPION: '\uD83C\uDFC6',    // trophy
  TOP_SCORER: '\u26BD',         // soccer ball
  MVP: '\u2B50',                // star
  REVELATION: '\uD83D\uDCA5',  // collision/explosion
};

// ─── Category label translations ───────────────────────────────────────────

/** Maps backend bonus keys/labels (English) to Spanish display labels. */
const BONUS_LABELS: Record<string, string> = {
  // By key (uppercase)
  CHAMPION: 'Campeón',
  TOP_SCORER: 'Goleador',
  MVP: 'MVP',
  REVELATION: 'Revelación',
  // By label string (backend may send these)
  'Champion': 'Campeón',
  'Top Scorer': 'Goleador',
  'Most Valuable Player': 'MVP',
  'Revelation Team': 'Revelación',
};

// ─── Props ──────────────────────────────────────────────────────────────────

export interface BonusPredictionCardProps {
  /** The bonus type definition (key, label, points). */
  bonusType: BonusTypeDto;
  /** The user's prediction for this category, or null/undefined if none. */
  prediction: BonusPredictionDto | null | undefined;
  /** Whether bonus predictions are locked (after tournament starts). */
  isLocked: boolean;
  /** Called when the user taps to edit. Not called when locked. */
  onEdit: () => void;
  /** NativeWind classes for external spacing (e.g. mb-3). */
  className?: string;
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function BonusPredictionCard({
  bonusType,
  prediction,
  isLocked,
  onEdit,
  className,
}: BonusPredictionCardProps) {
  const hasPrediction = prediction != null && prediction.predictedValue !== '';
  const icon = CATEGORY_ICONS[bonusType.key] ?? '\uD83C\uDFC5'; // medal fallback
  const displayLabel = BONUS_LABELS[bonusType.key] ?? BONUS_LABELS[bonusType.label] ?? bonusType.label;

  // ── Determine visual state ──────────────────────────────────────────────

  const isScored = prediction?.isCorrect != null;
  const isCorrect = prediction?.isCorrect === true;

  const cardContent = (
    <View style={styles.cardSurface}>
      {/* Single horizontal row: icon + label | prediction value + status */}
      <View style={styles.mainRow}>
        {/* Left: icon + label + points */}
        <View style={styles.leftSection}>
          <Text style={styles.icon}>{icon}</Text>
          <View style={styles.labelGroup}>
            <Text style={styles.categoryLabel} numberOfLines={1}>{displayLabel}</Text>
            <Text style={styles.pointsText}>{bonusType.points} pts</Text>
          </View>
        </View>

        {/* Right: prediction value + status */}
        <View style={styles.rightSection}>
          {isLocked && !hasPrediction ? (
            <View style={styles.lockedRow}>
              <Text style={styles.lockedIcon}>{'\uD83D\uDD12'}</Text>
              <Text style={styles.lockedText}>Sin pronóstico</Text>
            </View>
          ) : hasPrediction ? (
            <View style={styles.predictionRow}>
              <Text
                style={[
                  styles.predictionValue,
                  isScored && isCorrect && styles.correctValue,
                  isScored && !isCorrect && styles.incorrectValue,
                ]}
                numberOfLines={1}
              >
                {prediction.predictedValue}
              </Text>
              {isScored && isCorrect && prediction.pointsEarned > 0 ? (
                <View style={styles.earnedBadge}>
                  <Text style={styles.earnedText}>
                    +{prediction.pointsEarned}pts
                  </Text>
                </View>
              ) : null}
            </View>
          ) : (
            <Text style={styles.editHint}>
              Tocar para pronosticar
            </Text>
          )}
        </View>
      </View>
    </View>
  );

  const pressableCard = isLocked ? (
    <View style={styles.shadow}>
      <View style={isLocked ? styles.lockedOverlay : undefined}>
        {cardContent}
      </View>
    </View>
  ) : (
    <Pressable
      onPress={onEdit}
      style={({ pressed }) => pressed ? [styles.shadow, styles.pressed] : styles.shadow}
    >
      {cardContent}
    </Pressable>
  );

  if (className) {
    return <View className={className}>{pressableCard}</View>;
  }

  return pressableCard;
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // ── Shadow wrapper ──────────────────────────────────────────────────────
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },

  // ── Card surface ────────────────────────────────────────────────────────
  cardSurface: {
    overflow: 'hidden',
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },

  // ── Pressed / locked states ─────────────────────────────────────────────
  pressed: {
    opacity: 0.7,
  },
  lockedOverlay: {
    opacity: 0.6,
  },

  // ── Main horizontal row ─────────────────────────────────────────────────
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  // ── Left section: icon + label + points ─────────────────────────────────
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 1,
  },
  icon: {
    fontSize: 20,
  },
  labelGroup: {
    flexShrink: 1,
  },
  categoryLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  pointsText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.text.muted,
    marginTop: 1,
  },

  // ── Right section: prediction value / status ────────────────────────────
  rightSection: {
    alignItems: 'flex-end',
    marginLeft: 12,
    flexShrink: 0,
  },
  predictionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  predictionValue: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.primary.DEFAULT,
  },
  correctValue: {
    color: COLORS.success,
  },
  incorrectValue: {
    color: COLORS.error,
  },

  // ── Locked value ────────────────────────────────────────────────────────
  lockedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  lockedIcon: {
    fontSize: 13,
  },
  lockedText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.text.muted,
    fontStyle: 'italic',
  },

  // ── Earned badge ────────────────────────────────────────────────────────
  earnedBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: COLORS.primary.light,
  },
  earnedText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.success,
    letterSpacing: 0.3,
  },

  // ── Edit hint ───────────────────────────────────────────────────────────
  editHint: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.text.secondary,
    fontStyle: 'italic',
  },
});
