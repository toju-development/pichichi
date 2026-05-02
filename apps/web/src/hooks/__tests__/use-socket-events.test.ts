/**
 * Smoke test de `useSocketEvents`.
 *
 * Verifica que cuando el socket emite `match:updated`, el hook invalida
 * todos los prefijos relevantes en el QueryClient.
 *
 * Mockeamos un "socket" mínimo con on/off — alcanza para verificar el
 * cableado de listeners y la invalidación.
 */
import { describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { QueryClient } from "@tanstack/react-query";

import { useSocketEvents } from "@/hooks/use-socket-events";
import type { TypedSocket } from "@/types/socket-events";

type Listener = (payload: { matchId: string }) => void;

function makeFakeSocket() {
  const listeners = new Map<string, Set<Listener>>();
  const fake = {
    on(event: string, fn: Listener) {
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event)!.add(fn);
    },
    off(event: string, fn: Listener) {
      listeners.get(event)?.delete(fn);
    },
    emit(event: string, payload: { matchId: string }) {
      listeners.get(event)?.forEach((fn) => fn(payload));
    },
  };
  return fake;
}

describe("useSocketEvents", () => {
  it("registra `match:updated` y dispara invalidaciones de las query keys esperadas", () => {
    const qc = new QueryClient();
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries");
    const fake = makeFakeSocket();

    renderHook(() =>
      useSocketEvents(fake as unknown as TypedSocket, qc)
    );

    fake.emit("match:updated", { matchId: "m1" });

    const invalidatedPrefixes = invalidateSpy.mock.calls.map(
      ([arg]) => (arg as { queryKey: unknown[] }).queryKey[0]
    );

    expect(invalidatedPrefixes).toContain("dashboard");
    expect(invalidatedPrefixes).toContain("matches");
    expect(invalidatedPrefixes).toContain("predictions");
    expect(invalidatedPrefixes).toContain("leaderboard");
    expect(invalidatedPrefixes).toContain("groups");
    expect(invalidatedPrefixes).toContain("notifications");
  });

  it("no hace nada cuando socket es null", () => {
    const qc = new QueryClient();
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries");

    renderHook(() => useSocketEvents(null, qc));

    expect(invalidateSpy).not.toHaveBeenCalled();
  });
});
