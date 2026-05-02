/**
 * ProfilePage smoke tests.
 *
 * Cubre:
 *   - Loading state cuando dashLoading || lbLoading
 *   - Render feliz con stats + position + identity del store
 *   - Fallbacks cuando user/stats/position son null
 *   - Logout flow: click → ConfirmDialog → confirm → useLogout.mutate
 *   - Logout flow: click → ConfirmDialog → cancel → NO mutate
 *
 * Mockea:
 *   - useDashboard, useGlobalLeaderboard, useLogout (hooks externos)
 *   - useAuthStore vía setState con shape COMPLETO (incluyendo plan limits)
 */
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import type {
  DashboardResponseDto,
  LeaderboardEntryDto,
} from "@pichichi/shared";

vi.mock("@/hooks/use-dashboard", () => ({
  useDashboard: vi.fn(),
}));

vi.mock("@/hooks/use-leaderboard", () => ({
  useGlobalLeaderboard: vi.fn(),
}));

vi.mock("@/hooks/use-logout", () => ({
  useLogout: vi.fn(),
}));

import { useDashboard } from "@/hooks/use-dashboard";
import { useGlobalLeaderboard } from "@/hooks/use-leaderboard";
import { useLogout } from "@/hooks/use-logout";
import { useAuthStore } from "@/stores/auth-store";
import ProfilePage from "@/app/app/(authed)/profile/page";

const useDashboardMock = vi.mocked(useDashboard);
const useGlobalLeaderboardMock = vi.mocked(useGlobalLeaderboard);
const useLogoutMock = vi.mocked(useLogout);

const baseStats: DashboardResponseDto = {
  stats: {
    totalPoints: 142,
    totalPredictions: 30,
    exactCount: 5,
    accuracy: 73.4,
    groupCount: 2,
  },
  todayMatches: [],
  groups: [],
};

const baseEntry: LeaderboardEntryDto = {
  position: 7,
  userId: "u-1",
  displayName: "Me",
  username: "me",
  avatarUrl: null,
  totalPoints: 142,
  exactCount: 5,
  goalDiffCount: 0,
  winnerCount: 0,
  missCount: 0,
  bonusPoints: 0,
  streak: 0,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function setDashboard(state: Record<string, any>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useDashboardMock.mockReturnValue(state as any);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function setLeaderboard(state: Record<string, any>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useGlobalLeaderboardMock.mockReturnValue(state as any);
}

let mutateMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  mutateMock = vi.fn().mockResolvedValue(undefined);
  useLogoutMock.mockReturnValue({
    mutate: mutateMock,
    isPending: false,
  });

  useAuthStore.setState({
    accessToken: "tok",
    refreshToken: "ref",
    user: {
      id: "u-1",
      email: "me@example.com",
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
  cleanup();
  useDashboardMock.mockReset();
  useGlobalLeaderboardMock.mockReset();
  useLogoutMock.mockReset();
  useAuthStore.setState({
    accessToken: null,
    refreshToken: null,
    user: null,
    isAuthenticated: false,
    isHydrated: true,
  });
});

describe("ProfilePage", () => {
  it("muestra loading mientras dashboard o leaderboard cargan", () => {
    setDashboard({ data: undefined, isLoading: true });
    setLeaderboard({ currentUserEntry: null, isLoading: false });

    render(<ProfilePage />);

    expect(screen.getByTestId("page-profile")).toBeInTheDocument();
    expect(screen.getByTestId("page-profile-loading")).toBeInTheDocument();
    expect(
      screen.queryByTestId("profile-stats-grid"),
    ).not.toBeInTheDocument();
  });

  it("renderiza header con identity + stats + ranking + logout", () => {
    setDashboard({ data: baseStats, isLoading: false });
    setLeaderboard({ currentUserEntry: baseEntry, isLoading: false });

    render(<ProfilePage />);

    // Header
    expect(
      screen.getByTestId("profile-header-display-name").textContent,
    ).toBe("Me");
    expect(screen.getByTestId("profile-header-username").textContent).toBe(
      "@me",
    );
    expect(screen.getByTestId("profile-header-email").textContent).toBe(
      "me@example.com",
    );
    expect(screen.getByTestId("profile-header-avatar").textContent).toBe("M");

    // Stats grid (todas las celdas con sus valores correctos)
    expect(screen.getByTestId("profile-stats-grid")).toBeInTheDocument();
    expect(
      screen.getByTestId("profile-stat-card-predictions").textContent,
    ).toContain("30");
    expect(
      screen.getByTestId("profile-stat-card-exact").textContent,
    ).toContain("5");
    expect(
      screen.getByTestId("profile-stat-card-points").textContent,
    ).toContain("142");
    expect(
      screen.getByTestId("profile-stat-card-accuracy").textContent,
    ).toContain("73%");
    expect(
      screen.getByTestId("profile-stat-card-ranking").textContent,
    ).toContain("#7");
    expect(
      screen.getByTestId("profile-stat-card-groups").textContent,
    ).toContain("2");

    // Logout CTA
    expect(screen.getByTestId("profile-logout-button")).toBeInTheDocument();
  });

  it("usa fallbacks cuando stats es null y position es null", () => {
    setDashboard({
      data: { ...baseStats, stats: null },
      isLoading: false,
    });
    setLeaderboard({ currentUserEntry: null, isLoading: false });

    render(<ProfilePage />);

    expect(
      screen.getByTestId("profile-stat-card-predictions").textContent,
    ).toContain("0");
    expect(
      screen.getByTestId("profile-stat-card-accuracy").textContent,
    ).toContain("0%");
    expect(
      screen.getByTestId("profile-stat-card-ranking").textContent,
    ).toContain("–");
  });

  it("usa fallback 'Usuario' cuando user es null en el store", () => {
    useAuthStore.setState({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
      isHydrated: true,
    });
    setDashboard({ data: baseStats, isLoading: false });
    setLeaderboard({ currentUserEntry: null, isLoading: false });

    render(<ProfilePage />);

    expect(
      screen.getByTestId("profile-header-display-name").textContent,
    ).toBe("Usuario");
    expect(screen.getByTestId("profile-header-avatar").textContent).toBe("U");
    // username/email vacíos → no se renderizan
    expect(
      screen.queryByTestId("profile-header-username"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("profile-header-email"),
    ).not.toBeInTheDocument();
  });

  it("logout flow: click → confirm → mutate dispara", async () => {
    setDashboard({ data: baseStats, isLoading: false });
    setLeaderboard({ currentUserEntry: baseEntry, isLoading: false });

    render(<ProfilePage />);

    fireEvent.click(screen.getByTestId("profile-logout-button"));

    // ConfirmDialog mounted con testId custom
    const confirmBtn = await screen.findByTestId(
      "profile-logout-confirm-confirm",
    );
    expect(
      screen.getByTestId("profile-logout-confirm"),
    ).toBeInTheDocument();

    fireEvent.click(confirmBtn);

    // Microtask flush
    await Promise.resolve();
    await Promise.resolve();

    expect(mutateMock).toHaveBeenCalledTimes(1);
  });

  it("logout flow: click → cancel → NO mutate", async () => {
    setDashboard({ data: baseStats, isLoading: false });
    setLeaderboard({ currentUserEntry: baseEntry, isLoading: false });

    render(<ProfilePage />);

    fireEvent.click(screen.getByTestId("profile-logout-button"));

    const cancelBtn = await screen.findByTestId(
      "profile-logout-confirm-cancel",
    );
    fireEvent.click(cancelBtn);

    await Promise.resolve();
    await Promise.resolve();

    expect(mutateMock).not.toHaveBeenCalled();
  });
});
