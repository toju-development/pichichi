/**
 * Leaderboard placeholder screen.
 *
 * Will eventually show: ranking table with positions, points, streaks.
 */

import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LeaderboardScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 items-center justify-center px-8">
        <Text className="text-5xl">🏆</Text>
        <Text className="mt-4 text-2xl font-bold text-text-primary">
          Ranking
        </Text>
        <Text className="mt-2 text-center text-base text-text-secondary">
          La tabla de posiciones se mostrará acá
        </Text>
        <View className="mt-6 rounded-xl bg-surface px-6 py-4">
          <Text className="text-center text-sm text-text-muted">
            Posiciones, puntos y rachas de cada jugador
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
