/**
 * Home / Dashboard screen.
 *
 * Data-driven engagement hub fed by the `GET /dashboard` endpoint.
 * Uses `useDashboard()` hook and renders 3 presentational section
 * components. Each section handles its own empty state.
 *
 * IMPORTANT — NativeWind v4 first-frame fix:
 * ALL visual properties use StyleSheet to guarantee rendering on the
 * first frame. `className` is only used for external spacing wrappers.
 * Never mix `style` and `className` on the same element.
 */

import { useCallback } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  GroupRankingsSection,
  TodayMatchesSection,
  UserStatsSection,
} from '@/components/home';
import { NotificationBell } from '@/components/ui/notification-bell';
import { ScreenHeader } from '@/components/ui/screen-header';
import { useDashboard } from '@/hooks/use-dashboard';
import { useUnreadCount } from '@/hooks/use-notifications';
import { COLORS } from '@/theme/colors';

// ─── Skeleton placeholder ───────────────────────────────────────────────────

function SectionSkeleton() {
  return (
    <View style={styles.skeletonContainer}>
      <View style={styles.skeletonTitleBar} />
      <View style={styles.skeletonCard}>
        <View style={styles.skeletonLine} />
        <View style={styles.skeletonLineShort} />
      </View>
    </View>
  );
}

// ─── Section error indicator ────────────────────────────────────────────────

function SectionError({ label }: { label: string }) {
  return (
    <View style={styles.errorContainer}>
      <Text style={styles.errorText}>No se pudo cargar {label}</Text>
    </View>
  );
}

// ─── Main Screen ────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const { data, isLoading, isRefetching, refetch, error } = useDashboard();
  const { refetch: refetchUnreadCount } = useUnreadCount();

  const onRefresh = useCallback(() => {
    console.log('[Notifications] 🔄 Refetching unread count');
    refetch();
    refetchUnreadCount();
  }, [refetch, refetchUnreadCount]);

  // Full-screen loading state (first load only)
  if (isLoading) {
    return (
      <View style={styles.root}>
        <ScreenHeader title="Pichichi" subtitle="Mundial 2026" gradient rightAction={<NotificationBell />} />
        <ScrollView
          style={styles.fill}
          contentContainerStyle={styles.scrollContent}
        >
          <SectionSkeleton />
          <SectionSkeleton />
          <SectionSkeleton />
        </ScrollView>
      </View>
    );
  }

  // Full-screen error state (no data at all)
  if (error && !data) {
    return (
      <View style={styles.root}>
        <ScreenHeader title="Pichichi" subtitle="Mundial 2026" gradient rightAction={<NotificationBell />} />
        <ScrollView
          style={styles.fill}
          contentContainerStyle={styles.errorScrollContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={onRefresh}
              tintColor={COLORS.primary.DEFAULT}
              colors={[COLORS.primary.DEFAULT]}
            />
          }
        >
          <View style={styles.fullErrorContainer}>
            <Text style={styles.fullErrorEmoji}>{'\u26A0\uFE0F'}</Text>
            <Text style={styles.fullErrorTitle}>
              Error al cargar el dashboard
            </Text>
            <Text style={styles.fullErrorSubtitle}>
              Deslizá hacia abajo para reintentar
            </Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ScreenHeader title="Pichichi" subtitle="Mundial 2026" gradient rightAction={<NotificationBell />} />

      <ScrollView
        style={styles.fill}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={onRefresh}
            tintColor={COLORS.primary.DEFAULT}
            colors={[COLORS.primary.DEFAULT]}
          />
        }
      >
        {/* ── User Stats ─────────────────────────────────────────────── */}
        {data?.stats === undefined ? (
          <SectionSkeleton />
        ) : data.stats === null ? (
          <SectionError label="estadísticas" />
        ) : (
          <UserStatsSection stats={data.stats} />
        )}

        {/* ── Today Matches ──────────────────────────────────────────── */}
        {data?.todayMatches === undefined ? (
          <SectionSkeleton />
        ) : data.todayMatches === null ? (
          <SectionError label="partidos de hoy" />
        ) : (
          <TodayMatchesSection matches={data.todayMatches} />
        )}

        {/* ── Group Rankings ──────────────────────────────────────────── */}
        {data?.groups === undefined ? (
          <SectionSkeleton />
        ) : data.groups === null ? (
          <SectionError label="grupos" />
        ) : (
          <GroupRankingsSection groups={data.groups} />
        )}
      </ScrollView>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  fill: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 40,
    gap: 24,
  },

  // ── Skeleton ──────────────────────────────────────────────────────────────
  skeletonContainer: {},
  skeletonTitleBar: {
    width: 160,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.border,
    marginBottom: 12,
  },
  skeletonCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  skeletonLine: {
    width: '100%',
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.border,
  },
  skeletonLineShort: {
    width: '60%',
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.border,
  },

  // ── Section error ─────────────────────────────────────────────────────────
  errorContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.text.muted,
    textAlign: 'center',
  },

  // ── Full-screen error ─────────────────────────────────────────────────────
  errorScrollContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  fullErrorContainer: {
    alignItems: 'center',
    padding: 20,
  },
  fullErrorEmoji: {
    fontSize: 40,
    marginBottom: 16,
  },
  fullErrorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  fullErrorSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
});
