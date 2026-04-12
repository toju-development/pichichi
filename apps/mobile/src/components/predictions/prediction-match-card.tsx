/**
 * Match card enriched with prediction context for group tournament screens.
 *
 * Wraps the existing `MatchCard` via composition — does NOT modify the
 * original component. Adds:
 * - `PredictionStatusBadge` inside the card's bottom-right area
 * - Lock logic: match is non-tappable once locked (status !== SCHEDULED
 *   or < LOCK_BUFFER_MINUTES before kickoff)
 * - Visual dimming when locked and no prediction exists
 *
 * IMPORTANT — NativeWind v4 ghost-card fix:
 * ALL visual properties live in StyleSheet so they are applied on the FIRST
 * frame. Never mix `style` and `className` on the same element.
 */

import { View } from 'react-native';

import type { MatchDto, PredictionDto } from '@pichichi/shared';

import { MatchCard } from '@/components/matches/match-card';
import { PredictionStatusBadge } from '@/components/predictions/prediction-status-badge';
import { isMatchLocked } from '@/utils/match-helpers';

// ─── Props ──────────────────────────────────────────────────────────────────

export interface PredictionMatchCardProps {
  /** The match to display. */
  match: MatchDto;
  /** The user's prediction for this match, or null/undefined if none. */
  prediction: PredictionDto | null | undefined;
  /** Called when the user taps the card to open prediction entry. */
  onPredict: (match: MatchDto) => void;
  /**
   * Called when the user taps the card while it is locked (e.g. LIVE or past
   * the prediction cutoff). Use this to open a match detail view.
   */
  onMatchDetail?: (match: MatchDto) => void;
  /** Group ID for context (used by parent for mutations). */
  groupId: string;
  /** Show the phase/group badge line at the top. */
  showPhaseInfo?: boolean;
  /** NativeWind classes for external spacing (e.g. mb-3). */
  className?: string;
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function PredictionMatchCard({
  match,
  prediction,
  onPredict,
  onMatchDetail,
  showPhaseInfo = false,
  className,
}: PredictionMatchCardProps) {
  const locked = isMatchLocked(match);
  const hasPrediction = prediction != null;

  const badge = (
    <PredictionStatusBadge
      prediction={prediction}
      matchStatus={match.status}
      isLocked={locked}
    />
  );

  return (
    <View className={className}>
      <MatchCard
        match={match}
        hasPrediction={hasPrediction}
        showPhaseInfo={showPhaseInfo}
        footer={badge}
        onPress={locked ? (onMatchDetail ? () => onMatchDetail(match) : undefined) : () => onPredict(match)}
      />
    </View>
  );
}
