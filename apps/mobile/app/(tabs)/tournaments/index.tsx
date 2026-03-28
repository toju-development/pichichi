/**
 * Tournaments list screen — shows all available tournaments.
 *
 * States: loading, empty (with CTA), error (with retry), populated list.
 * Each card navigates to the tournament detail screen on press.
 *
 * IMPORTANT — NativeWind v4 ghost-card fix:
 * TournamentCard uses StyleSheet for ALL visual properties (color, font,
 * padding, bg) to guarantee first-frame rendering. NativeWind className is
 * only used for external spacing wrappers (e.g. mb-3).
 */

import { useCallback } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import type { TournamentDto, TournamentStatus, TournamentType } from '@pichichi/shared';

import { TrophyIcon } from '@/components/brand/icons';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { useTournaments } from '@/hooks/use-tournaments';
import { COLORS } from '@/theme/colors';

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
  CUSTOM: 'Personalizado',
};

// ─── Date formatting ─────────────────────────────────────────────────────────

const SHORT_MONTHS = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
];

/** Formats a date range like "11 Jun - 19 Jul 2026". */
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

// ─── Tournament Card ─────────────────────────────────────────────────────────

function TournamentCard({ tournament }: { tournament: TournamentDto }) {
  const statusLabel = STATUS_LABELS[tournament.status] ?? tournament.status;
  const typeLabel = TYPE_LABELS[tournament.type] ?? tournament.type;
  const dateRange = formatDateRange(tournament.startDate, tournament.endDate);
  const teamCount = tournament.teamCount;

  return (
    <Card
      accent
      onPress={() => router.push(`/(tabs)/tournaments/${tournament.slug}`)}
      className="mb-3"
    >
      <View style={cardStyles.content}>
        {/* Title row: icon + name */}
        <View style={cardStyles.titleRow}>
          <TrophyIcon size={20} color={COLORS.primary.DEFAULT} />
          <Text style={cardStyles.name}>{tournament.name}</Text>
        </View>

        {/* Type · Status */}
        <View style={cardStyles.metaRow}>
          <Text style={cardStyles.typeLabel}>{typeLabel}</Text>
          <Text style={cardStyles.separator}>·</Text>
          <Text style={cardStyles.statusLabel}>{statusLabel}</Text>
        </View>

        {/* Date range · Team count */}
        <View style={cardStyles.bottomRow}>
          <Text style={cardStyles.dateText}>{dateRange}</Text>
          {teamCount != null ? (
            <>
              <Text style={cardStyles.separator}>·</Text>
              <Text style={cardStyles.teamCount}>
                {teamCount} {teamCount === 1 ? 'equipo' : 'equipos'}
              </Text>
            </>
          ) : null}
        </View>
      </View>
    </Card>
  );
}

const cardStyles = StyleSheet.create({
  content: {
    paddingLeft: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  metaRow: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  typeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary.DEFAULT,
  },
  separator: {
    fontSize: 12,
    color: COLORS.text.muted,
  },
  statusLabel: {
    fontSize: 12,
    color: COLORS.text.muted,
  },
  bottomRow: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 12,
    color: COLORS.text.secondary,
  },
  teamCount: {
    fontSize: 12,
    color: COLORS.text.secondary,
  },
});

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function TournamentsScreen() {
  const { data: tournaments, isLoading, error, refetch, isRefetching } = useTournaments();

  const hasTournaments = tournaments && tournaments.length > 0;

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

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
    backgroundColor: COLORS.background,
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
