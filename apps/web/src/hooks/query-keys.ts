/**
 * Centralized query key factory para la PWA web.
 *
 * Port literal de `apps/mobile/src/hooks/query-keys.ts`. Mismas keys =
 * misma convención de invalidación que mobile (importante para mantener
 * la lógica de `use-socket-events` idéntica).
 *
 * Cada key es un readonly tuple — TanStack Query usa equalidad referencial
 * y `as const` garantiza tipos literales angostos.
 *
 * Convención: `domain.scope(params)` — ej: `queryKeys.groups.members(groupId)`.
 */

export const queryKeys = {
  // ─── User ──────────────────────────────────────────────────────────────────
  user: {
    me: ["user", "me"] as const,
  },

  // ─── Groups ────────────────────────────────────────────────────────────────
  groups: {
    all: ["groups", "list"] as const,
    byTournament: (tournamentId: string) =>
      ["groups", "list", "tournament", tournamentId] as const,
    detail: (id: string) => ["groups", "detail", id] as const,
    members: (groupId: string) => ["groups", "members", groupId] as const,
    tournaments: (groupId: string) =>
      ["groups", "tournaments", groupId] as const,
    upcomingPredictions: (groupId: string) =>
      ["groups", "upcoming-predictions", groupId] as const,
  },

  // ─── Tournaments ───────────────────────────────────────────────────────────
  tournaments: {
    all: ["tournaments"] as const,
    playable: ["tournaments", "playable"] as const,
    bySlug: (slug: string) => ["tournaments", slug] as const,
    teams: (id: string) => ["tournaments", id, "teams"] as const,
    players: (id: string) => ["tournaments", id, "players"] as const,
  },

  // ─── Matches ───────────────────────────────────────────────────────────────
  matches: {
    all: (params?: {
      tournamentId?: string;
      phase?: string;
      status?: string;
      date?: string;
      groupName?: string;
    }) => ["matches", params ?? {}] as const,
    detail: (id: string) => ["matches", id] as const,
    upcoming: ["matches", "upcoming"] as const,
    live: ["matches", "live"] as const,
  },

  // ─── Predictions ───────────────────────────────────────────────────────────
  predictions: {
    byGroup: (groupId: string) => ["predictions", groupId] as const,
    groupMatch: (groupId: string, matchId: string) =>
      ["predictions", groupId, matchId] as const,
    stats: (groupId: string) => ["predictions", groupId, "stats"] as const,
    memberPredictions: (groupId: string, userId: string) =>
      ["predictions", groupId, "member", userId] as const,
  },

  // ─── Leaderboard ───────────────────────────────────────────────────────────
  leaderboard: {
    byGroup: (groupId: string) => ["leaderboard", groupId] as const,
    myPosition: (groupId: string) =>
      ["leaderboard", groupId, "me"] as const,
    global: ["leaderboard", "global"] as const,
  },

  // ─── Bonus Predictions ─────────────────────────────────────────────────────
  bonusPredictions: {
    /** Prefix key para invalidar todas las bonus prediction queries del grupo. */
    byGroup: (groupId: string) => ["bonus-predictions", groupId] as const,
    mine: (groupId: string, tournamentId: string) =>
      ["bonus-predictions", groupId, "mine", tournamentId] as const,
    group: (groupId: string, tournamentId: string) =>
      ["bonus-predictions", groupId, "all", tournamentId] as const,
  },

  // ─── Dashboard ──────────────────────────────────────────────────────────────
  dashboard: {
    all: ["dashboard"] as const,
  },

  // ─── Notifications ─────────────────────────────────────────────────────────
  notifications: {
    all: ["notifications"] as const,
    unreadCount: ["notifications", "unread-count"] as const,
  },
} as const;
