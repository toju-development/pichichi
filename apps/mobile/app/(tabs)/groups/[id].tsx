/**
 * Group detail screen — full group view with members, tournaments, and actions.
 *
 * Shows group info (invite code for admin, members list, tournaments) with admin
 * actions for member management, editing, and deletion. Handles loading, error,
 * and empty states.
 *
 * IMPORTANT — NativeWind v4 ghost-card fix:
 * ALL visual properties use StyleSheet.create(). Never mix `style` + `className`.
 * Shadows use Platform.select for iOS/Android.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, FlatList, Image, Modal, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import * as Clipboard from 'expo-clipboard';
import type { AxiosError } from 'axios';
import { LogOut, Pencil, Trash2, UserPlus, Users } from 'lucide-react-native';

import type { GroupMemberRole, TournamentDto } from '@pichichi/shared';

import { TrophyIcon } from '@/components/brand/icons';
import { AddTournamentModal } from '@/components/groups/add-tournament-modal';
import { EditGroupModal } from '@/components/groups/edit-group-modal';
import { UpcomingPredictionsSection } from '@/components/groups/upcoming-predictions-section';
import { Button } from '@/components/ui/button';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { checkRemoveTournament } from '@/api/groups';
import { TOURNAMENT_STATUS_LABELS, TOURNAMENT_TYPE_LABELS } from '@/utils/match-helpers';
import {
  useDeleteGroup,
  useGroup,
  useGroupMembers,
  useGroupTournaments,
  useLeaveGroup,
  useRemoveMember,
  useRemoveTournament,
  useUpcomingPredictions,
} from '@/hooks/use-groups';
import { useLeaderboard } from '@/hooks/use-leaderboard';
import { queryKeys } from '@/hooks/query-keys';
import { useAuthStore } from '@/stores/auth-store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ── Constants ─────────────────────────────────────────────────────────────────

/** Deterministic avatar colors based on member index. */
const AVATAR_COLORS = [
  '#0B6E4F', '#10B981', '#FFD166', '#6366F1',
  '#F59E0B', '#E63946', '#8B5CF6', '#EC4899',
] as const;

/** Tournament type → tag color mapping. */
const TOURNAMENT_TAG_COLORS: Record<string, { bg: string; text: string }> = {
  WORLD_CUP: { bg: '#FFF3E0', text: '#E65100' },
  COPA_AMERICA: { bg: '#FFF3E0', text: '#E65100' },
  EURO: { bg: '#FFF3E0', text: '#E65100' },
  CHAMPIONS_LEAGUE: { bg: '#FFF3E0', text: '#E65100' },
  COPA_LIBERTADORES: { bg: '#FFF3E0', text: '#E65100' },
  CUSTOM: { bg: '#E8F5EE', text: '#0B6E4F' },
};

const DEFAULT_TAG_COLOR = { bg: '#E8F5EE', text: '#0B6E4F' };

// ── Helpers ───────────────────────────────────────────────────────────────────

function getAvatarColor(index: number): string {
  return AVATAR_COLORS[index % AVATAR_COLORS.length];
}

function getTagColors(tournamentType: string) {
  return TOURNAMENT_TAG_COLORS[tournamentType] ?? DEFAULT_TAG_COLOR;
}

// ── Sub-components ────────────────────────────────────────────────────────────

