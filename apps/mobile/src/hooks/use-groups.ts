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

export function useGroup(id: string) {
  return useQuery({
    queryKey: queryKeys.groups.detail(id),
    queryFn: () => groupsApi.getGroup(id),
    enabled: !!id,
  });
}

export function useGroupMembers(groupId: string) {
  return useQuery({
    queryKey: queryKeys.groups.members(groupId),
    queryFn: () => groupsApi.getMembers(groupId),
    enabled: !!groupId,
  });
}

export function useGroupTournaments(groupId: string) {
  return useQuery({
    queryKey: queryKeys.groups.tournaments(groupId),
    queryFn: () => groupsApi.getGroupTournaments(groupId),
    enabled: !!groupId,
  });
}

export function useCreateGroup() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: groupsApi.createGroup,
    retry: false,
    onSuccess: (newGroup) => {
      qc.setQueryData<GroupDto[]>(queryKeys.groups.all, (old) =>
        old ? [newGroup, ...old] : [newGroup],
      );
    },
  });
}

export function useJoinGroup() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (inviteCode: string) => groupsApi.joinGroup(inviteCode),
    retry: false,
    onSuccess: (joinedGroup) => {
      qc.setQueryData<GroupDto[]>(queryKeys.groups.all, (old) =>
        old ? [joinedGroup, ...old] : [joinedGroup],
      );
    },
  });
}

export function useLeaveGroup() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (groupId: string) => groupsApi.leaveGroup(groupId),
    retry: false,
    onSuccess: (_data, groupId) => {
      qc.invalidateQueries({ queryKey: queryKeys.groups.all });
      qc.invalidateQueries({ queryKey: queryKeys.groups.detail(groupId) });
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
