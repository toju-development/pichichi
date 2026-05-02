import type { ReactElement, ReactNode } from "react";
import { render, type RenderOptions } from "@testing-library/react";

// Phase 0 baseline. As Query/Auth providers land in later phases, wrap them here
// so every test gets the same context for free.
function AllProviders({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function renderWithProviders(ui: ReactElement, options?: Omit<RenderOptions, "wrapper">) {
  return render(ui, { wrapper: AllProviders, ...options });
}

export * from "@testing-library/react";
