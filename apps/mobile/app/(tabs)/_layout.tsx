/**
 * Tab navigator layout — bottom navigation for authenticated users.
 *
 * 5 tabs: Inicio, Torneos, Grupos, Ranking, Perfil.
 * Uses branded SVG icons from @/components/brand/icons.
 * Active indicator: small green dot below focused icon.
 *
 * Stale-data fix: every tab press invalidates that tab's TanStack Query
 * caches and resets nested stacks to their root screen. This ensures the
 * user always sees fresh data when tapping a tab icon — even if the tab
 * was already mounted and data changed in another tab.
 */

import { useCallback } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';

import { GlobeIcon, GroupIcon, TrophyIcon } from '@/components/brand/icons';
import { COLORS } from '@/theme/colors';

// ─── Query key prefixes per tab ─────────────────────────────────────────────
// Each tab maps to the query key prefixes that should be invalidated when
// the user taps that tab icon. Uses prefix matching (same pattern as
// use-socket-events.ts) so all sub-queries are covered automatically.
//
// Profile has no data queries — it reads from the auth store.
// Notifications unread count is shared across all tabs (shown in every header),
// so it's invalidated on EVERY tab press.

const TAB_QUERY_KEYS: Record<string, readonly (readonly string[])[]> = {
  index: [['dashboard']],
  tournaments: [['tournaments']],
  groups: [['groups'], ['predictions'], ['bonus-predictions']],
  leaderboard: [['leaderboard']],
  profile: [],
};

/** Query keys invalidated on EVERY tab press (cross-cutting concerns). */
const SHARED_QUERY_KEYS: readonly (readonly string[])[] = [
  ['notifications', 'unread-count'],
];

// ─── Sub-components ─────────────────────────────────────────────────────────

/** Small dot rendered below the active tab label. */
function ActiveDot() {
  return <View style={styles.activeDot} />;
}

// ─── Main Layout ────────────────────────────────────────────────────────────

export default function TabLayout() {
  const queryClient = useQueryClient();

  /**
   * Creates a `tabPress` handler that invalidates the tab's queries.
   *
   * We do NOT call `e.preventDefault()` — React Navigation's default
   * `tabPress` behavior already handles:
   * - Popping nested stacks to root (popToTop)
   * - Scrolling to top if the tab is already focused
   *
   * We simply piggyback on it to invalidate TanStack Query caches,
   * ensuring the user always sees fresh data when tapping a tab icon.
   */
  const createTabPressHandler = useCallback(
    (tabName: string) =>
      () => {
        const queryKeys = TAB_QUERY_KEYS[tabName] ?? [];

        // Invalidate tab-specific queries
        for (const key of queryKeys) {
          void queryClient.invalidateQueries({ queryKey: key });
        }

        // Invalidate shared queries (e.g. unread notification count)
        for (const key of SHARED_QUERY_KEYS) {
          void queryClient.invalidateQueries({ queryKey: key });
        }
      },
    [queryClient],
  );

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary.DEFAULT,
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: styles.tabBar,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color }) => <GlobeIcon size={24} color={color} />,
          tabBarLabel: ({ focused }) => (
            <View style={styles.labelContainer}>
              <Text style={focused ? styles.labelTextActive : styles.labelText}>
                Inicio
              </Text>
              {focused && <ActiveDot />}
            </View>
          ),
        }}
        listeners={{
          tabPress: createTabPressHandler('index'),
        }}
      />
      <Tabs.Screen
        name="tournaments"
        options={{
          title: 'Torneos',
          tabBarIcon: ({ color }) => <TrophyIcon size={24} color={color} />,
          tabBarLabel: ({ focused }) => (
            <View style={styles.labelContainer}>
              <Text style={focused ? styles.labelTextActive : styles.labelText}>
                Torneos
              </Text>
              {focused && <ActiveDot />}
            </View>
          ),
        }}
        listeners={{
          tabPress: createTabPressHandler('tournaments'),
        }}
      />
      <Tabs.Screen
        name="groups"
        options={{
          title: 'Grupos',
          tabBarIcon: ({ color }) => <GroupIcon size={24} color={color} />,
          tabBarLabel: ({ focused }) => (
            <View style={styles.labelContainer}>
              <Text style={focused ? styles.labelTextActive : styles.labelText}>
                Grupos
              </Text>
              {focused && <ActiveDot />}
            </View>
          ),
        }}
        listeners={{
          tabPress: createTabPressHandler('groups'),
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          title: 'Ranking',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'stats-chart' : 'stats-chart-outline'}
              size={24}
              color={color}
            />
          ),
          tabBarLabel: ({ focused }) => (
            <View style={styles.labelContainer}>
              <Text style={focused ? styles.labelTextActive : styles.labelText}>
                Ranking
              </Text>
              {focused && <ActiveDot />}
            </View>
          ),
        }}
        listeners={{
          tabPress: createTabPressHandler('leaderboard'),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'person' : 'person-outline'}
              size={24}
              color={color}
            />
          ),
          tabBarLabel: ({ focused }) => (
            <View style={styles.labelContainer}>
              <Text style={focused ? styles.labelTextActive : styles.labelText}>
                Perfil
              </Text>
              {focused && <ActiveDot />}
            </View>
          ),
        }}
        listeners={{
          tabPress: createTabPressHandler('profile'),
         }}
      />
    </Tabs>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    height: Platform.select({ ios: 84, android: 72 }),
    paddingBottom: Platform.select({ ios: 20, android: 12 }),
    paddingTop: 6,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  activeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#0B6E4F',
    marginTop: 2,
  },
  labelContainer: {
    alignItems: 'center',
  },
  labelText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  labelTextActive: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0B6E4F',
  },
});
