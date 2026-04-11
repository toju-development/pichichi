/**
 * Single row in the group leaderboard.
 *
 * Renders position badge (with colored numbers for top positions), user avatar,
 * display name, total points, and exact-prediction count.
 *
 * IMPORTANT — NativeWind v4 ghost-card fix:
 * ALL visual properties live in StyleSheet so they are applied on the FIRST
 * frame. The `className` prop is only for external spacing (e.g. `mb-2`).
 * Never mix `style` and `className` on the same element.
 */

import { Image, StyleSheet, Text, View } from 'react-native';

import type { LeaderboardEntryDto } from '@pichichi/shared';

import { COLORS } from '@/theme/colors';

// ─── Props ──────────────────────────────────────────────────────────────────

export interface LeaderboardEntryProps {
  entry: LeaderboardEntryDto;
  /** Highlights the row when it belongs to the authenticated user. */
  isCurrentUser: boolean;
  /** NativeWind classes for external spacing (e.g. mb-2). */
  className?: string;
}

// ─── Position color config ──────────────────────────────────────────────────

const POSITION_COLORS: Record<number, string> = {
  1: '#FFD166', // gold
  2: '#C0C0C0', // silver
};

// ─── Sub-components ─────────────────────────────────────────────────────────

/** Position number — colored for top positions. */
function PositionBadge({ position }: { position: number }) {
  const color = POSITION_COLORS[position];

  return (
    <View style={styles.positionContainer}>
      <Text
        style={[
          styles.positionText,
          color != null && { color },
        ]}
      >
        {position}
      </Text>
    </View>
  );
}

/** User avatar — shows image if available, fallback to initial circle. */
function UserAvatar({
  displayName,
  avatarUrl,
}: {
  displayName: string;
  avatarUrl: string | null;
}) {
  if (avatarUrl) {
    return <Image source={{ uri: avatarUrl }} style={styles.avatar} />;
  }

  return (
    <View style={styles.avatarFallback}>
      <Text style={styles.avatarInitial}>
        {displayName.charAt(0).toUpperCase()}
      </Text>
    </View>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function LeaderboardEntry({
  entry,
  isCurrentUser,
  className,
}: LeaderboardEntryProps) {
  const { position, displayName, avatarUrl, totalPoints, exactCount } = entry;

  const row = (
    <View
      style={[
        styles.row,
        isCurrentUser && styles.rowHighlighted,
      ]}
    >
      {/* Position badge */}
      <PositionBadge position={position} />

      {/* User avatar */}
      <UserAvatar displayName={displayName} avatarUrl={avatarUrl} />

      {/* Name + exacto subtitle */}
      <View style={styles.nameContainer}>
        <Text
          style={[styles.displayName, isCurrentUser && styles.displayNameBold]}
          numberOfLines={1}
        >
          {displayName}
        </Text>
        <Text style={styles.exactCount}>
          {exactCount} {exactCount === 1 ? 'exacto' : 'exactos'}
        </Text>
      </View>

      {/* Points — number on top, "pts" label below */}
      <View style={styles.pointsContainer}>
        <Text style={styles.totalPoints}>{totalPoints}</Text>
        <Text style={styles.ptsLabel}>pts</Text>
      </View>
    </View>
  );

  // Outer View for caller's className (spacing like mb-2).
  // If no className, skip the wrapper to keep the tree shallow.
  if (className) {
    return <View className={className}>{row}</View>;
  }

  return row;
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // ── Row ──────────────────────────────────────────────────────────────────
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  rowHighlighted: {
    backgroundColor: COLORS.primary.light,
    borderRadius: 12,
    borderBottomWidth: 0,
  },

  // ── Position ─────────────────────────────────────────────────────────────
  positionContainer: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  positionText: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text.primary,
  },

  // ── Avatar ───────────────────────────────────────────────────────────────
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginLeft: 6,
  },
  avatarFallback: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginLeft: 6,
    backgroundColor: COLORS.primary.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primary.DEFAULT,
  },

  // ── Name ─────────────────────────────────────────────────────────────────
  nameContainer: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  displayName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  displayNameBold: {
    fontWeight: '700',
  },

  // ── Points ───────────────────────────────────────────────────────────────
  pointsContainer: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    flexShrink: 0,
    minWidth: 40,
  },
  totalPoints: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primary.DEFAULT,
    lineHeight: 24,
  },
  ptsLabel: {
    fontSize: 11,
    fontWeight: '400',
    color: COLORS.text.muted,
    lineHeight: 14,
  },
  exactCount: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.text.secondary,
    marginTop: 2,
  },
});
