import { ROUTES } from "@/lib/routes";

/**
 * Single source of truth for the primary navigation entries.
 *
 * Sidebar (desktop) and bottom-tab (mobile) both consume this list, which
 * keeps the IA in lockstep across viewports and makes adding a new section
 * a one-line change.
 */
export interface AppNavItem {
  id: string;
  label: string;
  href: string;
}

export const APP_NAV_ITEMS: readonly AppNavItem[] = [
  { id: "dashboard", label: "Inicio", href: ROUTES.app.dashboard },
  { id: "groups", label: "Grupos", href: ROUTES.app.groups },
  { id: "tournaments", label: "Torneos", href: ROUTES.app.tournaments },
  { id: "leaderboard", label: "Ranking", href: ROUTES.app.leaderboard },
  { id: "notifications", label: "Alertas", href: ROUTES.app.notifications },
  { id: "profile", label: "Perfil", href: ROUTES.app.profile },
] as const;
