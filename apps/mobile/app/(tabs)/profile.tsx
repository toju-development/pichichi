/**
 * Profile screen — user identity, stats grid, and logout.
 *
 * Composes data from three sources:
 * - useAuthStore  → user identity (displayName, username, email)
 * - useDashboard  → stats (totalPredictions, exactCount, totalPoints, accuracy, groupCount)
 * - useGlobalLeaderboard → currentUserEntry.position
 *
 * Layout: green gradient header → 3×2 stat grid → logout card.
 *
 * IMPORTANT — NativeWind v4 first-frame fix:
 * ALL visual properties use StyleSheet to guarantee rendering on the first
 * frame. No NativeWind className props on any element.
 */

import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import {
  GroupIcon,
  PointsIcon,
  PredictionIcon,
  TrophyIcon,
} from '@/components/brand/icons';
import { NotificationBell } from '@/components/ui/notification-bell';
import { ScreenHeader } from '@/components/ui/screen-header';
import { useLogout } from '@/hooks/use-auth';
import { useDashboard } from '@/hooks/use-dashboard';
import { useGlobalLeaderboard } from '@/hooks/use-leaderboard';
import { useAuthStore } from '@/stores/auth-store';
import { COLORS } from '@/theme/colors';

/* -------------------------------------------------------------------------- */
/*  StatCard — single metric card                                             */
/* -------------------------------------------------------------------------- */

interface StatCardProps {
  icon: React.ReactNode;
  value: string;
  label: string;
}

function StatCard({ icon, value, label }: StatCardProps) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statIconContainer}>{icon}</View>
      <Text style={styles.statValue} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.statLabel} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*  LoadingSkeleton — shown while data is fetching                            */
/* -------------------------------------------------------------------------- */

function LoadingSkeleton() {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={COLORS.primary.DEFAULT} />
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*  ProfileScreen                                                             */
/* -------------------------------------------------------------------------- */

const STAT_ICON_SIZE = 22;
const STAT_ICON_COLOR = COLORS.primary.DEFAULT;

export default function ProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const logoutMutation = useLogout();
  const { data: dashboardData, isLoading: dashLoading } = useDashboard();
  const { currentUserEntry, isLoading: lbLoading } = useGlobalLeaderboard();

  const displayName = user?.displayName ?? 'Usuario';
  const initial = displayName.charAt(0).toUpperCase();
  const username = user?.username ?? '';
  const email = user?.email ?? '';

  const isLoading = dashLoading || lbLoading;

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
                router.replace('/(auth)/login');
              },
            }),
        },
      ],
    );
  }

  // Derive stat values with fallbacks
  const stats = dashboardData?.stats;
  const position = currentUserEntry?.position;

  const statCards: StatCardProps[] = [
    {
      icon: <PredictionIcon size={STAT_ICON_SIZE} color={STAT_ICON_COLOR} />,
      value: String(stats?.totalPredictions ?? 0),
      label: 'Pronósticos',
    },
    {
      icon: <PredictionIcon size={STAT_ICON_SIZE} color={STAT_ICON_COLOR} />,
      value: String(stats?.exactCount ?? 0),
      label: 'Exactos',
    },
    {
      icon: <PointsIcon size={STAT_ICON_SIZE} color={STAT_ICON_COLOR} />,
      value: String(stats?.totalPoints ?? 0),
      label: 'Puntos',
    },
    {
      icon: <PredictionIcon size={STAT_ICON_SIZE} color={STAT_ICON_COLOR} />,
      value: `${stats?.accuracy ?? 0}%`,
      label: 'Aciertos',
    },
    {
      icon: <TrophyIcon size={STAT_ICON_SIZE} color={STAT_ICON_COLOR} />,
      value: position ? `#${position}` : '–',
      label: 'Ranking',
    },
    {
      icon: <GroupIcon size={STAT_ICON_SIZE} color={STAT_ICON_COLOR} />,
      value: String(stats?.groupCount ?? 0),
      label: 'Grupos',
    },
  ];

  return (
    <View style={styles.root}>
      {/* Green header with user identity */}
      <ScreenHeader title="" gradient>
        <View style={styles.userInfoRow}>
          {/* Avatar circle */}
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>

          {/* Name, username, email */}
          <View style={styles.userText}>
            <Text style={styles.displayName} numberOfLines={1}>
              {displayName}
            </Text>
            <Text style={styles.username} numberOfLines={1}>
              @{username}
            </Text>
            <Text style={styles.email} numberOfLines={1}>
              {email}
            </Text>
          </View>

          {/* Notification bell aligned with user info */}
          <NotificationBell />
        </View>
      </ScreenHeader>

      {/* Scrollable content below header */}
      {isLoading ? (
        <LoadingSkeleton />
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Stats section */}
          <Text style={styles.sectionTitle}>Mis Estadísticas</Text>

          <View style={styles.statsGrid}>
            {statCards.map((card) => (
              <StatCard
                key={card.label}
                icon={card.icon}
                value={card.value}
                label={card.label}
              />
            ))}
          </View>

          {/* Spacer pushes logout to bottom */}
          <View style={styles.spacer} />

          {/* Logout button */}
          <Pressable
            onPress={handleLogout}
            style={styles.logoutButton}
          >
            <Text style={styles.logoutText}>
              {logoutMutation.isPending
                ? 'Cerrando sesión...'
                : 'Cerrar sesión'}
            </Text>
          </Pressable>
        </ScrollView>
      )}
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*  Styles                                                                    */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  /* ── Header children ─────────────────────────────────────────────────── */

  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  userText: {
    flex: 1,
    marginLeft: 12,
  },
  displayName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  username: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  email: {
    fontSize: 13,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 1,
  },

  /* ── Loading ─────────────────────────────────────────────────────────── */

  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ── Scroll content ──────────────────────────────────────────────────── */

  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 32,
  },

  /* ── Stats section ───────────────────────────────────────────────────── */

  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: '48%' as unknown as number, // RN accepts string percentages at runtime
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  statIconContainer: {
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 2,
  },

  /* ── Spacer ───────────────────────────────────────────────────────────── */

  spacer: {
    flex: 1,
  },

  /* ── Logout ──────────────────────────────────────────────────────────── */

  logoutButton: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#DC2626',
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginTop: 24,
    marginBottom: 24,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#DC2626',
  },
});
