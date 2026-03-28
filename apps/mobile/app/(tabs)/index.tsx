/**
 * Home / Dashboard screen.
 *
 * Shows: welcome card, quick stats, upcoming match placeholders.
 * All static placeholder data — no API calls yet.
 */

import { ScrollView, Text, View } from 'react-native';

import { PredictionIcon, PointsIcon, TrophyIcon } from '@/components/brand/icons';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScreenHeader } from '@/components/ui/screen-header';
import { COLORS } from '@/theme/colors';

export default function HomeScreen() {
  return (
    <View className="flex-1 bg-background">
      {/* Gradient header */}
      <ScreenHeader title="Pichichi" subtitle="Mundial 2026" gradient />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
      >
        {/* Welcome card */}
        <Card accent className="mb-5">
          <View className="pl-3">
            <Text className="text-lg font-bold text-text-primary">
              ¡Bienvenido! 👋
            </Text>
            <Text className="mt-1 text-sm text-text-secondary">
              Empezá a predecir los partidos del Mundial 2026
            </Text>
            <View className="mt-4">
              <Button variant="gradient" title="Ver próximos partidos" />
            </View>
          </View>
        </Card>

        {/* Quick stats row */}
        <View className="mb-5 flex-row gap-3">
          <Card className="flex-1 items-center py-4">
            <PredictionIcon size={16} color={COLORS.primary.DEFAULT} />
            <Text className="mt-1 text-2xl font-bold text-primary">0</Text>
            <Text className="text-xs text-text-secondary">
              Predicciones
            </Text>
          </Card>

          <Card className="flex-1 items-center py-4">
            <PointsIcon size={16} color={COLORS.primary.DEFAULT} />
            <Text className="mt-1 text-2xl font-bold text-primary">0</Text>
            <Text className="text-xs text-text-secondary">
              Puntos
            </Text>
          </Card>

          <Card className="flex-1 items-center py-4">
            <TrophyIcon size={16} color={COLORS.primary.DEFAULT} />
            <Text className="mt-1 text-2xl font-bold text-primary">0</Text>
            <Text className="text-xs text-text-secondary">
              Posición
            </Text>
          </Card>
        </View>

        {/* Upcoming matches section */}
        <Text className="mb-3 text-lg font-bold text-text-primary">
          Próximos partidos
        </Text>

        <Card className="mb-3">
          <View className="flex-row items-center justify-between">
            <Text className="flex-1 text-right text-sm font-semibold text-text-primary">
              Argentina
            </Text>
            <Text className="mx-3 text-xs font-bold text-text-muted">vs</Text>
            <Text className="flex-1 text-sm font-semibold text-text-primary">
              Arabia Saudita
            </Text>
          </View>
          <Text className="mt-2 text-center text-xs text-text-secondary">
            11 Jun 2026
          </Text>
        </Card>

        <Card>
          <View className="flex-row items-center justify-between">
            <Text className="flex-1 text-right text-sm font-semibold text-text-primary">
              Brasil
            </Text>
            <Text className="mx-3 text-xs font-bold text-text-muted">vs</Text>
            <Text className="flex-1 text-sm font-semibold text-text-primary">
              Serbia
            </Text>
          </View>
          <Text className="mt-2 text-center text-xs text-text-secondary">
            12 Jun 2026
          </Text>
        </Card>
      </ScrollView>
    </View>
  );
}
