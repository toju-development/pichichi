/**
 * Group detail screen — full group view with members, tournaments, and actions.
 *
 * Shows group info (invite code for admin, members list, tournaments) with admin
 * actions for member management, editing, and deletion. Handles loading, error,
 * and empty states.
 */

import { useCallback, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import type { GroupMemberRole } from '@pichichi/shared';

import { TrophyIcon } from '@/components/brand/icons';
import { EditGroupModal } from '@/components/groups/edit-group-modal';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import {
  useDeleteGroup,
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
      style={[
        detailStyles.badge,
        isAdmin ? detailStyles.badgeAdmin : detailStyles.badgeMember,
      ]}
    >
      <Text
        style={[
          detailStyles.badgeText,
          isAdmin ? detailStyles.badgeTextAdmin : detailStyles.badgeTextMember,
        ]}
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
      style={detailStyles.backButton}
    >
      <Text style={detailStyles.backText}>{'\u2190'} Volver</Text>
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
  const deleteGroupMutation = useDeleteGroup();

  const currentUserId = useAuthStore((s) => s.user?.id);

  const isAdmin = group?.userRole === 'ADMIN';

  const [editModalVisible, setEditModalVisible] = useState(false);

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
        'Sos el último miembro del grupo. Si te vas, el grupo se eliminará. ¿Estás seguro?';
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

  function handleDeleteGroup() {
    if (!group || deleteGroupMutation.isPending) return;

    const otherMemberCount = (members?.length ?? group.memberCount) - 1;
    const hasOtherMembers = otherMemberCount > 0;

    const message = hasOtherMembers
      ? `Este grupo tiene ${otherMemberCount} ${otherMemberCount === 1 ? 'miembro más' : 'miembros más'}. ` +
        'Si lo eliminás, todos los miembros serán removidos. ¿Estás seguro?'
      : 'Si el grupo tiene predicciones será archivado, si no será eliminado permanentemente. ¿Estás seguro?';

    Alert.alert(
      'Eliminar grupo',
      message,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () =>
            deleteGroupMutation.mutate(group.id, {
              onSuccess: (result) => {
                const msg =
                  result.action === 'archived'
                    ? 'El grupo fue archivado porque contiene predicciones.'
                    : 'El grupo fue eliminado.';
                Alert.alert('Listo', msg, [
                  { text: 'OK', onPress: () => router.replace('/(tabs)/groups') },
                ]);
              },
              onError: () =>
                Alert.alert(
                  'Error',
                  'No se pudo eliminar el grupo. Intentá de nuevo.',
                ),
            }),
        },
      ],
    );
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
      <View style={detailStyles.screen}>
        <ScreenHeader title="Grupo" gradient>
          <BackButton />
        </ScreenHeader>

        <View style={detailStyles.errorContainer}>
          <Text style={detailStyles.errorText}>
            No se pudo cargar el grupo.
          </Text>
          <Button title="Volver" variant="outline" onPress={() => router.back()} />
        </View>
    </View>
  );
}

  // ── Loaded state ──────────────────────────────────────────────────────────

  return (
    <View style={detailStyles.screen}>
      <ScreenHeader
        title={group.name}
        subtitle={group.description || 'Grupo de predicciones'}
        gradient
      >
        <BackButton />
      </ScreenHeader>

      <ScrollView
        style={detailStyles.scrollView}
        contentContainerStyle={detailStyles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isAnyRefreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary.DEFAULT}
            colors={[COLORS.primary.DEFAULT]}
          />
        }
      >
       <View style={detailStyles.sections}>
        {/* ── Invite Code Card (admin only) ───────────────────────────── */}
        {isAdmin && group.inviteCode ? (
          <Card accent>
            <Text style={detailStyles.sectionLabel}>
              Código de invitación
            </Text>
            <Text style={detailStyles.inviteCode}>
              {group.inviteCode}
            </Text>
            <Button title="Compartir" variant="outline" onPress={handleShareInviteCode} />
          </Card>
        ) : null}

        {/* ── Group Info Card ──────────────────────────────────────────── */}
        <Card>
          <View style={detailStyles.infoRow}>
            <Text style={detailStyles.infoText}>
              Miembros: {members?.length ?? group.memberCount} / {group.maxMembers}
            </Text>
            {isAdmin ? (
              <Pressable
                onPress={() => setEditModalVisible(true)}
                style={detailStyles.editButton}
              >
                <Text style={detailStyles.editButtonText}>Editar</Text>
              </Pressable>
            ) : null}
          </View>
        </Card>

        {/* ── Members Section ──────────────────────────────────────────── */}
        <View>
          <Text style={detailStyles.sectionTitle}>
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
                <View style={detailStyles.memberRow}>
                  {/* Avatar circle */}
                  <View style={detailStyles.avatar}>
                    <Text style={detailStyles.avatarText}>{initial}</Text>
                  </View>

                  {/* Name */}
                  <View style={detailStyles.memberInfo}>
                    <Text style={detailStyles.memberName}>
                      {member.displayName}
                      {isCurrentUser ? ' (Vos)' : ''}
                    </Text>
                    <Text style={detailStyles.memberUsername}>
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
          <Text style={detailStyles.sectionTitle}>Torneos</Text>

          {!tournaments || tournaments.length === 0 ? (
            <Card>
              <View style={detailStyles.tournamentRow}>
                <TrophyIcon size={20} color={COLORS.text.muted} />
                <Text style={detailStyles.tournamentEmpty}>
                  No hay torneos asociados
                </Text>
              </View>
            </Card>
          ) : (
            tournaments.map((tournament) => (
              <Card key={tournament.id} className="mb-3">
                <View style={detailStyles.tournamentRow}>
                  <TrophyIcon size={22} color={COLORS.primary.DEFAULT} />
                  <View style={detailStyles.tournamentInfo}>
                    <Text style={detailStyles.tournamentName}>
                      {tournament.name}
                    </Text>
                    <View style={detailStyles.tournamentMeta}>
                      <View style={detailStyles.tournamentTypeBadge}>
                        <Text style={detailStyles.tournamentTypeText}>
                          {tournament.type.replace(/_/g, ' ')}
                        </Text>
                      </View>
                      <Text style={detailStyles.tournamentStatus}>
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
        <View style={detailStyles.actionsSection}>
          {/* Leave group */}
          <Card onPress={leaveGroupMutation.isPending ? undefined : handleLeaveGroup}>
            <View style={detailStyles.actionRow}>
              <Text
                style={[
                  detailStyles.actionText,
                  leaveGroupMutation.isPending
                    ? detailStyles.actionTextDisabled
                    : detailStyles.actionTextDanger,
                ]}
              >
                {leaveGroupMutation.isPending ? 'Saliendo...' : 'Salir del grupo'}
              </Text>
            </View>
          </Card>

          {/* Delete group (admin only) */}
          {isAdmin ? (
            <Card onPress={deleteGroupMutation.isPending ? undefined : handleDeleteGroup}>
              <View style={detailStyles.actionRow}>
              <Text
                style={[
                  detailStyles.actionText,
                  deleteGroupMutation.isPending
                    ? detailStyles.actionTextDisabled
                    : detailStyles.actionTextDanger,
                ]}
              >
                {deleteGroupMutation.isPending ? 'Eliminando...' : 'Eliminar grupo'}
              </Text>
              </View>
            </Card>
          ) : null}
        </View>
       </View>
      </ScrollView>

      {/* ── Edit Group Modal ───────────────────────────────────────────── */}
      {isAdmin ? (
        <EditGroupModal
          visible={editModalVisible}
          group={group}
          onClose={() => setEditModalVisible(false)}
        />
      ) : null}
    </View>
  );
}

const detailStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  sections: {
    gap: 16,
  },
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

  // Badge
  badge: {
    borderRadius: 9999,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  badgeAdmin: {
    backgroundColor: 'rgba(11, 110, 79, 0.15)',
  },
  badgeMember: {
    backgroundColor: '#F3F4F6',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  badgeTextAdmin: {
    color: COLORS.primary.DEFAULT,
  },
  badgeTextMember: {
    color: COLORS.text.muted,
  },

  // Back button
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

  // Invite code card
  sectionLabel: {
    marginBottom: 8,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.secondary,
  },
  inviteCode: {
    marginBottom: 12,
    textAlign: 'center',
    fontFamily: 'monospace',
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 4,
    color: COLORS.primary.DEFAULT,
  },

  // Group info card
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoText: {
    fontSize: 14,
    color: COLORS.text.muted,
  },
  editButton: {
    borderRadius: 8,
    backgroundColor: 'rgba(11, 110, 79, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary.DEFAULT,
  },

  // Section titles
  sectionTitle: {
    marginBottom: 12,
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text.primary,
  },

  // Members
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    marginRight: 12,
    height: 40,
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9999,
    backgroundColor: 'rgba(11, 110, 79, 0.15)',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary.DEFAULT,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  memberUsername: {
    marginTop: 2,
    fontSize: 12,
    color: COLORS.text.muted,
  },

  // Tournaments
  tournamentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tournamentEmpty: {
    fontSize: 14,
    color: COLORS.text.muted,
  },
  tournamentInfo: {
    flex: 1,
  },
  tournamentName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  tournamentMeta: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tournamentTypeBadge: {
    borderRadius: 9999,
    backgroundColor: 'rgba(11, 110, 79, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  tournamentTypeText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.primary.DEFAULT,
  },
  tournamentStatus: {
    fontSize: 12,
    color: COLORS.text.muted,
  },

  // Actions
  actionsSection: {
    marginTop: 16,
    gap: 12,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600',
  },
  actionTextDanger: {
    color: COLORS.error,
  },
  actionTextDisabled: {
    color: COLORS.text.muted,
  },
});
