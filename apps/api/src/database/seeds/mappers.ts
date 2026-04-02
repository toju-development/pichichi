/**
 * API-Football → Pichichi Data Mappers
 *
 * Converts API-Football response shapes into Pichichi domain types
 * compatible with Prisma models. Used by the import pipeline.
 *
 * All enums are imported directly from @prisma/client (seed scripts
 * use direct Prisma access, not the shared package).
 */

import { MatchPhase, MatchStatus, TournamentStatus, TournamentType } from '@prisma/client';

import type {
  ApiFootballFixture,
  ApiFootballLeague,
  ApiFootballSeason,
  ApiFootballSquadPlayer,
  ApiFootballTeam,
} from './api-football-client.js';

// ---------------------------------------------------------------------------
// Tournament Type Mapper
// ---------------------------------------------------------------------------

/** Known API-Football league ID → Pichichi TournamentType */
const LEAGUE_ID_TO_TYPE: Record<number, TournamentType> = {
  1: TournamentType.WORLD_CUP,
  9: TournamentType.COPA_AMERICA,
  2: TournamentType.CHAMPIONS_LEAGUE,
  3: TournamentType.CHAMPIONS_LEAGUE, // UEFA Europa League → closest match
  4: TournamentType.EURO,
  848: TournamentType.EURO, // Euro Championship qualifying / alternate ID
} as const;

export function mapTournamentType(league: ApiFootballLeague): TournamentType {
  const mapped = LEAGUE_ID_TO_TYPE[league.league.id];

  if (mapped) {
    return mapped;
  }

  // Fallback: use CUSTOM for both cups and leagues we don't explicitly know
  return TournamentType.CUSTOM;
}

// ---------------------------------------------------------------------------
// Tournament Status Mapper
// ---------------------------------------------------------------------------

/**
 * Derives TournamentStatus from the API-Football season data.
 *
 * Logic:
 *   - season.current === true → IN_PROGRESS (API says season is active)
 *   - season.end is in the past → FINISHED
 *   - season.start is in the future → UPCOMING
 *   - otherwise (between start and end) → IN_PROGRESS
 *
 * Falls back to UPCOMING when no season data is available.
 */
export function mapTournamentStatus(season?: ApiFootballSeason): TournamentStatus {
  if (!season) {
    return TournamentStatus.UPCOMING;
  }

  // If the API explicitly says the season is current, it's in progress
  if (season.current) {
    return TournamentStatus.IN_PROGRESS;
  }

  const now = new Date();
  const startDate = new Date(season.start);
  const endDate = new Date(season.end);

  if (now > endDate) {
    return TournamentStatus.FINISHED;
  }

  if (now < startDate) {
    return TournamentStatus.UPCOMING;
  }

  // Between start and end but API says not current — still treat as in progress
  return TournamentStatus.IN_PROGRESS;
}

// ---------------------------------------------------------------------------
// Match Phase Mapper
// ---------------------------------------------------------------------------

interface PhasePattern {
  pattern: RegExp;
  phase: MatchPhase;
}

/**
 * Order matters — more specific patterns must come before general ones.
 * "Semi-finals" must match SEMI_FINAL before "Final$" could accidentally match.
 */
const PHASE_PATTERNS: PhasePattern[] = [
  { pattern: /^Group/i, phase: MatchPhase.GROUP_STAGE },
  { pattern: /Round of 32/i, phase: MatchPhase.ROUND_OF_32 },
  { pattern: /Round of 16/i, phase: MatchPhase.ROUND_OF_16 },
  { pattern: /Quarter[- ]?final/i, phase: MatchPhase.QUARTER_FINAL },
  { pattern: /Semi[- ]?final/i, phase: MatchPhase.SEMI_FINAL },
  { pattern: /3rd Place|Third Place/i, phase: MatchPhase.THIRD_PLACE },
  // Anchor to word boundary — "Final" alone, not "Semi-final" or "Quarter-final"
  { pattern: /\bFinal$/i, phase: MatchPhase.FINAL },
];

export function mapMatchPhase(round: string): MatchPhase {
  for (const { pattern, phase } of PHASE_PATTERNS) {
    if (pattern.test(round)) {
      return phase;
    }
  }

  console.warn(`[mappers] Unknown round string: "${round}" — defaulting to GROUP_STAGE`);
  return MatchPhase.GROUP_STAGE;
}

// ---------------------------------------------------------------------------
// Match Status Mapper
// ---------------------------------------------------------------------------

const STATUS_MAP: Record<string, MatchStatus> = {
  // Scheduled
  TBD: MatchStatus.SCHEDULED,
  NS: MatchStatus.SCHEDULED,

  // Live / In play
  '1H': MatchStatus.LIVE,
  HT: MatchStatus.LIVE,
  '2H': MatchStatus.LIVE,
  ET: MatchStatus.LIVE,
  BT: MatchStatus.LIVE,
  P: MatchStatus.LIVE,
  SUSP: MatchStatus.LIVE,
  INT: MatchStatus.LIVE,
  LIVE: MatchStatus.LIVE,

  // Finished
  FT: MatchStatus.FINISHED,
  AET: MatchStatus.FINISHED,
  PEN: MatchStatus.FINISHED,

  // Postponed
  PST: MatchStatus.POSTPONED,

  // Cancelled
  CANC: MatchStatus.CANCELLED,
  ABD: MatchStatus.CANCELLED,
  AWD: MatchStatus.CANCELLED,
  WO: MatchStatus.CANCELLED,
} as const;

