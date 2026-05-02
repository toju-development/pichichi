/**
 * Smoke tests para los hooks de groups. Cubren paridad con mobile en lo
 * crítico:
 *   - `useMyGroups` consume `groupsApi.getMyGroups()` con la query key
 *     `queryKeys.groups.all`.
 *   - `useCreateGroup` invalida `groups.all` tras éxito (write-side
 *     invalidation contractual con mobile).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

import type { GroupDto } from "@pichichi/shared";

const getMyGroupsMock = vi.fn();
const createGroupMock = vi.fn();
const removeMemberMock = vi.fn();
vi.mock("@/api", async () => {
  const actual = await vi.importActual<typeof import("@/api")>("@/api");
  return {
    ...actual,
    groupsApi: {
      ...actual.groupsApi,
      getMyGroups: (...args: unknown[]) => getMyGroupsMock(...args),
      createGroup: (...args: unknown[]) => createGroupMock(...args),
      removeMember: (...args: unknown[]) => removeMemberMock(...args),
    },
  };
});

import { queryKeys } from "@/hooks/query-keys";
import {
  useCreateGroup,
  useMyGroups,
  useRemoveMember,
} from "@/hooks/use-groups";

const groupFixture: GroupDto = {
  id: "g-1",
  name: "Los del finde",
  description: null,
  inviteCode: "ABCD1234",
  createdBy: "user-1",
  maxMembers: 10,
  memberCount: 1,
  userRole: "ADMIN",
  userPoints: 0,
  createdAt: "2026-01-01T00:00:00.000Z",
};

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  }
  return { qc, Wrapper };
}

describe("useMyGroups", () => {
  beforeEach(() => {
    getMyGroupsMock.mockReset();
  });

  it("consume groupsApi.getMyGroups y devuelve la lista", async () => {
    getMyGroupsMock.mockResolvedValue([groupFixture]);
    const { Wrapper } = makeWrapper();

    const { result } = renderHook(() => useMyGroups(), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(result.current.data).toEqual([groupFixture]);
    expect(getMyGroupsMock).toHaveBeenCalledTimes(1);
  });
});

describe("useCreateGroup", () => {
  beforeEach(() => {
    createGroupMock.mockReset();
  });
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("invalida queryKeys.groups.all tras éxito y prepopula la cache", async () => {
    createGroupMock.mockResolvedValue(groupFixture);
    const { qc, Wrapper } = makeWrapper();
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries");

    const { result } = renderHook(() => useCreateGroup(), { wrapper: Wrapper });

    await result.current.mutateAsync({
      name: "Los del finde",
      maxMembers: 10,
    });

    // TanStack Query v5 passes a mutation context object as the 2nd arg.
    expect(createGroupMock).toHaveBeenCalledTimes(1);
    expect(createGroupMock.mock.calls[0]?.[0]).toEqual({
      name: "Los del finde",
      maxMembers: 10,
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.groups.all,
    });
    expect(qc.getQueryData(queryKeys.groups.all)).toEqual([groupFixture]);
  });
});

describe("useRemoveMember", () => {
  beforeEach(() => {
    removeMemberMock.mockReset();
  });
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("invoca removeMember(groupId, userId) e invalida members + groups.all", async () => {
    removeMemberMock.mockResolvedValue({ message: "ok" });
    const { qc, Wrapper } = makeWrapper();
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries");

    const { result } = renderHook(() => useRemoveMember(), { wrapper: Wrapper });

    await result.current.mutateAsync({ groupId: "g-1", userId: "u-2" });

    expect(removeMemberMock).toHaveBeenCalledTimes(1);
    expect(removeMemberMock.mock.calls[0]?.[0]).toBe("g-1");
    expect(removeMemberMock.mock.calls[0]?.[1]).toBe("u-2");

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.groups.members("g-1"),
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.groups.all,
    });
  });
});
