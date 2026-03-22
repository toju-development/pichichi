/**
 * 404 — Not Found screen.
 *
 * Shown when navigating to an unknown route.
 * Provides a link back to the home screen.
 */

import { Text, View } from 'react-native';
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function NotFoundScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 items-center justify-center px-8">
        <Text className="text-5xl">🤔</Text>
        <Text className="mt-4 text-2xl font-bold text-text-primary">
          Página no encontrada
        </Text>
        <Text className="mt-2 text-center text-base text-text-secondary">
          La página que buscás no existe
        </Text>
        <Link
          href="/"
          className="mt-6 rounded-xl bg-primary px-6 py-3"
        >
          <Text className="text-base font-semibold text-white">
            Volver al inicio
          </Text>
        </Link>
      </View>
    </SafeAreaView>
  );
}
