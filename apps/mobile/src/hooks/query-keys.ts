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
    all: ['groups'] as const,
    detail: (id: string) => ['groups', id] as const,
    members: (groupId: string) => ['groups', groupId, 'members'] as const,
    tournaments: (groupId: string) =>
      ['groups', groupId, 'tournaments'] as const,
  },

  // ─── Tournaments ───────────────────────────────────────────────────────────
  tournaments: {
    all: ['tournaments'] as const,
    bySlug: (slug: string) => ['tournaments', slug] as const,
    teams: (id: string) => ['tournaments', id, 'teams'] as const,
  },

  // ─── Matches ───────────────────────────────────────────────────────────────
  matches: {
    all: (params?: { tournamentId?: string; phase?: string; status?: string }) =>
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
    mine: (groupId: string) => ['bonus-predictions', groupId] as const,
    group: (groupId: string) =>
      ['bonus-predictions', groupId, 'all'] as const,
  },

  // ─── Notifications ─────────────────────────────────────────────────────────
  notifications: {
    all: ['notifications'] as const,
    unreadCount: ['notifications', 'unread-count'] as const,
  },
} as const;
