/**
 * LeaderboardList component smoke tests.
 *
 * Cubre:
 *   - render entries con podio + lista cuando hay data
 *   - empty state cuando entries.length === 0
 *   - loading state mientras query.isLoading
 *   - error state cuando query.isError
 *   - highlight de current user (delega a LeaderboardEntry via isCurrentUser)
 *
 * Mockea `useLeaderboard` directamente para evitar acoplar a TanStack
 * Query / network. `useAuthStore` se setea con setState (Zustand real).
 */
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

import type { LeaderboardDto, LeaderboardEntryDto } from "@pichichi/shared";

vi.mock("@/hooks/use-leaderboard", () => ({
  useLeaderboard: vi.fn(),
}));

import { useLeaderboard } from "@/hooks/use-leaderboard";
import { useAuthStore } from "@/stores/auth-store";
import { LeaderboardList } from "@/features/leaderboard/leaderboard-list";

const useLeaderboardMock = vi.mocked(useLeaderboard);

function makeEntry(
  position: number,
  overrides: Partial<LeaderboardEntryDto> = {},
): LeaderboardEntryDto {
  return {
    position,
    userId: `u-${position}`,
    displayName: `User${position}`,
    username: `user${position}`,
    avatarUrl: null,
    totalPoints: 100 - position * 10,
    exactCount: 0,
    goalDiffCount: 0,
    winnerCount: 0,
    missCount: 0,
    bonusPoints: 0,
    streak: 0,
    ...overrides,
  };
}

function makeLeaderboard(
  entries: LeaderboardEntryDto[],
): LeaderboardDto {
  return {
    groupId: "g-1",
    groupName: "Group 1",
    tournamentId: "t-1",
    entries,
    totalMembers: entries.length,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function setQuery(state: Record<string, any>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useLeaderboardMock.mockReturnValue(state as any);
}

beforeEach(() => {
  useAuthStore.setState({
    accessToken: "tok",
    refreshToken: "ref",
    user: {
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
    },
    isAuthenticated: true,
    isHydrated: true,
  });
});

afterEach(() => {
  // Unmount BEFORE resetting the mock — evita re-renders con mock undefined.
  cleanup();
  useLeaderboardMock.mockReset();
  useAuthStore.setState({
    accessToken: null,
    refreshToken: null,
    user: null,
    isAuthenticated: false,
    isHydrated: true,
  });
});

describe("LeaderboardList", () => {
  it("muestra loading mientras la query carga", () => {
    setQuery({ isLoading: true, isError: false, data: undefined, refetch: vi.fn() });
    render(<LeaderboardList groupId="g-1" />);
    expect(screen.getByTestId("leaderboard-list-loading")).toBeInTheDocument();
  });

  it("muestra error state cuando query.isError", () => {
    setQuery({ isLoading: false, isError: true, data: undefined, refetch: vi.fn() });
    render(<LeaderboardList groupId="g-1" />);
    expect(screen.getByTestId("leaderboard-list-error")).toBeInTheDocument();
  });

  it("muestra empty state cuando entries vacío", () => {
    setQuery({
      isLoading: false,
      isError: false,
      data: makeLeaderboard([]),
      refetch: vi.fn(),
    });
    render(<LeaderboardList groupId="g-1" />);
    expect(screen.getByTestId("leaderboard-list-empty")).toBeInTheDocument();
  });

  it("renderiza podio + lista y resalta al current user", () => {
    const entries = [
      makeEntry(1, { userId: "u-1", displayName: "Me" }),
      makeEntry(2, { userId: "u-2", displayName: "Other" }),
      makeEntry(3, { userId: "u-3", displayName: "Third" }),
    ];
    setQuery({
      isLoading: false,
      isError: false,
      data: makeLeaderboard(entries),
      refetch: vi.fn(),
    });
    render(<LeaderboardList groupId="g-1" />);

    expect(screen.getByTestId("leaderboard-list")).toBeInTheDocument();
    expect(screen.getByTestId("podium")).toBeInTheDocument();

    const rows = screen.getAllByTestId("leaderboard-entry");
    expect(rows).toHaveLength(3);

    const highlighted = rows.filter(
      (r) => r.getAttribute("data-current-user") === "true",
    );
    expect(highlighted).toHaveLength(1);
    expect(highlighted[0].textContent).toContain("Me");
  });
});
