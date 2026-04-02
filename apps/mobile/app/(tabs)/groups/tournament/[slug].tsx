/**
 * Group tournament screen — the main prediction experience.
 *
 * Structure:
 * 1. ScreenHeader with gradient (tournament name + back button)
 * 2. Four-tab bar: Pronósticos / Resultados / Bonus / Ranking
 * 3. Pronósticos tab: LIVE matches at top (locked, "En vivo 🔴"), then SCHEDULED non-locked (soonest first)
 * 4. Resultados tab: FINISHED matches only (most recent first)
 * 5. Bonus tab: BonusSection (full-tab view)
 * 6. Ranking tab: LeaderboardList
 *
 * Data flow:
 *   groupId ← search params (passed from groups/[id].tsx)
 *   slug ← route params → useTournament(slug) → tournamentId
 *   tournamentId → useMatches, usePredictions, useBonusPredictions, useLeaderboard
 *
 * IMPORTANT — NativeWind v4 first-frame fix:
 * ALL visual properties use StyleSheet. Never mix style + className on
 * the same element.
 */

import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import type { MatchDto, PredictionDto, TournamentBonusTypeDto } from '@pichichi/shared';

import { Ionicons } from '@expo/vector-icons';

import { TrophyIcon } from '@/components/brand/icons';
import { LeaderboardList } from '@/components/leaderboard/leaderboard-list';
import { BonusSection } from '@/components/predictions/bonus-section';
import { PredictionMatchCard } from '@/components/predictions/prediction-match-card';
import { ScorePredictionModal } from '@/components/predictions/score-prediction-modal';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { useBonusPredictions } from '@/hooks/use-bonus-predictions';
import { useGroup } from '@/hooks/use-groups';
import { useLeaderboard } from '@/hooks/use-leaderboard';
import { useMatches } from '@/hooks/use-matches';
import { usePredictions } from '@/hooks/use-predictions';
import { useTournament } from '@/hooks/use-tournaments';
import { useAuthStore } from '@/stores/auth-store';
import { COLORS } from '@/theme/colors';
import {
  groupMatchesByDate,
  groupMatchesByDateDesc,
  isMatchLocked,
  TOURNAMENT_TYPE_LABELS,
} from '@/utils/match-helpers';
import type { MatchSection } from '@/utils/match-helpers';

// ─── Types ──────────────────────────────────────────────────────────────────

type Tab = 'pronosticos' | 'resultados' | 'bonus' | 'ranking';

interface TabDefinition {
  key: Tab;
  label: string;
  iconName: keyof typeof Ionicons.glyphMap;
  iconNameOutline: keyof typeof Ionicons.glyphMap;
}

const TABS: TabDefinition[] = [
  { key: 'pronosticos', label: 'Pronósticos', iconName: 'football', iconNameOutline: 'football-outline' },
  { key: 'resultados', label: 'Resultados', iconName: 'checkmark-circle', iconNameOutline: 'checkmark-circle-outline' },
  { key: 'bonus', label: 'Bonus', iconName: 'star', iconNameOutline: 'star-outline' },
  { key: 'ranking', label: 'Ranking', iconName: 'podium', iconNameOutline: 'podium-outline' },
];

// ─── Sub-components ─────────────────────────────────────────────────────────

/** Back button rendered inside ScreenHeader (gradient area). */
function BackButton() {
  return (
    <Pressable
      onPress={() => router.back()}
      style={styles.backButton}
    >
      <Text style={styles.backText}>{'\u2190'} Volver</Text>
    </Pressable>
  );
}

/** Single tab button in the tab bar — icon only, no text. */
function TabButton({
  tab,
  isActive,
  onPress,
}: {
  tab: TabDefinition;
  isActive: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.tabButton, isActive && styles.tabButtonActive]}
      accessibilityLabel={tab.label}
      accessibilityRole="tab"
    >
      <Ionicons
        name={isActive ? tab.iconName : tab.iconNameOutline}
        size={20}
        color={isActive ? '#FFFFFF' : COLORS.text.secondary}
      />
    </Pressable>
  );
}

// ─── Bonus lock logic ───────────────────────────────────────────────────────

/**
 * Determines if bonus predictions should be locked.
 * Locked when the first tournament match has already kicked off.
 */
