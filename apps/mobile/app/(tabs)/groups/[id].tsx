/**
 * Group detail placeholder screen (dynamic route).
 *
 * Will eventually show: group predictions, leaderboard, members.
 */

import { Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 items-center justify-center px-8">
        <Text className="text-5xl">🏟️</Text>
        <Text className="mt-4 text-2xl font-bold text-text-primary">
          Detalle del Grupo
        </Text>
        <Text className="mt-2 text-center text-base text-text-secondary">
          Grupo: {id}
        </Text>
        <View className="mt-6 rounded-xl bg-surface px-6 py-4">
          <Text className="text-center text-sm text-text-muted">
            Predicciones, ranking y miembros del grupo van a aparecer acá
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
