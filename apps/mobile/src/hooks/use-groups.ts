import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { GroupDto } from '@pichichi/shared';

import * as groupsApi from '@/api/groups';

import { queryKeys } from './query-keys';

export function useMyGroups() {
  return useQuery({
    queryKey: queryKeys.groups.all,
    queryFn: groupsApi.getMyGroups,
  });
}

export function useGroup(id: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.groups.detail(id),
    queryFn: () => groupsApi.getGroup(id),
    enabled: !!id && enabled,
  });
}

export function useGroupMembers(groupId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.groups.members(groupId),
    queryFn: () => groupsApi.getMembers(groupId),
    enabled: !!groupId && enabled,
  });
}

export function useGroupTournaments(groupId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.groups.tournaments(groupId),
    queryFn: () => groupsApi.getGroupTournaments(groupId),
    enabled: !!groupId && enabled,
  });
}

export function useCreateGroup() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: groupsApi.createGroup,
    retry: false,
    onSuccess: (newGroup) => {
      // Optimistic: add to cache immediately for instant UI feedback
      qc.setQueryData<GroupDto[]>(queryKeys.groups.all, (old) =>
        old ? [newGroup, ...old] : [newGroup],
      );
      // Background: sync with server to ensure data consistency
      qc.invalidateQueries({ queryKey: queryKeys.groups.all });
    },
  });
}

export function useJoinGroup() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (inviteCode: string) => groupsApi.joinGroup(inviteCode),
    retry: false,
    onSuccess: (joinedGroup) => {
      // Optimistic: add to cache immediately for instant UI feedback
      qc.setQueryData<GroupDto[]>(queryKeys.groups.all, (old) =>
        old ? [joinedGroup, ...old] : [joinedGroup],
      );
      // Background: sync with server to ensure data consistency
      qc.invalidateQueries({ queryKey: queryKeys.groups.all });
    },
  });
}

export function useLeaveGroup() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (groupId: string) => groupsApi.leaveGroup(groupId),
    retry: false,
    onSuccess: () => {
      // Only refresh the list. The detail screen disables its own queries
      // via the enabled flag before navigating away, so no 404 refetches.
      qc.invalidateQueries({ queryKey: queryKeys.groups.all });
    },
  });
}

export function useAddTournament() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      groupId,
      tournamentId,
    }: {
      groupId: string;
      tournamentId: string;
    }) => groupsApi.addTournament(groupId, tournamentId),
    retry: false,
    onSuccess: (_data, { groupId }) => {
      qc.invalidateQueries({
        queryKey: queryKeys.groups.tournaments(groupId),
      });
    },
  });
}

export function useUpdateGroup() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { name?: string; description?: string; maxMembers?: number };
    }) => groupsApi.updateGroup(id, data),
    retry: false,
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.groups.all });
      qc.invalidateQueries({ queryKey: queryKeys.groups.detail(id) });
    },
  });
}

export function useDeleteGroup() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (groupId: string) => groupsApi.deleteGroup(groupId),
    retry: false,
    onSuccess: () => {
      // Only refresh the list. The detail screen disables its own queries
      // via the enabled flag before navigating away, so no 404 refetches.
      qc.invalidateQueries({ queryKey: queryKeys.groups.all });
    },
  });
}

export function useRemoveMember() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      groupId,
      userId,
    }: {
      groupId: string;
      userId: string;
    }) => groupsApi.removeMember(groupId, userId),
    retry: false,
    onSuccess: (_data, { groupId }) => {
      qc.invalidateQueries({
        queryKey: queryKeys.groups.members(groupId),
      });
      qc.invalidateQueries({ queryKey: queryKeys.groups.all });
    },
  });
}
