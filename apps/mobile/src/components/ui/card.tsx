/**
 * Styled card with optional accent bar and press handling.
 *
 * Uses a subtle shadow and rounded corners following the Pichichi design system.
 *
 * IMPORTANT: Uses safe Pressable pattern for NativeWind v4 compatibility.
 * Outer View (StyleSheet) → Inner Pressable (className) → Content.
 * Never use `style={({ pressed }) => ...}` on Pressable with NativeWind v4.
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
    <View
      className={`relative overflow-hidden rounded-2xl bg-white p-4 ${className ?? ''}`}
      style={SHADOW_STYLE}
    >
      {/* Accent bar */}
      {accent ? (
        <View className="absolute bottom-3 left-0 top-3 w-1 rounded-full bg-primary" />
      ) : null}

      {children}
    </View>
  );

  if (onPress) {
    return (
      <View style={pressableStyles.wrapper}>
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

const SHADOW_STYLE = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08,
  shadowRadius: 12,
  elevation: 3,
} as const;

/**
 * Safe Pressable pattern: outer View with StyleSheet for layout-critical
 * dimensions ensures Pressable doesn't collapse to 0 height in NativeWind v4.
 */
const pressableStyles = StyleSheet.create({
  wrapper: {
    minHeight: 1,
  },
});
