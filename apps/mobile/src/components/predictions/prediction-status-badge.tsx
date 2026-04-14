/**
 * Badge displaying the current state/result of a user's prediction on a match.
 *
 * Renders one of six visual states:
 * 1. **No prediction, open**           → subtle "Tocar para pronosticar" hint
 * 2. **Predicted, match not started**  → predicted score "2 - 1" in accent color
 * 3. **Scored, match finished**        → score + point-type label + points earned
 * 4. **Locked, no prediction**         → lock icon + "Bloqueado"
 * 5. **Locked, has prediction**        → predicted score (non-editable)
 * 6. **Finished, no prediction**       → "Sin pronóstico" muted text
 * 7. **Live, in progress**            → "En vivo" indicator
 *
 * Pure presentational — receives derived props, owns zero business logic.
 *
 * IMPORTANT — NativeWind v4 ghost-card fix:
 * ALL visual properties live in StyleSheet so they are applied on the FIRST
 * frame. Never mix `style` and `className` on the same element.
 */

import { StyleSheet, Text, View } from 'react-native';

import type { MatchStatus, PredictionDto, PredictionPointType } from '@pichichi/shared';

import { COLORS } from '@/theme/colors';

// ─── Point-type display config ──────────────────────────────────────────────

interface PointTypeConfig {
  label: string;
  color: string;
  icon: string;
}

const POINT_TYPE_CONFIG: Record<PredictionPointType, PointTypeConfig> = {
  EXACT: { label: 'Exacto', color: COLORS.success, icon: '\u2713' },
  GOAL_DIFF: { label: 'Gol Dif', color: COLORS.primary.DEFAULT, icon: '\u2248' },
  WINNER: { label: 'Ganador', color: COLORS.warning, icon: '\u2713' },
  MISS: { label: 'Errado', color: COLORS.error, icon: '\u2717' },
};

// ─── Props ──────────────────────────────────────────────────────────────────

export interface PredictionStatusBadgeProps {
  /** The user's prediction for this match, or null/undefined if none. */
  prediction: PredictionDto | null | undefined;
  /** Current status of the match (SCHEDULED, LIVE, FINISHED, etc.). */
  matchStatus: MatchStatus;
  /** Whether predictions are locked for this match (past deadline). */
  isLocked: boolean;
}

// ─── State derivation ───────────────────────────────────────────────────────

type BadgeState =
  | { kind: 'open' }
  | { kind: 'predicted'; home: number; away: number }
  | { kind: 'scored'; home: number; away: number; pointType: PredictionPointType; points: number }
  | { kind: 'locked' }
  | { kind: 'locked-predicted'; home: number; away: number }
  | { kind: 'finished-no-prediction' }
  | { kind: 'live' }
  | { kind: 'live-predicted'; home: number; away: number };

