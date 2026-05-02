/**
 * Centralized route table for the Pichichi PWA.
 *
 * Use these constants instead of hardcoded strings to keep navigation in sync
 * with the App Router file tree. The landing site lives at the root, the
 * functional PWA lives under `/app/*`.
 */
export const ROUTES = {
  landing: {
    home: "/",
    faq: "/faq",
    terms: "/terms",
    privacy: "/privacy-policy",
  },
  app: {
    root: "/app",
    login: "/app/login",
    dashboard: "/app",
    groups: "/app/groups",
    groupsCreate: "/app/groups/create",
    groupsJoin: "/app/groups/join",
    /** Detail page for a single group. */
    groupDetail: (groupId: string) => `/app/groups/${groupId}` as const,
    /** Edit page for a single group (admin-only). */
    groupEdit: (groupId: string) => `/app/groups/${groupId}/edit` as const,
    tournaments: "/app/tournaments",
    /** Detail page for a single tournament (by slug). */
    tournamentDetail: (slug: string) => `/app/tournaments/${slug}` as const,
    /** Per-group tournament page — shows bonus predictions, etc. */
    groupTournament: (groupId: string, slug: string) =>
      `/app/groups/${groupId}/tournament/${slug}` as const,
    /**
     * Predicciones históricas de un miembro dentro de un grupo.
     * Web-equivalente RESTful de mobile `/groups/member-predictions?...`.
     * Se acepta `displayName` como query param para mostrar el nombre en
     * el header sin esperar al fetch (UX mobile).
     */
    groupMemberPredictions: (groupId: string, memberId: string) =>
      `/app/groups/${groupId}/members/${memberId}/predictions` as const,
    leaderboard: "/app/leaderboard",
    notifications: "/app/notifications",
    profile: "/app/profile",
  },
} as const;

/** Static (non-function) entries from `ROUTES.app`. */
export type AppRoute = Extract<
  (typeof ROUTES.app)[keyof typeof ROUTES.app],
  string
>;