function areBonusesLocked(matches: MatchDto[]): boolean {
  if (matches.length === 0) return false;

  // Find earliest match by scheduledAt
  const earliest = matches.reduce((min, m) =>
    new Date(m.scheduledAt).getTime() < new Date(min.scheduledAt).getTime() ? m : min,
  );

  return (
    earliest.status !== 'SCHEDULED' ||
    Date.now() > new Date(earliest.scheduledAt).getTime()
  );
}

// ─── Match filtering ────────────────────────────────────────────────────────

/** Matches that can still be predicted: SCHEDULED and not locked. */
function getPredictableMatches(matches: MatchDto[]): MatchDto[] {
  return matches.filter((m) => m.status === 'SCHEDULED' && !isMatchLocked(m));
}

/** Live matches — shown locked at the top of Pronósticos tab. */
function getLiveMatches(matches: MatchDto[]): MatchDto[] {
  return matches.filter((m) => m.status === 'LIVE');
}

/** Matches that are finished (for the Resultados tab). */
function getFinishedMatches(matches: MatchDto[]): MatchDto[] {
  return matches.filter((m) => m.status === 'FINISHED');
}

// ─── Main Screen ────────────────────────────────────────────────────────────

export default function GroupTournamentScreen() {
  const { slug, groupId } = useLocalSearchParams<{
    slug: string;
    groupId: string;
  }>();

  const [activeTab, setActiveTab] = useState<Tab>('pronosticos');
  const [selectedMatch, setSelectedMatch] = useState<MatchDto | null>(null);

  // ── Auth ──────────────────────────────────────────────────────────────
  const currentUserId = useAuthStore((s) => s.user?.id) ?? '';

  // ── Group data (for header subtitle) ──────────────────────────────────
  const { data: group } = useGroup(groupId!);

  // ── Tournament data ───────────────────────────────────────────────────
  const {
    data: tournament,
    isLoading: isLoadingTournament,
    error: tournamentError,
    refetch: refetchTournament,
    isRefetching: isRefetchingTournament,
  } = useTournament(slug!);

  const tournamentId = tournament?.id ?? '';

  // ── Matches ───────────────────────────────────────────────────────────
  const {
    data: matches,
    isLoading: isLoadingMatches,
    refetch: refetchMatches,
    isRefetching: isRefetchingMatches,
  } = useMatches({ tournamentId: tournamentId || undefined });

  // ── Predictions (group-scoped) ────────────────────────────────────────
  const {
    data: predictions,
    isLoading: isLoadingPredictions,
    refetch: refetchPredictions,
    isRefetching: isRefetchingPredictions,
  } = usePredictions(groupId!);

  // ── Bonus Predictions (group-scoped) ──────────────────────────────────
  const {
    data: bonusPredictions,
    isLoading: isLoadingBonus,
    refetch: refetchBonus,
    isRefetching: isRefetchingBonus,
  } = useBonusPredictions(groupId!, tournamentId);

  // ── Leaderboard (group-scoped) ────────────────────────────────────────
  const {
    data: leaderboard,
    isLoading: isLoadingLeaderboard,
    refetch: refetchLeaderboard,
    isRefetching: isRefetchingLeaderboard,
  } = useLeaderboard(groupId!);

  // ── Derived data ──────────────────────────────────────────────────────

  const predictableMatches = useMemo(
    () => getPredictableMatches(matches ?? []),
    [matches],
  );

  const liveMatches = useMemo(
    () => getLiveMatches(matches ?? []),
    [matches],
  );

  const finishedMatches = useMemo(
    () => getFinishedMatches(matches ?? []),
    [matches],
  );

  const predictableSections = useMemo(
    () => groupMatchesByDate(predictableMatches),
    [predictableMatches],
  );

  // Pronósticos: live matches as special section at the top, then predictable by date asc
  const pronosticosSections = useMemo(() => {
    const sections: MatchSection[] = [];

    if (liveMatches.length > 0) {
      sections.push({
        title: 'En vivo \uD83D\uDD34',
        dateKey: '__LIVE__',
        data: liveMatches,
      });
    }

    sections.push(...predictableSections);

    return sections;
  }, [liveMatches, predictableSections]);

  // Results: only finished matches, grouped by date descending
  const resultsSections = useMemo(
    () => groupMatchesByDateDesc(finishedMatches),
    [finishedMatches],
  );

  // Build a lookup: matchId → prediction for O(1) matching
  const predictionsByMatchId = useMemo(() => {
    const map = new Map<string, PredictionDto>();
    for (const p of predictions ?? []) {
      map.set(p.matchId, p);
    }
    return map;
  }, [predictions]);

  const bonusLocked = useMemo(
    () => areBonusesLocked(matches ?? []),
    [matches],
  );

  // BonusTypes from tournament (TournamentBonusTypeDto is compatible with BonusTypeDto)
  const bonusTypes = (tournament?.bonusTypes ?? []) as TournamentBonusTypeDto[];

  const typeLabel = tournament
    ? (TOURNAMENT_TYPE_LABELS[tournament.type] ?? tournament.type)
    : '';

  const headerSubtitle = [typeLabel, group?.name].filter(Boolean).join(' · ');

  // ── Refresh handlers ──────────────────────────────────────────────────

  const isMatchDataRefreshing =
    isRefetchingTournament || isRefetchingMatches || isRefetchingPredictions;

  const onRefreshMatchData = useCallback(() => {
    refetchTournament();
    refetchMatches();
    refetchPredictions();
  }, [refetchTournament, refetchMatches, refetchPredictions]);

  const onRefreshBonus = useCallback(() => {
    refetchTournament();
    refetchBonus();
  }, [refetchTournament, refetchBonus]);

  const onRefreshRanking = useCallback(() => {
    refetchLeaderboard();
  }, [refetchLeaderboard]);

  // ── Modal handlers ────────────────────────────────────────────────────

  const handlePredictMatch = useCallback((match: MatchDto) => {
    setSelectedMatch(match);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedMatch(null);
  }, []);

  // ── Loading state ─────────────────────────────────────────────────────

  if (isLoadingTournament) {
    return <LoadingScreen />;
  }

  // ── Error state ───────────────────────────────────────────────────────

  if (tournamentError || !tournament || !groupId) {
    return (
      <View style={styles.screen}>
        <ScreenHeader title="Torneo" gradient>
          <BackButton />
        </ScreenHeader>

        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            {!groupId
              ? 'No se pudo determinar el grupo. Volvé e intentá de nuevo.'
              : 'No se pudo cargar el torneo.'}
          </Text>
          <Button title="Volver" variant="outline" onPress={() => router.back()} />
        </View>
      </View>
    );
  }

  // ── Loaded state ──────────────────────────────────────────────────────

  const isLoadingMatchData = isLoadingMatches || isLoadingPredictions;

  // Find the prediction for the selected match (for modal pre-fill)
  const selectedMatchPrediction = selectedMatch
    ? predictionsByMatchId.get(selectedMatch.id) ?? null
    : null;

  return (
    <View style={styles.screen}>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <ScreenHeader title={tournament.name} subtitle={headerSubtitle} gradient>
        <BackButton />
      </ScreenHeader>

      {/* ── Tab bar ─────────────────────────────────────────────────────── */}
      <View style={styles.tabBarContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabBarScroll}
        >
          {TABS.map((tab) => (
            <TabButton
              key={tab.key}
              tab={tab}
              isActive={activeTab === tab.key}
              onPress={() => setActiveTab(tab.key)}
            />
          ))}
        </ScrollView>
      </View>

      {/* ── Tab content ─────────────────────────────────────────────────── */}
      <View style={styles.fill}>
        {activeTab === 'pronosticos' ? (
          <PronosticosTab
            matchSections={pronosticosSections}
            predictionsByMatchId={predictionsByMatchId}
            groupId={groupId}
            isLoading={isLoadingMatchData}
            isRefreshing={isMatchDataRefreshing}
            onRefresh={onRefreshMatchData}
            onPredictMatch={handlePredictMatch}
          />
        ) : activeTab === 'resultados' ? (
          <ResultadosTab
            matchSections={resultsSections}
            predictionsByMatchId={predictionsByMatchId}
            groupId={groupId}
            isLoading={isLoadingMatchData}
            isRefreshing={isMatchDataRefreshing}
            onRefresh={onRefreshMatchData}
          />
        ) : activeTab === 'bonus' ? (
          <BonusTab
            bonusTypes={bonusTypes}
            bonusPredictions={bonusPredictions ?? []}
            bonusLocked={bonusLocked}
            groupId={groupId}
            tournamentId={tournamentId}
            isLoading={isLoadingBonus}
            isRefreshing={isRefetchingBonus}
            onRefresh={onRefreshBonus}
          />
        ) : (
          <RankingTab
            entries={leaderboard?.entries ?? []}
            currentUserId={currentUserId}
            isLoading={isLoadingLeaderboard}
            isRefreshing={isRefetchingLeaderboard}
            onRefresh={onRefreshRanking}
          />
        )}
      </View>

      {/* ── Score prediction modal ──────────────────────────────────────── */}
      <ScorePredictionModal
        visible={selectedMatch != null}
        match={selectedMatch}
        prediction={selectedMatchPrediction}
        groupId={groupId}
        onClose={handleCloseModal}
      />
    </View>
  );
}

