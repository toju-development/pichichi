/**
 * Compact navigation-bar style header with optional gradient background.
 *
 * Rendered at the top of a screen. Handles safe-area insets automatically
 * so content is never hidden behind the status bar.
 *
 * Total height ≈ safe-area-top + 16px padding + 60–80 px content area.
 *
 * IMPORTANT — NativeWind v4 first-frame fix:
 * ALL visual properties use StyleSheet to guarantee rendering on the first
 * frame. The gradient variant uses white text; the plain variant uses dark text.
 */

import { StyleSheet, Text, View } from 'react-native';
import type { TextProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS } from '@/theme/colors';

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
  /** Override title text styles (merged on top of base + light/dark). */
  titleStyle?: import('react-native').TextStyle;
  /** Override subtitle text styles (merged on top of base + light/dark). */
  subtitleStyle?: import('react-native').TextStyle;
  /** Extra props forwarded to the title <Text> (e.g. numberOfLines, adjustsFontSizeToFit). */
  titleProps?: Omit<TextProps, 'style' | 'children'>;
}

export function ScreenHeader({
  title,
  subtitle,
  gradient = true,
  rightAction,
  children,
  titleStyle,
  subtitleStyle,
  titleProps,
}: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();

  const content = (
    <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
      {/* Title row */}
      <View style={styles.titleRow}>
        {/* Text group */}
        <View style={styles.titleGroup}>
          <Text
            style={[styles.title, gradient ? styles.titleLight : styles.titleDark, titleStyle]}
            {...titleProps}
          >
            {title}
          </Text>

          {subtitle ? (
            <Text
              style={[
                styles.subtitle,
                gradient ? styles.subtitleLight : styles.subtitleDark,
                subtitleStyle,
              ]}
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
      <GradientBackground colors={['#062E22', '#0B6E4F'] as const}>
        {content}
      </GradientBackground>
    );
  }

  return <View style={styles.plainBg}>{content}</View>;
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleGroup: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  titleLight: {
    color: '#FFFFFF',
  },
  titleDark: {
    color: COLORS.text.primary,
  },
  subtitle: {
    marginTop: 2,
    fontSize: 10,
    textTransform: 'uppercase',
  },
  subtitleLight: {
    color: '#FFFFFF80',
  },
  subtitleDark: {
    color: COLORS.text.secondary,
  },
  plainBg: {
    backgroundColor: '#FFFFFF',
  },
});