/** Role badge shown next to each member name. */
function RoleBadge({ role }: { role: GroupMemberRole }) {
  const isAdmin = role === 'ADMIN';

  return (
    <View
      style={[
        s.roleBadge,
        isAdmin ? s.roleBadgeAdmin : s.roleBadgeMember,
      ]}
    >
      <Text
        style={[
          s.roleBadgeText,
          isAdmin ? s.roleBadgeTextAdmin : s.roleBadgeTextMember,
        ]}
      >
        {isAdmin ? 'ADMIN' : 'MIEMBRO'}
      </Text>
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const qc = useQueryClient();
  const insets = useSafeAreaInsets();

  // Flag to disable all queries and show loading state during delete/leave.
  // Set to true BEFORE calling mutate() so the next render disables observers
  // and prevents 404 refetches. Reverted to false on mutation error.
  const [isGroupRemoved, setIsGroupRemoved] = useState(false);

  const { data: group, isLoading, error, refetch, isRefetching } = useGroup(id!, !isGroupRemoved);
  const { data: members, refetch: refetchMembers, isRefetching: isRefetchingMembers } = useGroupMembers(id!, !isGroupRemoved);
  const { data: tournaments, refetch: refetchTournaments, isRefetching: isRefetchingTournaments } = useGroupTournaments(id!, !isGroupRemoved);
  const { data: upcomingPredictions } = useUpcomingPredictions(id!, !isGroupRemoved);
  const { data: leaderboard } = useLeaderboard(id!);
  const leaveGroupMutation = useLeaveGroup();
  const removeMemberMutation = useRemoveMember();
  const deleteGroupMutation = useDeleteGroup();
  const removeTournamentMutation = useRemoveTournament();

  const currentUserId = useAuthStore((s) => s.user?.id);

  const isAdmin = group?.userRole === 'ADMIN';

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [addTournamentVisible, setAddTournamentVisible] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);

  const isAnyRefreshing = isRefetching || isRefetchingMembers || isRefetchingTournaments;

  // Build a quick lookup: userId → totalPoints from leaderboard
  const pointsByUser = new Map<string, number>();
  if (leaderboard?.entries) {
    for (const entry of leaderboard.entries) {
      pointsByUser.set(entry.userId, entry.totalPoints);
    }
  }

  // Sort members by points descending so highest scorer appears first
  const sortedMembers = useMemo(() => {
    if (!members) return undefined;
    return [...members].sort((a, b) => {
      const ptsA = pointsByUser.get(a.userId) ?? 0;
      const ptsB = pointsByUser.get(b.userId) ?? 0;
      return ptsB - ptsA;
    });
  }, [members, pointsByUser]);

  // ── Auto-navigate on 404 (group deleted/removed by someone else) ────────
  // Uses a ref to prevent the Alert from firing more than once.
  const hasNavigatedFor404 = useRef(false);

  useEffect(() => {
    if (isGroupRemoved || hasNavigatedFor404.current) return;

    const status = (error as AxiosError)?.response?.status;
    if (status === 404 || status === 403) {
      hasNavigatedFor404.current = true;
      setIsGroupRemoved(true);
      // Refresh the groups list so it doesn't show the stale group
      qc.invalidateQueries({ queryKey: queryKeys.groups.all });
      const msg =
        status === 404
          ? 'Este grupo fue eliminado o ya no tenés acceso.'
          : 'Ya no sos miembro de este grupo.';
      Alert.alert('Grupo no disponible', msg, [
        { text: 'OK', onPress: () => router.replace('/(tabs)/groups') },
      ]);
    }
  }, [error, isGroupRemoved, qc]);

  const onRefresh = useCallback(() => {
    refetch();
    refetchMembers();
    refetchTournaments();
  }, [refetch, refetchMembers, refetchTournaments]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  /** Handle mutation errors — if the group no longer exists (404/403),
   *  navigate to the list instead of showing a generic retry message. */
  function handleMutationError(err: unknown, fallbackMsg: string) {
    const status = (err as AxiosError)?.response?.status;
    if (status === 404 || status === 403) {
      qc.invalidateQueries({ queryKey: queryKeys.groups.all });
      const msg =
        status === 404
          ? 'Este grupo fue eliminado o ya no tenés acceso.'
          : 'Ya no sos miembro de este grupo.';
      Alert.alert('Grupo no disponible', msg, [
        { text: 'OK', onPress: () => router.replace('/(tabs)/groups') },
      ]);
    } else {
      setIsGroupRemoved(false);
      Alert.alert('Error', fallbackMsg);
    }
  }

  const [codeCopied, setCodeCopied] = useState(false);

  async function handleCopyInviteCode() {
    if (!group?.inviteCode) return;

    await Clipboard.setStringAsync(group.inviteCode);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  }

  function handleShareInviteCode() {
    if (!group?.inviteCode) return;

    void Clipboard.setStringAsync(group.inviteCode);
    Alert.alert(
      'Código copiado',
      `Código de invitación: ${group.inviteCode}\n\nCompartilo con tus amigos para que se unan al grupo.`,
    );
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
        onPress: () => {
          // Disable queries BEFORE the mutation fires to prevent 404 refetches.
          // React batches setState, but the next render will have enabled=false
          // before any mutation onSuccess/invalidation triggers observers.
          setIsGroupRemoved(true);
          leaveGroupMutation.mutate(group.id, {
            onSuccess: () => {
              router.replace('/(tabs)/groups');
            },
            onError: (err) => {
              handleMutationError(err, 'No se pudo salir del grupo. Intentá de nuevo.');
            },
          });
        },
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
          onPress: () => {
            // Disable queries BEFORE the mutation fires to prevent 404 refetches.
            setIsGroupRemoved(true);
            deleteGroupMutation.mutate(group.id, {
              onSuccess: () => {
                // Navigate immediately — same pattern as leave.
                // No intermediate Alert: the user already confirmed the action.
                router.replace('/(tabs)/groups');
              },
              onError: (err) => {
                handleMutationError(err, 'No se pudo eliminar el grupo. Intentá de nuevo.');
              },
            });
          },
        },
      ],
    );
  }

  function handleNavigateToMemberPredictions(member: {
    userId: string;
    displayName: string;
  }) {
    router.push({
      pathname: '/(tabs)/groups/member-predictions',
      params: { groupId: id, userId: member.userId, displayName: member.displayName },
    });
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

  async function handleRemoveTournament(tournament: TournamentDto) {
    if (!group || removeTournamentMutation.isPending) return;

    try {
      const result = await checkRemoveTournament(group.id, tournament.id);

      if (!result.canRemove) {
        Alert.alert('No se puede eliminar', 'El torneo está en curso o finalizado.');
        return;
      }

      const message =
        result.predictionsCount > 0
          ? `Se borrarán ${result.predictionsCount} predicciones. ¿Estás seguro?`
          : `¿Eliminar ${tournament.name} del grupo?`;

      Alert.alert('Eliminar torneo', message, [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () =>
            removeTournamentMutation.mutate(
              { groupId: group.id, tournamentId: tournament.id },
              {
                onError: () =>
                  Alert.alert(
                    'Error',
                    'No se pudo eliminar el torneo. Intentá de nuevo.',
                  ),
              },
            ),
        },
      ]);
    } catch {
      Alert.alert('Error', 'No se pudo verificar el estado del torneo.');
    }
  }

  // ── Loading state ─────────────────────────────────────────────────────────

  // Show loading during initial fetch OR while navigating away after delete/leave.
  // Without this, the error state flashes ("No se pudo cargar") before the
  // navigation transition completes, because the queries receive 404s.
  if (isLoading || isGroupRemoved) {
    return <LoadingScreen />;
  }

  // ── Error state ───────────────────────────────────────────────────────────

  if (error || !group) {
    return (
      <View style={s.screen}>
        <ScreenHeader title="Grupo" gradient onBack={() => router.back()} />

        <View style={s.errorContainer}>
          <Text style={s.errorText}>
            No se pudo cargar el grupo.
          </Text>
          <Button title="Volver" variant="outline" onPress={() => router.back()} />
        </View>
      </View>
    );
  }

  // ── Loaded state ──────────────────────────────────────────────────────────

  return (
    <View style={s.screen}>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <ScreenHeader
        title={group.name}
        subtitle={group.description || 'Grupo de predicciones'}
        gradient
        onBack={() => router.back()}
        titleStyle={s.headerTitleOverride}
        subtitleStyle={s.headerSubtitleOverride}
        titleProps={{ numberOfLines: 1 }}
        rightAction={
          isAdmin ? (
            <Pressable
              onPress={() => setEditModalVisible(true)}
              style={s.headerEditBtn}
            >
              <Pencil size={14} color="#FFFFFF" />
              <Text style={s.headerEditText}>Editar</Text>
            </Pressable>
          ) : undefined
        }
      />

      {/* ── Scrollable Content ─────────────────────────────────────────── */}
      <ScrollView
        style={s.scrollView}
        contentContainerStyle={s.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isAnyRefreshing}
            onRefresh={onRefresh}
            tintColor="#0B6E4F"
            colors={['#0B6E4F']}
          />
        }
      >
        {/* ── Section 1: Torneos ────────────────────────────────────────── */}
        <View>
          {/* Section header */}
          <View style={s.sectionHeader}>
            <View style={s.sectionHeaderLeft}>
              <TrophyIcon size={20} color="#0B6E4F" />
              <Text style={s.sectionTitle}>Torneos</Text>
            </View>
            <View style={s.sectionHeaderRight}>
              <View style={s.countBadgeCircle}>
                <Text style={s.countBadgeText}>
                  {tournaments?.length ?? 0}
                </Text>
              </View>
              {isAdmin ? (
                <Pressable onPress={() => setAddTournamentVisible(true)}>
                  <Text style={s.sectionActionText}>Agregar</Text>
                </Pressable>
              ) : null}
            </View>
          </View>

          {/* Tournament cards */}
          <View style={s.cardList}>
            {!tournaments || tournaments.length === 0 ? (
              <View style={[s.card, s.cardShadow]}>
                <View style={s.tournamentCardRow}>
                  <View style={s.tournamentIconCircle}>
                    <TrophyIcon size={18} color="#0B6E4F" />
                  </View>
                  <Text style={s.emptyText}>No hay torneos asociados</Text>
                </View>
              </View>
            ) : (
              tournaments.map((tournament) => {
                const canRemove =
                  isAdmin &&
                  (tournament.status === 'DRAFT' || tournament.status === 'UPCOMING');
                const tagColors = getTagColors(tournament.type);

                return (
                  <View key={tournament.id} style={[s.card, s.cardShadow]}>
                    <Pressable
                      onPress={() => router.push({
                        pathname: '/(tabs)/groups/tournament/[slug]',
                        params: { slug: tournament.slug, groupId: id },
                      })}
                      style={({ pressed }) => pressed ? s.pressedOpacity : undefined}
                    >
                      <View style={s.tournamentCardRow}>
                        {/* Trophy icon circle / tournament logo */}
                        <View style={s.tournamentIconCircle}>
                          <TrophyIcon size={18} color="#0B6E4F" />
                          {tournament.logoUrl ? (
                            <Image
                              source={{ uri: tournament.logoUrl }}
                              style={s.tournamentLogoImage}
                            />
                          ) : null}
                        </View>

                        {/* Text column */}
                        <View style={s.tournamentTextCol}>
                          <Text style={s.tournamentName} numberOfLines={1}>
                            {tournament.name}
                          </Text>
                          <View style={s.tournamentTagsRow}>
                            <View style={[s.tournamentTag, { backgroundColor: tagColors.bg }]}>
                              <Text style={[s.tournamentTagText, { color: tagColors.text }]}>
                                {TOURNAMENT_TYPE_LABELS[tournament.type] ?? tournament.type}
                              </Text>
                            </View>
                            <Text style={s.tournamentStatus}>
                              {TOURNAMENT_STATUS_LABELS[tournament.status] ?? tournament.status}
                            </Text>
                          </View>
                        </View>

                        {/* Remove button (admin only) */}
                        {canRemove ? (
                          <Pressable
                            onPress={() => handleRemoveTournament(tournament)}
                            hitSlop={8}
                            style={s.removeBtn}
                          >
                            <Trash2 size={16} color="#E63946" />
                          </Pressable>
                        ) : null}
                      </View>
                    </Pressable>
                  </View>
                );
              })
            )}
          </View>
        </View>

        {/* ── Section 1.5: Upcoming Predictions ────────────────────────── */}
        {upcomingPredictions && upcomingPredictions.length > 0 ? (
          <UpcomingPredictionsSection
            matches={upcomingPredictions}
            groupId={id!}
          />
        ) : null}

        {/* ── Section 2: Miembros ──────────────────────────────────────── */}
        <View>
          {/* Section header */}
          <View style={s.sectionHeader}>
            <View style={s.sectionHeaderLeft}>
              <Users size={18} color="#0B6E4F" />
              <Text style={s.sectionTitle}>Miembros</Text>
            </View>
            <View style={s.sectionHeaderRight}>
              <View style={s.memberCountBadge}>
                <Text style={s.memberCountText}>
                  {members?.length ?? group.memberCount}
                </Text>
              </View>
              <Pressable onPress={() => setShowMembersModal(true)}>
                <Text style={s.sectionActionText}>Ver todos</Text>
              </Pressable>
            </View>
          </View>

          {/* Member cards (max 5 inline) */}
          <View style={s.cardList}>
            {sortedMembers?.slice(0, 5).map((member, index) => {
              const initial = member.displayName.charAt(0).toUpperCase();
              const isCurrentUser = member.userId === currentUserId;
              const canManage = isAdmin && !isCurrentUser;
              const avatarBg = getAvatarColor(index);
              const pts = pointsByUser.get(member.userId) ?? 0;

              return (
                <View key={member.id} style={[s.card, s.cardShadow]}>
                  <Pressable
                    onPress={() => handleNavigateToMemberPredictions(member)}
                    onLongPress={canManage ? () => handleMemberAction(member) : undefined}
                    style={({ pressed }) => pressed ? s.pressedOpacity : undefined}
                  >
                    <View style={s.memberCardRow}>
                      {/* Avatar */}
                      <View style={[s.memberAvatar, { backgroundColor: avatarBg }]}>
                        <Text style={s.memberAvatarText}>{initial}</Text>
                        {member.avatarUrl ? (
                          <Image
                            source={{ uri: member.avatarUrl }}
                            style={s.memberAvatarImage}
                          />
                        ) : null}
                      </View>

                      {/* Name + role */}
                      <View style={s.memberTextCol}>
                        <Text style={s.memberName} numberOfLines={1}>
                          {member.displayName}
                          {isCurrentUser ? ' (Vos)' : ''}
                        </Text>
                        <RoleBadge role={member.role} />
                      </View>

                      {/* Points */}
                      <View style={s.memberPointsCol}>
                        <Text style={s.memberPointsValue}>{pts}</Text>
                        <Text style={s.memberPointsLabel}>pts</Text>
                      </View>
                    </View>
                  </Pressable>
                </View>
              );
            })}
          </View>
        </View>

        {/* Spacer — pushes danger zone to bottom when content is short */}
        <View style={s.dangerZoneSpacer} />

        {/* ── Section 3: Danger Zone ───────────────────────────────────── */}
        <View>
          <View style={[s.dangerButton, s.dangerButtonBorder]}>
            <Pressable
              onPress={leaveGroupMutation.isPending ? undefined : handleLeaveGroup}
              style={({ pressed }) => pressed ? s.pressedOpacity : undefined}
            >
              <View style={s.dangerButtonRow}>
                <LogOut size={18} color="#E63946" />
                <Text style={s.dangerButtonText}>
                  {leaveGroupMutation.isPending ? 'Saliendo...' : 'Salir del grupo'}
                </Text>
              </View>
            </Pressable>
          </View>

          {/* Delete group — admin only, kept as hidden alert trigger */}
          {isAdmin ? (
            <View style={s.deleteGroupWrapper}>
              <Pressable
                onPress={deleteGroupMutation.isPending ? undefined : handleDeleteGroup}
                style={({ pressed }) => pressed ? s.pressedOpacity : undefined}
              >
                <Text style={s.deleteGroupText}>
                  {deleteGroupMutation.isPending ? 'Eliminando...' : 'Eliminar grupo'}
                </Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      </ScrollView>

      {/* ── FAB: Invite (admin only) ───────────────────────────────────── */}
      {isAdmin && group.inviteCode ? (
        <View style={[s.fab, s.fabShadow, { bottom: insets.bottom + 24 }]}>
          <Pressable
            onPress={codeCopied ? undefined : handleShareInviteCode}
            style={({ pressed }) => pressed ? s.pressedOpacity : undefined}
          >
            <UserPlus size={22} color="#FFFFFF" />
          </Pressable>
        </View>
      ) : null}

      {/* ── Edit Group Modal ───────────────────────────────────────────── */}
      {isAdmin ? (
        <EditGroupModal
          visible={editModalVisible}
          group={group}
          onClose={() => setEditModalVisible(false)}
        />
      ) : null}

      {/* ── Add Tournament Modal ───────────────────────────────────────── */}
      {isAdmin ? (
        <AddTournamentModal
          visible={addTournamentVisible}
          groupId={id!}
          currentTournamentIds={tournaments?.map(t => t.id) ?? []}
          onClose={() => setAddTournamentVisible(false)}
        />
      ) : null}

      {/* ── Members Modal ──────────────────────────────────────────────── */}
      <Modal
        visible={showMembersModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowMembersModal(false)}
      >
        <View style={s.modalContainer}>
          {/* Handle bar */}
          <View style={s.modalHandleBarRow}>
            <View style={s.modalHandleBar} />
          </View>

          {/* Header */}
          <View style={s.modalHeader}>
            <Text style={s.modalHeaderTitle}>Miembros</Text>
            <Pressable onPress={() => setShowMembersModal(false)}>
              <Text style={s.modalHeaderClose}>Cerrar</Text>
            </Pressable>
          </View>

          {/* Members list */}
          <FlatList
            data={sortedMembers ?? []}
            keyExtractor={(item) => item.id}
            contentContainerStyle={s.modalListContent}
            renderItem={({ item: member, index }) => {
              const initial = member.displayName.charAt(0).toUpperCase();
              const isCurrentUser = member.userId === currentUserId;
              const canManage = isAdmin && !isCurrentUser;
              const avatarBg = getAvatarColor(index);
              const pts = pointsByUser.get(member.userId) ?? 0;

              return (
                <View style={[s.card, s.cardShadow]}>
                  <Pressable
                    onPress={() => handleNavigateToMemberPredictions(member)}
                    onLongPress={canManage ? () => handleMemberAction(member) : undefined}
                    style={({ pressed }) => pressed ? s.pressedOpacity : undefined}
                  >
                    <View style={s.memberCardRow}>
                      {/* Avatar */}
                      <View style={[s.memberAvatar, { backgroundColor: avatarBg }]}>
                        <Text style={s.memberAvatarText}>{initial}</Text>
                        {member.avatarUrl ? (
                          <Image
                            source={{ uri: member.avatarUrl }}
                            style={s.memberAvatarImage}
                          />
                        ) : null}
                      </View>

                      {/* Name + role */}
                      <View style={s.memberTextCol}>
                        <Text style={s.memberName} numberOfLines={1}>
                          {member.displayName}
                          {isCurrentUser ? ' (Vos)' : ''}
                        </Text>
                        <RoleBadge role={member.role} />
                      </View>

                      {/* Points */}
                      <View style={s.memberPointsCol}>
                        <Text style={s.memberPointsValue}>{pts}</Text>
                        <Text style={s.memberPointsLabel}>pts</Text>
                      </View>
                    </View>
                  </Pressable>
                </View>
              );
            }}
          />
        </View>
      </Modal>
    </View>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  // ── Screen
  screen: {
    flex: 1,
    backgroundColor: '#F0FAF4',
  },

  // ── Header overrides for ScreenHeader
  headerTitleOverride: {
    fontSize: 20,
    fontWeight: '900',
    textTransform: 'none' as const,
  },
  headerSubtitleOverride: {
    fontSize: 11,
    textTransform: 'none' as const,
  },
  headerEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF20',
    borderRadius: 10,
    height: 34,
    paddingHorizontal: 14,
    gap: 6,
  },
  headerEditText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },

  // ── Error state
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
    color: '#6B7280',
  },

  // ── Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    gap: 24,
    paddingBottom: 100, // space for FAB
  },

  // ── Section headers
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  sectionHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionActionText: {
    color: '#0B6E4F',
    fontSize: 13,
    fontWeight: '600',
  },

  // ── Count badges
  countBadgeCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E8F5EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadgeText: {
    color: '#0B6E4F',
    fontSize: 13,
    fontWeight: '700',
  },
  memberCountBadge: {
    borderRadius: 10,
    backgroundColor: '#E8F5EE',
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  memberCountText: {
    color: '#0B6E4F',
    fontSize: 11,
    fontWeight: '700',
  },

  // ── Card list & card base
  cardList: {
    gap: 10,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  cardShadow: Platform.select({
    ios: {
      shadowColor: '#0000000A',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 1,
      shadowRadius: 4,
    },
    android: {
      elevation: 1,
    },
  }) as object,
  pressedOpacity: {
    opacity: 0.7,
  },

  // ── Tournament card
  tournamentCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  tournamentIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F5EE',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  tournamentLogoImage: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  tournamentTextCol: {
    flex: 1,
    marginLeft: 12,
    gap: 2,
  },
  tournamentName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A1A2E',
  },
  tournamentTagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tournamentTag: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  tournamentTagText: {
    fontSize: 11,
    fontWeight: '500',
  },
  tournamentStatus: {
    fontSize: 11,
    color: '#6B7280',
  },
  removeBtn: {
    marginLeft: 8,
    padding: 4,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 12,
  },

  // ── Member card
  memberCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  memberAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  memberAvatarImage: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  memberAvatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  memberTextCol: {
    flex: 1,
    marginLeft: 12,
    gap: 2,
  },
  memberName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A2E',
  },
  memberPointsCol: {
    alignItems: 'flex-end',
    gap: 1,
  },
  memberPointsValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0B6E4F',
  },
  memberPointsLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6B7280',
  },

  // ── Role badge
  roleBadge: {
    alignSelf: 'flex-start',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  roleBadgeAdmin: {
    backgroundColor: '#062E22',
  },
  roleBadgeMember: {
    backgroundColor: '#F0FAF4',
  },
  roleBadgeText: {
    fontSize: 9,
    fontWeight: '700',
  },
  roleBadgeTextAdmin: {
    color: '#FFD166',
  },
  roleBadgeTextMember: {
    color: '#0B6E4F',
  },

  // ── Danger zone
  dangerZoneSpacer: {
    flexGrow: 1,
  },
  dangerButton: {
    backgroundColor: '#FEF2F2',
    borderRadius: 14,
    overflow: 'hidden',
  },
  dangerButtonBorder: {
    borderWidth: 1,
    borderColor: '#E63946',
  },
  dangerButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 8,
  },
  dangerButtonText: {
    color: '#E63946',
    fontSize: 14,
    fontWeight: '600',
  },
  deleteGroupWrapper: {
    marginTop: 12,
    alignItems: 'center',
  },
  deleteGroupText: {
    color: '#E63946',
    fontSize: 13,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },

  // ── FAB
  fab: {
    position: 'absolute',
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#0B6E4F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabShadow: Platform.select({
    ios: {
      shadowColor: '#0B6E4F40',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 1,
      shadowRadius: 12,
    },
    android: {
      elevation: 8,
    },
  }) as object,

  // ── Members modal
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHandleBarRow: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 4,
    backgroundColor: '#FFFFFF',
  },
  modalHandleBar: {
    width: 36,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#D1D5DB',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalHeaderTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A1A2E',
  },
  modalHeaderClose: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0B6E4F',
  },
  modalListContent: {
    padding: 20,
    gap: 10,
  },
});
