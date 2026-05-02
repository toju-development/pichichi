/**
 * Smoke test de `useMe`.
 *
 * Cubre 2 casos:
 *   1. Sin sesión (`isAuthenticated: false`) → query queda `disabled`
 *      (TanStack expone esto vía `fetchStatus === "idle"` y `status === "pending"`).
 *   2. Con sesión → ejecuta `usersApi.getMe()` y llama `setUser` del store
 *      con la respuesta del back.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

import type { UserDto } from "@pichichi/shared";
import { useAuthStore } from "@/stores/auth-store";

const getMeMock = vi.fn();
vi.mock("@/api", async () => {
  const actual =
    await vi.importActual<typeof import("@/api")>("@/api");
  return {
    ...actual,
    usersApi: {
      getMe: (...args: unknown[]) => getMeMock(...args),
      updateMe: vi.fn(),
    },
  };
});

import { useMe } from "@/hooks/use-user";

const mockUser: UserDto = {
  id: "user-1",
  email: "messi@example.com",
  displayName: "Lionel Messi",
  username: "leo",
  avatarUrl: null,
  plan: {
    id: "plan-free",
    name: "Free",
    maxGroupsCreated: 3,
    maxMemberships: 5,
    maxMembersPerGroup: 20,
    maxTournamentsPerGroup: 2,
  },
  createdAt: "2026-01-01T00:00:00.000Z",
};

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  };
}

describe("useMe", () => {
  beforeEach(() => {
    getMeMock.mockReset();
    useAuthStore.setState({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
      isHydrated: true,
    });
  });

  afterEach(() => {
    useAuthStore.setState({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
      isHydrated: true,
    });
  });

  it("queda idle cuando no hay sesión (enabled: false)", () => {
    const { result } = renderHook(() => useMe(), { wrapper: makeWrapper() });

    expect(result.current.fetchStatus).toBe("idle");
    expect(getMeMock).not.toHaveBeenCalled();
  });

  it("dispara getMe y guarda el user en el store cuando hay sesión", async () => {
    useAuthStore.setState({
      accessToken: "access-1",
      refreshToken: "refresh-1",
      user: mockUser,
      isAuthenticated: true,
      isHydrated: true,
    });
    getMeMock.mockResolvedValue({ ...mockUser, displayName: "Leo Messi" });

    const { result } = renderHook(() => useMe(), { wrapper: makeWrapper() });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(getMeMock).toHaveBeenCalledTimes(1);
    expect(useAuthStore.getState().user?.displayName).toBe("Leo Messi");
  });
});
