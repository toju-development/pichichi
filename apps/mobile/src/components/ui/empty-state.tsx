/**
 * Centered empty state used when a screen has no data to display.
 *
 * Renders an icon inside a soft circle, a title, an optional description,
 * and an optional call-to-action button.
 */

import { Text, View } from 'react-native';

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
    <View className="flex-1 items-center justify-center px-6">
      {/* Icon circle */}
      <View className="h-20 w-20 items-center justify-center rounded-full bg-background">
        {icon}
      </View>

      <Text className="mt-4 text-center text-lg font-bold text-text-primary">
        {title}
      </Text>

      {description ? (
        <Text className="mt-2 max-w-[250px] text-center text-sm text-text-secondary">
          {description}
        </Text>
      ) : null}

      {action ? (
        <View className="mt-6">
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
