/**
 * Shared team avatar — shows the team logo if available, otherwise a
 * colored circle with the first letter of the team name.
 *
 * Accepts any object with `{ name?: string; logoUrl?: string | null }`,
 * so it works with MatchTeamDto, DashboardTodayMatchDto teams, or any
 * future team-like shape.
 *
 * IMPORTANT — NativeWind v4:
 * ALL visual properties live in StyleSheet so they are applied on the
 * FIRST frame. Never mix `style` and `className` on the same element.
 */

import { useMemo, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { COLORS } from '@/theme/colors';

// ─── Types ──────────────────────────────────────────────────────────────────

interface TeamLike {
  name?: string;
  /** Some DTOs expose shortName — used as preferred source for the initial. */
  shortName?: string;
  logoUrl?: string | null;
}

interface TeamAvatarProps {
  team: TeamLike | null;
  /** Width and height of the avatar (default: 28). */
  size?: number;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Returns a single uppercase initial from the team name (or "?"). */
function getInitial(team: TeamLike): string {
  const source = team.shortName ?? team.name ?? '';
  return source.length > 0 ? source.charAt(0).toUpperCase() : '?';
}

// ─── Component ──────────────────────────────────────────────────────────────

export function TeamAvatar({ team, size = 28 }: TeamAvatarProps) {
  const [imageError, setImageError] = useState(false);

  const dynamicStyles = useMemo(
    () =>
      size === 28
        ? null // use static styles for the default size (no extra object)
        : StyleSheet.create({
            container: {
              width: size,
              height: size,
              borderRadius: size / 2,
            },
            image: {
              width: size,
              height: size,
              borderRadius: size / 2,
            },
            text: {
              fontSize: Math.round(size * 0.39),
            },
          }),
    [size],
  );

  // ── Null / TBD team ───────────────────────────────────────────────────────
  if (!team) {
    return (
      <View
        style={
          dynamicStyles
            ? [styles.container, dynamicStyles.container]
            : styles.container
        }
      >
        <Text
          style={
            dynamicStyles
              ? [styles.initialText, dynamicStyles.text]
              : styles.initialText
          }
        >
          ?
        </Text>
      </View>
    );
  }

  // ── Logo available ────────────────────────────────────────────────────────
  if (team.logoUrl && !imageError) {
    return (
      <View
        style={
          dynamicStyles
            ? [styles.container, dynamicStyles.container]
            : styles.container
        }
      >
        <Image
          source={{ uri: team.logoUrl }}
          style={
            dynamicStyles
              ? [styles.image, dynamicStyles.image]
              : styles.image
          }
          onError={() => setImageError(true)}
        />
      </View>
    );
  }

  // ── Fallback: colored circle with initial ─────────────────────────────────
  return (
    <View
      style={
        dynamicStyles
          ? [styles.container, dynamicStyles.container]
          : styles.container
      }
    >
      <Text
        style={
          dynamicStyles
            ? [styles.initialText, dynamicStyles.text]
            : styles.initialText
        }
      >
        {getInitial(team)}
      </Text>
    </View>
  );
}

// ─── Styles (default size: 28) ──────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: 28,
    height: 28,
    borderRadius: 14,
    position: 'absolute',
  },
  initialText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary.DEFAULT,
  },
});
