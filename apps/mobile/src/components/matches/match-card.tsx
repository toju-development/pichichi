/**
 * Card displaying a single football match.
 *
 * Core visual building block of the Tournaments module. Renders team names,
 * scores, date/time, venue, phase info, and prediction status depending on
 * the match state (SCHEDULED, LIVE, FINISHED, POSTPONED, CANCELLED).
 *
 * IMPORTANT — NativeWind v4 ghost-card fix:
 * ALL visual properties live in StyleSheet so they are applied on the FIRST
 * frame. The outer `Card` component handles shadow/press; this component
 * only provides styled content. Never mix `style` and `className` on the
 * same element.
 */

import { StyleSheet, Text, View } from 'react-native';

import type { MatchDto, MatchTeamDto } from '@pichichi/shared';

import { Card } from '@/components/ui/card';
import { COLORS } from '@/theme/colors';

// ─── Phase labels (Spanish) ─────────────────────────────────────────────────

const PHASE_LABELS: Record<string, string> = {
  GROUP_STAGE: 'Fase de Grupos',
  ROUND_OF_32: '32avos',
  ROUND_OF_16: 'Octavos',
  QUARTER_FINAL: 'Cuartos',
  SEMI_FINAL: 'Semifinal',
  THIRD_PLACE: '3er Puesto',
  FINAL: 'Final',
};

// ─── Status labels (Spanish) ────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  POSTPONED: 'Aplazado',
  CANCELLED: 'Cancelado',
};

// ─── Day / month names for Spanish date formatting ──────────────────────────

const DAY_ABBR = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'] as const;
const MONTH_ABBR = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
] as const;

