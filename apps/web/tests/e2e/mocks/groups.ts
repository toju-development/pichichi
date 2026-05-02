import type { GroupDto, GroupMemberDto } from "@pichichi/shared";

import { MOCK_USER } from "./users";

export const MOCK_GROUP_PRIMARY: GroupDto = {
  id: "group-1",
  name: "Los cracks del mundial",
  description: "Grupo de prueba para E2E",
  inviteCode: "ABC123",
  createdBy: MOCK_USER.id,
  maxMembers: 20,
  memberCount: 5,
  userRole: "ADMIN",
  userPoints: 42,
  createdAt: "2026-01-15T12:00:00.000Z",
};

export const MOCK_GROUP_SECONDARY: GroupDto = {
  id: "group-2",
  name: "Pronos del barrio",
  description: null,
  inviteCode: null,
  createdBy: "user-other",
  maxMembers: 10,
  memberCount: 3,
  userRole: "MEMBER",
  userPoints: 18,
  createdAt: "2026-02-01T10:00:00.000Z",
};

export const MOCK_GROUPS: GroupDto[] = [MOCK_GROUP_PRIMARY, MOCK_GROUP_SECONDARY];

export const MOCK_GROUP_MEMBERS: GroupMemberDto[] = [
  {
    id: "membership-1",
    userId: MOCK_USER.id,
    displayName: MOCK_USER.displayName,
    username: MOCK_USER.username,
    avatarUrl: MOCK_USER.avatarUrl,
    role: "ADMIN",
    joinedAt: "2026-01-15T12:00:00.000Z",
  },
  {
    id: "membership-2",
    userId: "user-2",
    displayName: "Ana Pérez",
    username: "anap",
    avatarUrl: null,
    role: "MEMBER",
    joinedAt: "2026-01-16T12:00:00.000Z",
  },
  {
    id: "membership-3",
    userId: "user-3",
    displayName: "Marco Díaz",
    username: "mdiaz",
    avatarUrl: null,
    role: "MEMBER",
    joinedAt: "2026-01-17T12:00:00.000Z",
  },
];

/** A freshly-created group payload that the create-group flow expects. */
export const MOCK_GROUP_CREATED: GroupDto = {
  id: "group-new",
  name: "Grupo nuevo E2E",
  description: null,
  inviteCode: "NEW123",
  createdBy: MOCK_USER.id,
  maxMembers: 20,
  memberCount: 1,
  userRole: "ADMIN",
  userPoints: 0,
  createdAt: "2026-05-01T10:00:00.000Z",
};
