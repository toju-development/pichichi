/**
 * GroupPredictionsSheet — slide-up modal showing group members' predictions for a match.
 *
 * Displays:
 * - When `revealed === true`: list of group members' predictions with scores
 *   and (for FINISHED matches) color-coded points earned.
 * - When `revealed === false`: a lock message explaining predictions reveal on kickoff.
 * - Loading state: spinner while fetching.
 * - Empty state: when no predictions exist.
 *
 * Uses the `useGroupPredictions` hook and follows the same modal patterns
 * as ScorePredictionModal.
 *
 * IMPORTANT — NativeWind v4 ghost-card fix:
 * ALL visual properties live in StyleSheet. Never mix `style` and `className`
 * on the same element.
 */

import { ActivityIndicator, FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import type { MatchDto, PredictionPointType, UserPredictionDto } from '@pichichi/shared';

import { LockIcon, RevealIcon } from '@/components/brand/icons';
import { TeamAvatar } from '@/components/ui/team-avatar';
import { useGroupPredictions } from '@/hooks/use-predictions';
import { COLORS } from '@/theme/colors';

// ─── Props ──────────────────────────────────────────────────────────────────

interface GroupPredictionsSheetProps {
  visible: boolean;
  onClose: () => void;
  groupId: string;
  matchId: string;
  match: MatchDto;
  /** Display name of the group — shown in the header. */
  groupName?: string;
  /** Current logged-in user's ID — used to highlight their prediction row. */
  currentUserId?: string;
}

// ─── Point-type display config ──────────────────────────────────────────────

interface PointTypeConfig {
  label: string;
  color: string;
  bgColor: string;
}

const POINT_TYPE_CONFIG: Record<PredictionPointType, PointTypeConfig> = {
  EXACT: { label: 'Exacto', color: COLORS.success, bgColor: '#ECFDF5' },
  GOAL_DIFF: { label: 'Gol Dif', color: COLORS.primary.DEFAULT, bgColor: COLORS.primary.light },
  WINNER: { label: 'Ganador', color: COLORS.warning, bgColor: '#FFFBEB' },
  MISS: { label: 'Errado', color: COLORS.text.muted, bgColor: '#F3F4F6' },
};

// ─── Sub-components ─────────────────────────────────────────────────────────

/** Avatar circle — shows first letter of display name as initials fallback. */
function UserAvatar({ displayName, isCurrentUser }: { displayName: string; isCurrentUser: boolean }) {
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <View style={[styles.avatar, isCurrentUser && styles.currentUserAvatar]}>
      <Text style={[styles.avatarText, isCurrentUser && styles.currentUserAvatarText]}>{initial}</Text>
    </View>
  );
}