function deriveBadgeState(
  prediction: PredictionDto | null | undefined,
  matchStatus: MatchStatus,
  isLocked: boolean,
): BadgeState {
  const isFinished = matchStatus === 'FINISHED';
  const isLive = matchStatus === 'LIVE';

  if (prediction) {
    // Finished match with scored prediction
    if (isFinished && prediction.pointType != null) {
      return {
        kind: 'scored',
        home: prediction.predictedHome,
        away: prediction.predictedAway,
        pointType: prediction.pointType,
        points: prediction.pointsEarned,
      };
    }

    // Live match with existing prediction
    if (isLive) {
      return {
        kind: 'live-predicted',
        home: prediction.predictedHome,
        away: prediction.predictedAway,
      };
    }

    // Locked match with prediction (can't edit but shows score)
    if (isLocked) {
      return {
        kind: 'locked-predicted',
        home: prediction.predictedHome,
        away: prediction.predictedAway,
      };
    }

    // Open match with prediction (can still edit)
    return {
      kind: 'predicted',
      home: prediction.predictedHome,
      away: prediction.predictedAway,
    };
  }

  // No prediction below

  if (isFinished) {
    return { kind: 'finished-no-prediction' };
  }

  if (isLive) {
    return { kind: 'live' };
  }

  if (isLocked) {
    return { kind: 'locked' };
  }

  return { kind: 'open' };
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function PredictionStatusBadge({
  prediction,
  matchStatus,
  isLocked,
}: PredictionStatusBadgeProps) {
  const state = deriveBadgeState(prediction, matchStatus, isLocked);

  switch (state.kind) {
    case 'open':
      return (
        <View style={styles.openBadge}>
          <Text style={styles.openBadgeText}>+ Pronosticar</Text>
        </View>
      );

    case 'predicted':
      return (
        <View style={styles.predictedBadge}>
          <Text style={styles.predictedLabel}>Tu pronóstico</Text>
          <Text style={styles.predictedScore}>
            {state.home} - {state.away}
          </Text>
        </View>
      );

    case 'locked-predicted':
      return (
        <View style={styles.lockedPredictedBadge}>
          <Text style={styles.lockedPredictedLabel}>Tu pronóstico</Text>
          <Text style={styles.lockedPredictedScore}>
            {state.home} - {state.away}
          </Text>
        </View>
      );

    case 'live-predicted':
      return (
        <View style={styles.livePredictedBadge}>
          <Text style={styles.livePredictedLabel}>Tu pronóstico</Text>
          <Text style={styles.livePredictedScore}>
            {state.home} - {state.away}
          </Text>
        </View>
      );

    case 'scored': {
      const config = POINT_TYPE_CONFIG[state.pointType];
      return (
        <View style={styles.scoredBadge}>
          <Text style={[styles.scoredIcon, { color: config.color }]}>
            {config.icon}
          </Text>
          <Text style={styles.scoredScore}>
            {state.home} - {state.away}
          </Text>
          <Text style={[styles.scoredLabel, { color: config.color }]}>
            {config.label}
          </Text>
          {state.points > 0 ? (
            <Text style={[styles.scoredPoints, { color: config.color }]}>
              +{state.points}pts
            </Text>
          ) : (
            <Text style={styles.scoredZeroPoints}>0pts</Text>
          )}
        </View>
      );
    }

    case 'locked':
      return (
        <View style={styles.lockedBadge}>
          <Text style={styles.lockedIcon}>{'\uD83D\uDD12'}</Text>
          <Text style={styles.lockedText}>Bloqueado</Text>
        </View>
      );

    case 'finished-no-prediction':
      return (
        <View style={styles.finishedNoPredictionBadge}>
          <Text style={styles.finishedNoPredictionText}>Sin pronóstico</Text>
        </View>
      );

    case 'live':
      return (
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>En vivo</Text>
        </View>
      );
  }
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // ── Open (no prediction, tappable) ───────────────────────────────────────
  openBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#E65100',
    alignSelf: 'center',
  },
  openBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E65100',
    letterSpacing: 0.3,
  },

  // ── Predicted (match not started, editable) ──────────────────────────────
  predictedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: COLORS.primary.light,
  },
  predictedLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.primary.DEFAULT,
  },
  predictedScore: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary.DEFAULT,
    letterSpacing: 0.3,
  },

  // ── Locked with prediction (can't edit) ──────────────────────────────────
  lockedPredictedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: COLORS.background,
  },
  lockedPredictedLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.text.secondary,
  },
  lockedPredictedScore: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text.secondary,
    letterSpacing: 0.3,
  },

  // ── Live with prediction ─────────────────────────────────────────────────
  livePredictedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: COLORS.background,
  },
  livePredictedLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.text.secondary,
  },
  livePredictedScore: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text.secondary,
    letterSpacing: 0.3,
  },

  // ── Scored (match finished) ──────────────────────────────────────────────
  scoredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: COLORS.background,
  },
  scoredIcon: {
    fontSize: 12,
    fontWeight: '700',
  },
  scoredScore: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text.secondary,
  },
  scoredLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  scoredPoints: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  scoredZeroPoints: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.text.muted,
    letterSpacing: 0.3,
  },

  // ── Locked (no prediction) ──────────────────────────────────────────────
  lockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: COLORS.background,
  },
  lockedIcon: {
    fontSize: 11,
  },
  lockedText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text.muted,
    letterSpacing: 0.3,
  },

  // ── Finished without prediction ──────────────────────────────────────────
  finishedNoPredictionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignSelf: 'center',
  },
  finishedNoPredictionText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
  },

  // ── Live (no prediction) ────────────────────────────────────────────────
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: COLORS.background,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.error,
  },
  liveText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.error,
    letterSpacing: 0.3,
  },
});