export function mapMatchStatus(apiStatus: string): MatchStatus {
  const mapped = STATUS_MAP[apiStatus];

  if (mapped) {
    return mapped;
  }

  console.warn(
    `[mappers] Unknown match status: "${apiStatus}" — defaulting to SCHEDULED`,
  );
  return MatchStatus.SCHEDULED;
}

// ---------------------------------------------------------------------------
// Extra Time Detection
// ---------------------------------------------------------------------------

const EXTRA_TIME_STATUSES = new Set(['AET', 'ET']);

export function mapIsExtraTime(apiStatus: string): boolean {
  return EXTRA_TIME_STATUSES.has(apiStatus);
}

// ---------------------------------------------------------------------------
// Slug Generator
// ---------------------------------------------------------------------------

/**
 * Generates a URL-safe tournament slug from the league name and season.
 *
 * Strips common prefixes (FIFA, UEFA, AFC, CAF, CONMEBOL, CONCACAF, OFC),
 * lowercases, replaces spaces/special chars with hyphens, appends season year.
 *
 * Examples:
 *   "FIFA World Cup" + 2026 → "world-cup-2026"
 *   "UEFA Champions League" + 2024 → "champions-league-2024"
 *   "Copa America" + 2024 → "copa-america-2024"
 */
export function generateTournamentSlug(leagueName: string, season: number): string {
  const slug = leagueName
    // Strip known federation prefixes
    .replace(/^(FIFA|UEFA|AFC|CAF|CONMEBOL|CONCACAF|OFC)\s+/i, '')
    .trim()
    .toLowerCase()
    // Replace non-alphanumeric (except hyphens) with hyphens
    .replace(/[^a-z0-9-]+/g, '-')
    // Collapse multiple hyphens
    .replace(/-{2,}/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-|-$/g, '');

  return `${slug}-${season}`;
}

// ---------------------------------------------------------------------------
// Team Data Mapper
// ---------------------------------------------------------------------------

export interface MappedTeamData {
  name: string;
  shortName: string;
  logoUrl: string;
  flagUrl: string | null;
  country: string;
  externalId: number;
}

export function mapTeamData(
  apiTeam: ApiFootballTeam,
  countryFlag?: string | null,
): MappedTeamData {
  // shortName: use team.code if available, otherwise first 3 chars of name (uppercased)
  const code = apiTeam.team.code;
  const shortName = code
    ? code.slice(0, 5).toUpperCase()
    : apiTeam.team.name.slice(0, 3).toUpperCase();

  return {
    name: apiTeam.team.name,
    shortName,
    logoUrl: apiTeam.team.logo,
    flagUrl: countryFlag ?? null,
    country: apiTeam.team.country,
    externalId: apiTeam.team.id,
  };
}

// ---------------------------------------------------------------------------
// Player Data Mapper
// ---------------------------------------------------------------------------

export interface MappedPlayerData {
  name: string;
  photoUrl: string | null;
  position: string | null;
  nationality: string | null;
  externalId: number;
  shirtNumber: number | null;
}

export function mapPlayerData(
  apiPlayer: ApiFootballSquadPlayer,
  teamCountry?: string | null,
): MappedPlayerData {
  return {
    name: apiPlayer.name,
    photoUrl: apiPlayer.photo ?? null,
    position: apiPlayer.position ?? null,
    nationality: teamCountry ?? null,
    externalId: apiPlayer.id,
    shirtNumber: apiPlayer.number ?? null,
  };
}

// ---------------------------------------------------------------------------
// Fixture Data Mapper
// ---------------------------------------------------------------------------

export interface MappedFixtureData {
  externalId: number;
  scheduledAt: Date;
  venue: string | null;
  city: string | null;
  status: MatchStatus;
  phase: MatchPhase;
  homeScore: number | null;
  awayScore: number | null;
  homeScorePenalties: number | null;
  awayScorePenalties: number | null;
  isExtraTime: boolean;
  /** API-Football team IDs — NOT Pichichi UUIDs. Resolve externally. */
  homeTeamExternalId: number | null;
  awayTeamExternalId: number | null;
  /** Round string from API for placeholder generation */
  round: string;
}

export function mapFixtureData(fixture: ApiFootballFixture): MappedFixtureData {
  const statusShort = fixture.fixture.status.short;

  return {
    externalId: fixture.fixture.id,
    scheduledAt: new Date(fixture.fixture.date),
    venue: fixture.fixture.venue.name ?? null,
    city: fixture.fixture.venue.city ?? null,
    status: mapMatchStatus(statusShort),
    phase: mapMatchPhase(fixture.league.round),
    homeScore: fixture.goals.home,
    awayScore: fixture.goals.away,
    homeScorePenalties: fixture.score.penalty.home,
    awayScorePenalties: fixture.score.penalty.away,
    isExtraTime: mapIsExtraTime(statusShort),
    homeTeamExternalId: fixture.teams.home.id,
    awayTeamExternalId: fixture.teams.away.id,
    round: fixture.league.round,
  };
}
