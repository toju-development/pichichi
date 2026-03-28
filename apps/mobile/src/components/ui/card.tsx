/**
 * Styled card with optional accent bar and press handling.
 *
 * Uses a subtle shadow and rounded corners following the Pichichi design system.
 *
 * IMPORTANT — NativeWind v4 ghost-card fix:
 * ALL visual properties (bg, padding, border-radius, overflow) live in
 * StyleSheet so they are applied on the FIRST frame. The `className` prop
 * from the caller is applied to an OUTER View for spacing (e.g. `mb-3`),
 * which is safe because spacing doesn't affect content visibility.
 *
 * The accent bar also uses StyleSheet — className-based absolute positioning
 * was not resolving on the first render, leaving cards without visible content.
 */

import { Pressable, StyleSheet, View } from 'react-native';

interface CardProps {
  children: React.ReactNode;
  /** Adds a green accent bar on the left edge. */
  accent?: boolean;
  /** NativeWind classes for external spacing (e.g. mb-3). */
  className?: string;
  /** If provided the card becomes pressable with opacity feedback. */
  onPress?: () => void;
}

export function Card({ children, accent, className, onPress }: CardProps) {
  const cardInner = (
    <View style={styles.cardSurface}>
      {/* Accent bar — fully StyleSheet for first-frame rendering */}
      {accent ? <View style={styles.accentBar} /> : null}

      {children}
    </View>
  );

  const cardWithShadow = (
    <View style={styles.shadow}>
      {cardInner}
    </View>
  );

  const pressableCard = onPress ? (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => pressed ? styles.pressed : undefined}
    >
      {cardWithShadow}
    </Pressable>
  ) : (
    cardWithShadow
  );

  // Outer View for caller's className (spacing like mb-3).
  // If no className, skip the wrapper to keep the tree shallow.
  if (className) {
    return <View className={className}>{pressableCard}</View>;
  }

  return pressableCard;
}

const styles = StyleSheet.create({
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  cardSurface: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    padding: 16,
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 12,
    bottom: 12,
    width: 4,
    borderRadius: 9999,
    backgroundColor: '#0B6E4F',
  },
  pressed: {
    opacity: 0.7,
  },
});
