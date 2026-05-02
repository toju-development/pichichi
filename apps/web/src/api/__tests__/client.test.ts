/**
 * Smoke test del refresh queue del API client.
 *
 * Caso crítico: dos requests concurrentes reciben 401, debe disparar UNA SOLA
 * llamada a `/auth/refresh`. El primer request rota tokens, el segundo espera
 * en la cola y reintenta con el nuevo token.
 *
 * Mockeamos axios a nivel módulo para no tocar red real.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ─── Mock de axios ───────────────────────────────────────────────────────────
//
// IMPORTANTE: el factory de `vi.mock` se hoistea al top del archivo, antes que
// cualquier `const`. Por eso TODO lo que el factory toca tiene que vivir dentro
// de `vi.hoisted`.

const { mockInstance, standalonePost } = vi.hoisted(() => {
  const standalonePost = vi.fn();

  type LocalMockInstance = {
    defaults: { baseURL: string };
    interceptors: {
      request: { use: (fn: (c: { headers: Record<string, string>; url?: string }) => unknown) => void };
      response: {
        use: (
          onFulfilled: (r: unknown) => unknown,
          onRejected: (e: unknown) => unknown,
        ) => void;
      };
    };
    __requestInterceptor?: (c: { headers: Record<string, string>; url?: string }) => unknown;
    __responseRejected?: (e: unknown) => unknown;
    __handler: (config: {
      url?: string;
      headers: Record<string, string>;
      _retry?: boolean;
    }) => Promise<{ data: unknown; status: number; config: unknown }>;
    (config: { url?: string; headers?: Record<string, string>; _retry?: boolean }): Promise<unknown>;
    post: (url: string, body?: unknown) => Promise<unknown>;
  };

  const baseFn = (config: {
    url?: string;
    headers?: Record<string, string>;
    _retry?: boolean;
  }) => {
    const merged = {
      url: config.url,
      headers: config.headers ?? {},
      _retry: config._retry ?? false,
    };
    if (instance.__requestInterceptor) {
      instance.__requestInterceptor(merged);
    }
    return instance.__handler(merged).catch((err: unknown) => {
      if (instance.__responseRejected) {
        return instance.__responseRejected(err);
      }
      throw err;
    });
  };

  const instance = baseFn as unknown as LocalMockInstance;
  instance.defaults = { baseURL: "" };
  instance.__handler = async () => ({
    data: {},
    status: 200,
    config: { headers: {} },
  });
  instance.interceptors = {
    request: {
      use: (fn) => {
        instance.__requestInterceptor = fn;
      },
    },
    response: {
      use: (_onFulfilled, onRejected) => {
        instance.__responseRejected = onRejected;
      },
    },
  };
  instance.post = vi.fn();

  return { mockInstance: instance, standalonePost };
});

vi.mock("axios", () => {
  return {
    default: {
      create: () => mockInstance,
      post: standalonePost,
    },
  };
});

// ─── Imports del SUT (después del mock) ───────────────────────────────────────

import { api, __resetRefreshQueueForTests } from "@/api/client";
import { useAuthStore } from "@/stores/auth-store";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeAxiosError(config: {
  url?: string;
  headers: Record<string, string>;
  _retry?: boolean;
}): { response: { status: number }; config: typeof config } {
  return {
    response: { status: 401 },
    config,
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("api client refresh queue", () => {
  beforeEach(() => {
    __resetRefreshQueueForTests();
    standalonePost.mockReset();
    useAuthStore.setState({
      accessToken: "old-access",
      refreshToken: "old-refresh",
      user: {
        id: "u1",
        email: "x@y.com",
        displayName: "X",
        username: "x",
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
    __resetRefreshQueueForTests();
  });

  it("two concurrent 401s trigger ONE refresh and both retry with the new token", async () => {
    // Diferimos la respuesta de /auth/refresh para verificar que el segundo
    // request quede en la cola mientras el primero refresca.
    let resolveRefresh!: (value: { data: { accessToken: string; refreshToken: string } }) => void;
    const refreshPromise = new Promise<{
      data: { accessToken: string; refreshToken: string };
    }>((resolve) => {
      resolveRefresh = resolve;
    });
    standalonePost.mockReturnValue(refreshPromise);

    // Primer call al handler: 401. Segundo call (retry con nuevo token): 200.
    const retriedAuthHeaders: string[] = [];
    let callCount = 0;
    mockInstance.__handler = async (config) => {
      callCount += 1;
      if (config._retry) {
        retriedAuthHeaders.push(config.headers.Authorization);
        return { data: { ok: true, n: callCount }, status: 200, config };
      }
      throw makeAxiosError(config);
    };

    // Disparar dos requests concurrentes.
    const p1 = api({ url: "/groups", headers: {} });
    const p2 = api({ url: "/tournaments", headers: {} });

    // Dejá que los rejects propaguen al interceptor y armen la cola.
    await Promise.resolve();
    await Promise.resolve();

    // Sólo UNA llamada a /auth/refresh.
    expect(standalonePost).toHaveBeenCalledTimes(1);
    expect(standalonePost.mock.calls[0]?.[0]).toContain("/auth/refresh");
    expect(standalonePost.mock.calls[0]?.[1]).toEqual({ refreshToken: "old-refresh" });

    // Resolver el refresh.
    resolveRefresh({
      data: { accessToken: "new-access", refreshToken: "new-refresh" },
    });

    const [r1, r2] = (await Promise.all([p1, p2])) as Array<{
      data: { ok: boolean };
    }>;
    expect(r1.data.ok).toBe(true);
    expect(r2.data.ok).toBe(true);

    // Ambos retries usan el nuevo token.
    expect(retriedAuthHeaders).toHaveLength(2);
    for (const h of retriedAuthHeaders) {
      expect(h).toBe("Bearer new-access");
    }

    // El store quedó actualizado con los nuevos tokens.
    const state = useAuthStore.getState();
    expect(state.accessToken).toBe("new-access");
    expect(state.refreshToken).toBe("new-refresh");
  });

  it("if refresh fails, both queued requests reject and store is logged out", async () => {
    standalonePost.mockRejectedValue(new Error("refresh-failed"));

    mockInstance.__handler = async (config) => {
      throw makeAxiosError(config);
    };

    const p1 = api({ url: "/groups", headers: {} });
    const p2 = api({ url: "/tournaments", headers: {} });

    await expect(p1).rejects.toBeDefined();
    await expect(p2).rejects.toBeDefined();

    expect(standalonePost).toHaveBeenCalledTimes(1);
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().accessToken).toBeNull();
  });
});
