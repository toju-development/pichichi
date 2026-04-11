/**
 * Tournaments list screen — shows all available tournaments.
 *
 * States: loading, empty (with CTA), error (with retry), populated list.
 * Each card navigates to the tournament detail screen on press.
 *
 * IMPORTANT — NativeWind v4 ghost-card fix:
 * TournamentCard uses StyleSheet for ALL visual properties (color, font,
 * padding, bg) to guarantee first-frame rendering. NativeWind className is
 * NOT used anywhere — all styles are in StyleSheet.create().
 *
 * Card accent bar uses INSET positioning (left:8) to avoid the
 * border clipping issue with overflow:hidden + borderRadius.
 */

import { useCallback } from 'react';
import {
  Image,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import type { TournamentDto, TournamentStatus, TournamentType } from '@pichichi/shared';
import { Calendar, ChevronRight, Shield } from 'lucide-react-native';

import { TrophyIcon } from '@/components/brand/icons';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { NotificationBell } from '@/components/ui/notification-bell';
import { ScreenHeader } from '@/components/ui/screen-header';
import { useUnreadCount } from '@/hooks/use-notifications';
import { useTournaments } from '@/hooks/use-tournaments';
import { COLORS } from '@/theme/colors';

// ─── Constants ───────────────────────────────────────────────────────────────

const GREEN = '#0B6E4F';
const GREEN_BG = '#E8F5EE';

// ─── Label maps ──────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<TournamentStatus, string> = {
  UPCOMING: 'Próximamente',
  IN_PROGRESS: 'En curso',
  FINISHED: 'Finalizado',
  DRAFT: 'Borrador',
  CANCELLED: 'Cancelado',
};

const TYPE_LABELS: Record<TournamentType, string> = {
  WORLD_CUP: 'Copa del Mundo',
  COPA_AMERICA: 'Copa América',
  EURO: 'Eurocopa',
  CHAMPIONS_LEAGUE: 'Champions League',
  COPA_LIBERTADORES: 'Copa Libertadores',
  CUSTOM: 'Personalizado',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const SHORT_MONTHS = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
];

/** Formats a date range like "25 Ene - 8 Nov 2026". */
function formatDateRange(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const startDay = start.getUTCDate();
  const startMonth = SHORT_MONTHS[start.getUTCMonth()];
  const endDay = end.getUTCDate();
  const endMonth = SHORT_MONTHS[end.getUTCMonth()];
  const endYear = end.getUTCFullYear();

  return `${startDay} ${startMonth} - ${endDay} ${endMonth} ${endYear}`;
}

/** Get status pill styling. */
function getStatusStyle(status: TournamentStatus) {
  if (status === 'IN_PROGRESS') {
    return { color: '#16A34A', bg: '#DCFCE7' };
  }
  // UPCOMING, DRAFT, FINISHED, CANCELLED → gray
  return { color: '#6B7280', bg: '#F3F4F6' };
}

// ─── Tournament Card ─────────────────────────────────────────────────────────

