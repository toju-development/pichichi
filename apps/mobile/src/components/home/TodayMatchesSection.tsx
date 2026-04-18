/**
 * Today's matches section for the home dashboard.
 *
 * Unified view of all matches scheduled for today across tournaments.
 * Deduplicates matches that appear in multiple groups — shows one card
 * per unique match with group chips when the match exists in 2+ groups.
 *
 * Pure presentational — receives typed props, no hooks or data fetching.
 *
 * IMPORTANT — NativeWind v4:
 * Uses StyleSheet for all visual properties to guarantee rendering
 * on the first frame. `className` is for external spacing only.
 * Never mix `style` and `className` on the same element.
 */

import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Check, CalendarX2, ChevronRight, Globe, Users } from 'lucide-react-native';

import type { DashboardTodayMatchDto, MatchDto } from '@pichichi/shared';

import { MatchDetailModal } from '@/components/matches/match-detail-modal';
import { ScorePredictionModal } from '@/components/predictions/score-prediction-modal';
import { TeamAvatar } from '@/components/ui/team-avatar';
import { COLORS } from '@/theme/colors';

// ─── Types ──────────────────────────────────────────────────────────────────

/** Per-group prediction info for a deduplicated match. */
interface GroupEntry {
  groupId: string;
  groupName: string;
  tournamentSlug: string;
  hasPrediction: boolean;
  predictedHome: number | null;
  predictedAway: number | null;
}

/** A unique match with all its group appearances. */
interface DeduplicatedMatch {
  /** The first DTO row — used for match-level fields (teams, score, status, etc.) */
  match: DashboardTodayMatchDto;
  /** All groups this match appears in (1 = single, 2+ = multi-group). */
  groups: GroupEntry[];
}

// ─── Time formatting ────────────────────────────────────────────────────────

