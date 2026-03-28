/**
 * Centered empty state used when a screen has no data to display.
 *
 * Renders an icon inside a soft circle, a title, an optional description,
 * and an optional call-to-action button.
 *
 * IMPORTANT — NativeWind v4 first-frame fix:
 * Uses StyleSheet for all visual properties to guarantee rendering
 * on the first frame without ghost/invisible content.
 */

import { StyleSheet, Text, View } from 'react-native';

import { COLORS } from '@/theme/colors';

import { Button } from './button';

interface EmptyStateProps {
  /** Custom SVG icon from brand/icons. */
  icon: React.ReactNode;
  title: string;
  description?: string;
  /** Optional CTA rendered below the description. */
  action?: {
    label: string;
    onPress: () => void;
  };
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      {/* Icon circle */}
      <View style={styles.iconCircle}>
        {icon}
      </View>

      <Text style={styles.title}>
        {title}
      </Text>

      {description ? (
        <Text style={styles.description}>
          {description}
        </Text>
      ) : null}

      {action ? (
        <View style={styles.actionWrapper}>
          <Button
            title={action.label}
            variant="primary"
            onPress={action.onPress}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  iconCircle: {
    height: 80,
    width: 80,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9999,
    backgroundColor: COLORS.background,
  },
  title: {
    marginTop: 16,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  description: {
    marginTop: 8,
    maxWidth: 250,
    textAlign: 'center',
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  actionWrapper: {
    marginTop: 24,
  },
});
