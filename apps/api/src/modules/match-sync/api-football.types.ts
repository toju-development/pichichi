/**
 * API-Football v3 — Shared Types
 *
 * Canonical type definitions for the API-Football v3 API responses.
 * Used by both the seed/import scripts and the MatchSyncModule.
 *
 * These types mirror the actual API-Football v3 response structure
 * for the `/fixtures` and `/players/topscorers` endpoints.
 *
 * @see https://www.api-football.com/documentation-v3
 */

// ---------------------------------------------------------------------------
// Generic API Response Wrapper
// ---------------------------------------------------------------------------

export interface ApiFootballResponse<T> {
  get: string;
  parameters: Record<string, string>;
  errors: Record<string, string>;
  results: number;
  paging: {
    current: number;
    total: number;
  };
  response: T[];
}

// ---------------------------------------------------------------------------
// Fixture Types (GET /fixtures)
// ---------------------------------------------------------------------------

/**
 * API-Football short status codes for match state.
 *
 * @see https://www.api-football.com/documentation-v3#tag/Fixtures/operation/get-fixtures
 */
const API_FOOTBALL_FIXTURE_STATUS = {
  // Scheduled
  TBD: 'TBD',
  NS: 'NS',
  // In play
  FIRST_HALF: '1H',
  HALF_TIME: 'HT',
  SECOND_HALF: '2H',
  EXTRA_TIME: 'ET',
  BREAK_TIME: 'BT',
  PENALTY: 'P',
  SUSPENDED: 'SUSP',
  INTERRUPTED: 'INT',
  LIVE: 'LIVE',
  // Finished
  FULL_TIME: 'FT',
  AFTER_EXTRA_TIME: 'AET',
  AFTER_PENALTY: 'PEN',
  // Other
  POSTPONED: 'PST',
  CANCELLED: 'CANC',
  ABANDONED: 'ABD',
  AWARDED: 'AWD',
  WALKOVER: 'WO',
} as const;

type ApiFootballFixtureStatus =
  (typeof API_FOOTBALL_FIXTURE_STATUS)[keyof typeof API_FOOTBALL_FIXTURE_STATUS];

export { API_FOOTBALL_FIXTURE_STATUS, type ApiFootballFixtureStatus };

// ---------------------------------------------------------------------------
// Status Grouping Constants
// ---------------------------------------------------------------------------

/** Match has ended — score is final. */
export const FINISHED_STATUSES: readonly ApiFootballFixtureStatus[] = [
  'FT',
  'AET',
  'PEN',
] as const;

/** Match is currently being played. */
export const LIVE_STATUSES: readonly ApiFootballFixtureStatus[] = [
  '1H',
  'HT',
  '2H',
  'ET',
  'BT',
  'P',
  'SUSP',
  'INT',
  'LIVE',
] as const;

/** Match has not started yet. */
export const SCHEDULED_STATUSES: readonly ApiFootballFixtureStatus[] = [
  'TBD',
  'NS',
] as const;

// ---------------------------------------------------------------------------
// Fixture Sub-Types
// ---------------------------------------------------------------------------

export interface ApiFootballFixtureStatusInfo {
  long: string;
  short: ApiFootballFixtureStatus;
  elapsed: number | null;
  extra: number | null;
}

export interface ApiFootballFixtureVenue {
  id: number | null;
  name: string | null;
  city: string | null;
}

export interface ApiFootballFixturePeriods {
  first: number | null;
  second: number | null;
}

export interface ApiFootballFixtureInfo {
  id: number;
  referee: string | null;
  timezone: string;
  date: string;
  timestamp: number;
  periods: ApiFootballFixturePeriods;
  venue: ApiFootballFixtureVenue;
  status: ApiFootballFixtureStatusInfo;
}

export interface ApiFootballFixtureLeague {
  id: number;
  name: string;
  country: string;
  logo: string;
  flag: string | null;
  season: number;
  round: string;
}

export interface ApiFootballFixtureTeamRef {
  id: number | null;
  name: string;
  logo: string;
  winner: boolean | null;
}

export interface ApiFootballFixtureTeams {
  home: ApiFootballFixtureTeamRef;
  away: ApiFootballFixtureTeamRef;
}

export interface ApiFootballScorePart {
  home: number | null;
  away: number | null;
}

export interface ApiFootballFixtureGoals {
  home: number | null;
  away: number | null;
}

export interface ApiFootballFixtureScore {
  halftime: ApiFootballScorePart;
  fulltime: ApiFootballScorePart;
  extratime: ApiFootballScorePart;
  penalty: ApiFootballScorePart;
}

/**
 * Full fixture response from GET /fixtures.
 *
 * This is the shape of each element in `ApiFootballResponse<ApiFootballFixture>.response`.
 */
export interface ApiFootballFixture {
  fixture: ApiFootballFixtureInfo;
  league: ApiFootballFixtureLeague;
  teams: ApiFootballFixtureTeams;
  goals: ApiFootballFixtureGoals;
  score: ApiFootballFixtureScore;
}

// ---------------------------------------------------------------------------
// Top Scorers Types (GET /players/topscorers)
// ---------------------------------------------------------------------------

export interface ApiFootballTopScorerPlayer {
  id: number;
  name: string;
  firstname: string;
  lastname: string;
  photo: string;
  nationality: string;
}

export interface ApiFootballTopScorerTeam {
  id: number;
  name: string;
  logo: string;
}

export interface ApiFootballTopScorerLeague {
  id: number;
  name: string;
  country: string;
  logo: string;
  flag: string | null;
  season: number;
}

export interface ApiFootballTopScorerGames {
  appearences: number | null;
  minutes: number | null;
  position: string | null;
}

export interface ApiFootballTopScorerGoals {
  total: number | null;
  assists: number | null;
}

export interface ApiFootballTopScorerStatistic {
  team: ApiFootballTopScorerTeam;
  league: ApiFootballTopScorerLeague;
  games: ApiFootballTopScorerGames;
  goals: ApiFootballTopScorerGoals;
}

/**
 * Top scorer response from GET /players/topscorers.
 *
 * Each element in the response array represents one player
 * with their statistics across the requested league/season.
 */
export interface ApiFootballTopScorer {
  player: ApiFootballTopScorerPlayer;
  statistics: ApiFootballTopScorerStatistic[];
}
