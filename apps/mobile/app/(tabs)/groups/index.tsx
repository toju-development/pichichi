/**
 * Groups list placeholder screen.
 *
 * Will eventually show: list of groups, create/join buttons.
 */

import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function GroupsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 px-6 pt-8">
        {/* Header */}
        <Text className="text-2xl font-bold text-text-primary">
          Mis Grupos
        </Text>

        {/* Placeholder content */}
        <View className="flex-1 items-center justify-center">
          <Text className="text-5xl">👥</Text>
          <Text className="mt-4 text-lg font-semibold text-text-primary">
            Todavía no tenés grupos
          </Text>
          <Text className="mt-2 text-center text-base text-text-secondary">
            Tus grupos de predicciones aparecerán acá
          </Text>
          <View className="mt-6 rounded-xl bg-surface px-6 py-4">
            <Text className="text-center text-sm text-text-muted">
              Creá un grupo o uníte a uno para empezar a competir
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
