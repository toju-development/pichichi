/**
 * 404 — Not Found screen.
 *
 * Shown when navigating to an unknown route.
 * Provides a branded layout with a link back to the home screen.
 */

import { Text, View } from 'react-native';
import { Link } from 'expo-router';

import { Logo } from '@/components/brand/logo';
import { Button } from '@/components/ui/button';

export default function NotFoundScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-background px-8">
      <Logo variant="icon" size={60} />

      <Text className="mt-4 text-2xl font-bold text-text-primary">¡Ups!</Text>

      <Text className="mt-2 text-center text-base text-text-primary/60">
        No encontramos lo que buscás
      </Text>

      <View className="mt-6">
        <Link href="/" asChild>
          <Button title="Volver al inicio" variant="primary" />
        </Link>
      </View>
    </View>
  );
}
