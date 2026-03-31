/**
 * Tournament detail screen — the main screen of the Tournaments module.
 *
 * Structure:
 * 1. ScreenHeader with gradient (tournament name + type label)
 * 2. Horizontal scrollable tab bar built from tournament phases
 * 3. Content area that changes based on selected tab:
 *    - Próximos: all SCHEDULED matches grouped by date
 *    - Grupos: group-stage matches with A–L sub-filter
 *    - Knockout tabs: matches for that phase grouped by date
 *    - 3°/Final: combined THIRD_PLACE + FINAL tab
 *
 * IMPORTANT — NativeWind v4 first-frame fix:
 * ALL visual properties use StyleSheet. Never mix style + className on
 * the same element.
 */

import { useCallback, useMemo, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';

import type { MatchDto, MatchPhase, TournamentPhaseDto } from '@pichichi/shared';

import { TrophyIcon } from '@/components/brand/icons';
import { MatchCard } from '@/components/matches/match-card';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Button } from '@/components/ui/button';
import { useMatches } from '@/hooks/use-matches';
import { useMyGroupsByTournament } from '@/hooks/use-groups';
import { useTournament } from '@/hooks/use-tournaments';
import {
  groupMatchesByDate,
  PHASE_LABELS,
  TOURNAMENT_TYPE_LABELS,
} from '@/utils/match-helpers';
import type { MatchSection } from '@/utils/match-helpers';
import { useAuthStore } from '@/stores/auth-store';
import { COLORS } from '@/theme/colors';

// ─── Constants ──────────────────────────────────────────────────────────────

/** Tab labels for phases shown in the tab bar. */
const TAB_PHASE_LABELS: Record<string, string> = {
  GROUP_STAGE: 'Grupos',
  ROUND_OF_32: 'R32',
  ROUND_OF_16: '8vos',
  QUARTER_FINAL: '4tos',
  SEMI_FINAL: 'Semis',
};

/** Group sub-filter options. */
const GROUP_LETTERS = [
  'Todos', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L',
] as const;

/**
 * Phases that are combined into a single "3°/Final" tab.
 * Each has only 1 match so they make sense together.
 */
const COMBINED_PHASES: MatchPhase[] = ['THIRD_PLACE', 'FINAL'];
const COMBINED_TAB_LABEL = '3°/Final';

/** The "Próximos" virtual tab — always first. */
const PROXIMOS_TAB_KEY = '__PROXIMOS__';

// ─── Types ──────────────────────────────────────────────────────────────────

interface TabDefinition {
  key: string;
  label: string;
  /** Phase values this tab covers (empty for the "Próximos" virtual tab). */
  phases: MatchPhase[];
}

// ─── Tab builder ────────────────────────────────────────────────────────────

/**
 * Builds the tab array from the tournament's phases, sorted by sortOrder.
 *
 * - "Próximos" is always first.
 * - THIRD_PLACE + FINAL are merged into a single "3°/Final" tab.
 * - Other phases map 1:1 to tabs.
 */
function buildTabs(phases: TournamentPhaseDto[]): TabDefinition[] {
  const sorted = [...phases].sort((a, b) => a.sortOrder - b.sortOrder);

  const tabs: TabDefinition[] = [
    { key: PROXIMOS_TAB_KEY, label: 'Próximos', phases: [] },
  ];

  let combinedAdded = false;

  for (const p of sorted) {
    if (COMBINED_PHASES.includes(p.phase as MatchPhase)) {
      // Only add the combined tab once, when we first encounter either phase
      if (!combinedAdded) {
        combinedAdded = true;
        tabs.push({
          key: 'COMBINED_FINALS',
          label: COMBINED_TAB_LABEL,
          phases: [...COMBINED_PHASES],
        });
      }
      continue;
    }

    tabs.push({
      key: p.phase,
      label: TAB_PHASE_LABELS[p.phase] ?? PHASE_LABELS[p.phase] ?? p.phase,
      phases: [p.phase as MatchPhase],
    });
  }

  return tabs;
}

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

