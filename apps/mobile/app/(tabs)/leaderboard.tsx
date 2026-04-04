/**
 * Leaderboard screen — podium + ranking table.
 *
 * Shows a top-3 podium with placeholders, then a full ranking list below.
 */

import { ScrollView, Text, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { NotificationBell } from '@/components/ui/notification-bell';
import { ScreenHeader } from '@/components/ui/screen-header';

/** Single podium item (top 3). */
function PodiumItem({
  position,
  medal,
  isFirst,
}: {
  position: number;
  medal: string;
  isFirst?: boolean;
}) {
  return (
    <View
      className={`flex-1 items-center ${isFirst ? 'mb-0' : 'mt-4'}`}
    >
      {/* Avatar circle */}
      <View
        className={`items-center justify-center rounded-full bg-gray-200 ${
          isFirst ? 'h-16 w-16 border-2 border-gold' : 'h-14 w-14'
        }`}
      >
        <Text className="text-lg text-gray-400">—</Text>
      </View>

      {/* Medal */}
      <Text className="mt-2 text-xl">{medal}</Text>

      {/* Name */}
      <Text className="mt-1 text-sm font-semibold text-text-primary">—</Text>

      {/* Points */}
      <Text
        className={`text-xs font-bold ${isFirst ? 'text-gold' : 'text-gray-400'}`}
      >
        0 pts
      </Text>
    </View>
  );
}

/** Single row in the full ranking table. */
function RankingRow({ position }: { position: number }) {
  return (
    <View className="flex-row items-center px-4 py-3">
      <Text className="w-8 text-lg font-bold text-primary">{position}</Text>
      <Text className="flex-1 text-base text-text-primary">—</Text>
      <Text className="text-sm text-text-secondary">0 pts</Text>
    </View>
  );
}

export default function LeaderboardScreen() {
  return (
    <View className="flex-1 bg-background">
      <ScreenHeader
        title="Ranking"
        subtitle="Tabla de posiciones"
        gradient={true}
        rightAction={<NotificationBell />}
      />

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pt-6 pb-8"
      >
        {/* Podium — visual order: 2nd | 1st (taller) | 3rd */}
        <View className="mb-8 flex-row items-end justify-center">
          <PodiumItem position={2} medal="🥈" />
          <PodiumItem position={1} medal="🥇" isFirst />
          <PodiumItem position={3} medal="🥉" />
        </View>

        {/* Full ranking table */}
        <Text className="mb-3 text-lg font-bold text-text-primary">
          Tabla completa
        </Text>

        <Card>
          {[4, 5, 6, 7, 8].map((pos, idx) => (
            <View key={pos}>
              {idx > 0 && <View className="mx-4 h-px bg-gray-100" />}
              <RankingRow position={pos} />
            </View>
          ))}
        </Card>
      </ScrollView>
    </View>
  );
}
