"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/cn";
import { APP_NAV_ITEMS } from "./nav-items";

/**
 * Persistent left sidebar shown on desktop (md+).
 * Hidden on mobile — the bottom nav takes over there.
 */
export function AppShellSidebar() {
  const pathname = usePathname();

  return (
    <aside
      data-testid="app-shell-sidebar"
      className="hidden w-60 shrink-0 border-r border-border bg-surface md:flex md:flex-col"
    >
      <div className="px-6 py-6">
        <Link
          href={ROUTES.app.dashboard}
          data-testid="app-shell-sidebar-brand"
          className="text-lg font-semibold text-primary"
        >
          Pichichi
        </Link>
      </div>
      <nav
        aria-label="Navegación principal"
        className="flex flex-1 flex-col gap-1 px-3 pb-6"
      >
        {APP_NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== ROUTES.app.dashboard &&
              pathname?.startsWith(`${item.href}/`));

          return (
            <Link
              key={item.href}
              href={item.href}
              data-testid={`app-shell-sidebar-link-${item.id}`}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium transition",
                isActive
                  ? "bg-primary-surface text-primary"
                  : "text-text-secondary hover:bg-primary-surface-light hover:text-primary",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