/** Single tab button in the phase tab bar. */
function TabButton({
  label,
  isActive,
  onPress,
}: {
  label: string;
  isActive: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.tabButton, isActive && styles.tabButtonActive]}
    >
      <Text style={[styles.tabButtonText, isActive && styles.tabButtonTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

/** Single filter chip in the group sub-filter bar. */
function FilterChip({
  label,
  isActive,
  onPress,
}: {
  label: string;
  isActive: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.filterChip, isActive && styles.filterChipActive]}
    >
      <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

/** "Mis Grupos" horizontal section — shows the user's groups playing this tournament. */
function MisGruposSection({ tournamentId }: { tournamentId: string }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { data: groups, isLoading } = useMyGroupsByTournament(tournamentId);

  // Don't render anything if not authenticated, still loading, or no groups
  if (!isAuthenticated || isLoading || !groups?.length) {
    return null;
  }

  return (
    <View style={styles.misGruposContainer}>
      <Text style={styles.misGruposTitle}>Mis Grupos</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.misGruposScroll}
      >
        {groups.map((group) => (
          <Pressable
            key={group.id}
            style={styles.misGruposCard}
            onPress={() => router.push(`/(tabs)/tournaments/group/${group.id}`)}
          >
            <View style={styles.misGruposCardIcon}>
              <Ionicons name="people" size={18} color={COLORS.primary.DEFAULT} />
            </View>
            <View style={styles.misGruposCardContent}>
              <Text style={styles.misGruposCardName} numberOfLines={1}>
                {group.name}
              </Text>
              <Text style={styles.misGruposCardMembers}>
                {group.memberCount} {group.memberCount === 1 ? 'miembro' : 'miembros'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={COLORS.text.muted} />
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

// ─── Tab content components ─────────────────────────────────────────────────

/**
 * Renders the "Próximos" tab content.
 * Fetches all SCHEDULED matches for this tournament, grouped by date.
 */
function ProximosContent({
  tournamentId,
  onRefresh,
  isRefreshing,
}: {
  tournamentId: string;
  onRefresh: () => void;
  isRefreshing: boolean;
}) {
  const {
    data: matches,
    isLoading,
    refetch,
    isRefetching,
  } = useMatches({ tournamentId, status: 'SCHEDULED' });

  const sections = useMemo(
    () => groupMatchesByDate(matches ?? []),
    [matches],
  );

  const handleRefresh = useCallback(() => {
    onRefresh();
    refetch();
  }, [onRefresh, refetch]);

  if (isLoading) {
    return (
      <View style={styles.contentLoading}>
        <Text style={styles.contentLoadingText}>Cargando partidos...</Text>
      </View>
    );
  }

  if (sections.length === 0) {
    return (
      <ScrollView
        style={styles.fill}
        contentContainerStyle={styles.fill}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing || isRefetching}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary.DEFAULT}
            colors={[COLORS.primary.DEFAULT]}
          />
        }
      >
        <EmptyState
          icon={<TrophyIcon size={40} color={COLORS.primary.DEFAULT} />}
          title="No hay partidos próximos"
          description="Los próximos partidos aparecerán acá cuando estén programados."
        />
      </ScrollView>
    );
  }

  return (
    <SectionList<MatchDto, MatchSection>
      sections={sections}
      keyExtractor={(item) => item.id}
      renderSectionHeader={({ section }) => (
        <Text style={styles.sectionHeader}>{section.title}</Text>
      )}
      renderItem={({ item }) => (
        <View style={styles.matchCardWrapper}>
          <MatchCard match={item} showPhaseInfo />
        </View>
      )}
      contentContainerStyle={styles.listContent}
      stickySectionHeadersEnabled={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing || isRefetching}
          onRefresh={handleRefresh}
          tintColor={COLORS.primary.DEFAULT}
          colors={[COLORS.primary.DEFAULT]}
        />
      }
    />
  );
}

/**
 * Renders the "Grupos" tab content with an A–L sub-filter bar.
 */
function GruposContent({
  tournamentId,
  onRefresh,
  isRefreshing,
}: {
  tournamentId: string;
  onRefresh: () => void;
  isRefreshing: boolean;
}) {
  const [selectedGroup, setSelectedGroup] = useState<string>('Todos');

  const {
    data: matches,
    isLoading,
    refetch,
    isRefetching,
  } = useMatches({
    tournamentId,
    phase: 'GROUP_STAGE',
    groupLetter: selectedGroup === 'Todos' ? undefined : selectedGroup,
  });

  const sections = useMemo(
    () => groupMatchesByDate(matches ?? []),
    [matches],
  );

  const handleRefresh = useCallback(() => {
    onRefresh();
    refetch();
  }, [onRefresh, refetch]);

  return (
    <View style={styles.fill}>
      {/* Group sub-filter bar */}
      <View style={styles.subFilterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.subFilterScroll}
        >
          {GROUP_LETTERS.map((letter) => (
            <FilterChip
              key={letter}
              label={letter}
              isActive={selectedGroup === letter}
              onPress={() => setSelectedGroup(letter)}
            />
          ))}
        </ScrollView>
      </View>

      {isLoading ? (
        <View style={styles.contentLoading}>
          <Text style={styles.contentLoadingText}>Cargando partidos...</Text>
        </View>
      ) : sections.length === 0 ? (
        <ScrollView
          style={styles.fill}
          contentContainerStyle={styles.fill}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing || isRefetching}
              onRefresh={handleRefresh}
              tintColor={COLORS.primary.DEFAULT}
              colors={[COLORS.primary.DEFAULT]}
            />
          }
        >
          <EmptyState
            icon={<TrophyIcon size={40} color={COLORS.primary.DEFAULT} />}
            title="No hay partidos"
            description={
              selectedGroup === 'Todos'
                ? 'No hay partidos en la fase de grupos.'
                : `No hay partidos en el Grupo ${selectedGroup}.`
            }
          />
        </ScrollView>
      ) : (
        <SectionList<MatchDto, MatchSection>
          sections={sections}
          keyExtractor={(item) => item.id}
          renderSectionHeader={({ section }) => (
            <Text style={styles.sectionHeader}>{section.title}</Text>
          )}
          renderItem={({ item }) => (
            <View style={styles.matchCardWrapper}>
              <MatchCard match={item} showPhaseInfo />
            </View>
          )}
          contentContainerStyle={styles.listContent}
          stickySectionHeadersEnabled={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing || isRefetching}
              onRefresh={handleRefresh}
              tintColor={COLORS.primary.DEFAULT}
              colors={[COLORS.primary.DEFAULT]}
            />
          }
        />
      )}
    </View>
  );
}