/** Build a minimal MatchDto from a DashboardTodayMatchDto for the prediction modal. */
function toMatchDto(m: DashboardTodayMatchDto): MatchDto {
  return {
    id: m.matchId,
    tournamentId: '',
    homeTeam: m.homeTeam ? { ...m.homeTeam, shortName: m.homeTeam.name } : null,
    awayTeam: m.awayTeam ? { ...m.awayTeam, shortName: m.awayTeam.name } : null,
    phase: m.phase as MatchDto['phase'],
    groupName: null,
    matchNumber: null,
    scheduledAt: m.scheduledAt,
    venue: null,
    city: null,
    status: m.status as MatchDto['status'],
    homeScore: m.homeScore,
    awayScore: m.awayScore,
    homeScorePenalties: null,
    awayScorePenalties: null,
    isExtraTime: false,
    homeTeamPlaceholder: m.homePlaceholder,
    awayTeamPlaceholder: m.awayPlaceholder,
    externalId: m.externalId,
    createdAt: '',
    updatedAt: '',
  };
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

// ─── Deduplication ──────────────────────────────────────────────────────────

/**
 * Groups flat match rows by matchId, producing one DeduplicatedMatch per
 * unique match. Preserves the original order (first occurrence wins).
 */
function deduplicateMatches(
  matches: DashboardTodayMatchDto[],
): DeduplicatedMatch[] {
  const map = new Map<string, DeduplicatedMatch>();

  for (const m of matches) {
    const existing = map.get(m.matchId);
    const groupEntry: GroupEntry = {
      groupId: m.groupId,
      groupName: m.groupName,
      tournamentSlug: m.tournamentSlug,
      hasPrediction: m.hasPrediction,
      predictedHome: m.predictedHome,
      predictedAway: m.predictedAway,
    };

    if (existing) {
      existing.groups.push(groupEntry);
    } else {
      map.set(m.matchId, { match: m, groups: [groupEntry] });
    }
  }

  return Array.from(map.values());
}

// ─── Props ──────────────────────────────────────────────────────────────────

interface TodayMatchesSectionProps {
  matches: DashboardTodayMatchDto[];
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function TeamSide({
  team,
  placeholder,
  reverse,
}: {
  team: DashboardTodayMatchDto['homeTeam'];
  placeholder: string | null;
  reverse?: boolean;
}) {
  if (!team) {
    return (
      <View style={[styles.teamSide, reverse && styles.teamSideReverse]}>
        <Text style={styles.placeholderName} numberOfLines={1}>
          {placeholder ?? 'TBD'}
        </Text>
      </View>
    );
  }

  const avatar = <TeamAvatar team={team} />;
  const name = (
    <Text style={styles.teamName} numberOfLines={1}>
      {team.name}
    </Text>
  );

  return (
    <View style={[styles.teamSide, reverse && styles.teamSideReverse]}>
      {reverse ? <>{name}{avatar}</> : <>{avatar}{name}</>}
    </View>
  );
}

function CenterBlock({ match }: { match: DashboardTodayMatchDto }) {
  const isLive = match.isLocked && match.homeScore != null && match.awayScore != null;
  const isFinished = match.status === 'FINISHED';
  const hasScore = match.homeScore != null && match.awayScore != null;

  if ((isLive || isFinished) && hasScore) {
    return (
      <View style={styles.scoreBlock}>
        {isLive && !isFinished ? <View style={styles.liveDot} /> : null}
        <Text style={styles.scoreText}>
          {match.homeScore} - {match.awayScore}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.timeBlock}>
      <Text style={styles.timeText}>{formatTime(match.scheduledAt)}</Text>
    </View>
  );
}

function PredictionIndicator({ match, groups }: { match: DashboardTodayMatchDto; groups: GroupEntry[] }) {
  const isMultiGroup = groups.length > 1;
  const predictedCount = groups.filter((g) => g.hasPrediction).length;

  if (match.isLocked) {
    // Locked: show first group's prediction if any
    const firstPredicted = groups.find((g) => g.hasPrediction);
    if (firstPredicted) {
      return (
        <View style={styles.predictionSubmitted}>
          <Check size={14} color="#0B6E4F" strokeWidth={2.5} />
          <Text style={styles.predictionSubmittedText}>
            {firstPredicted.predictedHome} - {firstPredicted.predictedAway}
          </Text>
        </View>
      );
    }
    return null;
  }

  if (isMultiGroup) {
    // Multi-group: show "2/2 ✓" or "1/2" with appropriate styling
    if (predictedCount === groups.length) {
      return (
        <View style={styles.predictionSubmitted}>
          <Check size={14} color="#0B6E4F" strokeWidth={2.5} />
          <Text style={styles.predictionSubmittedText}>
            {predictedCount}/{groups.length}
          </Text>
        </View>
      );
    }
    if (predictedCount > 0) {
      return (
        <View style={styles.predictBadgePartial}>
          <Text style={styles.predictBadgePartialText}>
            {predictedCount}/{groups.length}
          </Text>
        </View>
      );
    }
    return (
      <View style={styles.predictBadge}>
        <Text style={styles.predictBadgeText}>Pronosticar</Text>
      </View>
    );
  }

  // Single group
  if (groups[0]?.hasPrediction) {
    return (
      <View style={styles.predictionSubmitted}>
        <Check size={14} color="#0B6E4F" strokeWidth={2.5} />
        <Text style={styles.predictionSubmittedText}>
          {groups[0].predictedHome} - {groups[0].predictedAway}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.predictBadge}>
      <Text style={styles.predictBadgeText}>Pronosticar</Text>
    </View>
  );
}

// ─── Group picker bottom sheet ──────────────────────────────────────────────

function GroupPickerModal({
  visible,
  groups,
  onSelect,
  onClose,
}: {
  visible: boolean;
  groups: GroupEntry[];
  onSelect: (group: GroupEntry) => void;
  onClose: () => void;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={pickerStyles.overlay} onPress={onClose}>
        <View style={pickerStyles.sheet}>
          <View style={pickerStyles.handleBarRow}>
            <View style={pickerStyles.handleBar} />
          </View>
          <Text style={pickerStyles.title}>¿En qué grupo querés pronosticar?</Text>
          {groups.map((g) => (
            <Pressable
              key={g.groupId}
              style={pickerStyles.row}
              onPress={() => {
                onClose();
                onSelect(g);
              }}
            >
              <View style={pickerStyles.rowLeft}>
                <Users size={16} color={COLORS.text.muted} />
                <Text style={pickerStyles.groupName}>{g.groupName}</Text>
              </View>
              {g.hasPrediction ? (
                <View style={pickerStyles.predicted}>
                  <Check size={12} color="#0B6E4F" strokeWidth={2.5} />
                  <Text style={pickerStyles.predictedText}>
                    {g.predictedHome}-{g.predictedAway}
                  </Text>
                </View>
              ) : (
                <ChevronRight size={16} color={COLORS.text.muted} />
              )}
            </Pressable>
          ))}
        </View>
      </Pressable>
    </Modal>
  );
}

const pickerStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 36,
  },
  handleBarRow: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 8,
  },
  handleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  groupName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  predicted: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  predictedText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0B6E4F',
  },
});