/** Single prediction row. */
function PredictionRow({ item, isFinished, isCurrentUser }: { item: UserPredictionDto; isFinished: boolean; isCurrentUser: boolean }) {
  const pointConfig = item.pointType ? POINT_TYPE_CONFIG[item.pointType] : null;

  return (
    <View style={[styles.predictionRow, isCurrentUser && styles.currentUserRow]}>
      {/* Avatar + Name */}
      <View style={styles.userInfo}>
        <UserAvatar displayName={item.displayName} isCurrentUser={isCurrentUser} />
        <View style={styles.nameContainer}>
          <Text style={styles.displayName} numberOfLines={1}>
            {item.displayName}
          </Text>
          {isCurrentUser ? (
            <Text style={styles.youLabel}>(Vos)</Text>
          ) : null}
        </View>
      </View>

      {/* Predicted score */}
      <View style={styles.scoreSection}>
        <Text style={styles.predictedScore}>
          {item.predictedHome} - {item.predictedAway}
        </Text>
      </View>

      {/* Points (only for FINISHED matches with a pointType) */}
      {isFinished && pointConfig ? (
        <View style={[styles.pointBadge, { backgroundColor: pointConfig.bgColor }]}>
          <Text style={[styles.pointLabel, { color: pointConfig.color }]}>
            {pointConfig.label}
          </Text>
          <Text style={[styles.pointValue, { color: pointConfig.color }]}>
            +{item.pointsEarned}
          </Text>
        </View>
      ) : isFinished ? (
        <View style={[styles.pointBadge, { backgroundColor: '#F3F4F6' }]}>
          <Text style={[styles.pointLabel, { color: COLORS.text.muted }]}>
            -
          </Text>
        </View>
      ) : null}
    </View>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function GroupPredictionsSheet({
  visible,
  onClose,
  groupId,
  matchId,
  match,
  groupName,
  currentUserId,
}: GroupPredictionsSheetProps) {
  const { data, isLoading } = useGroupPredictions(groupId, matchId);

  const isFinished = match.status === 'FINISHED';

  const homeTeamName =
    match.homeTeam?.name ?? match.homeTeamPlaceholder ?? 'Local';
  const awayTeamName =
    match.awayTeam?.name ?? match.awayTeamPlaceholder ?? 'Visitante';

  const headerTitle = groupName
    ? `Pronósticos · ${groupName}`
    : 'Pronósticos del grupo';

  // ── Content rendering ─────────────────────────────────────────────────

  function renderContent() {
    // Loading
    if (isLoading) {
      return (
        <View style={styles.centeredContent}>
          <ActivityIndicator size="large" color={COLORS.primary.DEFAULT} />
          <Text style={styles.loadingText}>Cargando pronósticos...</Text>
        </View>
      );
    }

    // Not revealed — locked state
    if (data && !data.revealed) {
      return (
        <View style={styles.centeredContent}>
          <View style={styles.lockCircle}>
            <LockIcon size={32} color={COLORS.text.muted} />
          </View>
          <Text style={styles.lockTitle}>Pronósticos ocultos</Text>
          <Text style={styles.lockDescription}>
            Los pronósticos se revelan al inicio del partido
          </Text>
        </View>
      );
    }

    // Revealed but no predictions
    if (data && data.revealed && data.predictions.length === 0) {
      return (
        <View style={styles.centeredContent}>
          <View style={styles.lockCircle}>
            <RevealIcon size={32} color={COLORS.text.muted} />
          </View>
          <Text style={styles.lockTitle}>Sin pronósticos</Text>
          <Text style={styles.lockDescription}>
            Nadie ha pronosticado este partido aún
          </Text>
        </View>
      );
    }

    // Revealed with predictions — list
    if (data && data.revealed) {
      return (
        <FlatList
          data={data.predictions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <PredictionRow
              item={item}
              isFinished={isFinished}
              isCurrentUser={!!currentUserId && item.userId === currentUserId}
            />
          )}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      );
    }

    return null;
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle} numberOfLines={1}>{headerTitle}</Text>
          <Pressable onPress={onClose} style={styles.cancelButton}>
            <Text style={styles.cancelText}>Cerrar</Text>
          </Pressable>
        </View>

        {/* Match info — team logos + names + score */}
        <View style={styles.matchInfo}>
          <View style={styles.matchTeamsRow}>
            <View style={styles.matchTeamSide}>
              <TeamAvatar team={match.homeTeam} size={22} />
              <Text style={styles.matchTeamName} numberOfLines={1}>
                {homeTeamName}
              </Text>
            </View>

            {isFinished && match.homeScore != null && match.awayScore != null ? (
              <View style={styles.matchScoreBlock}>
                <Text style={styles.matchScoreText}>
                  {match.homeScore} - {match.awayScore}
                </Text>
              </View>
            ) : (
              <Text style={styles.matchVsText}>vs</Text>
            )}

            <View style={[styles.matchTeamSide, styles.matchTeamSideAway]}>
              <TeamAvatar team={match.awayTeam} size={22} />
              <Text style={styles.matchTeamName} numberOfLines={1}>
                {awayTeamName}
              </Text>
            </View>
          </View>
        </View>

        {/* Content */}
        <View style={styles.contentContainer}>
          {renderContent()}
        </View>
      </View>
    </Modal>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // ── Header ──────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text.primary,
    flexShrink: 1,
    marginRight: 12,
  },
  cancelButton: {
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.primary.DEFAULT,
  },

  // ── Match info ──────────────────────────────────────────────────────────
  matchInfo: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  matchTeamsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  matchTeamSide: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    justifyContent: 'flex-end',
  },
  matchTeamSideAway: {
    flexDirection: 'row-reverse',
    justifyContent: 'flex-end',
  },
  matchTeamName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.primary,
    flexShrink: 1,
  },
  matchScoreBlock: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: COLORS.primary.light,
  },
  matchScoreText: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.primary.DEFAULT,
    letterSpacing: 0.5,
  },
  matchVsText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text.muted,
    paddingHorizontal: 4,
  },

  // ── Content ─────────────────────────────────────────────────────────────
  contentContainer: {
    flex: 1,
  },

  // ── Centered content (loading, lock, empty) ─────────────────────────────
  centeredContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.text.muted,
  },

  // ── Lock state ──────────────────────────────────────────────────────────
  lockCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  lockTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text.primary,
    textAlign: 'center',
  },
  lockDescription: {
    marginTop: 8,
    fontSize: 14,
    color: COLORS.text.secondary,
    textAlign: 'center',
    maxWidth: 260,
  },

  // ── Prediction list ─────────────────────────────────────────────────────
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.border,
    marginVertical: 4,
  },

  // ── Prediction row ──────────────────────────────────────────────────────
  predictionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 10,
  },
  currentUserRow: {
    backgroundColor: COLORS.primary.light,
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginRight: 8,
  },

  // ── Avatar ──────────────────────────────────────────────────────────────
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentUserAvatar: {
    backgroundColor: COLORS.primary.DEFAULT,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary.DEFAULT,
  },
  currentUserAvatarText: {
    color: COLORS.surface,
  },

  // ── Display name ────────────────────────────────────────────────────────
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 1,
  },
  displayName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.primary,
    flexShrink: 1,
  },
  youLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary.DEFAULT,
  },

  // ── Predicted score ─────────────────────────────────────────────────────
  scoreSection: {
    paddingHorizontal: 8,
  },
  predictedScore: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text.primary,
    letterSpacing: 0.3,
  },

  // ── Points badge ────────────────────────────────────────────────────────
  pointBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
    minWidth: 70,
    justifyContent: 'center',
  },
  pointLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  pointValue: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
