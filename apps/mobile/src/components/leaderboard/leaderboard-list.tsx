/**
 * Scrollable leaderboard rendered as a FlatList for performance.
 *
 * Displays a list of LeaderboardEntry rows, highlights the current user,
 * and supports pull-to-refresh. Shows an EmptyState when there are no
 * entries.
 *
 * IMPORTANT — NativeWind v4 ghost-card fix:
 * ALL visual properties live in StyleSheet so they are applied on the FIRST
 * frame. The `className` prop is only for external spacing.
 * Never mix `style` and `className` on the same element.
 */

import { type ReactElement, useCallback } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';

import type { LeaderboardEntryDto } from '@pichichi/shared';

import { TrophyIcon } from '@/components/brand/icons';
import { EmptyState } from '@/components/ui/empty-state';
import { COLORS } from '@/theme/colors';

import { LeaderboardEntry } from './leaderboard-entry';

// ─── Props ──────────────────────────────────────────────────────────────────

export interface LeaderboardListProps {
  entries: LeaderboardEntryDto[];
  /** User id used to highlight the current user's row. */
  currentUserId: string;
  /** Whether a refresh is currently in progress. */
  refreshing: boolean;
  /** Callback triggered on pull-to-refresh. */
  onRefresh: () => void;
  /** Optional component rendered above the list (e.g. summary card). */
  ListHeaderComponent?: ReactElement;
}

// ─── Key extractor ──────────────────────────────────────────────────────────

function keyExtractor(item: LeaderboardEntryDto): string {
  return item.userId;
}

// ─── Empty component ────────────────────────────────────────────────────────

function ListEmpty() {
  return (
    <EmptyState
      icon={<TrophyIcon size={40} color={COLORS.text.muted} />}
      title="Sin ranking disponible"
      description="El ranking se actualizará cuando se registren pronósticos."
    />
  );
}

// ─── Header ─────────────────────────────────────────────────────────────────

function ListHeader() {
  return (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Ranking</Text>
    </View>
  );
}

// ─── Separator ──────────────────────────────────────────────────────────────

function ItemSeparator() {
  return <View style={styles.separator} />;
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function LeaderboardList({
  entries,
  currentUserId,
  refreshing,
  onRefresh,
  ListHeaderComponent,
}: LeaderboardListProps) {
  const renderItem = useCallback(
    ({ item }: { item: LeaderboardEntryDto }) => (
      <LeaderboardEntry
        entry={item}
        isCurrentUser={item.userId === currentUserId}
      />
    ),
    [currentUserId],
  );

  return (
    <FlatList
      data={entries}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      ListHeaderComponent={
        <>
          {ListHeaderComponent}
          <ListHeader />
        </>
      }
      ListEmptyComponent={ListEmpty}
      ItemSeparatorComponent={ItemSeparator}
      contentContainerStyle={[
        styles.listContent,
        entries.length === 0 && styles.listContentEmpty,
      ]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={COLORS.primary.DEFAULT}
          colors={[COLORS.primary.DEFAULT]}
        />
      }
      showsVerticalScrollIndicator={false}
    />
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  listContent: {
    paddingBottom: 32,
  },
  listContentEmpty: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.border,
    marginHorizontal: 16,
  },
});
