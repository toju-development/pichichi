/**
 * Group rankings section for the home dashboard.
 *
 * Shows the user's groups (max 2) with a mini leaderboard (top 3 +
 * user position if not in top 3). User row is highlighted.
 *
 * Pure presentational — receives typed props, no hooks or data fetching.
 *
 * IMPORTANT — NativeWind v4:
 * Uses StyleSheet for all visual properties to guarantee rendering
 * on the first frame. `className` is for external spacing only.
 * Never mix `style` and `className` on the same element.
 */

import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import type { DashboardGroupRankingDto } from '@pichichi/shared';

import { GroupIcon } from '@/components/brand/icons';
import { Button } from '@/components/ui/button';
import { COLORS } from '@/theme/colors';

// ─── Props ──────────────────────────────────────────────────────────────────

interface GroupRankingsSectionProps {
  groups: DashboardGroupRankingDto[];
}

// ─── Medal config ───────────────────────────────────────────────────────────

const MEDALS: Record<number, string> = {
  1: '\uD83C\uDFC6',
  2: '\uD83E\uDD48',
  3: '\uD83E\uDD49',
};

// ─── Sub-components ─────────────────────────────────────────────────────────

function PositionBadge({ position }: { position: number }) {
  const medal = MEDALS[position];
  return (
    <View style={styles.positionContainer}>
      {medal ? (
        <Text style={styles.medalEmoji}>{medal}</Text>
      ) : (
        <Text style={styles.positionText}>#{position}</Text>
      )}
    </View>
  );
}

function LeaderboardRow({
  position,
  displayName,
  totalPoints,
  isUser,
}: {
  position: number;
  displayName: string;
  totalPoints: number;
  isUser: boolean;
}) {
  return (
    <View style={[styles.leaderboardRow, isUser && styles.leaderboardRowHighlighted]}>
      <PositionBadge position={position} />
      <Text
        style={[styles.rowName, isUser && styles.rowNameBold]}
        numberOfLines={1}
      >
        {displayName}
      </Text>
      <Text style={[styles.rowPoints, isUser && styles.rowPointsBold]}>
        {totalPoints}pts
      </Text>
    </View>
  );
}

function GroupCard({ group }: { group: DashboardGroupRankingDto }) {
  const userInTop3 = group.topEntries.some(
    (entry) => entry.position === group.userPosition,
  );

  return (
    <Pressable
      onPress={() => router.push(`/(tabs)/groups/${group.groupId}`)}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      {/* Group name + member count */}
      <View style={styles.groupHeaderRow}>
        <Text style={styles.groupName} numberOfLines={1}>
          {group.groupName}
        </Text>
        <Text style={styles.memberCount}>
          {group.totalMembers} {group.totalMembers === 1 ? 'miembro' : 'miembros'}
        </Text>
      </View>

      {/* Mini leaderboard */}
      <View style={styles.miniLeaderboard}>
        {group.topEntries.map((entry) => (
          <LeaderboardRow
            key={`${group.groupId}-${entry.userId}`}
            position={entry.position}
            displayName={entry.displayName}
            totalPoints={entry.totalPoints}
            isUser={entry.position === group.userPosition}
          />
        ))}

        {/* User row if not in top 3 */}
        {!userInTop3 ? (
          <>
            <View style={styles.separator}>
              <Text style={styles.separatorDots}>{'\u22EF'}</Text>
            </View>
            <LeaderboardRow
              position={group.userPosition}
              displayName="Vos"
              totalPoints={group.userPoints}
              isUser
            />
          </>
        ) : null}
      </View>
    </Pressable>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function GroupRankingsSection({ groups }: GroupRankingsSectionProps) {
  // ── Empty state ──────────────────────────────────────────────────────────
  if (groups.length === 0) {
    return (
      <View style={styles.section}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Mis Grupos</Text>
        </View>
        <View style={styles.emptyContainer}>
          <GroupIcon size={32} color={COLORS.text.muted} />
          <Text style={styles.emptyText}>No estás en ningún grupo</Text>
          <View style={styles.emptyAction}>
            <Button
              title="Unirse a un grupo"
              variant="primary"
              onPress={() => router.push('/(tabs)/groups')}
            />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <GroupIcon size={18} color={COLORS.primary.DEFAULT} />
          <Text style={styles.headerTitle}>Mis Grupos</Text>
        </View>
        <Pressable onPress={() => router.push('/(tabs)/groups')}>
          <Text style={styles.seeAllText}>Ver todos</Text>
        </Pressable>
      </View>

      {/* Group cards */}
      {groups.map((group) => (
        <GroupCard key={group.groupId} group={group} />
      ))}
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
    marginBottom: 12,
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
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary.DEFAULT,
  },

  // ── Card ────────────────────────────────────────────────────────────────
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardPressed: {
    opacity: 0.7,
  },

  // ── Group header ────────────────────────────────────────────────────────
  groupHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text.primary,
    flex: 1,
    marginRight: 8,
  },
  memberCount: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.text.muted,
  },

  // ── Mini leaderboard ────────────────────────────────────────────────────
  miniLeaderboard: {
    gap: 2,
  },
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  leaderboardRowHighlighted: {
    backgroundColor: COLORS.primary.light,
  },

  // ── Position ────────────────────────────────────────────────────────────
  positionContainer: {
    width: 30,
    alignItems: 'center',
  },
  positionText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.text.secondary,
  },
  medalEmoji: {
    fontSize: 16,
  },

  // ── Row content ─────────────────────────────────────────────────────────
  rowName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.text.primary,
    marginLeft: 8,
  },
  rowNameBold: {
    fontWeight: '700',
  },
  rowPoints: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary.DEFAULT,
    marginLeft: 8,
  },
  rowPointsBold: {
    fontWeight: '800',
  },

  // ── Separator ───────────────────────────────────────────────────────────
  separator: {
    alignItems: 'center',
    paddingVertical: 2,
  },
  separatorDots: {
    fontSize: 16,
    color: COLORS.text.muted,
  },

  // ── Empty state ─────────────────────────────────────────────────────────
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginTop: 12,
  },
  emptyAction: {
    marginTop: 16,
  },
});
