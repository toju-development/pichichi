/**
 * Smoke test del QueryProvider.
 *
 * Verifica que el provider envuelve el árbol con el QueryClient singleton
 * y que `useQueryClient()` resuelve dentro de su scope.
 */
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { useQueryClient } from "@tanstack/react-query";

import { QueryProvider } from "@/providers/query-provider";
import { queryClient } from "@/hooks/query-client";

function Probe() {
  const qc = useQueryClient();
  return <div data-testid="qc-id">{qc === queryClient ? "same" : "other"}</div>;
}

describe("QueryProvider", () => {
  it("provee el QueryClient singleton al árbol hijo", () => {
    render(
      <QueryProvider>
        <Probe />
      </QueryProvider>
    );

    expect(screen.getByTestId("qc-id").textContent).toBe("same");
  });
});
