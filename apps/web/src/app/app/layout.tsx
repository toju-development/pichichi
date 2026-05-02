import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AppProviders } from "@/providers/app-providers";

/**
 * Root layout for the `/app/*` PWA segment.
 *
 * This is a nested layout (the root `<html>`/`<body>` lives in the landing
 * `app/layout.tsx`). It mounts the provider tree and a minimal chrome wrapper
 * shared by both public PWA routes (login) and authenticated routes.
 *
 * Domain logic, auth guards and dashboard chrome live deeper:
 *   - `(authed)/layout.tsx`        → auth gate + sidebar/topbar/mobile nav
 *   - `(authed)/<segment>/page.tsx` → feature pages
 */
export const metadata: Metadata = {
  title: {
    default: "Pichichi App",
    template: "%s | Pichichi App",
  },
  description: "La app de Pichichi para grupos, torneos y predicciones.",
};

export default function AppRootLayout({ children }: { children: ReactNode }) {
  return (
    <AppProviders>
      <div
        data-testid="app-root"
        className="min-h-screen bg-bg text-text-primary"
      >
        {children}
      </div>
    </AppProviders>
  );
}
