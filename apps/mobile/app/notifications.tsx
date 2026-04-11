/**
 * Notification list screen — accessible from any tab via the bell icon.
 *
 * Behaviour:
 * - On mount: marks all notifications as read (badge resets to 0).
 * - Renders a paginated FlatList (20 per page, infinite scroll via onEndReached).
 * - Each item shows a type icon, title, body, and relative timestamp.
 * - Empty state shown when the user has no notifications.
 *
 * IMPORTANT — NativeWind v4 first-frame fix:
 * Uses StyleSheet for all visual properties to guarantee rendering on
 * the first frame without ghost/invisible content.
 */

import { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';

import type { NotificationDto } from '@pichichi/shared';

import { ScreenHeader } from '@/components/ui/screen-header';
import {
  useMarkAllAsRead,
  useNotifications,
} from '@/hooks/use-notifications';
import { COLORS } from '@/theme/colors';

// ─── Notification type icons ────────────────────────────────────────────────

const TYPE_ICONS: Record<string, string> = {
  MATCH_RESULT: '🏟️',
  MATCH_REMINDER: '⏰',
  GROUP_JOIN: '👥',
  GROUP_INVITE: '✉️',
  PREDICTION_DEADLINE: '📝',
  LEADERBOARD_CHANGE: '📊',
  BONUS_REMINDER: '⭐',
};

function getTypeIcon(type: string): string {
  return TYPE_ICONS[type] ?? '🔔';
}

// ─── Relative timestamp ─────────────────────────────────────────────────────

function formatRelativeTime(dateString: string): string {
  const now = Date.now();
  const date = new Date(dateString).getTime();
  const diffMs = now - date;

  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'ahora';
  if (minutes < 60) return `hace ${minutes} min`;
  if (hours < 24) return `hace ${hours} ${hours === 1 ? 'hora' : 'horas'}`;
  if (days === 1) return 'ayer';
  if (days < 7) return `hace ${days} días`;
  if (days < 30) {
    const weeks = Math.floor(days / 7);
    return `hace ${weeks} ${weeks === 1 ? 'semana' : 'semanas'}`;
  }

  const months = Math.floor(days / 30);
  return `hace ${months} ${months === 1 ? 'mes' : 'meses'}`;
}

// ─── Single notification row ────────────────────────────────────────────────

function NotificationItem({ notification }: { notification: NotificationDto }) {
  return (
    <View style={itemStyles.container}>
      {/* Type icon */}
      <View style={itemStyles.iconContainer}>
        <Text style={itemStyles.iconText}>{getTypeIcon(notification.type)}</Text>
      </View>

      {/* Content */}
      <View style={itemStyles.content}>
        <Text style={itemStyles.title} numberOfLines={1}>
          {notification.title}
        </Text>
        <Text style={itemStyles.body} numberOfLines={2}>
          {notification.body}
        </Text>
        <Text style={itemStyles.timestamp}>
          {formatRelativeTime(notification.createdAt)}
        </Text>
      </View>
    </View>
  );
}

const itemStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary.light,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  iconText: {
    fontSize: 18,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 2,
  },
  body: {
    fontSize: 14,
    fontWeight: '400',
    color: COLORS.text.secondary,
    lineHeight: 20,
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.text.muted,
  },
});

// ─── Empty state ────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <View style={emptyStyles.container}>
      <Text style={emptyStyles.emoji}>🔔</Text>
      <Text style={emptyStyles.title}>No tenés notificaciones</Text>
      <Text style={emptyStyles.subtitle}>
        Cuando haya novedades en tus grupos y partidos, van a aparecer acá.
      </Text>
    </View>
  );
}

const emptyStyles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingTop: 80,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});

// ─── Main screen ────────────────────────────────────────────────────────────

export default function NotificationsScreen() {
  const markAllAsRead = useMarkAllAsRead();
  const markedRef = useRef(false);

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useNotifications();

  // Mark all as read on mount (once).
  useEffect(() => {
    if (!markedRef.current) {
      markedRef.current = true;
      markAllAsRead.mutate();
    }
  }, [markAllAsRead]);

  // Flatten all pages into a single list.
  const notifications = data?.pages.flat() ?? [];

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <ScreenHeader
        title="Notificaciones"
        gradient={false}
        onBack={() => router.back()}
      />

      {/* Loading state */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary.DEFAULT} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <NotificationItem notification={item} />}
          ListEmptyComponent={EmptyState}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            isFetchingNextPage ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator
                  size="small"
                  color={COLORS.primary.DEFAULT}
                />
              </View>
            ) : null
          }
          contentContainerStyle={
            notifications.length === 0 ? styles.emptyList : undefined
          }
        />
      )}
    </View>
  );
}

// ─── Screen styles ──────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyList: {
    flex: 1,
  },
});
