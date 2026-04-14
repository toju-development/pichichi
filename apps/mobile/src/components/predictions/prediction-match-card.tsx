/**
 * Match card enriched with prediction context for group tournament screens.
 *
 * Wraps the existing `MatchCard` via composition — does NOT modify the
 * original component. Adds:
 * - `PredictionStatusBadge` inside the card's bottom-right area
 * - Lock logic: match is non-tappable once locked (status !== SCHEDULED
 *   or < LOCK_BUFFER_MINUTES before kickoff)
 * - Visual dimming when locked and no prediction exists
 * - Social reveal button: when match is locked and groupId is provided,
 *   shows an eye icon to open the GroupPredictionsSheet.
 *
 * IMPORTANT — NativeWind v4 ghost-card fix:
 * ALL visual properties live in StyleSheet so they are applied on the FIRST
 * frame. Never mix `style` and `className` on the same element.
 */

import { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import type { MatchDto, PredictionDto } from '@pichichi/shared';

import { RevealIcon } from '@/components/brand/icons';
import { MatchCard } from '@/components/matches/match-card';
import { GroupPredictionsSheet } from '@/components/predictions/group-predictions-sheet';
import { PredictionStatusBadge } from '@/components/predictions/prediction-status-badge';
import { COLORS } from '@/theme/colors';
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
  /** Group ID — when provided and match is locked, shows the social reveal button. */
  groupId?: string;
  /** Group display name — forwarded to GroupPredictionsSheet header. */
  groupName?: string;
  /** Current logged-in user ID — forwarded to GroupPredictionsSheet to highlight their row. */
  currentUserId?: string;
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
  groupId,
  groupName,
  currentUserId,
  showPhaseInfo = false,
  className,
}: PredictionMatchCardProps) {
  const locked = isMatchLocked(match);
  const hasPrediction = prediction != null;

  const [sheetVisible, setSheetVisible] = useState(false);

  const showRevealButton = locked && !!groupId;

  const badge = (
    <View style={styles.footerContainer}>
      <PredictionStatusBadge
        prediction={prediction}
        matchStatus={match.status}
        isLocked={locked}
      />
      {showRevealButton ? (
        <TouchableOpacity
          onPress={() => setSheetVisible(true)}
          style={styles.revealButton}
          activeOpacity={0.6}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <RevealIcon size={18} color={COLORS.primary.DEFAULT} />
        </TouchableOpacity>
      ) : null}
    </View>
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

      {/* Group predictions sheet — only rendered when groupId is available */}
      {groupId ? (
        <GroupPredictionsSheet
          visible={sheetVisible}
          onClose={() => setSheetVisible(false)}
          groupId={groupId}
          matchId={match.id}
          match={match}
          groupName={groupName}
          currentUserId={currentUserId}
        />
      ) : null}
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  footerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  revealButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
