/**
 * Member Predictions Screen — shows a specific member's prediction history
 * within a group, grouped by tournament using SectionList.
 *
 * IMPORTANT — NativeWind v4 ghost-card fix:
 * ALL visual properties use StyleSheet.create(). Never mix `style` + `className`.
 */

import { ActivityIndicator, Image, SectionList, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { router } from 'expo-router';

import type { MemberPredictionItemDto, PredictionPointType } from '@pichichi/shared';

import { ScreenHeader } from '@/components/ui/screen-header';
import { useMemberPredictions } from '@/hooks/use-predictions';
import { COLORS } from '@/theme/colors';

// ─── Point-type display config (reused from group-predictions-sheet) ────────

interface PointTypeConfig {
  label: string;
  color: string;
  bgColor: string;
}

const POINT_TYPE_CONFIG: Record<PredictionPointType, PointTypeConfig> = {
  EXACT: { label: 'Exacto', color: COLORS.success, bgColor: '#ECFDF5' },
  GOAL_DIFF: { label: 'Gol Dif', color: COLORS.primary.DEFAULT, bgColor: COLORS.primary.light },
  WINNER: { label: 'Ganador', color: COLORS.warning, bgColor: '#FFFBEB' },
  MISS: { label: 'Errado', color: COLORS.text.muted, bgColor: '#F3F4F6' },
};

// ─── Types ──────────────────────────────────────────────────────────────────

interface TournamentSection {
  tournamentId: string;
  tournamentName: string;
  tournamentLogoUrl: string | null;
  data: MemberPredictionItemDto[];
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function groupByTournament(predictions: MemberPredictionItemDto[]): TournamentSection[] {
  const map = new Map<string, TournamentSection>();

  for (const p of predictions) {
    let section = map.get(p.tournamentId);
    if (!section) {
      section = {
        tournamentId: p.tournamentId,
        tournamentName: p.tournamentName,
        tournamentLogoUrl: p.tournamentLogoUrl,
        data: [],
      };
      map.set(p.tournamentId, section);
    }
    section.data.push(p);
  }

  return Array.from(map.values());
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function PredictionRow({ item }: { item: MemberPredictionItemDto }) {
  const pointConfig = item.pointType ? POINT_TYPE_CONFIG[item.pointType] : null;
  const isFinished = item.match.status === 'FINISHED';
  const isLive = item.match.status === 'LIVE';

  return (
    <View style={[s.predictionCard, isLive && s.predictionCardLive]}>
      {/* LIVE indicator */}
      {isLive ? (
        <View style={s.liveRow}>
          <View style={s.liveDot} />
          <Text style={s.liveLabel}>EN VIVO</Text>
        </View>
      ) : null}

      {/* Teams + Scores */}
      <View style={s.matchRow}>
        {/* Home team */}
        <View style={s.teamSide}>
          {item.match.homeTeamFlagUrl ? (
            <Image source={{ uri: item.match.homeTeamFlagUrl }} style={s.teamFlag} />
          ) : (
            <View style={s.teamFlagPlaceholder} />
          )}
          <Text style={s.teamName} numberOfLines={1}>
            {item.match.homeTeamShortName ?? item.match.homeTeamName ?? '?'}
          </Text>
        </View>

        {/* Actual score */}
        <View style={s.scoreBlock}>
          <Text style={s.scoreText}>
            {item.match.homeScore ?? '-'} - {item.match.awayScore ?? '-'}
          </Text>
        </View>

        {/* Away team */}
        <View style={[s.teamSide, s.teamSideAway]}>
          {item.match.awayTeamFlagUrl ? (
            <Image source={{ uri: item.match.awayTeamFlagUrl }} style={s.teamFlag} />
          ) : (
            <View style={s.teamFlagPlaceholder} />
          )}
          <Text style={s.teamName} numberOfLines={1}>
            {item.match.awayTeamShortName ?? item.match.awayTeamName ?? '?'}
          </Text>
        </View>
      </View>

      {/* User prediction + Points badge */}
      <View style={s.predictionRow}>
        <Text style={s.predictionLabel}>Pronóstico:</Text>
        <Text style={s.predictionScore}>
          {item.predictedHome} - {item.predictedAway}
        </Text>

        {isLive ? (
          <View style={[s.pointBadge, { backgroundColor: '#ECFDF5' }]}>
            <View style={s.liveDotSmall} />
            <Text style={[s.pointLabel, { color: COLORS.success }]}>
              En vivo
            </Text>
          </View>
        ) : isFinished && pointConfig ? (
          <View style={[s.pointBadge, { backgroundColor: pointConfig.bgColor }]}>
            <Text style={[s.pointLabel, { color: pointConfig.color }]}>
              {pointConfig.label}
            </Text>
            <Text style={[s.pointValue, { color: pointConfig.color }]}>
              +{item.pointsEarned}
            </Text>
          </View>
        ) : isFinished ? (
          <View style={[s.pointBadge, { backgroundColor: '#F3F4F6' }]}>
            <Text style={[s.pointLabel, { color: COLORS.text.muted }]}>
              —
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

function SectionHeader({ section }: { section: TournamentSection }) {
  return (
    <View style={s.sectionHeader}>
      {section.tournamentLogoUrl ? (
        <Image source={{ uri: section.tournamentLogoUrl }} style={s.sectionLogo} />
      ) : null}
      <Text style={s.sectionTitle}>{section.tournamentName}</Text>
    </View>
  );
}

// ─── Main Screen ────────────────────────────────────────────────────────────

export default function MemberPredictionsScreen() {
  const { groupId, userId, displayName } = useLocalSearchParams<{
    groupId: string;
    userId: string;
    displayName: string;
  }>();

  const { data, isLoading } = useMemberPredictions(groupId!, userId!);

  const sections = data ? groupByTournament(data.predictions) : [];

  return (
    <View style={s.screen}>
      <ScreenHeader
        title={displayName ?? data?.displayName ?? 'Predicciones'}
        gradient
        onBack={() => router.back()}
      />

      {isLoading ? (
        <View style={s.centered}>
          <ActivityIndicator size="large" color={COLORS.primary.DEFAULT} />
          <Text style={s.loadingText}>Cargando predicciones...</Text>
        </View>
      ) : !data || data.predictions.length === 0 ? (
        <View style={s.centered}>
          <Text style={s.emptyTitle}>Sin predicciones</Text>
          <Text style={s.emptyDescription}>
            Este miembro aún no tiene predicciones en partidos finalizados o en vivo.
          </Text>
        </View>
      ) : (
        <>
          {/* Points header */}
          <View style={s.pointsHeader}>
            <View style={s.avatarCircle}>
              <Text style={s.avatarInitial}>
                {(data.displayName ?? '?').charAt(0).toUpperCase()}
              </Text>
              {data.avatarUrl ? (
                <Image source={{ uri: data.avatarUrl }} style={s.avatarImage} />
              ) : null}
            </View>
            <View style={s.pointsInfo}>
              <Text style={s.pointsName}>{data.displayName}</Text>
              <Text style={s.pointsTotal}>{data.totalPoints} pts</Text>
            </View>
          </View>

          <SectionList
            sections={sections}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <PredictionRow item={item} />}
            renderSectionHeader={({ section }) => <SectionHeader section={section as TournamentSection} />}
            contentContainerStyle={s.listContent}
            stickySectionHeadersEnabled={false}
          />
        </>
      )}
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // ── Centered states ────────────────────────────────────────────────────
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.text.muted,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text.primary,
    textAlign: 'center',
  },
  emptyDescription: {
    marginTop: 8,
    fontSize: 14,
    color: COLORS.text.secondary,
    textAlign: 'center',
    maxWidth: 280,
  },

  // ── Points header ──────────────────────────────────────────────────────
  pointsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
    gap: 14,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarInitial: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.surface,
  },
  avatarImage: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  pointsInfo: {
    flex: 1,
    gap: 2,
  },
  pointsName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  pointsTotal: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.primary.DEFAULT,
  },

  // ── Section header ─────────────────────────────────────────────────────
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
  },
  sectionLogo: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text.primary,
  },

  // ── List ───────────────────────────────────────────────────────────────
  listContent: {
    paddingBottom: 32,
  },

  // ── Prediction card ────────────────────────────────────────────────────
  predictionCard: {
    marginHorizontal: 20,
    marginTop: 8,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 8,
  },
  predictionCardLive: {
    borderWidth: 1.5,
    borderColor: COLORS.success,
  },

  // ── Live indicator ─────────────────────────────────────────────────────
  liveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.success,
  },
  liveLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.success,
    letterSpacing: 0.5,
  },
  liveDotSmall: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.success,
  },

  // ── Match row ──────────────────────────────────────────────────────────
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  teamSide: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
  },
  teamSideAway: {
    flexDirection: 'row-reverse',
    justifyContent: 'flex-end',
  },
  teamFlag: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  teamFlagPlaceholder: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.primary.light,
  },
  teamName: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text.primary,
    flexShrink: 1,
  },
  scoreBlock: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: COLORS.primary.light,
  },
  scoreText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primary.DEFAULT,
    letterSpacing: 0.5,
  },

  // ── Prediction row ─────────────────────────────────────────────────────
  predictionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  predictionLabel: {
    fontSize: 12,
    color: COLORS.text.muted,
  },
  predictionScore: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text.primary,
  },

  // ── Points badge ───────────────────────────────────────────────────────
  pointBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginLeft: 'auto',
  },
  pointLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  pointValue: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
