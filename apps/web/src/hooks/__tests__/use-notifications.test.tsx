/**
 * Smoke tests para hooks de notifications. Cubren paridad mobile en lo crítico:
 *   - `useUnreadCount` está gateado por `isAuthenticated` (no fetchea si false).
 *   - `useUnreadCount` consume `getUnreadCount` y guarda en query key
 *     `queryKeys.notifications.unreadCount`.
 *   - `useMarkAllAsRead` invalida `notifications.all` y `notifications.unreadCount`
 *     tras success (paridad mobile).
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

const getUnreadCountMock = vi.fn();
const markAllAsReadMock = vi.fn();

vi.mock("@/api", async () => {
  const actual = await vi.importActual<typeof import("@/api")>("@/api");
  return {
    ...actual,
    notificationsApi: {
      ...actual.notificationsApi,
      getUnreadCount: (...args: unknown[]) => getUnreadCountMock(...args),
      markAllAsRead: (...args: unknown[]) => markAllAsReadMock(...args),
    },
  };
});

import { queryKeys } from "@/hooks/query-keys";
import {
  useMarkAllAsRead,
  useUnreadCount,
} from "@/hooks/use-notifications";
import { useAuthStore } from "@/stores/auth-store";

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  }
  return { qc, Wrapper };
}

function setAuthenticated(isAuthenticated: boolean) {
  useAuthStore.setState({
    accessToken: isAuthenticated ? "tok" : null,
    refreshToken: isAuthenticated ? "ref" : null,
    user: isAuthenticated
      ? {
          id: "u-1",
          email: "x@y.com",
          displayName: "Me",
          username: "me",
          avatarUrl: null,
          plan: {
            id: "p",
            name: "Free",
            maxGroupsCreated: 1,
            maxMemberships: 1,
            maxMembersPerGroup: 1,
            maxTournamentsPerGroup: 1,
          },
          createdAt: "2026-01-01T00:00:00.000Z",
        }
      : null,
    isAuthenticated,
    isHydrated: true,
  });
}

describe("useUnreadCount", () => {
  beforeEach(() => {
    getUnreadCountMock.mockReset();
  });

  it("no fetchea cuando isAuthenticated === false", () => {
    setAuthenticated(false);
    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useUnreadCount(), {
      wrapper: Wrapper,
    });

    expect(result.current.fetchStatus).toBe("idle");
    expect(getUnreadCountMock).not.toHaveBeenCalled();
  });

  it("consume getUnreadCount y guarda en query key unreadCount", async () => {
    setAuthenticated(true);
    getUnreadCountMock.mockResolvedValue({ count: 7 });
    const { qc, Wrapper } = makeWrapper();

    const { result } = renderHook(() => useUnreadCount(), {
      wrapper: Wrapper,
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(getUnreadCountMock).toHaveBeenCalledTimes(1);
    expect(qc.getQueryData(queryKeys.notifications.unreadCount)).toEqual({
      count: 7,
    });
  });
});

describe("useMarkAllAsRead", () => {
  beforeEach(() => {
    markAllAsReadMock.mockReset();
    setAuthenticated(true);
  });

  it("invalida notifications.all y notifications.unreadCount tras success", async () => {
    markAllAsReadMock.mockResolvedValue(undefined);
    const { qc, Wrapper } = makeWrapper();
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries");

    const { result } = renderHook(() => useMarkAllAsRead(), {
      wrapper: Wrapper,
    });

    result.current.mutate();

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const invalidatedKeys = invalidateSpy.mock.calls.map(
      (c) => (c[0] as { queryKey: unknown }).queryKey,
    );

    expect(invalidatedKeys).toEqual(
      expect.arrayContaining([
        queryKeys.notifications.all,
        queryKeys.notifications.unreadCount,
      ]),
    );
  });
});
