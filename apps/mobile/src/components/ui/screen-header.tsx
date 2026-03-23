/**
 * Compact navigation-bar style header with optional gradient background.
 *
 * Rendered at the top of a screen. Handles safe-area insets automatically
 * so content is never hidden behind the status bar.
 *
 * Total height ≈ safe-area-top + 60–80 px content area.
 */

import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GradientBackground } from './gradient-bg';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  /** Use green gradient background (default: true). */
  gradient?: boolean;
  /** Optional element rendered on the right side (icon button, etc.). */
  rightAction?: React.ReactNode;
  /** Optional content rendered below the title inside the gradient area (e.g. avatar). */
  children?: React.ReactNode;
}

export function ScreenHeader({
  title,
  subtitle,
  gradient = true,
  rightAction,
  children,
}: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();

  const content = (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      {/* Title row */}
      <View style={styles.titleRow}>
        {/* Text group */}
        <View className="flex-1">
          <Text
            className={`text-[22px] font-bold ${gradient ? 'text-white' : 'text-text-primary'}`}
          >
            {title}
          </Text>

          {subtitle ? (
            <Text
              className={`mt-0.5 text-sm ${gradient ? 'text-white/70' : 'text-text-secondary'}`}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>

        {/* Right action */}
        {rightAction ? <View>{rightAction}</View> : null}
      </View>

      {/* Optional extra content (avatar, filters, etc.) */}
      {children}
    </View>
  );

  if (gradient) {
    return (
      <GradientBackground
        colors={['#084a36', '#0B6E4F'] as const}
        style={styles.gradientWrapper}
      >
        {content}
      </GradientBackground>
    );
  }

  return <View className="bg-white">{content}</View>;
}

const styles = StyleSheet.create({
  gradientWrapper: {
    // No flex: 1 — height is determined solely by content
  },
  container: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
