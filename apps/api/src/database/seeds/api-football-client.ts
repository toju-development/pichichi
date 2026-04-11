/**
 * API-Football v3 Client
 *
 * Standalone HTTP client for the API-Football API (api-sports.io).
 * Uses native fetch (Node 18+), rate-limited, with typed responses.
 *
 * This module is used exclusively by seed/import scripts — NOT by the NestJS app.
 *
 * @see https://www.api-football.com/documentation-v3
 */

// ---------------------------------------------------------------------------
// API Response Types (only the fields we use)
// ---------------------------------------------------------------------------

export interface ApiFootballResponse<T> {
  response: T[];
  results: number;
  errors: Record<string, string>;
}

export interface ApiFootballLeague {
  league: {
    id: number;
    name: string;
    type: string;
    logo: string;
  };
  country: {
    name: string;
    flag: string | null;
  };
  seasons: ApiFootballSeason[];
}

export interface ApiFootballSeason {
  year: number;
  start: string;
  end: string;
  current: boolean;
}

export interface ApiFootballTeam {
  team: {
    id: number;
    name: string;
    code: string | null;
    country: string;
    logo: string;
    national: boolean;
  };
  venue: {
    name: string | null;
    city: string | null;
  } | null;
}

interface ApiFootballFixtureStatus {
  long: string;
  short: string;
  elapsed: number | null;
}

interface ApiFootballFixtureVenue {
  name: string | null;
  city: string | null;
}

interface ApiFootballFixtureTeamRef {
  id: number | null;
  name: string;
  logo: string;
  winner: boolean | null;
}

interface ApiFootballScorePart {
  home: number | null;
  away: number | null;
}

export interface ApiFootballFixture {
  fixture: {
    id: number;
    date: string;
    venue: ApiFootballFixtureVenue;
    status: ApiFootballFixtureStatus;
  };
  league: {
    id: number;
    name: string;
    round: string;
  };
  teams: {
    home: ApiFootballFixtureTeamRef;
    away: ApiFootballFixtureTeamRef;
  };
  goals: {
    home: number | null;
    away: number | null;
  };
  score: {
    halftime: ApiFootballScorePart;
    fulltime: ApiFootballScorePart;
    extratime: ApiFootballScorePart;
    penalty: ApiFootballScorePart;
  };
}

export interface ApiFootballSquadPlayer {
  id: number;
  name: string;
  age: number | null;
  number: number | null;
  position: string;
  photo: string;
}

export interface ApiFootballSquad {
  team: {
    id: number;
    name: string;
    logo: string;
  };
  players: ApiFootballSquadPlayer[];
}

// ---------------------------------------------------------------------------
// Tournament Players (players?league=...&season=...&team=...) — paginated
// ---------------------------------------------------------------------------

export interface ApiFootballTournamentPlayerStatGames {
  appearences: number | null;
  position: string | null;
  number: number | null;
}

export interface ApiFootballTournamentPlayerStat {
  games: ApiFootballTournamentPlayerStatGames;
}

export interface ApiFootballTournamentPlayerEntry {
  player: {
    id: number;
    name: string;
    firstname: string | null;
    lastname: string | null;
    age: number | null;
    photo: string | null;
  };
  statistics: ApiFootballTournamentPlayerStat[];
}

export interface ApiFootballStandingTeam {
  id: number;
  name: string;
}

export interface ApiFootballStandingEntry {
  rank: number;
  team: ApiFootballStandingTeam;
  group: string;
  points: number;
}

export interface ApiFootballStandingsResponse {
  league: {
    id: number;
    name: string;
    season: number;
    standings: ApiFootballStandingEntry[][];
  };
}

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------

const BASE_URL = 'https://v3.football.api-sports.io';

interface ApiFootballClientOptions {
  apiKey: string;
  delayMs?: number;
}

