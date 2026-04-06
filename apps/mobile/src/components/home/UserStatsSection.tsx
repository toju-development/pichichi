/**
 * User stats section for the home dashboard.
 *
 * Flat 4-column card showing aggregated statistics: total points, predictions,
 * accuracy %, and exact prediction count — all with equal visual weight.
 *
 * Pure presentational — receives typed props, no hooks or data fetching.
 *
 * IMPORTANT — NativeWind v4:
 * Uses StyleSheet for all visual properties to guarantee rendering
 * on the first frame. `className` is for external spacing only.
 * Never mix `style` and `className` on the same element.
 */

import { StyleSheet, Text, View } from 'react-native';

import { CircleCheck, Star, Target, Timer, Trophy } from 'lucide-react-native';

import type { DashboardUserStatsDto } from '@pichichi/shared';

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
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Timer size={16} color="#0B6E4F" />
        <Text style={styles.headerTitle}>Tus Estadísticas</Text>
      </View>

      {/* Flat 4-column stats row */}
      <View style={styles.statsRow}>
        <StatItem
          icon={<Star size={16} color="#FFD166" />}
          value={String(stats.totalPoints)}
          label="Puntos"
        />
        <View style={styles.statDivider} />
        <StatItem
          icon={<Target size={16} color="#0B6E4F" />}
          value={String(stats.totalPredictions)}
          label="Pronósticos"
        />
        <View style={styles.statDivider} />
        <StatItem
          icon={<Trophy size={16} color="#FFD166" />}
          value={`${Math.round(stats.accuracy)}%`}
          label="Precisión"
        />
        <View style={styles.statDivider} />
        <StatItem
          icon={<CircleCheck size={16} color="#10B981" />}
          value={String(stats.exactCount)}
          label="Exactos"
        />
      </View>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // ── Card ────────────────────────────────────────────────────────────────
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },

  // ── Header ──────────────────────────────────────────────────────────────
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A2E',
  },

  // ── Stats row ───────────────────────────────────────────────────────────
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A1A2E',
  },
  statLabel: {
    fontSize: 10,
    color: '#6B7280',
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    height: 32,
    backgroundColor: '#E5E7EB',
  },
});
