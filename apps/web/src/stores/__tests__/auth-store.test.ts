import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { STORAGE_KEY_AUTH } from "@/lib/storage";
import { useAuthStore } from "@/stores/auth-store";
import type { AuthResponseDto, UserDto } from "@pichichi/shared";

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

const mockAuth: AuthResponseDto = {
  accessToken: "access-1",
  refreshToken: "refresh-1",
  user: mockUser,
};

describe("auth-store", () => {
  beforeEach(() => {
    window.localStorage.clear();
    // Reset store a estado inicial (post-hydration).
    useAuthStore.setState({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
      isHydrated: true,
    });
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it("starts with no session", () => {
    const state = useAuthStore.getState();
    expect(state.accessToken).toBeNull();
    expect(state.refreshToken).toBeNull();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it("login() sets tokens, user and isAuthenticated", () => {
    useAuthStore.getState().login(mockAuth);

    const state = useAuthStore.getState();
    expect(state.accessToken).toBe("access-1");
    expect(state.refreshToken).toBe("refresh-1");
    expect(state.user).toEqual(mockUser);
    expect(state.isAuthenticated).toBe(true);
  });

  it("login() persists tokens and user into localStorage", () => {
    useAuthStore.getState().login(mockAuth);

    const raw = window.localStorage.getItem(STORAGE_KEY_AUTH);
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed.state.accessToken).toBe("access-1");
    expect(parsed.state.refreshToken).toBe("refresh-1");
    expect(parsed.state.user.id).toBe("user-1");
    // isAuthenticated NO se persiste (deriva).
    expect(parsed.state.isAuthenticated).toBeUndefined();
  });

  it("logout() clears state but keeps isHydrated true", () => {
    useAuthStore.getState().login(mockAuth);
    useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.accessToken).toBeNull();
    expect(state.refreshToken).toBeNull();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.isHydrated).toBe(true);
  });

  it("setTokens() updates tokens and re-derives isAuthenticated when user exists", () => {
    useAuthStore.getState().login(mockAuth);
    useAuthStore.getState().setTokens("access-2", "refresh-2");

    const state = useAuthStore.getState();
    expect(state.accessToken).toBe("access-2");
    expect(state.refreshToken).toBe("refresh-2");
    expect(state.isAuthenticated).toBe(true);
  });

  it("setUser() flips isAuthenticated to true when access token already exists", () => {
    useAuthStore.setState({
      accessToken: "access-1",
      refreshToken: "refresh-1",
      user: null,
      isAuthenticated: false,
    });

    useAuthStore.getState().setUser(mockUser);
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });

  it("rehydrate() restores tokens from localStorage and flips isHydrated", async () => {
    // Forzamos estado limpio in-memory PRIMERO (antes de sembrar localStorage),
    // porque cualquier setState mientras el persist middleware está activo
    // dispara un write que sobrescribiría el seed.
    useAuthStore.setState({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
      isHydrated: false,
    });

    // Limpiamos cualquier write residual del setState anterior y sembramos.
    window.localStorage.clear();
    window.localStorage.setItem(
      STORAGE_KEY_AUTH,
      JSON.stringify({
        state: {
          accessToken: "access-seed",
          refreshToken: "refresh-seed",
          user: mockUser,
        },
        version: 0,
      }),
    );

    await useAuthStore.persist.rehydrate();

    const state = useAuthStore.getState();
    expect(state.accessToken).toBe("access-seed");
    expect(state.refreshToken).toBe("refresh-seed");
    expect(state.user?.id).toBe("user-1");
    expect(state.isAuthenticated).toBe(true);
    expect(state.isHydrated).toBe(true);
  });
});
