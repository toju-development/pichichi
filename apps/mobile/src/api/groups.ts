import type {
  GroupDto,
  GroupMemberDto,
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
