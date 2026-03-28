/**
 * Group detail screen — full group view with members, tournaments, and actions.
 *
 * Shows group info (invite code for admin, members list, tournaments) with admin
 * actions for member management. Handles loading, error, and empty states.
 */

import { useCallback } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, Share, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import type { GroupMemberRole } from '@pichichi/shared';

import { TrophyIcon } from '@/components/brand/icons';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import {
  useGroup,
  useGroupMembers,
  useGroupTournaments,
  useLeaveGroup,
  useRemoveMember,
} from '@/hooks/use-groups';
import { useAuthStore } from '@/stores/auth-store';
import { COLORS } from '@/theme/colors';

/** Role badge shown next to each member name. */
function RoleBadge({ role }: { role: GroupMemberRole }) {
  const isAdmin = role === 'ADMIN';

  return (
    <View
      className={`rounded-full px-2.5 py-0.5 ${isAdmin ? 'bg-primary/15' : 'bg-gray-100'}`}
    >
      <Text
        className={`text-xs font-semibold ${isAdmin ? 'text-primary' : 'text-text-muted'}`}
      >
        {isAdmin ? 'Admin' : 'Miembro'}
      </Text>
    </View>
  );
}

/** Back button rendered inside ScreenHeader children (below title, in gradient). */
function BackButton() {
  return (
    <Pressable
      onPress={() => router.back()}
      className="mt-2 flex-row items-center self-start active:opacity-70"
    >
      <Text className="text-sm font-semibold text-white/80">← Volver</Text>
    </Pressable>
  );
}

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: group, isLoading, error, refetch, isRefetching } = useGroup(id!);
  const { data: members, refetch: refetchMembers, isRefetching: isRefetchingMembers } = useGroupMembers(id!);
  const { data: tournaments, refetch: refetchTournaments, isRefetching: isRefetchingTournaments } = useGroupTournaments(id!);
  const leaveGroupMutation = useLeaveGroup();
  const removeMemberMutation = useRemoveMember();

  const currentUserId = useAuthStore((s) => s.user?.id);

  const isAdmin = group?.userRole === 'ADMIN';

  const isAnyRefreshing = isRefetching || isRefetchingMembers || isRefetchingTournaments;

  const onRefresh = useCallback(() => {
    refetch();
    refetchMembers();
    refetchTournaments();
  }, [refetch, refetchMembers, refetchTournaments]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  function handleShareInviteCode() {
    if (!group?.inviteCode) return;

    Share.share({
      message: `Unite a mi grupo "${group.name}" en Pichichi! Código: ${group.inviteCode}`,
    });
  }

  function handleLeaveGroup() {
    if (!group || leaveGroupMutation.isPending) return;

    // members only contains active members (API filters by isActive: true)
    const isLastMember = (members?.length ?? 0) <= 1;

    let message: string;
    if (isLastMember) {
      message =
        'Sos el último miembro del grupo. Si te vas, el grupo se desactivará. ¿Estás seguro?';
    } else if (isAdmin) {
      message =
        'Sos administrador de este grupo. Si te vas, se asignará otro admin automáticamente. ¿Estás seguro?';
    } else {
      message = '¿Estás seguro de que querés salir de este grupo?';
    }

    Alert.alert('Salir del grupo', message, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Salir',
        style: 'destructive',
        onPress: () =>
          leaveGroupMutation.mutate(group.id, {
            onSuccess: () => router.replace('/(tabs)/groups'),
            onError: () =>
              Alert.alert('Error', 'No se pudo salir del grupo. Intentá de nuevo.'),
          }),
      },
    ]);
  }

  function handleMemberAction(member: {
    userId: string;
    displayName: string;
    role: GroupMemberRole;
  }) {
    if (!group || !isAdmin || member.userId === currentUserId) return;

    Alert.alert(
      member.displayName,
      '¿Querés expulsar a este miembro del grupo?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Expulsar',
          style: 'destructive',
          onPress: () =>
            removeMemberMutation.mutate(
              { groupId: group.id, userId: member.userId },
              {
                onSuccess: () =>
                  Alert.alert('Listo', `${member.displayName} fue expulsado del grupo.`),
                onError: () =>
                  Alert.alert(
                    'Error',
                    'No se pudo expulsar al miembro. Intentá de nuevo.',
                  ),
              },
            ),
        },
      ],
    );
  }

  // ── Loading state ─────────────────────────────────────────────────────────

  if (isLoading) {
    return <LoadingScreen />;
  }

  // ── Error state ───────────────────────────────────────────────────────────

  if (error || !group) {
    return (
      <View className="flex-1 bg-background">
        <ScreenHeader title="Grupo" gradient>
          <BackButton />
        </ScreenHeader>

        <View className="flex-1 items-center justify-center px-6">
          <Text className="mb-4 text-center text-base text-text-secondary">
            No se pudo cargar el grupo.
          </Text>
          <Button title="Volver" variant="outline" onPress={() => router.back()} />
        </View>
      </View>
    );
  }

  // ── Loaded state ──────────────────────────────────────────────────────────

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader
        title={group.name}
        subtitle={group.description || 'Grupo de predicciones'}
        gradient
      >
        <BackButton />
      </ScreenHeader>

      <ScrollView
        className="flex-1 px-5 pt-4"
        contentContainerClassName="pb-8 gap-4"
        refreshControl={
          <RefreshControl
            refreshing={isAnyRefreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary.DEFAULT}
            colors={[COLORS.primary.DEFAULT]}
          />
        }
      >
        {/* ── Invite Code Card (admin only) ───────────────────────────── */}
        {isAdmin && group.inviteCode ? (
          <Card accent>
            <Text className="mb-2 text-sm font-semibold text-text-secondary">
              Código de invitación
            </Text>
            <Text
              className="mb-3 text-center text-2xl font-bold tracking-widest text-primary"
              style={{ fontFamily: 'monospace' }}
            >
              {group.inviteCode}
            </Text>
            <Button title="Compartir" variant="outline" onPress={handleShareInviteCode} />
          </Card>
        ) : null}

        {/* ── Members Section ──────────────────────────────────────────── */}
        <View>
          <Text className="mb-3 text-lg font-bold text-text-primary">
            Miembros ({members?.length ?? group.memberCount})
          </Text>

          {members?.map((member) => {
            const initial = member.displayName.charAt(0).toUpperCase();
            const isCurrentUser = member.userId === currentUserId;
            const canManage = isAdmin && !isCurrentUser;

            return (
              <Card
                key={member.id}
                className="mb-3"
                onPress={canManage ? () => handleMemberAction(member) : undefined}
              >
                <View className="flex-row items-center">
                  {/* Avatar circle */}
                  <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-primary/15">
                    <Text className="text-sm font-bold text-primary">{initial}</Text>
                  </View>

                  {/* Name */}
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-text-primary">
                      {member.displayName}
                      {isCurrentUser ? ' (Vos)' : ''}
                    </Text>
                    <Text className="mt-0.5 text-xs text-text-muted">
                      @{member.username}
                    </Text>
                  </View>

                  {/* Role badge */}
                  <RoleBadge role={member.role} />
                </View>
              </Card>
            );
          })}
        </View>

        {/* ── Tournaments Section ──────────────────────────────────────── */}
        <View>
          <Text className="mb-3 text-lg font-bold text-text-primary">Torneos</Text>

          {!tournaments || tournaments.length === 0 ? (
            <Card>
              <View className="flex-row items-center gap-3">
                <TrophyIcon size={20} color={COLORS.text.muted} />
                <Text className="text-sm text-text-muted">
                  No hay torneos asociados
                </Text>
              </View>
            </Card>
          ) : (
            tournaments.map((tournament) => (
              <Card key={tournament.id} className="mb-3">
                <View className="flex-row items-center gap-3">
                  <TrophyIcon size={22} color={COLORS.primary.DEFAULT} />
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-text-primary">
                      {tournament.name}
                    </Text>
                    <View className="mt-1 flex-row items-center gap-2">
                      <View className="rounded-full bg-primary/15 px-2 py-0.5">
                        <Text className="text-xs font-medium text-primary">
                          {tournament.type.replace(/_/g, ' ')}
                        </Text>
                      </View>
                      <Text className="text-xs text-text-muted">
                        {tournament.status === 'IN_PROGRESS'
                          ? 'En curso'
                          : tournament.status === 'UPCOMING'
                            ? 'Próximamente'
                            : tournament.status === 'FINISHED'
                              ? 'Finalizado'
                              : tournament.status}
                      </Text>
                    </View>
                  </View>
                </View>
              </Card>
            ))
          )}
        </View>

        {/* ── Actions Section ──────────────────────────────────────────── */}
        <View className="mt-4">
          <Card onPress={leaveGroupMutation.isPending ? undefined : handleLeaveGroup}>
            <View className="flex-row items-center justify-center">
              <Text
                className="text-base font-semibold"
                style={{ color: leaveGroupMutation.isPending ? COLORS.text.muted : COLORS.error }}
              >
                {leaveGroupMutation.isPending ? 'Saliendo...' : 'Salir del grupo'}
              </Text>
            </View>
          </Card>
        </View>
      </ScrollView>
    </View>
  );
}
