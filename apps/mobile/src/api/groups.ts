import type {
  GroupDto,
  GroupMemberDto,
  GroupMemberRole,
  TournamentDto,
} from '@pichichi/shared';

import { api } from './client';

export async function getMyGroups(): Promise<GroupDto[]> {
  const { data } = await api.get<GroupDto[]>('/groups');
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
  dto: { name?: string; description?: string },
): Promise<GroupDto> {
  const { data } = await api.patch<GroupDto>(`/groups/${id}`, dto);
  return data;
}

export async function deleteGroup(
  id: string,
): Promise<{ message: string }> {
  const { data } = await api.delete<{ message: string }>(`/groups/${id}`);
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

export async function updateMemberRole(
  groupId: string,
  userId: string,
  role: GroupMemberRole,
): Promise<GroupMemberDto> {
  const { data } = await api.patch<GroupMemberDto>(
    `/groups/${groupId}/members/${userId}/role`,
    { role },
  );
  return data;
}
