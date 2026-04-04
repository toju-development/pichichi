/**
 * Bell icon with unread-count badge for the navigation header.
 *
 * Renders a bell icon (Ionicons `notifications-outline`) with an optional
 * red circle badge showing the unread notification count. Pressing the
 * bell navigates to the notifications screen.
 *
 * IMPORTANT — NativeWind v4 first-frame fix:
 * Uses StyleSheet for all visual properties to guarantee rendering
 * on the first frame without ghost/invisible content.
 */

import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { useUnreadCount } from '@/hooks/use-notifications';

interface NotificationBellProps {
  /** Icon tint — defaults to white (for gradient headers). */
  tintColor?: string;
}

export function NotificationBell({ tintColor = '#FFFFFF' }: NotificationBellProps) {
  const { data } = useUnreadCount();
  const count = data?.count ?? 0;

  const label = count > 99 ? '99+' : String(count);

  return (
    <Pressable
      onPress={() => router.push('/notifications' as never)}
      style={styles.container}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={
        count > 0
          ? `Notificaciones, ${count} sin leer`
          : 'Notificaciones'
      }
    >
      <Ionicons name="notifications-outline" size={24} color={tintColor} />

      {count > 0 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{label}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const BADGE_SIZE = 18;

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    minWidth: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: BADGE_SIZE / 2,
    backgroundColor: '#E63946',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },
});
