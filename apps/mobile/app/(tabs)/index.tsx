/**
 * Home / Dashboard placeholder screen.
 *
 * Will eventually show: upcoming matches, live matches, quick prediction cards.
 */

import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 items-center justify-center px-8">
        <Text className="text-5xl">⚽</Text>
        <Text className="mt-4 text-2xl font-bold text-text-primary">
          Inicio
        </Text>
        <Text className="mt-2 text-center text-base text-text-secondary">
          Próximos partidos y predicciones rápidas
        </Text>
        <View className="mt-6 rounded-xl bg-surface px-6 py-4">
          <Text className="text-center text-sm text-text-muted">
            Los partidos y predicciones van a aparecer acá
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