// ─── Unified match card ─────────────────────────────────────────────────────

function MatchCard({
  match,
  groups,
  onOpenModal,
  onOpenPrediction,
  onOpenGroupPicker,
}: {
  match: DashboardTodayMatchDto;
  groups: GroupEntry[];
  onOpenModal: (externalId: number | null) => void;
  onOpenPrediction: (match: DashboardTodayMatchDto, group: GroupEntry) => void;
  onOpenGroupPicker: (match: DashboardTodayMatchDto, groups: GroupEntry[]) => void;
}) {
  const isLive = match.isLocked && match.status !== 'FINISHED';
  const isFinished = match.status === 'FINISHED';
  const firstGroup = groups[0]!;
  const isMultiGroup = groups.length > 1;

  const handlePress = () => {
    if (isLive || isFinished) {
      onOpenModal(match.externalId);
    } else if (isMultiGroup) {
      onOpenGroupPicker(match, groups);
    } else {
      onOpenPrediction(match, firstGroup);
    }
  };

  return (
    <View style={[styles.matchCard, isLive && styles.matchCardLive]}>
      <Pressable onPress={handlePress} style={styles.matchCardPressable}>
        {isLive ? (
          <View style={styles.liveRow}>
            <View style={styles.liveDotPulse} />
            <Text style={styles.liveLabel}>EN VIVO</Text>
          </View>
        ) : null}

        <View style={styles.teamsRow}>
          <TeamSide team={match.homeTeam} placeholder={match.homePlaceholder} />
          <CenterBlock match={match} />
          <TeamSide team={match.awayTeam} placeholder={match.awayPlaceholder} reverse />
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.metaColumn}>
            {match.tournamentName ? (
              <Text style={styles.tournamentText} numberOfLines={1}>
                {match.tournamentName}
              </Text>
            ) : null}
            <View style={styles.groupRow}>
              <Text style={styles.groupText} numberOfLines={1}>
                {firstGroup.groupName}
              </Text>
              {isMultiGroup ? (
                <View style={styles.multiGroupBadge}>
                  <Text style={styles.multiGroupBadgeText}>+{groups.length - 1}</Text>
                </View>
              ) : null}
            </View>
          </View>
          <PredictionIndicator match={match} groups={groups} />
        </View>
      </Pressable>
    </View>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function TodayMatchesSection({ matches }: TodayMatchesSectionProps) {
  const [selectedExternalId, setSelectedExternalId] = useState<number | null>(null);
  const [pickerState, setPickerState] = useState<{ match: DashboardTodayMatchDto; groups: GroupEntry[] } | null>(null);
  const [predictionState, setPredictionState] = useState<{ match: DashboardTodayMatchDto; group: GroupEntry } | null>(null);

  const deduplicated = deduplicateMatches(matches);

  const handleOpenPrediction = (match: DashboardTodayMatchDto, group: GroupEntry) => {
    setPredictionState({ match, group });
  };

  const handleOpenGroupPicker = (match: DashboardTodayMatchDto, groups: GroupEntry[]) => {
    setPickerState({ match, groups });
  };

  const handleGroupSelected = (group: GroupEntry) => {
    if (pickerState) {
      handleOpenPrediction(pickerState.match, group);
    }
  };

  // ── Empty state ──────────────────────────────────────────────────────────
  if (deduplicated.length === 0) {
    return (
      <View style={styles.section}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Partidos del D{'\u00ED'}a</Text>
        </View>
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <CalendarX2 size={24} color={COLORS.text.muted} strokeWidth={1.5} />
          </View>
          <Text style={styles.emptyTitle}>Sin partidos hoy</Text>
          <Text style={styles.emptyText}>
            Cuando haya partidos programados,{'\n'}van a aparecer ac{'\u00E1'}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Globe size={18} color={COLORS.primary.DEFAULT} />
          <Text style={styles.headerTitle}>Partidos del D{'\u00ED'}a</Text>
        </View>
        <View style={styles.matchCountBadge}>
          <Text style={styles.matchCountText}>{deduplicated.length}</Text>
        </View>
      </View>

      {/* Match cards */}
      {deduplicated.map(({ match, groups }) => (
        <MatchCard
          key={match.matchId}
          match={match}
          groups={groups}
          onOpenModal={setSelectedExternalId}
          onOpenPrediction={handleOpenPrediction}
          onOpenGroupPicker={handleOpenGroupPicker}
        />
      ))}

      {/* Group picker bottom sheet */}
      <GroupPickerModal
        visible={pickerState !== null}
        groups={pickerState?.groups ?? []}
        onSelect={handleGroupSelected}
        onClose={() => setPickerState(null)}
      />

      {/* Score prediction modal */}
      <ScorePredictionModal
        visible={predictionState !== null}
        match={predictionState ? toMatchDto(predictionState.match) : null}
        prediction={
          predictionState?.group.hasPrediction
            ? {
                id: '',
                matchId: predictionState.match.matchId,
                groupId: predictionState.group.groupId,
                userId: '',
                predictedHome: predictionState.group.predictedHome ?? 0,
                predictedAway: predictionState.group.predictedAway ?? 0,
                pointsEarned: 0,
                pointType: null,
                createdAt: '',
                updatedAt: '',
              }
            : null
        }
        groupId={predictionState?.group.groupId ?? ''}
        onClose={() => setPredictionState(null)}
      />

      {/* Match detail modal */}
      <MatchDetailModal
        externalId={selectedExternalId}
        onClose={() => setSelectedExternalId(null)}
      />
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  section: {
    marginBottom: 20,
  },

  // ── Header ──────────────────────────────────────────────────────────────
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  matchCountBadge: {
    backgroundColor: COLORS.primary.light,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 2,
    minWidth: 28,
    alignItems: 'center',
  },
  matchCountText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary.DEFAULT,
  },

  // ── Match card ──────────────────────────────────────────────────────────
  matchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  matchCardLive: {
    borderWidth: 1.5,
    borderColor: COLORS.success,
  },
  matchCardPressed: {
    opacity: 0.7,
  },
  matchCardPressable: {
    // Static container — no dynamic press styles (NativeWind v4 compatibility)
  },

  // ── Live indicator ──────────────────────────────────────────────────────
  liveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  liveDotPulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.success,
    marginRight: 6,
  },
  liveLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.success,
    letterSpacing: 0.5,
  },

  // ── Teams row ───────────────────────────────────────────────────────────
  teamsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  // ── Team ────────────────────────────────────────────────────────────────
  teamSide: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  teamSideReverse: {
    flexDirection: 'row-reverse',
  },
  teamName: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.text.primary,
    width: 90,
  },
  placeholderName: {
    fontSize: 11,
    fontWeight: '500',
    fontStyle: 'italic',
    color: COLORS.text.muted,
    width: 90,
  },

  // ── Time / Score blocks ─────────────────────────────────────────────────
  timeBlock: {
    alignItems: 'center',
    paddingHorizontal: 10,
    minWidth: 56,
  },
  timeText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  scoreBlock: {
    alignItems: 'center',
    paddingHorizontal: 10,
    minWidth: 56,
    flexDirection: 'row',
    gap: 4,
  },
  scoreText: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.text.primary,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.success,
  },

  // ── Card footer (single-group only) ─────────────────────────────────────
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  metaColumn: {
    flex: 1,
    marginRight: 8,
  },
  tournamentText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#9CA3AF',
    marginTop: 2,
  },
  groupText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0B6E4F',
    marginTop: 2,
  },

  groupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  multiGroupBadge: {
    backgroundColor: COLORS.primary.light,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  multiGroupBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primary.DEFAULT,
  },

  // ── Prediction indicators ───────────────────────────────────────────────
  predictionSubmitted: {
    backgroundColor: '#E8F5EE',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  predictionSubmittedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0B6E4F',
  },
  predictBadge: {
    backgroundColor: '#FFF3E0',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  predictBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E65100',
    letterSpacing: 0.3,
  },
  predictBadgePartial: {
    backgroundColor: '#FFF3E0',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  predictBadgePartialText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E65100',
  },

  // ── Empty state ─────────────────────────────────────────────────────────
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  emptyIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '400',
    color: COLORS.text.muted,
    textAlign: 'center',
    lineHeight: 18,
  },
});
