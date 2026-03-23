/**
 * Group detail screen — branded header + placeholder Cards.
 *
 * Will eventually show: group predictions, leaderboard, members.
 */

import { ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { GroupIcon, TrophyIcon } from '@/components/brand/icons';
import { Card } from '@/components/ui/card';
import { ScreenHeader } from '@/components/ui/screen-header';

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title="Grupo" gradient={true} />

      <ScrollView className="flex-1 px-5 pt-4" contentContainerClassName="pb-8 gap-4">
        {/* Members card */}
        <Card accent>
          <View className="flex-row items-center gap-3">
            <GroupIcon size={24} color="#0B6E4F" />
            <View className="flex-1">
              <Text className="text-base font-semibold text-text-primary">
                Miembros
              </Text>
              <Text className="mt-1 text-sm text-text-secondary">
                Cargando miembros...
              </Text>
            </View>
          </View>
        </Card>

        {/* Tournaments card */}
        <Card accent>
          <View className="flex-row items-center gap-3">
            <TrophyIcon size={24} color="#0B6E4F" />
            <View className="flex-1">
              <Text className="text-base font-semibold text-text-primary">
                Torneos
              </Text>
              <Text className="mt-1 text-sm text-text-secondary">
                Cargando torneos...
              </Text>
            </View>
          </View>
        </Card>
      </ScrollView>
    </View>
  );
}
