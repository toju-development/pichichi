/**
 * Styled card with optional accent bar and press handling.
 *
 * Uses a subtle shadow and rounded corners following the Pichichi design system.
 *
 * IMPORTANT — NativeWind v4 rules applied here:
 * 1. Never mix `style` and `className` on the same element — iOS resolves
 *    them at different times, causing invisible content on first render.
 *    Shadow lives on an outer View (style-only), content on inner View (className-only).
 * 2. Safe Pressable pattern: outer View (StyleSheet) → Pressable (className).
 *    Never use `style={({ pressed }) => ...}` on Pressable with NativeWind v4.
 */

import { Pressable, StyleSheet, View } from 'react-native';

interface CardProps {
  children: React.ReactNode;
  /** Adds a green accent bar on the left edge. */
  accent?: boolean;
  /** NativeWind classes appended to the card container. */
  className?: string;
  /** If provided the card becomes pressable with opacity feedback. */
  onPress?: () => void;
}

export function Card({ children, accent, className, onPress }: CardProps) {
  const cardContent = (
    <View style={styles.shadow}>
      <View
        className={`relative overflow-hidden rounded-2xl bg-white p-4 ${className ?? ''}`}
      >
        {/* Accent bar */}
        {accent ? (
          <View className="absolute bottom-3 left-0 top-3 w-1 rounded-full bg-primary" />
        ) : null}

        {children}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <View style={styles.pressableWrapper}>
        <Pressable
          onPress={onPress}
          className="flex-1 active:opacity-70"
        >
          {cardContent}
        </Pressable>
      </View>
    );
  }

  return cardContent;
}

const styles = StyleSheet.create({
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  /**
   * Safe Pressable pattern: outer View with StyleSheet for layout-critical
   * dimensions ensures Pressable doesn't collapse to 0 height in NativeWind v4.
   */
  pressableWrapper: {
    minHeight: 1,
  },
});
