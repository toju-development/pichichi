/**
 * Podium component — hero display for the top 3 users in the ranking.
 *
 * Renders the classic podium layout: 2nd | 1st (elevated) | 3rd,
 * each position showing medal emoji, avatar, display name, and points.
 *
 * Gracefully handles fewer than 3 entries (shows only available positions)
 * and returns null when there are no entries.
 *
 * IMPORTANT — NativeWind v4 ghost-card fix:
 * ALL visual properties live in StyleSheet so they are applied on the FIRST
 * frame. Never mix `style` and `className` on the same element.
 */

import { Image, StyleSheet, Text, View } from 'react-native';

import type { LeaderboardEntryDto } from '@pichichi/shared';

import { COLORS } from '@/theme/colors';

// ─── Constants ──────────────────────────────────────────────────────────────

const MEDALS: Record<number, string> = {
  1: '🥇',
  2: '🥈',
  3: '🥉',
};

const PEDESTAL_HEIGHTS: Record<number, number> = {
  1: 80,
  2: 56,
  3: 40,
};

const AVATAR_SIZES: Record<number, number> = {
  1: 72,
  2: 56,
  3: 56,
};

const PEDESTAL_COLORS: Record<number, string> = {
  1: '#FFD166', // gold
  2: '#C0C0C0', // silver
  3: '#CD7F32', // bronze
};

const BORDER_COLORS: Record<number, string> = {
  1: '#FFD166',
  2: '#C0C0C0',
  3: '#CD7F32',
};

// ─── Props ──────────────────────────────────────────────────────────────────

export interface PodiumProps {
  entries: LeaderboardEntryDto[];
}

// ─── Sub-components ─────────────────────────────────────────────────────────

/** Avatar circle — shows image or initial fallback. */
function PodiumAvatar({
  displayName,
  avatarUrl,
  size,
  borderColor,
}: {
  displayName: string;
  avatarUrl: string | null;
  size: number;
  borderColor: string;
}) {
  const borderRadius = size / 2;

  if (avatarUrl) {
    return (
      <Image
        source={{ uri: avatarUrl }}
        style={[
          styles.avatar,
          {
            width: size,
            height: size,
            borderRadius,
            borderColor,
          },
        ]}
      />
    );
  }

  return (
    <View
      style={[
        styles.avatarFallback,
        {
          width: size,
          height: size,
          borderRadius,
          borderColor,
        },
      ]}
    >
      <Text
        style={[
          styles.avatarInitial,
          { fontSize: size * 0.38 },
        ]}
      >
        {displayName.charAt(0).toUpperCase()}
      </Text>
    </View>
  );
}

/** Single podium position — avatar, medal, name, points, pedestal. */
function PodiumPosition({ entry }: { entry: LeaderboardEntryDto }) {
  const { position, displayName, avatarUrl, totalPoints } = entry;
  const medal = MEDALS[position] ?? '';
  const pedestalHeight = PEDESTAL_HEIGHTS[position] ?? 40;
  const avatarSize = AVATAR_SIZES[position] ?? 56;
  const pedestalColor = PEDESTAL_COLORS[position] ?? COLORS.primary.light;
  const borderColor = BORDER_COLORS[position] ?? COLORS.border;
  const isFirst = position === 1;

  return (
    <View style={styles.positionColumn}>
      {/* Avatar */}
      <PodiumAvatar
        displayName={displayName}
        avatarUrl={avatarUrl}
        size={avatarSize}
        borderColor={borderColor}
      />

      {/* Medal */}
      <Text style={styles.medal}>{medal}</Text>

      {/* Display name — allow 2 lines to avoid truncation */}
      <Text
        style={[styles.name, isFirst && styles.nameFirst]}
        numberOfLines={2}
      >
        {displayName}
      </Text>

      {/* Points */}
      <Text style={[styles.points, isFirst && styles.pointsFirst]}>
        {totalPoints} pts
      </Text>

      {/* Pedestal */}
      <View
        style={[
          styles.pedestal,
          {
            height: pedestalHeight,
            backgroundColor: pedestalColor,
          },
          isFirst && styles.pedestalFirst,
        ]}
      >
        <Text style={[styles.pedestalPosition, isFirst && styles.pedestalPositionFirst]}>
          {position}
        </Text>
      </View>
    </View>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function Podium({ entries }: PodiumProps) {
  if (entries.length === 0) {
    return null;
  }

  // Sort entries by position to ensure correct ordering
  const sorted = [...entries].sort((a, b) => a.position - b.position);
  const first = sorted[0];
  const second = sorted[1];
  const third = sorted[2];

  return (
    <View style={styles.container}>
      {/* Podium row: 2nd | 1st (elevated) | 3rd */}
      <View style={styles.podiumRow}>
        {/* 2nd place — left */}
        {second ? (
          <PodiumPosition entry={second} />
        ) : (
          <View style={styles.positionColumn} />
        )}

        {/* 1st place — center, elevated */}
        {first ? (
          <PodiumPosition entry={first} />
        ) : null}

        {/* 3rd place — right */}
        {third ? (
          <PodiumPosition entry={third} />
        ) : (
          <View style={styles.positionColumn} />
        )}
      </View>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 8,
  },

  podiumRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },

  positionColumn: {
    flex: 1,
    alignItems: 'center',
  },

  // ── Avatar ────────────────────────────────────────────────────────────────
  avatar: {
    borderWidth: 3,
  },
  avatarFallback: {
    borderWidth: 3,
    backgroundColor: COLORS.primary.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontWeight: '700',
    color: COLORS.primary.DEFAULT,
  },

  // ── Medal ─────────────────────────────────────────────────────────────────
  medal: {
    fontSize: 24,
    marginTop: 6,
  },

  // ── Name ──────────────────────────────────────────────────────────────────
  name: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  nameFirst: {
    fontSize: 13,
    fontWeight: '700',
  },

  // ── Points ────────────────────────────────────────────────────────────────
  points: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text.secondary,
    marginTop: 2,
  },
  pointsFirst: {
    fontSize: 14,
    color: COLORS.gold.DEFAULT,
  },

  // ── Pedestal ──────────────────────────────────────────────────────────────
  pedestal: {
    width: '85%',
    marginTop: 10,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pedestalFirst: {
    width: '90%',
  },
  pedestalPosition: {
    fontSize: 20,
    fontWeight: '800',
    color: 'rgba(0, 0, 0, 0.25)',
  },
  pedestalPositionFirst: {
    fontSize: 24,
  },
});