/**
 * Renders a knockout phase tab content (R32, R16, QF, SF).
 * Fetches matches for a single phase.
 */
function KnockoutContent({
  tournamentId,
  phase,
  onRefresh,
  isRefreshing,
}: {
  tournamentId: string;
  phase: MatchPhase;
  onRefresh: () => void;
  isRefreshing: boolean;
}) {
  const {
    data: matches,
    isLoading,
    refetch,
    isRefetching,
  } = useMatches({ tournamentId, phase });

  const sections = useMemo(
    () => groupMatchesByDate(matches ?? []),
    [matches],
  );

  const handleRefresh = useCallback(() => {
    onRefresh();
    refetch();
  }, [onRefresh, refetch]);

  const phaseLabel = PHASE_LABELS[phase] ?? phase;

  if (isLoading) {
    return (
      <View style={styles.contentLoading}>
        <Text style={styles.contentLoadingText}>Cargando partidos...</Text>
      </View>
    );
  }

  if (sections.length === 0) {
    return (
      <ScrollView
        style={styles.fill}
        contentContainerStyle={styles.fill}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing || isRefetching}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary.DEFAULT}
            colors={[COLORS.primary.DEFAULT]}
          />
        }
      >
        <EmptyState
          icon={<TrophyIcon size={40} color={COLORS.primary.DEFAULT} />}
          title={`No hay partidos de ${phaseLabel}`}
          description="Los partidos aparecerán cuando se definan los cruces."
        />
      </ScrollView>
    );
  }

  return (
    <SectionList<MatchDto, MatchSection>
      sections={sections}
      keyExtractor={(item) => item.id}
      renderSectionHeader={({ section }) => (
        <Text style={styles.sectionHeader}>{section.title}</Text>
      )}
      renderItem={({ item }) => (
        <View style={styles.matchCardWrapper}>
          <MatchCard match={item} showPhaseInfo={false} />
        </View>
      )}
      contentContainerStyle={styles.listContent}
      stickySectionHeadersEnabled={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing || isRefetching}
          onRefresh={handleRefresh}
          tintColor={COLORS.primary.DEFAULT}
          colors={[COLORS.primary.DEFAULT]}
        />
      }
    />
  );
}

