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
import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Users } from 'lucide-react-native';

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

/** Value used when no group filter is applied. */
const ALL_GROUPS = 'Todos' as const;

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
      <ChevronLeft size={18} color="rgba(255, 255, 255, 0.8)" strokeWidth={2.5} />
      <Text style={styles.backText}>Volver</Text>
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
function MisGruposSection({ tournamentId, tournamentSlug }: { tournamentId: string; tournamentSlug: string }) {
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
            onPress={() => router.push({
              pathname: '/(tabs)/tournaments/tournament-group/[slug]',
              params: { slug: tournamentSlug, groupId: group.id },
            })}
          >
            <View style={styles.misGruposCardIcon}>
              <Users size={16} color={COLORS.primary.DEFAULT} strokeWidth={2.5} />
            </View>
            <Text style={styles.misGruposCardName}>
              {group.name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

// ─── Tab content components ─────────────────────────────────────────────────

/**
 * Renders the "Próximos" tab content.
 * Fetches LIVE + SCHEDULED matches for this tournament, grouped by date.
 * LIVE matches are returned first by the API, so they appear at the top.
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
  } = useMatches({ tournamentId, status: 'LIVE,SCHEDULED' });

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
          <MatchCard match={item} showPhaseInfo showPrediction={false} />
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
  const [selectedGroupName, setSelectedGroupName] = useState<string>(ALL_GROUPS);

  // Fetch ALL group-stage matches (no groupName filter) so we can derive the chip list
  const {
    data: allGroupMatches,
    isLoading,
    refetch,
    isRefetching,
  } = useMatches({
    tournamentId,
    phase: 'GROUP_STAGE',
  });

  // Derive unique group names from match data
  const groupNames = useMemo(
    () => [...new Set((allGroupMatches ?? []).map((m) => m.groupName).filter(Boolean))].sort() as string[],
    [allGroupMatches],
  );

  // Client-side filter: if a group is selected, filter the already-fetched matches
  const filteredMatches = useMemo(() => {
    if (selectedGroupName === ALL_GROUPS) return allGroupMatches ?? [];
    return (allGroupMatches ?? []).filter((m) => m.groupName === selectedGroupName);
  }, [allGroupMatches, selectedGroupName]);

  const sections = useMemo(
    () => groupMatchesByDate(filteredMatches),
    [filteredMatches],
  );

  const handleRefresh = useCallback(() => {
    onRefresh();
    refetch();
  }, [onRefresh, refetch]);

  /** Extract a short display label from the full group name (e.g. "Group A" → "A"). */
  const chipLabel = (name: string): string => {
    const parts = name.split(' ');
    return parts.length > 1 ? parts[parts.length - 1] : name;
  };

  return (
    <View style={styles.fill}>
      {/* Group sub-filter bar */}
      <View style={styles.subFilterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.subFilterScroll}
        >
          <FilterChip
            key={ALL_GROUPS}
            label={ALL_GROUPS}
            isActive={selectedGroupName === ALL_GROUPS}
            onPress={() => setSelectedGroupName(ALL_GROUPS)}
          />
          {groupNames.map((name) => (
            <FilterChip
              key={name}
              label={chipLabel(name)}
              isActive={selectedGroupName === name}
              onPress={() => setSelectedGroupName(name)}
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
              selectedGroupName === ALL_GROUPS
                ? 'No hay partidos en la fase de grupos.'
                : `No hay partidos en ${selectedGroupName}.`
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
              <MatchCard match={item} showPhaseInfo showPrediction={false} />
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
          <MatchCard match={item} showPhaseInfo={false} showPrediction={false} />
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
          <MatchCard match={item} showPhaseInfo showPrediction={false} />
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
        <ScreenHeader title="Torneo" gradient rightAction={<BackButton />} />

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
      <ScreenHeader
        title={tournament.name}
        subtitle={typeLabel}
        gradient
        titleStyle={styles.headerTitle}
        subtitleStyle={styles.headerSubtitle}
        rightAction={<BackButton />}
        titleProps={{
          numberOfLines: 1,
          adjustsFontSizeToFit: true,
          minimumFontScale: 0.7,
        }}
      />

      {/* Mis Grupos — user's groups playing this tournament */}
      <MisGruposSection tournamentId={tournament.id} tournamentSlug={tournament.slug} />

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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
  },

  // ── Header text overrides (normal case, larger title) ─────────────────
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    textTransform: 'none' as const,
    flexShrink: 1,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    textTransform: 'none' as const,
    color: 'rgba(255, 255, 255, 0.6)',
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
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  misGruposCardIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary.light,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  misGruposCardName: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text.primary,
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
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: 'transparent',
  },
  tabButtonActive: {
    backgroundColor: COLORS.primary.DEFAULT,
    borderColor: COLORS.primary.DEFAULT,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  tabButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
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
    borderRadius: 20,
  },
  filterChipActive: {
    borderWidth: 1,
    borderColor: COLORS.primary.DEFAULT,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  filterChipTextActive: {
    color: COLORS.primary.DEFAULT,
    fontWeight: '600',
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
