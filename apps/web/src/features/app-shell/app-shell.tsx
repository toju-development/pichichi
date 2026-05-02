"use client";

import type { ReactNode } from "react";
import { AppShellSidebar } from "./app-shell-sidebar";
import { AppShellTopbar } from "./app-shell-topbar";
import { AppShellMobileNav } from "./app-shell-mobile-nav";

/**
 * Shared chrome for authenticated PWA routes.
 *
 * Layout:
 *   - Desktop (md+): persistent sidebar on the left, topbar at the top.
 *   - Mobile: topbar at the top, bottom-tab nav at the bottom.
 *
 * No domain logic yet — Phase 3+ wires real notifications, logout and user
 * state into the existing slots (each slot already exposes a `data-testid`).
 */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div
      data-testid="app-shell"
      className="flex min-h-screen w-full flex-col bg-bg md:flex-row"
    >
      <AppShellSidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <AppShellTopbar />
        <main
          data-testid="app-shell-content"
          className="flex-1 px-4 pb-24 pt-6 md:px-8 md:pb-10"
        >
          {children}
        </main>
        <AppShellMobileNav />
      </div>
    </div>
  );
}