function TournamentCard({ tournament }: { tournament: TournamentDto }) {
  const statusLabel = STATUS_LABELS[tournament.status] ?? 'Próximamente';
  const typeLabel = TYPE_LABELS[tournament.type] ?? tournament.type;
  const dateRange = formatDateRange(tournament.startDate, tournament.endDate);
  const teamCount = tournament.teamCount;

  const statusStyle = getStatusStyle(tournament.status);

  return (
    <View style={cardStyles.cardWrapper}>
      {/* Visual card container — bg, border, shadow, borderRadius */}
      <View style={cardStyles.cardSurface}>
        {/* Accent bar — inset left to avoid overflow:hidden clipping */}
        <View style={[cardStyles.accentBar, { backgroundColor: GREEN }]} />

        {/* Pressable inside only handles opacity feedback */}
        <Pressable
          onPress={() => router.push(`/(tabs)/tournaments/${tournament.slug}`)}
          style={({ pressed }) => pressed ? cardStyles.pressed : undefined}
        >
          <View style={cardStyles.body}>
            {/* Row 1: Logo/Icon + Name + Chevron */}
            <View style={cardStyles.topRow}>
              <View style={cardStyles.topRowLeft}>
                {/* Icon circle with optional logo overlay */}
                <View style={[cardStyles.iconCircle, { backgroundColor: GREEN_BG }]}>
                  <TrophyIcon size={16} color={GREEN} />
                  {tournament.logoUrl ? (
                    <Image
                      source={{ uri: tournament.logoUrl }}
                      style={cardStyles.logoImage}
                    />
                  ) : null}
                </View>
                <Text style={cardStyles.name} numberOfLines={1}>
                  {tournament.name}
                </Text>
              </View>
              <ChevronRight size={18} color="#9CA3AF" />
            </View>

            {/* Row 2: Type pill + Status pill */}
            <View style={cardStyles.pillRow}>
              <View style={[cardStyles.pill, { backgroundColor: GREEN_BG }]}>
                <Text style={[cardStyles.pillText, { color: GREEN }]}>
                  {typeLabel}
                </Text>
              </View>
              <View style={[cardStyles.pill, { backgroundColor: statusStyle.bg }]}>
                <Text style={[cardStyles.pillText, { color: statusStyle.color }]}>
                  {statusLabel}
                </Text>
              </View>
            </View>

            {/* Row 3: Date range + Team count */}
            <View style={cardStyles.metaRow}>
              <View style={cardStyles.metaItem}>
                <Calendar size={13} color="#9CA3AF" />
                <Text style={cardStyles.metaText}>{dateRange}</Text>
              </View>
              {teamCount != null ? (
                <View style={cardStyles.metaItem}>
                  <Shield size={13} color="#9CA3AF" />
                  <Text style={cardStyles.metaText}>
                    {teamCount} {teamCount === 1 ? 'equipo' : 'equipos'}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const cardStyles = StyleSheet.create({
  cardWrapper: {
    marginBottom: 12,
  },
  cardSurface: {
    position: 'relative',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
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
  accentBar: {
    position: 'absolute',
    left: 8,
    top: 14,
    bottom: 14,
    width: 4,
    borderRadius: 2,
  },
  pressed: {
    opacity: 0.7,
  },
  body: {
    paddingTop: 14,
    paddingRight: 16,
    paddingBottom: 14,
    paddingLeft: 20,
    gap: 8,
  },

  // Row 1: top
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topRowLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginRight: 8,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  logoImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  name: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
  },

  // Row 2: pills
  pillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pill: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '600',
  },

  // Row 3: meta
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    color: '#6B7280',
  },
});

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function TournamentsScreen() {
  const { data: tournaments, isLoading, error, refetch, isRefetching } = useTournaments();
  const { refetch: refetchUnreadCount } = useUnreadCount();

  const hasTournaments = tournaments && tournaments.length > 0;

  const onRefresh = useCallback(() => {
    console.log('[Notifications] 🔄 Refetching unread count');
    refetch();
    refetchUnreadCount();
  }, [refetch, refetchUnreadCount]);

  // ── Loading state ─────────────────────────────────────────────────────────

  if (isLoading) {
    return <LoadingScreen />;
  }

  // ── Loaded state ──────────────────────────────────────────────────────────

  return (
    <View style={screenStyles.root}>
      <ScreenHeader
        title="Torneos"
        subtitle="Competiciones disponibles"
        gradient
        rightAction={<NotificationBell />}
      />

      {error ? (
        /* Error state */
        <ScrollView
          style={screenStyles.fill}
          contentContainerStyle={screenStyles.fill}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={onRefresh}
              tintColor={COLORS.primary.DEFAULT}
              colors={[COLORS.primary.DEFAULT]}
            />
          }
        >
          <EmptyState
            icon={<Text style={screenStyles.errorIcon}>⚠</Text>}
            title="Error al cargar torneos"
            description="No se pudieron cargar los torneos. Deslizá hacia abajo para reintentar."
            action={{
              label: 'Reintentar',
              onPress: () => refetch(),
            }}
          />
        </ScrollView>
      ) : hasTournaments ? (
        /* Tournament list */
        <ScrollView
          style={screenStyles.fill}
          contentContainerStyle={screenStyles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={onRefresh}
              tintColor={COLORS.primary.DEFAULT}
              colors={[COLORS.primary.DEFAULT]}
            />
          }
        >
          {tournaments.map((tournament) => (
            <TournamentCard key={tournament.id} tournament={tournament} />
          ))}
        </ScrollView>
      ) : (
        /* Empty state */
        <ScrollView
          style={screenStyles.fill}
          contentContainerStyle={screenStyles.fill}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={onRefresh}
              tintColor={COLORS.primary.DEFAULT}
              colors={[COLORS.primary.DEFAULT]}
            />
          }
        >
          <EmptyState
            icon={<TrophyIcon size={40} color={COLORS.primary.DEFAULT} />}
            title="No hay torneos disponibles"
            description="Los torneos aparecerán acá cuando estén disponibles. ¡Volvé pronto!"
          />
        </ScrollView>
      )}
    </View>
  );
}

const screenStyles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F0FAF4',
  },
  fill: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
  },
  errorIcon: {
    fontSize: 32,
  },
});