/**
 * Renders the combined "3°/Final" tab.
 * Fetches THIRD_PLACE and FINAL matches separately and merges them.
 */
function CombinedFinalsContent({
  tournamentId,
  onRefresh,
  isRefreshing,
}: {
  tournamentId: string;
  onRefresh: () => void;
  isRefreshing: boolean;
}) {
  const {
    data: thirdPlaceMatches,
    isLoading: isLoadingThird,
    refetch: refetchThird,
    isRefetching: isRefetchingThird,
  } = useMatches({ tournamentId, phase: 'THIRD_PLACE' });

  const {
    data: finalMatches,
    isLoading: isLoadingFinal,
    refetch: refetchFinal,
    isRefetching: isRefetchingFinal,
  } = useMatches({ tournamentId, phase: 'FINAL' });

  const isLoading = isLoadingThird || isLoadingFinal;
  const isContentRefetching = isRefetchingThird || isRefetchingFinal;

  const sections = useMemo(() => {
    const all = [
      ...(thirdPlaceMatches ?? []),
      ...(finalMatches ?? []),
    ];
    return groupMatchesByDate(all);
  }, [thirdPlaceMatches, finalMatches]);

  const handleRefresh = useCallback(() => {
    onRefresh();
    refetchThird();
    refetchFinal();
  }, [onRefresh, refetchThird, refetchFinal]);

  if (isLoading) {
    return (
      <View style={styles.contentLoading}>
        <Text style={styles.contentLoadingText}>Cargando partidos...</Text>
      </View>
    );
  }

  if (sections.length === 0) {
    return (
      <ScrollView
        style={styles.fill}
        contentContainerStyle={styles.fill}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing || isContentRefetching}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary.DEFAULT}
            colors={[COLORS.primary.DEFAULT]}
          />
        }
      >
        <EmptyState
          icon={<TrophyIcon size={40} color={COLORS.primary.DEFAULT} />}
          title="No hay partidos de 3° Puesto / Final"
          description="Los partidos aparecerán cuando se definan los cruces."
        />
      </ScrollView>
    );
  }

  return (
    <SectionList<MatchDto, MatchSection>
      sections={sections}
      keyExtractor={(item) => item.id}
      renderSectionHeader={({ section }) => (
        <Text style={styles.sectionHeader}>{section.title}</Text>
      )}
      renderItem={({ item }) => (
        <View style={styles.matchCardWrapper}>
          <MatchCard match={item} showPhaseInfo />
        </View>
      )}
      contentContainerStyle={styles.listContent}
      stickySectionHeadersEnabled={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing || isContentRefetching}
          onRefresh={handleRefresh}
          tintColor={COLORS.primary.DEFAULT}
          colors={[COLORS.primary.DEFAULT]}
        />
      }
    />
  );
}

// ─── Screen ─────────────────────────────────────────────────────────────────

export default function TournamentDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const {
    data: tournament,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useTournament(slug!);

  const [selectedTab, setSelectedTab] = useState(0);

  // ── Build tabs from tournament phases ──────────────────────────────────

  const tabs = useMemo(() => {
    if (!tournament?.phases?.length) return [];
    return buildTabs(tournament.phases);
  }, [tournament?.phases]);

  const activeTab = tabs[selectedTab] ?? tabs[0];

  // ── Tournament type label ─────────────────────────────────────────────

  const typeLabel = tournament
    ? (TOURNAMENT_TYPE_LABELS[tournament.type] ?? tournament.type)
    : '';

  // ── Refresh handler ───────────────────────────────────────────────────

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  // ── Loading state ─────────────────────────────────────────────────────

  if (isLoading) {
    return <LoadingScreen />;
  }

  // ── Error state ───────────────────────────────────────────────────────

  if (error || !tournament) {
    return (
      <View style={styles.screen}>
        <ScreenHeader title="Torneo" gradient>
          <BackButton />
        </ScreenHeader>

        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            No se pudo cargar el torneo.
          </Text>
          <Button title="Volver" variant="outline" onPress={() => router.back()} />
        </View>
      </View>
    );
  }

  // ── Loaded state ──────────────────────────────────────────────────────

  return (
    <View style={styles.screen}>
      {/* Header */}
      <ScreenHeader title={tournament.name} subtitle={typeLabel} gradient>
        <BackButton />
      </ScreenHeader>

      {/* Mis Grupos — user's groups playing this tournament */}
      <MisGruposSection tournamentId={tournament.id} />

      {/* Tab bar */}
      {tabs.length > 0 ? (
        <View style={styles.tabBarContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabBarScroll}
          >
            {tabs.map((tab, index) => (
              <TabButton
                key={tab.key}
                label={tab.label}
                isActive={selectedTab === index}
                onPress={() => setSelectedTab(index)}
              />
            ))}
          </ScrollView>
        </View>
      ) : null}

      {/* Tab content */}
      <View style={styles.fill}>
        {activeTab ? (
          <TabContent
            tab={activeTab}
            tournamentId={tournament.id}
            onRefresh={onRefresh}
            isRefreshing={isRefetching}
          />
        ) : null}
      </View>
    </View>
  );
}

