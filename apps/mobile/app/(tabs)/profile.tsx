/**
 * Profile screen — shows user info + working logout.
 *
 * Displays name, email from auth store.
 * Logout button calls useLogout mutation + clears auth state.
 * This is the ONE screen that's semi-functional, not just a placeholder.
 */

import { Alert, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { useLogout } from '@/hooks/use-auth';
import { useAuthStore } from '@/stores/auth-store';

export default function ProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const logoutMutation = useLogout();

  function handleLogout() {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro de que querés cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar sesión',
          style: 'destructive',
          onPress: () => logoutMutation.mutate(),
        },
      ],
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 px-6 pt-8">
        {/* Header */}
        <Text className="text-2xl font-bold text-text-primary">Perfil</Text>

        {/* User info card */}
        <View className="mt-6 rounded-xl bg-surface p-6">
          <View className="items-center">
            <View className="h-20 w-20 items-center justify-center rounded-full bg-primary-light">
              <Text className="text-3xl">👤</Text>
            </View>
            <Text className="mt-4 text-xl font-bold text-text-primary">
              {user?.displayName ?? 'Usuario'}
            </Text>
            <Text className="mt-1 text-sm text-text-secondary">
              {user?.email ?? 'Sin email'}
            </Text>
          </View>

          {user?.username ? (
            <View className="mt-4 items-center rounded-lg bg-background px-4 py-2">
              <Text className="text-sm text-text-muted">
                @{user.username}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Placeholder for future settings */}
        <View className="mt-6 rounded-xl bg-surface p-6">
          <Text className="text-base font-semibold text-text-primary">
            Configuración
          </Text>
          <Text className="mt-2 text-sm text-text-muted">
            Las opciones de configuración van a aparecer acá
          </Text>
        </View>

        {/* Logout button at bottom */}
        <View className="mt-auto pb-6">
          <Button
            title="Cerrar sesión"
            variant="outline"
            loading={logoutMutation.isPending}
            onPress={handleLogout}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
