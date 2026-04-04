/**
 * Centralized query key factory.
 *
 * Every query key is a readonly tuple — TanStack Query uses referential equality
 * internally, and `as const` ensures these are narrow literal types.
 *
 * Convention: `domain.scope(params)` — e.g. `queryKeys.groups.members(groupId)`
 */

export const queryKeys = {
  // ─── User ──────────────────────────────────────────────────────────────────
  user: {
    me: ['user', 'me'] as const,
  },

  // ─── Groups ────────────────────────────────────────────────────────────────
  groups: {
    all: ['groups', 'list'] as const,
    byTournament: (tournamentId: string) =>
      ['groups', 'list', 'tournament', tournamentId] as const,
    detail: (id: string) => ['groups', 'detail', id] as const,
    members: (groupId: string) => ['groups', 'members', groupId] as const,
    tournaments: (groupId: string) =>
      ['groups', 'tournaments', groupId] as const,
  },

  // ─── Tournaments ───────────────────────────────────────────────────────────
  tournaments: {
    all: ['tournaments'] as const,
    bySlug: (slug: string) => ['tournaments', slug] as const,
    teams: (id: string) => ['tournaments', id, 'teams'] as const,
    players: (id: string) => ['tournaments', id, 'players'] as const,
  },

  // ─── Matches ───────────────────────────────────────────────────────────────
  matches: {
    all: (params?: { tournamentId?: string; phase?: string; status?: string; date?: string; groupLetter?: string }) =>
      ['matches', params ?? {}] as const,
    detail: (id: string) => ['matches', id] as const,
    upcoming: ['matches', 'upcoming'] as const,
    live: ['matches', 'live'] as const,
  },

  // ─── Predictions ───────────────────────────────────────────────────────────
  predictions: {
    byGroup: (groupId: string) => ['predictions', groupId] as const,
    groupMatch: (groupId: string, matchId: string) =>
      ['predictions', groupId, matchId] as const,
    stats: (groupId: string) => ['predictions', groupId, 'stats'] as const,
  },

  // ─── Leaderboard ───────────────────────────────────────────────────────────
  leaderboard: {
    byGroup: (groupId: string) => ['leaderboard', groupId] as const,
    myPosition: (groupId: string) =>
      ['leaderboard', groupId, 'me'] as const,
  },

  // ─── Bonus Predictions ─────────────────────────────────────────────────────
  bonusPredictions: {
    /** Prefix key for invalidating all bonus prediction queries in a group. */
    byGroup: (groupId: string) =>
      ['bonus-predictions', groupId] as const,
    mine: (groupId: string, tournamentId: string) =>
      ['bonus-predictions', groupId, 'mine', tournamentId] as const,
    group: (groupId: string, tournamentId: string) =>
      ['bonus-predictions', groupId, 'all', tournamentId] as const,
  },

  // ─── Dashboard ──────────────────────────────────────────────────────────────
  dashboard: {
    all: ['dashboard'] as const,
  },

  // ─── Notifications ─────────────────────────────────────────────────────────
  notifications: {
    all: ['notifications'] as const,
    unreadCount: ['notifications', 'unread-count'] as const,
  },
} as const;
