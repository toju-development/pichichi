/**
 * Upcoming predictions section for group detail screen.
 *
 * Shows today's SCHEDULED matches that the user hasn't predicted yet
 * within a specific group. Pressing a card opens ScorePredictionModal
 * directly (no group picker needed — group is already known).
 *
 * Hidden when there are no matches to show (returns null).
 *
 * IMPORTANT — NativeWind v4:
 * Uses StyleSheet for all visual properties. `className` is for external
 * spacing only. Never mix `style` and `className` on the same element.
 */

import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Clock } from 'lucide-react-native';

import type { DashboardTodayMatchDto, MatchDto } from '@pichichi/shared';

import { ScorePredictionModal } from '@/components/predictions/score-prediction-modal';
import { TeamAvatar } from '@/components/ui/team-avatar';
import { COLORS } from '@/theme/colors';

// ─── Helpers ────────────────────────────────────────────────────────────────

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

// ─── Props ──────────────────────────────────────────────────────────────────

interface UpcomingPredictionsSectionProps {
  matches: DashboardTodayMatchDto[];
  groupId: string;
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

// ─── Main Component ─────────────────────────────────────────────────────────

export function UpcomingPredictionsSection({
  matches,
  groupId,
}: UpcomingPredictionsSectionProps) {
  const [predictionMatch, setPredictionMatch] = useState<DashboardTodayMatchDto | null>(null);

  if (matches.length === 0) return null;

  return (
    <View>
      {/* Section header — matches Torneos/Miembros style */}
      <View style={styles.sectionHeader}>
        <View style={styles.sectionHeaderLeft}>
          <Clock size={18} color="#0B6E4F" />
          <Text style={styles.sectionTitle}>Pr{'\u00F3'}ximos a pronosticar</Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>{matches.length}</Text>
        </View>
      </View>

      {/* Match cards */}
      <View style={styles.cardList}>
        {matches.map((match) => (
          <View key={match.matchId} style={styles.matchCard}>
            <Pressable
              onPress={() => setPredictionMatch(match)}
              style={({ pressed }) => pressed ? styles.pressedOpacity : undefined}
            >
              <View style={styles.teamsRow}>
                <TeamSide team={match.homeTeam} placeholder={match.homePlaceholder} />
                <View style={styles.timeBlock}>
                  <Text style={styles.timeText}>{formatTime(match.scheduledAt)}</Text>
                </View>
                <TeamSide team={match.awayTeam} placeholder={match.awayPlaceholder} reverse />
              </View>
              <View style={styles.cardFooter}>
                <Text style={styles.tournamentText} numberOfLines={1}>
                  {match.tournamentName}
                </Text>
                <View style={styles.predictBadge}>
                  <Text style={styles.predictBadgeText}>Pronosticar</Text>
                </View>
              </View>
            </Pressable>
          </View>
        ))}
      </View>

      {/* Score prediction modal */}
      <ScorePredictionModal
        visible={predictionMatch !== null}
        match={predictionMatch ? toMatchDto(predictionMatch) : null}
        prediction={null}
        groupId={groupId}
        onClose={() => setPredictionMatch(null)}
      />
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // ── Section header (matches Torneos/Miembros pattern)
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  countBadge: {
    borderRadius: 10,
    backgroundColor: '#E8F5EE',
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  countBadgeText: {
    color: '#0B6E4F',
    fontSize: 11,
    fontWeight: '700',
  },

  // ── Card list
  cardList: {
    gap: 10,
  },

  // ── Match card
  matchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  pressedOpacity: {
    opacity: 0.7,
  },

  // ── Teams row
  teamsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  // ── Team
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

  // ── Time block
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

  // ── Card footer
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  tournamentText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#9CA3AF',
    flex: 1,
    marginRight: 8,
  },

  // ── Prediction badge
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
});