interface ApiFootballClient {
  searchLeagues: (search: string) => Promise<ApiFootballLeague[]>;
  fetchLeague: (
    leagueId: number,
    season: number,
  ) => Promise<ApiFootballLeague | null>;
  fetchTeams: (leagueId: number, season: number) => Promise<ApiFootballTeam[]>;
  fetchFixtures: (
    leagueId: number,
    season: number,
  ) => Promise<ApiFootballFixture[]>;
  fetchSquad: (teamId: number) => Promise<ApiFootballSquad | null>;
  fetchTournamentPlayers: (
    leagueId: number,
    season: number,
    teamId: number,
  ) => Promise<ApiFootballTournamentPlayerEntry[]>;
  fetchStandings: (
    leagueId: number,
    season: number,
  ) => Promise<ApiFootballStandingEntry[][]>;
  getApiCallCount: () => number;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function createApiFootballClient(
  options: ApiFootballClientOptions,
): ApiFootballClient {
  const { apiKey, delayMs = 7000 } = options;
  let apiCallCount = 0;
  let lastCallTime = 0;

  async function request<T>(
    endpoint: string,
    params: Record<string, string>,
    isRetry = false,
  ): Promise<T[]> {
    // Rate limiter: ensure minimum delay between calls
    const now = Date.now();
    const elapsed = now - lastCallTime;

    if (lastCallTime > 0 && elapsed < delayMs) {
      await delay(delayMs - elapsed);
    }

    const url = new URL(`${BASE_URL}/${endpoint}`);

    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }

    apiCallCount++;
    lastCallTime = Date.now();

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'x-apisports-key': apiKey,
      },
    });

    // Auth errors — abort immediately
    if (response.status === 401 || response.status === 403) {
      throw new Error(
        `API-Football auth error (${response.status}): Invalid or expired API key. ` +
          'Check your API_FOOTBALL_KEY environment variable.',
      );
    }

    // Check rate limit from response headers
    const remaining = response.headers.get('x-ratelimit-requests-remaining');

    if (remaining !== null && parseInt(remaining, 10) <= 0) {
      throw new Error(
        'API-Football rate limit exceeded. No requests remaining for today. ' +
          `Made ${apiCallCount} calls in this session.`,
      );
    }

    if (response.status === 429) {
      if (!isRetry) {
        console.warn(
          `[api-football] ⏳ Rate limit hit on ${endpoint}. Waiting 60 seconds before retry...`,
        );
        await delay(60_000);
        return request<T>(endpoint, params, true);
      }

      console.warn(
        `[api-football] ⚠️  Rate limit hit again on ${endpoint} after retry. Skipping.`,
      );
      return [];
    }

    if (!response.ok) {
      console.warn(
        `[api-football] Warning: ${endpoint} returned ${response.status} — ${response.statusText}`,
      );
      return [];
    }

    const body = (await response.json()) as ApiFootballResponse<T>;

    // Check for API-level errors (the API returns 200 with error messages)
    const errorKeys = Object.keys(body.errors);

    if (errorKeys.length > 0) {
      const errorMsg = errorKeys
        .map((k) => `${k}: ${body.errors[k]}`)
        .join(', ');

      // API-Football returns rate limit errors as 200 with error body
      const isRateLimit = errorKeys.some(
        (k) =>
          body.errors[k]?.toLowerCase().includes('rate limit') ||
          body.errors[k]?.toLowerCase().includes('too many'),
      );

      if (isRateLimit && !isRetry) {
        console.warn(
          `[api-football] ⏳ Rate limit alcanzado en ${endpoint}. Esperando 60 segundos...`,
        );
        await delay(60_000);
        return request<T>(endpoint, params, true);
      }

      console.warn(`[api-football] API error on ${endpoint}: ${errorMsg}`);
      return [];
    }

    return body.response;
  }

  /**
   * Paginated request — loops through all pages until no more results.
   * API-Football paginates at 20 results per page.
   */
  async function requestPaginated<T>(
    endpoint: string,
    params: Record<string, string>,
  ): Promise<T[]> {
    const allResults: T[] = [];
    let page = 1;

    while (true) {
      const pageResults = await request<T>(endpoint, {
        ...params,
        page: String(page),
      });

      if (pageResults.length === 0) {
        break;
      }

      allResults.push(...pageResults);

      // API-Football returns max 20 per page. If we got fewer, we're done.
      if (pageResults.length < 20) {
        break;
      }

      page++;
    }

    return allResults;
  }

  return {
    async searchLeagues(search: string): Promise<ApiFootballLeague[]> {
      return request<ApiFootballLeague>('leagues', { search });
    },

    async fetchLeague(
      leagueId: number,
      season: number,
    ): Promise<ApiFootballLeague | null> {
      const results = await request<ApiFootballLeague>('leagues', {
        id: String(leagueId),
        season: String(season),
      });
      return results[0] ?? null;
    },

    async fetchTeams(
      leagueId: number,
      season: number,
    ): Promise<ApiFootballTeam[]> {
      return request<ApiFootballTeam>('teams', {
        league: String(leagueId),
        season: String(season),
      });
    },

    async fetchFixtures(
      leagueId: number,
      season: number,
    ): Promise<ApiFootballFixture[]> {
      return request<ApiFootballFixture>('fixtures', {
        league: String(leagueId),
        season: String(season),
      });
    },

    async fetchSquad(teamId: number): Promise<ApiFootballSquad | null> {
      const results = await request<ApiFootballSquad>('players/squads', {
        team: String(teamId),
      });
      return results[0] ?? null;
    },

    async fetchTournamentPlayers(
      leagueId: number,
      season: number,
      teamId: number,
    ): Promise<ApiFootballTournamentPlayerEntry[]> {
      return requestPaginated<ApiFootballTournamentPlayerEntry>('players', {
        league: String(leagueId),
        season: String(season),
        team: String(teamId),
      });
    },

    async fetchStandings(
      leagueId: number,
      season: number,
    ): Promise<ApiFootballStandingEntry[][]> {
      const results = await request<ApiFootballStandingsResponse>('standings', {
        league: String(leagueId),
        season: String(season),
      });
      return results[0]?.league?.standings ?? [];
    },

    getApiCallCount(): number {
      return apiCallCount;
    },
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Strip tournament-name prefix from a group string returned by the API.
 *
 * API-Football returns group names differently depending on the tournament:
 *   - World Cup:    "Group A"                               → "Group A"  (already clean)
 *   - Libertadores: "CONMEBOL Libertadores 2026, Group A"   → "Group A"
 *
 * The regex looks for "Group <word>" at the end of the string.
 * If no match is found the original value is returned as-is (safe fallback).
 */
export function normalizeGroupName(raw: string): string {
  const match = raw.match(/Group\s+\w+$/i);
  return match ? match[0] : raw;
}

/**
 * Build a lookup map from team external ID → group name.
 *
 * Takes the raw standings (array of groups, each group is an array of team entries)
 * and returns a Map where key = team.id, value = group string (e.g. "Group A").
 *
 * Group names are normalized to strip any tournament-name prefix that the API
 * may prepend (e.g. "CONMEBOL Libertadores 2026, Group A" → "Group A").
 */
export function buildTeamGroupMap(
  standings: ApiFootballStandingEntry[][],
): Map<number, string> {
  const map = new Map<number, string>();

  for (const group of standings) {
    for (const entry of group) {
      map.set(entry.team.id, normalizeGroupName(entry.group));
    }
  }

  return map;
}