// ─── Pronósticos Tab ────────────────────────────────────────────────────────

function PronosticosTab({
  matchSections,
  predictionsByMatchId,
  groupId,
  isLoading,
  isRefreshing,
  onRefresh,
  onPredictMatch,
}: {
  matchSections: MatchSection[];
  predictionsByMatchId: Map<string, PredictionDto>;
  groupId: string;
  isLoading: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
  onPredictMatch: (match: MatchDto) => void;
}) {
  if (isLoading) {
    return (
      <ScrollView
        style={styles.fill}
        contentContainerStyle={styles.contentLoading}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary.DEFAULT}
            colors={[COLORS.primary.DEFAULT]}
          />
        }
      >
        <ActivityIndicator size="large" color={COLORS.primary.DEFAULT} />
        <Text style={styles.contentLoadingText}>Cargando pronósticos...</Text>
      </ScrollView>
    );
  }

  if (matchSections.length === 0) {
    return (
      <ScrollView
        style={styles.fill}
        contentContainerStyle={styles.fill}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary.DEFAULT}
            colors={[COLORS.primary.DEFAULT]}
          />
        }
      >
        <EmptyState
          icon={<TrophyIcon size={40} color={COLORS.primary.DEFAULT} />}
          title="No hay partidos pendientes"
          description="No hay partidos pendientes de pronóstico."
        />
      </ScrollView>
    );
  }

  return (
    <SectionList<MatchDto, MatchSection>
      sections={matchSections}
      keyExtractor={(item) => item.id}
      renderSectionHeader={({ section }) => (
        <Text style={styles.sectionHeader}>{section.title}</Text>
      )}
      renderItem={({ item }) => (
        <View style={styles.matchCardWrapper}>
          <PredictionMatchCard
            match={item}
            prediction={predictionsByMatchId.get(item.id)}
            onPredict={onPredictMatch}
            groupId={groupId}
          />
        </View>
      )}
      contentContainerStyle={styles.listContent}
      stickySectionHeadersEnabled={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          tintColor={COLORS.primary.DEFAULT}
          colors={[COLORS.primary.DEFAULT]}
        />
      }
    />
  );
}

