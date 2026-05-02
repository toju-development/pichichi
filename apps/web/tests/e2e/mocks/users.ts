import type { PlanDto, UserDto } from "@pichichi/shared";

/**
 * Base auth mocks — single user with a generous plan so create-group flows
 * work without hitting the plan-limit gate by default.
 */

export const MOCK_PLAN: PlanDto = {
  id: "plan-pro",
  name: "Pro",
  maxGroupsCreated: 10,
  maxMemberships: 20,
  maxMembersPerGroup: 50,
  maxTournamentsPerGroup: 10,
};

export const MOCK_PLAN_FREE: PlanDto = {
  id: "plan-free",
  name: "Free",
  maxGroupsCreated: 1,
  maxMemberships: 3,
  maxMembersPerGroup: 10,
  maxTournamentsPerGroup: 1,
};

export const MOCK_USER: UserDto = {
  id: "user-current",
  email: "tester@pichichi.app",
  displayName: "Test User",
  username: "tester",
  avatarUrl: null,
  plan: MOCK_PLAN,
  createdAt: "2026-01-01T00:00:00.000Z",
};

/** Mock user that already hit the FREE-plan group-creation limit. */
export const MOCK_USER_FREE_AT_LIMIT: UserDto = {
  ...MOCK_USER,
  id: "user-free-limit",
  plan: MOCK_PLAN_FREE,
};

export const MOCK_TOKENS = {
  accessToken: "e2e-mock-access-token.jwt.placeholder",
  refreshToken: "e2e-mock-refresh-token.jwt.placeholder",
};
