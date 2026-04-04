/**
 * User stats section for the home dashboard.
 *
 * Compact card showing aggregated statistics: total points, accuracy %,
 * total predictions, and exact prediction count.
 *
 * Pure presentational — receives typed props, no hooks or data fetching.
 *
 * IMPORTANT — NativeWind v4:
 * Uses StyleSheet for all visual properties to guarantee rendering
 * on the first frame. `className` is for external spacing only.
 * Never mix `style` and `className` on the same element.
 */

import { StyleSheet, Text, View } from 'react-native';

import type { DashboardUserStatsDto } from '@pichichi/shared';

import { PointsIcon, PredictionIcon, TrophyIcon } from '@/components/brand/icons';
import { COLORS } from '@/theme/colors';

// ─── Props ──────────────────────────────────────────────────────────────────

interface UserStatsSectionProps {
  stats: DashboardUserStatsDto;
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function StatItem({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <View style={styles.statItem}>
      {icon}
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function UserStatsSection({ stats }: UserStatsSectionProps) {
  return (
    <View style={styles.section}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <PointsIcon size={18} color={COLORS.primary.DEFAULT} />
          <Text style={styles.headerTitle}>Tus Estadísticas</Text>
        </View>
      </View>

      {/* Stats card */}
      <View style={styles.card}>
        {/* Main stat — total points (prominent) */}
        <View style={styles.mainStat}>
          <Text style={styles.mainStatValue}>{stats.totalPoints}</Text>
          <Text style={styles.mainStatLabel}>puntos totales</Text>
        </View>

        {/* Secondary stats row */}
        <View style={styles.secondaryRow}>
          <StatItem
            icon={<PredictionIcon size={14} color={COLORS.primary.DEFAULT} />}
            value={String(stats.totalPredictions)}
            label="Pronósticos"
          />
          <View style={styles.statDivider} />
          <StatItem
            icon={<TrophyIcon size={14} color={COLORS.success} />}
            value={`${Math.round(stats.accuracy)}%`}
            label="Precisión"
          />
          <View style={styles.statDivider} />
          <StatItem
            icon={<Text style={styles.exactIcon}>{'\u2713'}</Text>}
            value={String(stats.exactCount)}
            label="Exactos"
          />
        </View>
      </View>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  section: {
    marginBottom: 20,
  },

  // ── Header ──────────────────────────────────────────────────────────────
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text.primary,
  },

  // ── Card ────────────────────────────────────────────────────────────────
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },

  // ── Main stat ───────────────────────────────────────────────────────────
  mainStat: {
    alignItems: 'center',
    marginBottom: 20,
  },
  mainStatValue: {
    fontSize: 40,
    fontWeight: '800',
    color: COLORS.primary.DEFAULT,
    letterSpacing: -1,
  },
  mainStatLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text.secondary,
    marginTop: 2,
  },

  // ── Secondary row ───────────────────────────────────────────────────────
  secondaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
    gap: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.text.muted,
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    height: 32,
    backgroundColor: COLORS.border,
  },

  // ── Exact icon ──────────────────────────────────────────────────────────
  exactIcon: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.success,
  },
});
