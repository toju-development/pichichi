/**
 * Profile screen — shows user info + working logout.
 *
 * Displays name, email from auth store.
 * Logout button calls useLogout mutation + clears auth state.
 * This is the ONE screen that's semi-functional, not just a placeholder.
 */

import { Alert, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';

import { GlobeIcon, LiveIcon, PointsIcon } from '@/components/brand/icons';
import { Card } from '@/components/ui/card';
import { ScreenHeader } from '@/components/ui/screen-header';
import { useLogout } from '@/hooks/use-auth';
import { useAuthStore } from '@/stores/auth-store';

/** Single setting row inside a Card. */
function SettingRow({
  icon,
  label,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  onPress?: () => void;
}) {
  return (
    <Card onPress={onPress} className="mb-3">
      <View className="flex-row items-center">
        <View className="mr-3">{icon}</View>
        <Text className="flex-1 text-base text-text-primary">{label}</Text>
        <Text className="text-lg text-gray-400">›</Text>
      </View>
    </Card>
  );
}

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
          onPress: () =>
            logoutMutation.mutate(undefined, {
              onSettled: () => {
                // Navigate AFTER clearing state — even if the server-side
                // revocation failed, local state is already cleared by onSettled.
                // Using replace prevents the user from navigating back.
                router.replace('/(auth)/login');
              },
            }),
        },
      ],
    );
  }

  const displayName = user?.displayName ?? 'Usuario';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <View className="flex-1 bg-background">
      {/* Compact header with avatar embedded */}
      <ScreenHeader title="Perfil" gradient>
        <View className="mt-3 flex-row items-center">
          {/* Avatar circle */}
          <View className="h-14 w-14 items-center justify-center rounded-full bg-white/20">
            <Text className="text-xl font-bold text-white">{initial}</Text>
          </View>

          {/* Name & email */}
          <View className="ml-3 flex-1">
            <Text className="text-base font-bold text-white">
              {displayName}
            </Text>
            <Text className="mt-0.5 text-sm text-white/70">
              {user?.email ?? ''}
            </Text>
          </View>
        </View>
      </ScreenHeader>

      {/* Scrollable content below header */}
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pt-6 pb-8"
      >
        {/* Settings section */}
        <Text className="mb-3 text-lg font-bold text-text-primary">
          Configuración
        </Text>

        <SettingRow
          icon={<GlobeIcon size={22} color="#0B6E4F" />}
          label="Mi cuenta"
          onPress={() => {}}
        />
        <SettingRow
          icon={<LiveIcon size={22} color="#0B6E4F" />}
          label="Notificaciones"
          onPress={() => {}}
        />
        <SettingRow
          icon={<PointsIcon size={22} color="#0B6E4F" />}
          label="Acerca de Pichichi"
          onPress={() => {}}
        />

        {/* Logout card */}
        <View className="mt-6">
          <Card onPress={handleLogout}>
            <View className="flex-row items-center justify-center">
              <Text className={`text-base font-semibold ${logoutMutation.isPending ? 'text-text-muted' : 'text-error'}`}>
                {logoutMutation.isPending ? 'Cerrando sesión...' : 'Cerrar sesión'}
              </Text>
            </View>
          </Card>
        </View>
      </ScrollView>
    </View>
  );
}
