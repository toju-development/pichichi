/**
 * Leaderboard screen — global ranking with podium + infinite scroll list.
 *
 * Shows a top-3 podium hero, then a FlatList of positions 4+ with
 * infinite scroll, pull-to-refresh, current user highlighting,
 * and a sticky bottom bar showing the current user's position.
 *
 * IMPORTANT — NativeWind v4 first-frame fix:
 * ALL visual properties use StyleSheet to guarantee rendering on the
 * first frame. Never mix `style` and `className` on the same element.
 */

import { useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import type { LeaderboardEntryDto } from '@pichichi/shared';

import { LeaderboardEntry } from '@/components/leaderboard/leaderboard-entry';
import { Podium } from '@/components/leaderboard/podium';
import { NotificationBell } from '@/components/ui/notification-bell';
import { ScreenHeader } from '@/components/ui/screen-header';
import { useGlobalLeaderboard } from '@/hooks/use-leaderboard';
import { useUnreadCount } from '@/hooks/use-notifications';
import { useAuthStore } from '@/stores/auth-store';
import { COLORS } from '@/theme/colors';

// ─── Constants ──────────────────────────────────────────────────────────────

const PODIUM_COUNT = 3;
const ON_END_REACHED_THRESHOLD = 0.5;

// ─── Sub-components ─────────────────────────────────────────────────────────

/** Loading skeleton for initial load state. */
function LoadingSkeleton() {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={COLORS.primary.DEFAULT} />
      <Text style={styles.loadingText}>Cargando ranking…</Text>
    </View>
  );
}

/** Empty state when no scored predictions exist yet. */
function EmptyState() {
  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyEmoji}>🏆</Text>
      <Text style={styles.emptyTitle}>Aún no hay resultados</Text>
      <Text style={styles.emptySubtitle}>
        Cuando se jueguen partidos y haya predicciones puntuadas, el ranking
        aparecerá acá.
      </Text>
    </View>
  );
}

/** Loading spinner at the bottom of the list while fetching the next page. */
function ListFooterSpinner() {
  return (
    <View style={styles.footerSpinner}>
      <ActivityIndicator size="small" color={COLORS.primary.DEFAULT} />
    </View>
  );
}

/** Sticky bar at the bottom showing the current user's position. */
function CurrentUserBar({ entry }: { entry: LeaderboardEntryDto }) {
  return (
    <View style={styles.stickyBar}>
      <View style={styles.stickyBarInner}>
        <View style={styles.stickyPosition}>
          <Text style={styles.stickyPositionText}>#{entry.position}</Text>
        </View>
        <Text style={styles.stickyName} numberOfLines={1}>
          {entry.displayName}
        </Text>
        <Text style={styles.stickyPoints}>{entry.totalPoints} pts</Text>
      </View>
    </View>
  );
}

// ─── Main Screen ────────────────────────────────────────────────────────────

export default function LeaderboardScreen() {
  const userId = useAuthStore((s) => s.user?.id);

  const {
    data,
    isLoading,
    isRefetching,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    currentUserEntry,
  } = useGlobalLeaderboard();

  const { refetch: refetchUnreadCount } = useUnreadCount();

  // ── Data derivation ───────────────────────────────────────────────────────

  const allEntries = useMemo(
    () => data?.pages.flatMap((p) => p.entries) ?? [],
    [data],
  );

  const top3 = useMemo(() => allEntries.slice(0, PODIUM_COUNT), [allEntries]);

  const restEntries = useMemo(
    () => allEntries.slice(PODIUM_COUNT),
    [allEntries],
  );

  // ── Handlers ──────────────────────────────────────────────────────────────

  const onRefresh = useCallback(() => {
    refetch();
    refetchUnreadCount();
  }, [refetch, refetchUnreadCount]);

  const onEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // ── Render helpers ────────────────────────────────────────────────────────

  const renderItem = useCallback(
    ({ item }: { item: LeaderboardEntryDto }) => (
      <LeaderboardEntry
        entry={item}
        isCurrentUser={item.userId === userId}
      />
    ),
    [userId],
  );

  const keyExtractor = useCallback(
    (item: LeaderboardEntryDto) => item.userId,
    [],
  );

  const listHeader = useMemo(() => {
    if (top3.length === 0) return null;
    return (
      <View>
        <Podium entries={top3} />
        {restEntries.length > 0 && (
          <Text style={styles.sectionTitle}>Tabla completa</Text>
        )}
      </View>
    );
  }, [top3, restEntries.length]);

  const listEmpty = useMemo(() => {
    // Only show empty state when there is NO data at all (no podium, no list).
    // When restEntries is empty but top3 has data, the FlatList triggers
    // ListEmptyComponent — we suppress it because the podium IS the content.
    if (isLoading || allEntries.length > 0) return null;
    return <EmptyState />;
  }, [isLoading, allEntries.length]);

  const listFooter = useMemo(() => {
    if (isFetchingNextPage) return <ListFooterSpinner />;
    return null;
  }, [isFetchingNextPage]);

  // Determine whether to show the sticky current-user bar:
  // Always show it when currentUserEntry exists — even for podium users,
  // it serves as a quick-reference for the user's position and points.
  const showStickyBar = !!currentUserEntry;

  // ── Initial loading state ─────────────────────────────────────────────────

  if (isLoading) {
    return (
      <View style={styles.root}>
        <ScreenHeader
          title="Ranking"
          subtitle="Tabla de posiciones"
          gradient
          rightAction={<NotificationBell />}
        />
        <LoadingSkeleton />
      </View>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────

  return (
    <View style={styles.root}>
      <ScreenHeader
        title="Ranking"
        subtitle="Tabla de posiciones"
        gradient
        rightAction={<NotificationBell />}
      />

      <FlatList<LeaderboardEntryDto>
        data={restEntries}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={listEmpty}
        ListFooterComponent={listFooter}
        onEndReached={onEndReached}
        onEndReachedThreshold={ON_END_REACHED_THRESHOLD}
        contentContainerStyle={styles.listContent}
        style={styles.fill}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={onRefresh}
            tintColor={COLORS.primary.DEFAULT}
            colors={[COLORS.primary.DEFAULT]}
          />
        }
      />

      {/* Sticky current user bar — pinned at bottom */}
      {showStickyBar ? <CurrentUserBar entry={currentUserEntry} /> : null}
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
  listContent: {
    paddingBottom: 40,
  },

  // ── Section title ─────────────────────────────────────────────────────────
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text.primary,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },

  // ── Loading ───────────────────────────────────────────────────────────────
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text.secondary,
  },

  // ── Empty state ───────────────────────────────────────────────────────────
  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 60,
    paddingBottom: 40,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },

  // ── Footer spinner ────────────────────────────────────────────────────────
  footerSpinner: {
    paddingVertical: 20,
    alignItems: 'center',
  },

  // ── Sticky current user bar ───────────────────────────────────────────────
  stickyBar: {
    backgroundColor: COLORS.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 4,
  },
  stickyBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary.light,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  stickyPosition: {
    width: 40,
    alignItems: 'center',
  },
  stickyPositionText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primary.DEFAULT,
  },
  stickyName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginLeft: 8,
    marginRight: 8,
  },
  stickyPoints: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary.DEFAULT,
  },
});
