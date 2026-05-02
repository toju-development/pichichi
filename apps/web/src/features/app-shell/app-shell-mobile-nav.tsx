"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { ROUTES } from "@/lib/routes";
import { APP_NAV_ITEMS } from "./nav-items";

/**
 * Bottom-tab navigation for mobile (md and below).
 * Mirrors the sidebar entries to keep the IA consistent across viewports.
 */
export function AppShellMobileNav() {
  const pathname = usePathname();

  return (
    <nav
      data-testid="app-shell-mobile-nav"
      aria-label="Navegación móvil"
      className="fixed inset-x-0 bottom-0 z-10 flex items-stretch justify-around border-t border-border bg-surface md:hidden"
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
            data-testid={`app-shell-mobile-link-${item.id}`}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-1 py-2 text-xs font-medium transition",
              isActive
                ? "text-primary"
                : "text-text-tertiary hover:text-primary",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