// ─── Resultados Tab ─────────────────────────────────────────────────────────

function ResultadosTab({
  matchSections,
  predictionsByMatchId,
  groupId,
  isLoading,
  isRefreshing,
  onRefresh,
}: {
  matchSections: MatchSection[];
  predictionsByMatchId: Map<string, PredictionDto>;
  groupId: string;
  isLoading: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
}) {
  if (isLoading) {
    return (
      <ScrollView
        style={styles.fill}
        contentContainerStyle={styles.contentLoading}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary.DEFAULT}
            colors={[COLORS.primary.DEFAULT]}
          />
        }
      >
        <ActivityIndicator size="large" color={COLORS.primary.DEFAULT} />
        <Text style={styles.contentLoadingText}>Cargando resultados...</Text>
      </ScrollView>
    );
  }

  if (matchSections.length === 0) {
    return (
      <ScrollView
        style={styles.fill}
        contentContainerStyle={styles.fill}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary.DEFAULT}
            colors={[COLORS.primary.DEFAULT]}
          />
        }
      >
        <EmptyState
          icon={<TrophyIcon size={40} color={COLORS.primary.DEFAULT} />}
          title="Aún no hay resultados"
          description="Los resultados aparecerán acá cuando finalicen los partidos."
        />
      </ScrollView>
    );
  }

  return (
    <SectionList<MatchDto, MatchSection>
      sections={matchSections}
      keyExtractor={(item) => item.id}
      renderSectionHeader={({ section }) => (
        <Text style={styles.sectionHeader}>{section.title}</Text>
      )}
      renderItem={({ item }) => (
        <View style={styles.matchCardWrapper}>
          <PredictionMatchCard
            match={item}
            prediction={predictionsByMatchId.get(item.id)}
            onPredict={() => {}} // Not tappable — locked/finished
            groupId={groupId}
          />
        </View>
      )}
      contentContainerStyle={styles.listContent}
      stickySectionHeadersEnabled={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          tintColor={COLORS.primary.DEFAULT}
          colors={[COLORS.primary.DEFAULT]}
        />
      }
    />
  );
}

