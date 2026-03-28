/**
 * Groups list screen — shows user's groups with create/join actions.
 *
 * States: loading, empty (with CTA), populated list with group cards.
 * Each card navigates to the group detail screen on press.
 */

import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import type { GroupDto } from '@pichichi/shared';

import { GroupIcon } from '@/components/brand/icons';
import { CreateGroupModal, JoinGroupModal } from '@/components/groups';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { ScreenHeader } from '@/components/ui/screen-header';
import { useMyGroups } from '@/hooks/use-groups';
import { useAuthStore } from '@/stores/auth-store';
import { COLORS } from '@/theme/colors';

/** Role badge shown next to member count. */
function RoleBadge({ role }: { role: string }) {
  const isAdmin = role === 'ADMIN';

  return (
    <View
      className={`rounded-full px-2.5 py-0.5 ${isAdmin ? 'bg-primary/15' : 'bg-gray-100'}`}
    >
      <Text
        className={`text-xs font-semibold ${isAdmin ? 'text-primary' : 'text-text-muted'}`}
      >
        {isAdmin ? 'ADMIN' : 'MIEMBRO'}
      </Text>
    </View>
  );
}

/** Single group card with name, description, members, and role. */
function GroupCard({ group }: { group: GroupDto }) {
  return (
    <Card
      accent
      onPress={() => router.push(`/(tabs)/groups/${group.id}`)}
      className="mb-3"
    >
      <View className="pl-3">
        {/* Group name */}
        <Text className="text-base font-bold text-text-primary">
          {group.name}
        </Text>

        {/* Description (truncated to 1 line) */}
        {group.description ? (
          <Text
            className="mt-1 text-sm text-text-secondary"
            numberOfLines={1}
          >
            {group.description}
          </Text>
        ) : null}

        {/* Bottom row: member count + role badge */}
        <View className="mt-2 flex-row items-center justify-between">
          <Text className="text-xs text-text-muted">
            {group.memberCount} {group.memberCount === 1 ? 'miembro' : 'miembros'}
          </Text>
          <RoleBadge role={group.userRole} />
        </View>
      </View>
    </Card>
  );
}

export default function GroupsScreen() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);

  const user = useAuthStore((s) => s.user);
  const maxGroupsCreated = user?.plan.maxGroupsCreated ?? 3;

  const { data: groups, isLoading, error, refetch, isRefetching } = useMyGroups();

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
    refetch();
  }, [refetch]);

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader
        title="Mis Grupos"
        gradient
        rightAction={
          <View className="flex-row items-center gap-3">
            {/* Create group */}
            <Pressable
              onPress={handleCreatePress}
              className={`h-9 w-9 items-center justify-center rounded-full active:opacity-70 ${
                canCreateGroup ? 'bg-white/20' : 'bg-white/10'
              }`}
            >
              <Text
                className={`text-lg font-bold ${canCreateGroup ? 'text-white' : 'text-white/40'}`}
              >
                +
              </Text>
            </Pressable>

            {/* Join group */}
            <Pressable
              onPress={() => setShowJoinModal(true)}
              className="h-9 w-9 items-center justify-center rounded-full bg-white/20 active:opacity-70"
            >
              <Text className="text-base font-bold text-white">#</Text>
            </Pressable>
          </View>
        }
      />

      {/* Loading */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={COLORS.primary.DEFAULT} />
        </View>
      ) : error ? (
        /* Error state */
        <ScrollView
          className="flex-1"
          contentContainerClassName="flex-1"
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
            icon={<Text className="text-4xl">⚠</Text>}
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
          className="flex-1"
          contentContainerClassName="px-5 pt-5 pb-8"
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
          className="flex-1"
          contentContainerClassName="flex-1"
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
          <View className="items-center pb-10">
            <Pressable
              onPress={() => setShowJoinModal(true)}
              className="active:opacity-70"
            >
              <Text className="text-sm text-text-secondary">
                ¿Tenés un código?{' '}
                <Text className="font-semibold text-primary">Unirme</Text>
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
    </View>
  );
}
