/**
 * Groups list screen — shows user's groups with create/join actions.
 *
 * States: loading, empty (with CTA), populated list with group cards.
 * Each card navigates to the group detail screen on press.
 *
 * IMPORTANT — NativeWind v4 ghost-card fix:
 * GroupCard and RoleBadge use StyleSheet for ALL visual properties
 * (color, font, padding, bg) to guarantee first-frame rendering.
 * NativeWind className is only used for screen-level layout wrappers
 * (flex-1, bg-background) that are safe because they affect the outer
 * container, not the visible card content.
 */

import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import type { GroupDto } from '@pichichi/shared';
import { Hash, Plus, Users } from 'lucide-react-native';

import { GroupIcon } from '@/components/brand/icons';
import { CreateGroupModal, JoinGroupModal } from '@/components/groups';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { NotificationBell } from '@/components/ui/notification-bell';
import { ScreenHeader } from '@/components/ui/screen-header';
import { useMyGroups } from '@/hooks/use-groups';
import { useUnreadCount } from '@/hooks/use-notifications';
import { useAuthStore } from '@/stores/auth-store';
import { COLORS } from '@/theme/colors';

/** Role badge shown next to member count. */
function RoleBadge({ role }: { role: string }) {
  const isAdmin = role === 'ADMIN';

  return (
    <View
      style={[
        badgeStyles.badge,
        isAdmin ? badgeStyles.badgeAdmin : badgeStyles.badgeMember,
      ]}
    >
      <Text
        style={[
          badgeStyles.badgeText,
          isAdmin ? badgeStyles.badgeTextAdmin : badgeStyles.badgeTextMember,
        ]}
      >
        {isAdmin ? 'ADMIN' : 'MIEMBRO'}
      </Text>
    </View>
  );
}

const badgeStyles = StyleSheet.create({
  badge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeAdmin: {
    backgroundColor: '#062E22',
  },
  badgeMember: {
    backgroundColor: '#F0FAF4',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  badgeTextAdmin: {
    color: '#FFD166',
  },
  badgeTextMember: {
    color: '#0B6E4F',
  },
});

/** Single group card with name, description, members, and role. */
function GroupCard({ group }: { group: GroupDto }) {
  return (
    <View style={cardStyles.cardWrapper}>
      <Card
        accent
        onPress={() => router.push(`/(tabs)/groups/${group.id}`)}
      >
        <View style={cardStyles.content}>
          {/* Group name */}
          <Text style={cardStyles.name}>
            {group.name}
          </Text>

          {/* Bottom row: member count + role badge */}
          <View style={cardStyles.bottomRow}>
            <View style={cardStyles.memberRow}>
              <Users size={12} color="#9CA3AF" />
              <Text style={cardStyles.memberCount}>
                {group.memberCount} {group.memberCount === 1 ? 'miembro' : 'miembros'}
              </Text>
            </View>
            <RoleBadge role={group.userRole} />
          </View>
        </View>
      </Card>
    </View>
  );
}

const cardStyles = StyleSheet.create({
  cardWrapper: {
    marginBottom: 12,
  },
  content: {
    paddingLeft: 12,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  bottomRow: {
    marginTop: 3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  memberCount: {
    fontSize: 11,
    color: '#6B7280',
  },
});

export default function GroupsScreen() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);

  const user = useAuthStore((s) => s.user);
  const maxGroupsCreated = user?.plan.maxGroupsCreated ?? 3;

  const { data: groups, isLoading, error, refetch, isRefetching } = useMyGroups();
  const { refetch: refetchUnreadCount } = useUnreadCount();

  const hasGroups = groups && groups.length > 0;

  const groupsCreatedCount = useMemo(
    () => (groups ?? []).filter((g) => g.createdBy === user?.id).length,
    [groups, user?.id],
  );
  const canCreateGroup = groupsCreatedCount < maxGroupsCreated;

  function handleCreatePress() {
    if (!canCreateGroup) {
      Alert.alert(
        'Límite alcanzado',
        `Tu plan permite crear hasta ${maxGroupsCreated} grupos y ya tenés ${groupsCreatedCount}. Podés unirte a grupos de otros usuarios con un código de invitación.`,
      );
      return;
    }
    setShowCreateModal(true);
  }

  const onRefresh = useCallback(() => {
    console.log('[Notifications] 🔄 Refetching unread count');
    refetch();
    refetchUnreadCount();
  }, [refetch, refetchUnreadCount]);

  return (
    <View style={screenStyles.root}>
      <ScreenHeader
        title="Mis Grupos"
        gradient
        rightAction={<NotificationBell />}
      />

      {/* Loading */}
      {isLoading ? (
        <View style={screenStyles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary.DEFAULT} />
        </View>
      ) : error ? (
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
            title="Error al cargar grupos"
            description="No se pudieron cargar tus grupos. Deslizá hacia abajo para reintentar."
            action={{
              label: 'Reintentar',
              onPress: () => refetch(),
            }}
          />
        </ScrollView>
      ) : hasGroups ? (
        /* Group list */
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
          {groups.map((group) => (
            <GroupCard key={group.id} group={group} />
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
            icon={<GroupIcon size={40} color={COLORS.primary.DEFAULT} />}
            title="No tenés grupos todavía"
            description="Creá un grupo para jugar con amigos o unite con un código de invitación"
            action={{
              label: 'Crear grupo',
              onPress: handleCreatePress,
            }}
          />

          {/* Secondary action */}
          <View style={screenStyles.secondaryAction}>
            <Pressable onPress={() => setShowJoinModal(true)}>
              <Text style={screenStyles.secondaryText}>
                ¿Tenés un código?{' '}
                <Text style={screenStyles.secondaryLink}>Unirme</Text>
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      )}

      {/* Modals */}
      <CreateGroupModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
      <JoinGroupModal
        visible={showJoinModal}
        onClose={() => setShowJoinModal(false)}
      />

      {/* Floating action buttons */}
      <View style={fabStyles.container}>
        <View style={fabStyles.fabCreate}>
          <Pressable
            onPress={handleCreatePress}
            style={({ pressed }) => [pressed && fabStyles.fabPressed]}
          >
            <Plus size={22} color="#FFFFFF" />
          </Pressable>
        </View>
        <View style={fabStyles.fabJoin}>
          <Pressable
            onPress={() => setShowJoinModal(true)}
            style={({ pressed }) => [pressed && fabStyles.fabPressed]}
          >
            <Hash size={22} color="#FFD166" />
          </Pressable>
        </View>
      </View>
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
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
  },
  errorIcon: {
    fontSize: 32,
  },
  secondaryAction: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  secondaryText: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  secondaryLink: {
    fontWeight: '600',
    color: COLORS.primary.DEFAULT,
  },
});

const fabStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    gap: 12,
    alignItems: 'center',
  },
  fabCreate: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0B6E4F',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#0B6E4F40',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  fabJoin: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#062E22',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#062E2240',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  fabPressed: {
    opacity: 0.7,
  },
});