// ─── Bonus Tab ──────────────────────────────────────────────────────────────

function BonusTab({
  bonusTypes,
  bonusPredictions,
  bonusLocked,
  groupId,
  tournamentId,
  isLoading,
  isRefreshing,
  onRefresh,
}: {
  bonusTypes: TournamentBonusTypeDto[];
  bonusPredictions: import('@pichichi/shared').BonusPredictionDto[];
  bonusLocked: boolean;
  groupId: string;
  tournamentId: string;
  isLoading: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
}) {
  if (isLoading) {
    return (
      <ScrollView
        style={styles.fill}
        contentContainerStyle={styles.contentLoading}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary.DEFAULT}
            colors={[COLORS.primary.DEFAULT]}
          />
        }
      >
        <ActivityIndicator size="large" color={COLORS.primary.DEFAULT} />
        <Text style={styles.contentLoadingText}>Cargando bonus...</Text>
      </ScrollView>
    );
  }

  if (bonusTypes.length === 0) {
    return (
      <ScrollView
        style={styles.fill}
        contentContainerStyle={styles.fill}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary.DEFAULT}
            colors={[COLORS.primary.DEFAULT]}
          />
        }
      >
        <EmptyState
          icon={<TrophyIcon size={40} color={COLORS.primary.DEFAULT} />}
          title="Sin bonus disponibles"
          description="Este torneo no tiene pronósticos bonus."
        />
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.fill}
      contentContainerStyle={styles.bonusTabContent}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          tintColor={COLORS.primary.DEFAULT}
          colors={[COLORS.primary.DEFAULT]}
        />
      }
    >
      <BonusSection
        bonusTypes={bonusTypes}
        bonusPredictions={bonusPredictions}
        isLocked={bonusLocked}
        groupId={groupId}
        tournamentId={tournamentId}
      />
    </ScrollView>
  );
}

// ─── Ranking Tab ────────────────────────────────────────────────────────────

function RankingTab({
  entries,
  currentUserId,
  isLoading,
  isRefreshing,
  onRefresh,
}: {
  entries: import('@pichichi/shared').LeaderboardEntryDto[];
  currentUserId: string;
  isLoading: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
}) {
  if (isLoading) {
    return (
      <ScrollView
        style={styles.fill}
        contentContainerStyle={styles.contentLoading}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary.DEFAULT}
            colors={[COLORS.primary.DEFAULT]}
          />
        }
      >
        <ActivityIndicator size="large" color={COLORS.primary.DEFAULT} />
        <Text style={styles.contentLoadingText}>Cargando ranking...</Text>
      </ScrollView>
    );
  }

  return (
    <LeaderboardList
      entries={entries}
      currentUserId={currentUserId}
      refreshing={isRefreshing}
      onRefresh={onRefresh}
    />
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // ── Screen shell ──────────────────────────────────────────────────────
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  fill: {
    flex: 1,
  },

  // ── Back button ───────────────────────────────────────────────────────
  backButton: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  backText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
  },

  // ── Error state ───────────────────────────────────────────────────────
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  errorText: {
    marginBottom: 16,
    textAlign: 'center',
    fontSize: 16,
    color: COLORS.text.secondary,
  },

  // ── Tab bar ───────────────────────────────────────────────────────────
  tabBarContainer: {
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingVertical: 6,
  },
  tabBarScroll: {
    paddingHorizontal: 12,
    gap: 8,
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 36,
    borderRadius: 12,
  },
  tabButtonActive: {
    backgroundColor: COLORS.primary.DEFAULT,
  },

  // ── Content ───────────────────────────────────────────────────────────
  sectionHeader: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text.primary,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  matchCardWrapper: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  listContent: {
    paddingBottom: 32,
  },
  bonusTabContent: {
    padding: 20,
    paddingBottom: 32,
  },

  // ── Loading ───────────────────────────────────────────────────────────
  contentLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  contentLoadingText: {
    fontSize: 14,
    color: COLORS.text.muted,
  },
});
