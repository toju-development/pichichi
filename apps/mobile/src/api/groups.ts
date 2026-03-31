import type {
  GroupDto,
  GroupMemberDto,
  TournamentDto,
} from '@pichichi/shared';

import { api } from './client';

export async function getMyGroups(
  params?: { tournamentId?: string },
): Promise<GroupDto[]> {
  const { data } = await api.get<GroupDto[]>('/groups', { params });
  return data;
}

export async function getGroup(id: string): Promise<GroupDto> {
  const { data } = await api.get<GroupDto>(`/groups/${id}`);
  return data;
}

export async function createGroup(dto: {
  name: string;
  description?: string;
  maxMembers?: number;
}): Promise<GroupDto> {
  const { data } = await api.post<GroupDto>('/groups', dto);
  return data;
}

export async function joinGroup(inviteCode: string): Promise<GroupDto> {
  const { data } = await api.post<GroupDto>('/groups/join', { inviteCode });
  return data;
}

export async function leaveGroup(
  id: string,
): Promise<{ message: string }> {
  const { data } = await api.post<{ message: string }>(
    `/groups/${id}/leave`,
  );
  return data;
}

export async function getMembers(
  groupId: string,
): Promise<GroupMemberDto[]> {
  const { data } = await api.get<GroupMemberDto[]>(
    `/groups/${groupId}/members`,
  );
  return data;
}

export async function addTournament(
  groupId: string,
  tournamentId: string,
): Promise<{ groupId: string; tournamentId: string }> {
  const { data } = await api.post<{ groupId: string; tournamentId: string }>(
    `/groups/${groupId}/tournaments`,
    { tournamentId },
  );
  return data;
}

export async function getGroupTournaments(
  groupId: string,
): Promise<TournamentDto[]> {
  const { data } = await api.get<TournamentDto[]>(
    `/groups/${groupId}/tournaments`,
  );
  return data;
}

export async function updateGroup(
  id: string,
  dto: { name?: string; description?: string; maxMembers?: number },
): Promise<GroupDto> {
  const { data } = await api.patch<GroupDto>(`/groups/${id}`, dto);
  return data;
}

export async function deleteGroup(
  id: string,
): Promise<{ action: 'deleted' | 'archived' }> {
  const { data } = await api.delete<{ action: 'deleted' | 'archived' }>(
    `/groups/${id}`,
  );
  return data;
}

export async function removeMember(
  groupId: string,
  userId: string,
): Promise<{ message: string }> {
  const { data } = await api.delete<{ message: string }>(
    `/groups/${groupId}/members/${userId}`,
  );
  return data;
}

export async function checkRemoveTournament(
  groupId: string,
  tournamentId: string,
): Promise<{ canRemove: boolean; predictionsCount: number; reason: string | null }> {
  const { data } = await api.get<{
    canRemove: boolean;
    predictionsCount: number;
    reason: string | null;
  }>(`/groups/${groupId}/tournaments/${tournamentId}/check-remove`);
  return data;
}

export async function removeTournament(
  groupId: string,
  tournamentId: string,
): Promise<{ action: string; predictionsDeleted: number }> {
  const { data } = await api.delete<{
    action: string;
    predictionsDeleted: number;
  }>(`/groups/${groupId}/tournaments/${tournamentId}`);
  return data;
}
