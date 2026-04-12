/**
 * Group rankings section for the home dashboard.
 *
 * Shows the user's groups (max 2) as simple card rows with
 * group name, member count, and user points.
 *
 * Pure presentational — receives typed props, no hooks or data fetching.
 *
 * IMPORTANT — NativeWind v4:
 * Uses StyleSheet for all visual properties to guarantee rendering
 * on the first frame. `className` is for external spacing only.
 * Never mix `style` and `className` on the same element.
 */

import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Users } from 'lucide-react-native';

import type { DashboardGroupRankingDto } from '@pichichi/shared';

import { Button } from '@/components/ui/button';
import { COLORS } from '@/theme/colors';

// ─── Props ──────────────────────────────────────────────────────────────────

interface GroupRankingsSectionProps {
  groups: DashboardGroupRankingDto[];
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function GroupCard({ group }: { group: DashboardGroupRankingDto }) {
  return (
    <View style={styles.card}>
      <Pressable
        onPress={() => router.push(`/(tabs)/groups/${group.groupId}`)}
        style={({ pressed }) => [pressed && styles.cardPressed]}
      >
        <View style={styles.cardContent}>
          <View style={styles.cardLeft}>
            <Text style={styles.groupName} numberOfLines={1}>
              {group.groupName}
            </Text>
            <Text style={styles.memberCount}>
              {group.totalMembers}{' '}
              {group.totalMembers === 1 ? 'miembro' : 'miembros'}
            </Text>
          </View>
          <View style={styles.cardRight}>
            <Text style={styles.userPoints}>{group.userPoints}</Text>
            <Text style={styles.ptsLabel}>pts</Text>
          </View>
        </View>
      </Pressable>
    </View>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function GroupRankingsSection({ groups }: GroupRankingsSectionProps) {
  // ── Empty state ──────────────────────────────────────────────────────────
  if (groups.length === 0) {
    return (
      <View style={styles.section}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Mis Grupos</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Users size={36} color={COLORS.primary.DEFAULT} />
          <Text style={styles.emptyTitle}>¡Sumate al prode!</Text>
          <Text style={styles.emptyText}>
            Creá un grupo o ingresá con el código de un amigo
          </Text>
          <View style={styles.emptyActions}>
            <View style={styles.emptyActionSecondary}>
              <Button
                title="Tengo un código"
                variant="outline"
                onPress={() => router.push('/(tabs)/groups?action=join')}
              />
            </View>
            <View style={styles.emptyActionPrimary}>
              <Button
                title="Crear grupo"
                variant="primary"
                onPress={() => router.push('/(tabs)/groups?action=create')}
              />
            </View>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Users size={18} color={COLORS.primary.DEFAULT} />
          <Text style={styles.headerTitle}>Mis Grupos</Text>
        </View>
        <Pressable onPress={() => router.push('/(tabs)/groups')}>
          <Text style={styles.seeAllText}>Ver todos</Text>
        </Pressable>
      </View>

      {/* Group cards */}
      {groups.map((group) => (
        <GroupCard key={group.groupId} group={group} />
      ))}
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
    justifyContent: 'space-between',
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
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary.DEFAULT,
  },

  // ── Card (outer View for Android shadow/border reliability) ─────────────
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardPressed: {
    opacity: 0.7,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardLeft: {
    flex: 1,
    marginRight: 12,
  },
  cardRight: {
    alignItems: 'flex-end',
  },

  // ── Text styles ─────────────────────────────────────────────────────────
  groupName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  memberCount: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 2,
  },
  userPoints: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0B6E4F',
  },
  ptsLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6B7280',
  },

  // ── Empty state ─────────────────────────────────────────────────────────
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 20,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text.primary,
    textAlign: 'center',
    marginTop: 12,
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '400',
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  emptyActions: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 10,
  },
  emptyActionSecondary: {
    flex: 1,
  },
  emptyActionPrimary: {
    flex: 1,
  },
});
