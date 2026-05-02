/**
 * Smoke test del `SocketProvider` — lifecycle visibility.
 *
 * Mockeamos `@/lib/socket` para devolver un fake socket controlable.
 * Verificamos:
 *  1. Con accessToken y `document.hidden = false`, el socket conecta.
 *  2. Al disparar `visibilitychange` con `document.hidden = true`, el
 *     socket desconecta.
 *  3. Al volver a visible, el socket reconecta + invalidateQueries fue
 *     llamado.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// ─── Mock de @/lib/socket ────────────────────────────────────────────────────
//
// Un "socket fake" con on/off/connect/disconnect espiados. `getSocket()`
// devuelve siempre la misma instancia entre llamadas, igual que el real.

const { fakeSocket, getSocketMock, destroySocketMock } = vi.hoisted(() => {
  type Listener = (...args: unknown[]) => void;
  const listeners = new Map<string, Set<Listener>>();

  const fake = {
    id: "fake-socket",
    on: vi.fn((event: string, fn: Listener) => {
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event)!.add(fn);
    }),
    off: vi.fn((event: string, fn: Listener) => {
      listeners.get(event)?.delete(fn);
    }),
    emit: (event: string, ...args: unknown[]) => {
      listeners.get(event)?.forEach((fn) => fn(...args));
    },
    connect: vi.fn(),
    disconnect: vi.fn(),
    removeAllListeners: vi.fn(() => listeners.clear()),
  };

  return {
    fakeSocket: fake,
    getSocketMock: vi.fn(() => fake),
    destroySocketMock: vi.fn(),
  };
});

vi.mock("@/lib/socket", () => ({
  getSocket: getSocketMock,
  destroySocket: destroySocketMock,
}));

// ─── Imports después del mock ────────────────────────────────────────────────

import { SocketProvider } from "@/providers/socket-provider";
import { useAuthStore } from "@/stores/auth-store";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function renderWithProviders() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const invalidateSpy = vi.spyOn(qc, "invalidateQueries");

  let utils!: ReturnType<typeof render>;
  act(() => {
    utils = render(
      <QueryClientProvider client={qc}>
        <SocketProvider>
          <div data-testid="children">ok</div>
        </SocketProvider>
      </QueryClientProvider>
    );
  });

  return { ...utils, qc, invalidateSpy };
}

function setHidden(value: boolean) {
  Object.defineProperty(document, "hidden", {
    configurable: true,
    get: () => value,
  });
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("SocketProvider", () => {
  beforeEach(() => {
    fakeSocket.connect.mockClear();
    fakeSocket.disconnect.mockClear();
    fakeSocket.on.mockClear();
    fakeSocket.off.mockClear();
    getSocketMock.mockClear();
    destroySocketMock.mockClear();

    setHidden(false);

    useAuthStore.setState({
      accessToken: "tok",
      refreshToken: "ref",
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
    useAuthStore.setState({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
      isHydrated: true,
    });
  });

  it("conecta el socket cuando hay accessToken al montar", () => {
    renderWithProviders();
    expect(getSocketMock).toHaveBeenCalled();
    expect(fakeSocket.connect).toHaveBeenCalledTimes(1);
  });

  it("desconecta cuando la pestaña se oculta y reconecta + invalida al volver a visible", () => {
    const { invalidateSpy } = renderWithProviders();
    fakeSocket.connect.mockClear();

    // Pestaña oculta.
    act(() => {
      setHidden(true);
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(fakeSocket.disconnect).toHaveBeenCalled();

    // Pestaña visible.
    act(() => {
      setHidden(false);
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(fakeSocket.connect).toHaveBeenCalled();
    expect(invalidateSpy).toHaveBeenCalled();
  });

  it("destruye el socket cuando no hay accessToken", () => {
    useAuthStore.setState({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
      isHydrated: true,
    });

    renderWithProviders();

    expect(destroySocketMock).toHaveBeenCalled();
    expect(fakeSocket.connect).not.toHaveBeenCalled();
  });
});
