import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.groups.all });
    },
  });
}

export function useJoinGroup() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (inviteCode: string) => groupsApi.joinGroup(inviteCode),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.groups.all });
    },
  });
}

export function useLeaveGroup() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (groupId: string) => groupsApi.leaveGroup(groupId),
    onSuccess: () => {
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
    onSuccess: (_data, { groupId }) => {
      qc.invalidateQueries({
        queryKey: queryKeys.groups.tournaments(groupId),
      });
    },
  });
}
