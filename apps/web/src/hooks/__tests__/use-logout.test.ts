/**
 * Test de `useLogout`.
 *
 * Cubre el flujo completo de cierre de sesión:
 *   - Llama `apiLogout(refreshToken)` cuando hay refresh token.
 *   - Continúa el flujo aunque `apiLogout` falle (best-effort).
 *   - Llama `storeLogout()` para limpiar Zustand.
 *   - Llama `queryClient.clear()` para invalidar el cache react-query.
 *   - Redirige a `/app/login` con `router.replace`.
 *   - Skipea la llamada a la API si no hay refresh token.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { createElement } from "react";

const replaceMock = vi.fn();
const apiLogoutMock = vi.fn();
const storeLogoutMock = vi.fn();
let mockRefreshToken: string | null = "refresh-token-abc";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock }),
}));

vi.mock("@/api/auth", () => ({
  logout: (token: string) => apiLogoutMock(token),
}));

vi.mock("@/stores/auth-store", () => ({
  useAuthStore: Object.assign(
    (selector: (state: { logout: () => void }) => unknown) =>
      selector({ logout: storeLogoutMock }),
    {
      getState: () => ({ refreshToken: mockRefreshToken }),
    }
  ),
}));

import { useLogout } from "@/hooks/use-logout";

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const clearSpy = vi.spyOn(qc, "clear");
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: qc }, children);
  return { wrapper, qc, clearSpy };
}

describe("useLogout", () => {
  beforeEach(() => {
    replaceMock.mockClear();
    apiLogoutMock.mockReset();
    storeLogoutMock.mockClear();
    mockRefreshToken = "refresh-token-abc";
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("ejecuta el flujo completo con refresh token presente", async () => {
    apiLogoutMock.mockResolvedValueOnce(undefined);
    const { wrapper, clearSpy } = makeWrapper();

    const { result } = renderHook(() => useLogout(), { wrapper });

    await act(async () => {
      await result.current.mutate();
    });

    expect(apiLogoutMock).toHaveBeenCalledWith("refresh-token-abc");
    expect(storeLogoutMock).toHaveBeenCalledTimes(1);
    expect(clearSpy).toHaveBeenCalledTimes(1);
    expect(replaceMock).toHaveBeenCalledWith("/app/login");
  });

  it("sigue limpiando store, cache y redirigiendo aunque la API falle", async () => {
    apiLogoutMock.mockRejectedValueOnce(new Error("network down"));
    const { wrapper, clearSpy } = makeWrapper();

    const { result } = renderHook(() => useLogout(), { wrapper });

    await act(async () => {
      await result.current.mutate();
    });

    expect(apiLogoutMock).toHaveBeenCalledTimes(1);
    expect(storeLogoutMock).toHaveBeenCalledTimes(1);
    expect(clearSpy).toHaveBeenCalledTimes(1);
    expect(replaceMock).toHaveBeenCalledWith("/app/login");
  });

  it("salta el llamado a la API si no hay refresh token", async () => {
    mockRefreshToken = null;
    const { wrapper, clearSpy } = makeWrapper();

    const { result } = renderHook(() => useLogout(), { wrapper });

    await act(async () => {
      await result.current.mutate();
    });

    expect(apiLogoutMock).not.toHaveBeenCalled();
    expect(storeLogoutMock).toHaveBeenCalledTimes(1);
    expect(clearSpy).toHaveBeenCalledTimes(1);
    expect(replaceMock).toHaveBeenCalledWith("/app/login");
  });
});
