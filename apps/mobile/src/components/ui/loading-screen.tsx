/**
 * Full-screen loading indicator.
 *
 * Used during auth hydration to show a branded splash
 * while tokens are being restored from SecureStore.
 */

import { ActivityIndicator, Text, View } from 'react-native';

import { COLORS } from '@/theme/colors';

export function LoadingScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-background">
      <Text className="mb-4 text-3xl font-bold text-primary">
        Pichichi
      </Text>
      <ActivityIndicator size="large" color={COLORS.primary.DEFAULT} />
    </View>
  );
}