// ─── Tab content router ─────────────────────────────────────────────────────

/**
 * Routes to the correct content component based on the active tab definition.
 */
function TabContent({
  tab,
  tournamentId,
  onRefresh,
  isRefreshing,
}: {
  tab: TabDefinition;
  tournamentId: string;
  onRefresh: () => void;
  isRefreshing: boolean;
}) {
  // Próximos (virtual tab — all scheduled matches)
  if (tab.key === PROXIMOS_TAB_KEY) {
    return (
      <ProximosContent
        tournamentId={tournamentId}
        onRefresh={onRefresh}
        isRefreshing={isRefreshing}
      />
    );
  }

  // Grupos (GROUP_STAGE with sub-filter)
  if (tab.phases.length === 1 && tab.phases[0] === 'GROUP_STAGE') {
    return (
      <GruposContent
        tournamentId={tournamentId}
        onRefresh={onRefresh}
        isRefreshing={isRefreshing}
      />
    );
  }

  // Combined 3°/Final
  if (tab.key === 'COMBINED_FINALS') {
    return (
      <CombinedFinalsContent
        tournamentId={tournamentId}
        onRefresh={onRefresh}
        isRefreshing={isRefreshing}
      />
    );
  }

  // Single knockout phase
  if (tab.phases.length === 1) {
    return (
      <KnockoutContent
        tournamentId={tournamentId}
        phase={tab.phases[0]}
        onRefresh={onRefresh}
        isRefreshing={isRefreshing}
      />
    );
  }

  return null;
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

  // ── Mis Grupos section ────────────────────────────────────────────────
  misGruposContainer: {
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingTop: 12,
    paddingBottom: 12,
  },
  misGruposTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text.primary,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  misGruposScroll: {
    paddingHorizontal: 16,
    gap: 10,
  },
  misGruposCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary.light,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minWidth: 160,
    maxWidth: 220,
  },
  misGruposCardIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  misGruposCardContent: {
    flex: 1,
    marginRight: 4,
  },
  misGruposCardName: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  misGruposCardMembers: {
    fontSize: 11,
    color: COLORS.text.secondary,
    marginTop: 1,
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
    paddingVertical: 8,
  },
  tabBarScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tabButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 9999,
  },
  tabButtonActive: {
    backgroundColor: COLORS.primary.DEFAULT,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.secondary,
  },
  tabButtonTextActive: {
    color: '#FFFFFF',
  },

  // ── Group sub-filter ──────────────────────────────────────────────────
  subFilterContainer: {
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingVertical: 6,
  },
  subFilterScroll: {
    paddingHorizontal: 16,
    gap: 6,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary.light,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text.muted,
  },
  filterChipTextActive: {
    color: COLORS.primary.DEFAULT,
  },

  // ── Section headers ───────────────────────────────────────────────────
  sectionHeader: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text.primary,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },

  // ── Match card wrapper ────────────────────────────────────────────────
  matchCardWrapper: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },

  // ── List content ──────────────────────────────────────────────────────
  listContent: {
    paddingBottom: 32,
  },

  // ── Content loading ───────────────────────────────────────────────────
  contentLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentLoadingText: {
    fontSize: 14,
    color: COLORS.text.muted,
  },
});
