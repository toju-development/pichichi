/**
 * Single row in the group leaderboard.
 *
 * Renders position badge (with medal emoji for top 3), user avatar,
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

// ─── Medal config ───────────────────────────────────────────────────────────

const MEDALS: Record<number, string> = {
  1: '🏆',
  2: '🥈',
  3: '🥉',
};

// ─── Sub-components ─────────────────────────────────────────────────────────

/** Position number — bold for top 3, with medal emoji. */
function PositionBadge({ position }: { position: number }) {
  const medal = MEDALS[position];
  const isTop3 = position <= 3;

  return (
    <View style={styles.positionContainer}>
      {medal ? (
        <Text style={styles.medalEmoji}>{medal}</Text>
      ) : (
        <Text style={isTop3 ? styles.positionTextBold : styles.positionText}>
          #{position}
        </Text>
      )}
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

      {/* Name */}
      <View style={styles.nameContainer}>
        <Text
          style={[styles.displayName, isCurrentUser && styles.displayNameBold]}
          numberOfLines={1}
        >
          {displayName}
        </Text>
      </View>

      {/* Points */}
      <View style={styles.pointsContainer}>
        <Text style={styles.totalPoints}>{totalPoints}pts</Text>
        {exactCount > 0 ? (
          <Text style={styles.exactCount}>
            {exactCount} {exactCount === 1 ? 'exacto' : 'exactos'}
          </Text>
        ) : null}
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
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  rowHighlighted: {
    backgroundColor: COLORS.primary.light,
    borderRadius: 12,
    borderBottomWidth: 0,
  },

  // ── Position ─────────────────────────────────────────────────────────────
  positionContainer: {
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  positionText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text.secondary,
  },
  positionTextBold: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  medalEmoji: {
    fontSize: 20,
  },

  // ── Avatar ───────────────────────────────────────────────────────────────
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginLeft: 8,
  },
  avatarFallback: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginLeft: 8,
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
    fontWeight: '500',
    color: COLORS.text.primary,
  },
  displayNameBold: {
    fontWeight: '700',
  },

  // ── Points ───────────────────────────────────────────────────────────────
  pointsContainer: {
    alignItems: 'flex-end',
    minWidth: 60,
  },
  totalPoints: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary.DEFAULT,
  },
  exactCount: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.text.secondary,
    marginTop: 2,
  },
});