/** Formats an ISO date string into "Mié 11 Jun · 16:00". */
function formatMatchDate(iso: string): string {
  const d = new Date(iso);
  const day = DAY_ABBR[d.getDay()];
  const date = d.getDate();
  const month = MONTH_ABBR[d.getMonth()];
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${day} ${date} ${month} \u00B7 ${hours}:${minutes}`;
}

// ─── Props ──────────────────────────────────────────────────────────────────

interface MatchCardProps {
  match: MatchDto;
  /** Whether the current user has already predicted this match. */
  hasPrediction?: boolean;
  /** Show the phase/group badge line at the top. */
  showPhaseInfo?: boolean;
  /** Optional custom content to render in the bottom-right area (replaces default prediction indicator). */
  bottomRight?: React.ReactNode;
  /** Optional content rendered centered below the match info (e.g. prediction badge). */
  footer?: React.ReactNode;
  /** Called when the user taps the card (to open prediction entry). */
  onPress?: () => void;
  /** NativeWind classes for external spacing (e.g. mb-3). */
  className?: string;
}

// ─── Sub-components ─────────────────────────────────────────────────────────

/** Team avatar — colored circle with the short name initial. */
function TeamAvatar({ team }: { team: MatchTeamDto }) {
  return (
    <View style={styles.avatar}>
      <Text style={styles.avatarText}>
        {team.shortName.charAt(0).toUpperCase()}
      </Text>
    </View>
  );
}

/** One side of the match (home or away). */
function TeamSide({
  team,
  placeholder,
  reverse,
}: {
  team: MatchTeamDto | null;
  placeholder: string | null;
  /** If true, renders avatar on the right (away side). */
  reverse?: boolean;
}) {
  if (!team) {
    return (
      <View style={[styles.teamSide, reverse && styles.teamSideReverse]}>
        <Text style={styles.placeholderName} numberOfLines={1}>
          {placeholder ?? 'TBD'}
        </Text>
      </View>
    );
  }

  const avatar = <TeamAvatar team={team} />;
  const name = (
    <Text style={styles.teamName} numberOfLines={1}>
      {team.name}
    </Text>
  );

  return (
    <View style={[styles.teamSide, reverse && styles.teamSideReverse]}>
      {reverse ? (
        <>
          {name}
          <View style={styles.avatarSpacer}>{avatar}</View>
        </>
      ) : (
        <>
          <View style={styles.avatarSpacer}>{avatar}</View>
          {name}
        </>
      )}
    </View>
  );
}

/** Score display for LIVE / FINISHED matches. */
function ScoreBlock({
  homeScore,
  awayScore,
  isExtraTime,
  homeScorePenalties,
  awayScorePenalties,
}: {
  homeScore: number;
  awayScore: number;
  isExtraTime: boolean;
  homeScorePenalties: number | null;
  awayScorePenalties: number | null;
}) {
  const hasPenalties =
    homeScorePenalties != null && awayScorePenalties != null;

  return (
    <View style={styles.scoreBlock}>
      <View style={styles.scoreRow}>
        <Text style={styles.scoreText}>{homeScore}</Text>
        <Text style={styles.scoreDash}>-</Text>
        <Text style={styles.scoreText}>{awayScore}</Text>
      </View>

      {isExtraTime && !hasPenalties ? (
        <Text style={styles.extraTimeLabel}>(ET)</Text>
      ) : null}

      {hasPenalties ? (
        <Text style={styles.penaltyLabel}>
          ({homeScorePenalties} - {awayScorePenalties} pen.)
        </Text>
      ) : null}
    </View>
  );
}

/** Pulsing green dot for LIVE status. */
function LiveBadge() {
  return (
    <View style={styles.liveBadgeRow}>
      <View style={styles.liveDot} />
      <Text style={styles.liveText}>EN VIVO</Text>
    </View>
  );
}

/** Status badge for POSTPONED / CANCELLED. */
function StatusBadge({ status }: { status: string }) {
  return (
    <View style={styles.statusBadge}>
      <Text style={styles.statusBadgeText}>
        {STATUS_LABELS[status] ?? status}
      </Text>
    </View>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function MatchCard({
  match,
  hasPrediction = false,
  showPhaseInfo = false,
  bottomRight,
  footer,
  onPress,
  className,
}: MatchCardProps) {
  const {
    homeTeam,
    awayTeam,
    homeTeamPlaceholder,
    awayTeamPlaceholder,
    phase,
    groupLetter,
    status,
    homeScore,
    awayScore,
    homeScorePenalties,
    awayScorePenalties,
    isExtraTime,
    scheduledAt,
    venue,
    city,
  } = match;

  const isScheduled = status === 'SCHEDULED';
  const isLive = status === 'LIVE';
  const isFinished = status === 'FINISHED';
  const isMuted = status === 'POSTPONED' || status === 'CANCELLED';
  const hasScore =
    (isLive || isFinished) && homeScore != null && awayScore != null;

  // ── Phase / group info line ──────────────────────────────────────────────

  const phaseLabel = PHASE_LABELS[phase] ?? phase;
  const groupLabel = groupLetter ? `Grupo ${groupLetter}` : null;
  const phaseInfoText = groupLabel
    ? `${groupLabel}  \u00B7  ${phaseLabel}`
    : phaseLabel;

  // ── Venue line ───────────────────────────────────────────────────────────

  const venueParts = [venue, city].filter(Boolean);
  const venueLine = venueParts.length > 0 ? venueParts.join(', ') : null;

  // ── Prediction indicator ─────────────────────────────────────────────────

  const showPredictionIndicator = isScheduled || isLive;

  return (
    <Card className={className} onPress={onPress}>
      <View style={isMuted ? styles.mutedContainer : undefined}>
        {/* Phase / group info */}
        {showPhaseInfo ? (
          <View style={styles.phaseRow}>
            <Text style={styles.phaseText}>{phaseInfoText}</Text>
          </View>
        ) : null}

        {/* LIVE badge */}
        {isLive ? (
          <View style={styles.liveBadgeContainer}>
            <LiveBadge />
          </View>
        ) : null}

        {/* Teams + score / vs row */}
        <View style={styles.teamsRow}>
          <TeamSide team={homeTeam} placeholder={homeTeamPlaceholder} />

          {hasScore ? (
            <ScoreBlock
              homeScore={homeScore}
              awayScore={awayScore}
              isExtraTime={isExtraTime}
              homeScorePenalties={homeScorePenalties}
              awayScorePenalties={awayScorePenalties}
            />
          ) : isMuted ? (
            <StatusBadge status={status} />
          ) : (
            <View style={styles.vsBlock}>
              <Text style={styles.vsText}>vs</Text>
            </View>
          )}

          <TeamSide
            team={awayTeam}
            placeholder={awayTeamPlaceholder}
            reverse
          />
        </View>

        {/* Bottom row: date + venue (same row, space-between) */}
        <View style={styles.bottomRow}>
          <Text style={styles.dateText}>{formatMatchDate(scheduledAt)}</Text>
          {venueLine ? (
            <Text style={styles.venueText} numberOfLines={1}>
              {venueLine}
            </Text>
          ) : null}
        </View>

        {/* Prediction indicator row (suppressed when a footer badge is provided) */}
        {footer == null && bottomRight != null ? (
          <View style={styles.predictionIndicatorRow}>{bottomRight}</View>
        ) : footer == null && showPredictionIndicator ? (
          hasPrediction ? (
            <View style={styles.predictionIndicatorRow}>
              <View style={styles.predictionRow}>
                <Text style={styles.predictionCheck}>{'\u2713'}</Text>
                <Text style={styles.predictionDone}>Listo</Text>
              </View>
            </View>
          ) : (
            <View style={styles.predictionIndicatorRow}>
              <Text style={styles.predictionMissing}>{'Sin predicción'}</Text>
            </View>
          )
        ) : null}

        {/* Footer (e.g. prediction badge — centered, full width) */}
        {footer != null ? (
          <View style={styles.footerRow}>{footer}</View>
        ) : null}
      </View>
    </Card>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // ── Container ────────────────────────────────────────────────────────────
  mutedContainer: {
    opacity: 0.55,
  },

  // ── Phase row ────────────────────────────────────────────────────────────
  phaseRow: {
    marginBottom: 8,
  },
  phaseText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // ── LIVE badge ───────────────────────────────────────────────────────────
  liveBadgeContainer: {
    marginBottom: 6,
  },
  liveBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.success,
    marginRight: 6,
  },
  liveText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.success,
    letterSpacing: 0.5,
  },

  // ── Teams row ────────────────────────────────────────────────────────────
  teamsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },

  // ── Team side ────────────────────────────────────────────────────────────
  teamSide: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  teamSideReverse: {
    flexDirection: 'row-reverse',
  },
  teamName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.primary,
    flexShrink: 1,
  },
  placeholderName: {
    fontSize: 14,
    fontWeight: '500',
    fontStyle: 'italic',
    color: COLORS.text.muted,
    flexShrink: 1,
  },

  // ── Avatar ───────────────────────────────────────────────────────────────
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary.DEFAULT,
  },
  avatarSpacer: {
    marginHorizontal: 8,
  },

  // ── Score block ──────────────────────────────────────────────────────────
  scoreBlock: {
    alignItems: 'center',
    paddingHorizontal: 8,
    minWidth: 70,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  scoreDash: {
    fontSize: 18,
    fontWeight: '400',
    color: COLORS.text.muted,
    marginHorizontal: 6,
  },
  extraTimeLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.text.secondary,
    marginTop: 2,
  },
  penaltyLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.text.secondary,
    marginTop: 2,
  },

  // ── VS block ─────────────────────────────────────────────────────────────
  vsBlock: {
    alignItems: 'center',
    paddingHorizontal: 8,
    minWidth: 70,
  },
  vsText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text.muted,
  },

  // ── Status badge ─────────────────────────────────────────────────────────
  statusBadge: {
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: COLORS.background,
    minWidth: 70,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },

  // ── Bottom row ───────────────────────────────────────────────────────────
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.text.secondary,
  },

  // ── Prediction indicator ─────────────────────────────────────────────────
  predictionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  predictionCheck: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.success,
    marginRight: 4,
  },
  predictionDone: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.success,
  },
  predictionMissing: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.text.muted,
  },

  // ── Venue (now inline with date, right-aligned) ──────────────────────────
  venueText: {
    fontSize: 11,
    fontWeight: '400',
    color: COLORS.text.muted,
    flex: 1,
    textAlign: 'right',
    marginLeft: 8,
  },

  // ── Prediction indicator row ─────────────────────────────────────────────
  predictionIndicatorRow: {
    marginTop: 6,
    alignItems: 'flex-end',
  },

  // ── Footer ──────────────────────────────────────────────────────────────
  footerRow: {
    marginTop: 10,
    alignItems: 'center' as const,
  },
});
