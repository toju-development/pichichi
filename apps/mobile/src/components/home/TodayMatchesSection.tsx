/**
 * Today's matches section for the home dashboard.
 *
 * Unified view of all matches scheduled for today across tournaments.
 * Shows prediction state (pending, submitted, or locked/live) and
 * navigates to the group tournament screen for prediction entry.
 *
 * Pure presentational — receives typed props, no hooks or data fetching.
 *
 * IMPORTANT — NativeWind v4:
 * Uses StyleSheet for all visual properties to guarantee rendering
 * on the first frame. `className` is for external spacing only.
 * Never mix `style` and `className` on the same element.
 */

import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Check, CalendarX2, Globe } from 'lucide-react-native';

import type { DashboardTodayMatchDto } from '@pichichi/shared';

import { MatchDetailModal } from '@/components/matches/match-detail-modal';
import { TeamAvatar } from '@/components/ui/team-avatar';
import { COLORS } from '@/theme/colors';

// ─── Time formatting ────────────────────────────────────────────────────────

function formatTime(iso: string): string {
  const d = new Date(iso);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

// ─── Client-side "today" filter ─────────────────────────────────────────────

/**
 * Returns true when the given ISO date falls on "today" according to the
 * **device** timezone.  This is the same pattern the tournament screen uses
 * (group-by-local-date) — the backend returns all upcoming matches and the
 * client decides what "today" means for this user.
 */
function isToday(isoDate: string): boolean {
  const matchDate = new Date(isoDate);
  const now = new Date();
  return (
    matchDate.getDate() === now.getDate() &&
    matchDate.getMonth() === now.getMonth() &&
    matchDate.getFullYear() === now.getFullYear()
  );
}

/**
 * Filters matches to only those scheduled "today" in the device timezone,
 * but always includes LIVE matches regardless of their scheduled date.
 */
function filterTodayMatches(
  matches: DashboardTodayMatchDto[],
): DashboardTodayMatchDto[] {
  return matches.filter((m) => isToday(m.scheduledAt) || m.status === 'LIVE');
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

  // Live or finished with score
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

  // Not started — show time
  return (
    <View style={styles.timeBlock}>
      <Text style={styles.timeText}>{formatTime(match.scheduledAt)}</Text>
    </View>
  );
}

function PredictionIndicator({ match }: { match: DashboardTodayMatchDto }) {
  // Live / locked — no CTA
  if (match.isLocked) {
    if (match.hasPrediction) {
      return (
        <View style={styles.predictionSubmitted}>
          <Check size={14} color="#0B6E4F" strokeWidth={2.5} />
          <Text style={styles.predictionSubmittedText}>
            {match.predictedHome} - {match.predictedAway}
          </Text>
        </View>
      );
    }
    return null;
  }

  // Has prediction — show submitted score
  if (match.hasPrediction) {
    return (
      <View style={styles.predictionSubmitted}>
        <Check size={14} color="#0B6E4F" strokeWidth={2.5} />
        <Text style={styles.predictionSubmittedText}>
          {match.predictedHome} - {match.predictedAway}
        </Text>
      </View>
    );
  }

  // No prediction — show CTA
  return (
    <View style={styles.predictBadge}>
      <Text style={styles.predictBadgeText}>Pronosticar</Text>
    </View>
  );
}

function TodayMatchCard({
  match,
  onPressLive,
}: {
  match: DashboardTodayMatchDto;
  onPressLive: (externalId: number | null) => void;
}) {
  const isLive = match.isLocked && match.status !== 'FINISHED';
  const canNavigate = !isLive;

  const handlePress = () => {
    if (canNavigate) {
      router.push({
        pathname: '/(tabs)/groups/tournament/[slug]',
        params: {
          slug: match.tournamentSlug,
          groupId: match.groupId,
        },
      });
    } else {
      onPressLive(match.externalId);
    }
  };

  return (
    <View style={[styles.matchCard, isLive && styles.matchCardLive]}>
      <Pressable
        onPress={handlePress}
        style={styles.matchCardPressable}
      >
        {/* Live indicator */}
        {isLive ? (
          <View style={styles.liveRow}>
            <View style={styles.liveDotPulse} />
            <Text style={styles.liveLabel}>EN VIVO</Text>
          </View>
        ) : null}

        {/* Teams + score/time */}
        <View style={styles.teamsRow}>
          <TeamSide team={match.homeTeam} placeholder={match.homePlaceholder} />
          <CenterBlock match={match} />
          <TeamSide team={match.awayTeam} placeholder={match.awayPlaceholder} reverse />
        </View>

        {/* Footer: meta + prediction state */}
        <View style={styles.cardFooter}>
          <View style={styles.metaColumn}>
            {match.tournamentName ? (
              <Text style={styles.tournamentText} numberOfLines={1}>
                {match.tournamentName}
              </Text>
            ) : null}
            <Text style={styles.groupText} numberOfLines={1}>
              {match.groupName}
            </Text>
          </View>
          <PredictionIndicator match={match} />
        </View>
      </Pressable>
    </View>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function TodayMatchesSection({ matches }: TodayMatchesSectionProps) {
  const [selectedExternalId, setSelectedExternalId] = useState<number | null>(null);

  // Filter to only "today" matches using the device timezone.
  // The backend returns all upcoming matches — timezone filtering happens here.
  const todayMatches = filterTodayMatches(matches);

  // ── Empty state ──────────────────────────────────────────────────────────
  if (todayMatches.length === 0) {
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
          <Text style={styles.matchCountText}>{todayMatches.length}</Text>
        </View>
      </View>

      {/* Match cards */}
      {todayMatches.map((match) => (
        <TodayMatchCard
          key={`${match.matchId}-${match.groupId}`}
          match={match}
          onPressLive={setSelectedExternalId}
        />
      ))}

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

  // ── Card footer ─────────────────────────────────────────────────────────
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
