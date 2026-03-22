/**
 * World Cup 2026 Seed Script
 *
 * Creates the FIFA World Cup 2026 tournament with all 48 teams,
 * group stage matches, and knockout stage placeholders.
 *
 * Usage:
 *   npx tsx src/database/seeds/world-cup-2026.seed.ts
 *   npx prisma db seed
 *
 * This script is IDEMPOTENT — running it twice will not create duplicates.
 */

import { PrismaClient } from '@prisma/client';
import type { MatchPhase } from '@prisma/client';

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// Team definitions: name, FIFA 3-letter code, ISO 2-letter code (for flagcdn)
// ---------------------------------------------------------------------------

interface TeamDef {
  name: string;
  code: string;
  isoCode: string;
  group: string;
}

const TEAMS: TeamDef[] = [
  // Group A
  { name: 'Mexico', code: 'MEX', isoCode: 'mx', group: 'A' },
  { name: 'South Africa', code: 'RSA', isoCode: 'za', group: 'A' },
  { name: 'South Korea', code: 'KOR', isoCode: 'kr', group: 'A' },
  { name: 'UEFA Path D winner', code: 'UPD', isoCode: 'eu', group: 'A' },

  // Group B
  { name: 'Canada', code: 'CAN', isoCode: 'ca', group: 'B' },
  { name: 'Qatar', code: 'QAT', isoCode: 'qa', group: 'B' },
  { name: 'Switzerland', code: 'SUI', isoCode: 'ch', group: 'B' },
  { name: 'UEFA Path A winner', code: 'UPA', isoCode: 'eu', group: 'B' },

  // Group C
  { name: 'Brazil', code: 'BRA', isoCode: 'br', group: 'C' },
  { name: 'Morocco', code: 'MAR', isoCode: 'ma', group: 'C' },
  { name: 'Haiti', code: 'HAI', isoCode: 'ht', group: 'C' },
  { name: 'Scotland', code: 'SCO', isoCode: 'gb-sct', group: 'C' },

  // Group D
  { name: 'USA', code: 'USA', isoCode: 'us', group: 'D' },
  { name: 'Paraguay', code: 'PAR', isoCode: 'py', group: 'D' },
  { name: 'Australia', code: 'AUS', isoCode: 'au', group: 'D' },
  { name: 'UEFA Path C winner', code: 'UPC', isoCode: 'eu', group: 'D' },

  // Group E
  { name: 'Germany', code: 'GER', isoCode: 'de', group: 'E' },
  { name: 'Curaçao', code: 'CUW', isoCode: 'cw', group: 'E' },
  { name: 'Ivory Coast', code: 'CIV', isoCode: 'ci', group: 'E' },
  { name: 'Ecuador', code: 'ECU', isoCode: 'ec', group: 'E' },

  // Group F
  { name: 'Netherlands', code: 'NED', isoCode: 'nl', group: 'F' },
  { name: 'Japan', code: 'JPN', isoCode: 'jp', group: 'F' },
  { name: 'UEFA Path B winner', code: 'UPB', isoCode: 'eu', group: 'F' },
  { name: 'Tunisia', code: 'TUN', isoCode: 'tn', group: 'F' },

  // Group G
  { name: 'Belgium', code: 'BEL', isoCode: 'be', group: 'G' },
  { name: 'Egypt', code: 'EGY', isoCode: 'eg', group: 'G' },
  { name: 'Iran', code: 'IRN', isoCode: 'ir', group: 'G' },
  { name: 'New Zealand', code: 'NZL', isoCode: 'nz', group: 'G' },

  // Group H
  { name: 'Spain', code: 'ESP', isoCode: 'es', group: 'H' },
  { name: 'Cape Verde', code: 'CPV', isoCode: 'cv', group: 'H' },
  { name: 'Saudi Arabia', code: 'KSA', isoCode: 'sa', group: 'H' },
  { name: 'Uruguay', code: 'URU', isoCode: 'uy', group: 'H' },

  // Group I
  { name: 'France', code: 'FRA', isoCode: 'fr', group: 'I' },
  { name: 'Senegal', code: 'SEN', isoCode: 'sn', group: 'I' },
  { name: 'IC Path 2 winner', code: 'IP2', isoCode: 'un', group: 'I' },
  { name: 'Norway', code: 'NOR', isoCode: 'no', group: 'I' },

  // Group J
  { name: 'Argentina', code: 'ARG', isoCode: 'ar', group: 'J' },
  { name: 'Algeria', code: 'ALG', isoCode: 'dz', group: 'J' },
  { name: 'Austria', code: 'AUT', isoCode: 'at', group: 'J' },
  { name: 'Jordan', code: 'JOR', isoCode: 'jo', group: 'J' },

  // Group K
  { name: 'Portugal', code: 'POR', isoCode: 'pt', group: 'K' },
  { name: 'IC Path 1 winner', code: 'IP1', isoCode: 'un', group: 'K' },
  { name: 'Uzbekistan', code: 'UZB', isoCode: 'uz', group: 'K' },
  { name: 'Colombia', code: 'COL', isoCode: 'co', group: 'K' },

  // Group L
  { name: 'England', code: 'ENG', isoCode: 'gb-eng', group: 'L' },
  { name: 'Croatia', code: 'CRO', isoCode: 'hr', group: 'L' },
  { name: 'Ghana', code: 'GHA', isoCode: 'gh', group: 'L' },
  { name: 'Panama', code: 'PAN', isoCode: 'pa', group: 'L' },
];

// ---------------------------------------------------------------------------
// Phase definitions
// ---------------------------------------------------------------------------

const PHASES: { phase: MatchPhase; multiplier: number; sortOrder: number }[] = [
  { phase: 'GROUP_STAGE', multiplier: 1, sortOrder: 0 },
  { phase: 'ROUND_OF_32', multiplier: 2, sortOrder: 1 },
  { phase: 'ROUND_OF_16', multiplier: 2, sortOrder: 2 },
  { phase: 'QUARTER_FINAL', multiplier: 3, sortOrder: 3 },
  { phase: 'SEMI_FINAL', multiplier: 3, sortOrder: 4 },
  { phase: 'THIRD_PLACE', multiplier: 3, sortOrder: 5 },
  { phase: 'FINAL', multiplier: 3, sortOrder: 6 },
];

// ---------------------------------------------------------------------------
// Bonus types
// ---------------------------------------------------------------------------

const BONUS_TYPES = [
  { key: 'champion', label: 'Champion', points: 10, sortOrder: 0 },
  { key: 'top_scorer', label: 'Top Scorer', points: 10, sortOrder: 1 },
  { key: 'mvp', label: 'Most Valuable Player', points: 10, sortOrder: 2 },
  { key: 'revelation', label: 'Revelation Team', points: 10, sortOrder: 3 },
];

// ---------------------------------------------------------------------------
// Match data from openfootball
// ---------------------------------------------------------------------------

interface RawMatch {
  round: string;
  num?: number;
  date: string;
  time: string;
  team1: string;
  team2: string;
  group?: string;
  ground: string;
}

const MATCHES_DATA: RawMatch[] = [
  // Group A
  { round: 'Matchday 1', date: '2026-06-11', time: '19:00', team1: 'Mexico', team2: 'South Africa', group: 'Group A', ground: 'Mexico City' },
  { round: 'Matchday 1', date: '2026-06-12', time: '02:00', team1: 'South Korea', team2: 'UEFA Path D winner', group: 'Group A', ground: 'Guadalajara' },
  { round: 'Matchday 8', date: '2026-06-18', time: '16:00', team1: 'UEFA Path D winner', team2: 'South Africa', group: 'Group A', ground: 'Atlanta' },
  { round: 'Matchday 8', date: '2026-06-19', time: '01:00', team1: 'Mexico', team2: 'South Korea', group: 'Group A', ground: 'Guadalajara' },
  { round: 'Matchday 14', date: '2026-06-25', time: '01:00', team1: 'UEFA Path D winner', team2: 'Mexico', group: 'Group A', ground: 'Mexico City' },
  { round: 'Matchday 14', date: '2026-06-25', time: '01:00', team1: 'South Africa', team2: 'South Korea', group: 'Group A', ground: 'Monterrey' },
  // Group B
  { round: 'Matchday 2', date: '2026-06-12', time: '19:00', team1: 'Canada', team2: 'UEFA Path A winner', group: 'Group B', ground: 'Toronto' },
  { round: 'Matchday 3', date: '2026-06-13', time: '19:00', team1: 'Qatar', team2: 'Switzerland', group: 'Group B', ground: 'Santa Clara' },
  { round: 'Matchday 8', date: '2026-06-18', time: '19:00', team1: 'Switzerland', team2: 'UEFA Path A winner', group: 'Group B', ground: 'Los Angeles' },
  { round: 'Matchday 8', date: '2026-06-18', time: '22:00', team1: 'Canada', team2: 'Qatar', group: 'Group B', ground: 'Vancouver' },
  { round: 'Matchday 14', date: '2026-06-24', time: '19:00', team1: 'Switzerland', team2: 'Canada', group: 'Group B', ground: 'Vancouver' },
  { round: 'Matchday 14', date: '2026-06-24', time: '19:00', team1: 'UEFA Path A winner', team2: 'Qatar', group: 'Group B', ground: 'Seattle' },
  // Group C
  { round: 'Matchday 3', date: '2026-06-13', time: '22:00', team1: 'Brazil', team2: 'Morocco', group: 'Group C', ground: 'East Rutherford' },
  { round: 'Matchday 3', date: '2026-06-14', time: '01:00', team1: 'Haiti', team2: 'Scotland', group: 'Group C', ground: 'Foxborough' },
  { round: 'Matchday 9', date: '2026-06-19', time: '22:00', team1: 'Scotland', team2: 'Morocco', group: 'Group C', ground: 'Foxborough' },
  { round: 'Matchday 9', date: '2026-06-20', time: '01:00', team1: 'Brazil', team2: 'Haiti', group: 'Group C', ground: 'Philadelphia' },
  { round: 'Matchday 14', date: '2026-06-24', time: '22:00', team1: 'Scotland', team2: 'Brazil', group: 'Group C', ground: 'Miami Gardens' },
  { round: 'Matchday 14', date: '2026-06-24', time: '22:00', team1: 'Morocco', team2: 'Haiti', group: 'Group C', ground: 'Atlanta' },
  // Group D
  { round: 'Matchday 2', date: '2026-06-13', time: '01:00', team1: 'USA', team2: 'Paraguay', group: 'Group D', ground: 'Los Angeles' },
  { round: 'Matchday 3', date: '2026-06-14', time: '04:00', team1: 'Australia', team2: 'UEFA Path C winner', group: 'Group D', ground: 'Vancouver' },
  { round: 'Matchday 9', date: '2026-06-19', time: '19:00', team1: 'USA', team2: 'Australia', group: 'Group D', ground: 'Seattle' },
  { round: 'Matchday 9', date: '2026-06-20', time: '04:00', team1: 'UEFA Path C winner', team2: 'Paraguay', group: 'Group D', ground: 'Santa Clara' },
  { round: 'Matchday 15', date: '2026-06-26', time: '02:00', team1: 'UEFA Path C winner', team2: 'USA', group: 'Group D', ground: 'Los Angeles' },
  { round: 'Matchday 15', date: '2026-06-26', time: '02:00', team1: 'Paraguay', team2: 'Australia', group: 'Group D', ground: 'Santa Clara' },
  // Group E
  { round: 'Matchday 4', date: '2026-06-14', time: '17:00', team1: 'Germany', team2: 'Curaçao', group: 'Group E', ground: 'Houston' },
  { round: 'Matchday 4', date: '2026-06-14', time: '23:00', team1: 'Ivory Coast', team2: 'Ecuador', group: 'Group E', ground: 'Philadelphia' },
  { round: 'Matchday 10', date: '2026-06-20', time: '20:00', team1: 'Germany', team2: 'Ivory Coast', group: 'Group E', ground: 'Toronto' },
  { round: 'Matchday 10', date: '2026-06-21', time: '00:00', team1: 'Ecuador', team2: 'Curaçao', group: 'Group E', ground: 'Kansas City' },
  { round: 'Matchday 15', date: '2026-06-25', time: '20:00', team1: 'Curaçao', team2: 'Ivory Coast', group: 'Group E', ground: 'Philadelphia' },
  { round: 'Matchday 15', date: '2026-06-25', time: '20:00', team1: 'Ecuador', team2: 'Germany', group: 'Group E', ground: 'East Rutherford' },
  // Group F
  { round: 'Matchday 4', date: '2026-06-14', time: '20:00', team1: 'Netherlands', team2: 'Japan', group: 'Group F', ground: 'Arlington' },
  { round: 'Matchday 4', date: '2026-06-15', time: '02:00', team1: 'UEFA Path B winner', team2: 'Tunisia', group: 'Group F', ground: 'Monterrey' },
  { round: 'Matchday 10', date: '2026-06-20', time: '17:00', team1: 'Netherlands', team2: 'UEFA Path B winner', group: 'Group F', ground: 'Houston' },
  { round: 'Matchday 10', date: '2026-06-21', time: '04:00', team1: 'Tunisia', team2: 'Japan', group: 'Group F', ground: 'Monterrey' },
  { round: 'Matchday 15', date: '2026-06-25', time: '23:00', team1: 'Japan', team2: 'UEFA Path B winner', group: 'Group F', ground: 'Arlington' },
  { round: 'Matchday 15', date: '2026-06-25', time: '23:00', team1: 'Tunisia', team2: 'Netherlands', group: 'Group F', ground: 'Kansas City' },
  // Group G
  { round: 'Matchday 5', date: '2026-06-15', time: '19:00', team1: 'Belgium', team2: 'Egypt', group: 'Group G', ground: 'Seattle' },
  { round: 'Matchday 5', date: '2026-06-16', time: '01:00', team1: 'Iran', team2: 'New Zealand', group: 'Group G', ground: 'Los Angeles' },
  { round: 'Matchday 11', date: '2026-06-21', time: '19:00', team1: 'Belgium', team2: 'Iran', group: 'Group G', ground: 'Los Angeles' },
  { round: 'Matchday 11', date: '2026-06-22', time: '01:00', team1: 'New Zealand', team2: 'Egypt', group: 'Group G', ground: 'Vancouver' },
  { round: 'Matchday 16', date: '2026-06-27', time: '03:00', team1: 'Egypt', team2: 'Iran', group: 'Group G', ground: 'Seattle' },
  { round: 'Matchday 16', date: '2026-06-27', time: '03:00', team1: 'New Zealand', team2: 'Belgium', group: 'Group G', ground: 'Vancouver' },
  // Group H
  { round: 'Matchday 5', date: '2026-06-15', time: '16:00', team1: 'Spain', team2: 'Cape Verde', group: 'Group H', ground: 'Atlanta' },
  { round: 'Matchday 5', date: '2026-06-15', time: '22:00', team1: 'Saudi Arabia', team2: 'Uruguay', group: 'Group H', ground: 'Miami Gardens' },
  { round: 'Matchday 11', date: '2026-06-21', time: '16:00', team1: 'Spain', team2: 'Saudi Arabia', group: 'Group H', ground: 'Atlanta' },
  { round: 'Matchday 11', date: '2026-06-21', time: '22:00', team1: 'Uruguay', team2: 'Cape Verde', group: 'Group H', ground: 'Miami Gardens' },
  { round: 'Matchday 16', date: '2026-06-27', time: '00:00', team1: 'Cape Verde', team2: 'Saudi Arabia', group: 'Group H', ground: 'Houston' },
  { round: 'Matchday 16', date: '2026-06-27', time: '00:00', team1: 'Uruguay', team2: 'Spain', group: 'Group H', ground: 'Guadalajara' },
  // Group I
  { round: 'Matchday 6', date: '2026-06-16', time: '19:00', team1: 'France', team2: 'Senegal', group: 'Group I', ground: 'East Rutherford' },
  { round: 'Matchday 6', date: '2026-06-16', time: '22:00', team1: 'IC Path 2 winner', team2: 'Norway', group: 'Group I', ground: 'Foxborough' },
  { round: 'Matchday 12', date: '2026-06-22', time: '21:00', team1: 'France', team2: 'IC Path 2 winner', group: 'Group I', ground: 'Philadelphia' },
  { round: 'Matchday 12', date: '2026-06-23', time: '00:00', team1: 'Norway', team2: 'Senegal', group: 'Group I', ground: 'East Rutherford' },
  { round: 'Matchday 16', date: '2026-06-26', time: '19:00', team1: 'Norway', team2: 'France', group: 'Group I', ground: 'Foxborough' },
  { round: 'Matchday 16', date: '2026-06-26', time: '19:00', team1: 'Senegal', team2: 'IC Path 2 winner', group: 'Group I', ground: 'Toronto' },
  // Group J
  { round: 'Matchday 6', date: '2026-06-17', time: '01:00', team1: 'Argentina', team2: 'Algeria', group: 'Group J', ground: 'Kansas City' },
  { round: 'Matchday 6', date: '2026-06-17', time: '04:00', team1: 'Austria', team2: 'Jordan', group: 'Group J', ground: 'Santa Clara' },
  { round: 'Matchday 12', date: '2026-06-22', time: '17:00', team1: 'Argentina', team2: 'Austria', group: 'Group J', ground: 'Arlington' },
  { round: 'Matchday 12', date: '2026-06-23', time: '03:00', team1: 'Jordan', team2: 'Algeria', group: 'Group J', ground: 'Santa Clara' },
  { round: 'Matchday 17', date: '2026-06-28', time: '02:00', team1: 'Algeria', team2: 'Austria', group: 'Group J', ground: 'Kansas City' },
  { round: 'Matchday 17', date: '2026-06-28', time: '02:00', team1: 'Jordan', team2: 'Argentina', group: 'Group J', ground: 'Arlington' },
  // Group K
  { round: 'Matchday 7', date: '2026-06-17', time: '17:00', team1: 'Portugal', team2: 'IC Path 1 winner', group: 'Group K', ground: 'Houston' },
  { round: 'Matchday 7', date: '2026-06-18', time: '02:00', team1: 'Uzbekistan', team2: 'Colombia', group: 'Group K', ground: 'Mexico City' },
  { round: 'Matchday 13', date: '2026-06-23', time: '17:00', team1: 'Portugal', team2: 'Uzbekistan', group: 'Group K', ground: 'Houston' },
  { round: 'Matchday 13', date: '2026-06-24', time: '02:00', team1: 'Colombia', team2: 'IC Path 1 winner', group: 'Group K', ground: 'Guadalajara' },
  { round: 'Matchday 17', date: '2026-06-27', time: '23:30', team1: 'Colombia', team2: 'Portugal', group: 'Group K', ground: 'Miami Gardens' },
  { round: 'Matchday 17', date: '2026-06-27', time: '23:30', team1: 'IC Path 1 winner', team2: 'Uzbekistan', group: 'Group K', ground: 'Atlanta' },
  // Group L
  { round: 'Matchday 7', date: '2026-06-17', time: '20:00', team1: 'England', team2: 'Croatia', group: 'Group L', ground: 'Arlington' },
  { round: 'Matchday 7', date: '2026-06-17', time: '23:00', team1: 'Ghana', team2: 'Panama', group: 'Group L', ground: 'Toronto' },
  { round: 'Matchday 13', date: '2026-06-23', time: '20:00', team1: 'England', team2: 'Ghana', group: 'Group L', ground: 'Foxborough' },
  { round: 'Matchday 13', date: '2026-06-23', time: '23:00', team1: 'Panama', team2: 'Croatia', group: 'Group L', ground: 'Toronto' },
  { round: 'Matchday 17', date: '2026-06-27', time: '21:00', team1: 'Panama', team2: 'England', group: 'Group L', ground: 'East Rutherford' },
  { round: 'Matchday 17', date: '2026-06-27', time: '21:00', team1: 'Croatia', team2: 'Ghana', group: 'Group L', ground: 'Philadelphia' },
];

interface KnockoutMatchDef {
  num: number;
  phase: MatchPhase;
  date: string;
  time: string;
  home: string;
  away: string;
  ground: string;
}

const KNOCKOUT_MATCHES: KnockoutMatchDef[] = [
  // Round of 32
  { num: 73, phase: 'ROUND_OF_32', date: '2026-06-28', time: '19:00', home: '2A', away: '2B', ground: 'Los Angeles' },
  { num: 74, phase: 'ROUND_OF_32', date: '2026-06-29', time: '20:30', home: '1E', away: '3A/B/C/D/F', ground: 'Foxborough' },
  { num: 75, phase: 'ROUND_OF_32', date: '2026-06-30', time: '01:00', home: '1F', away: '2C', ground: 'Monterrey' },
  { num: 76, phase: 'ROUND_OF_32', date: '2026-06-29', time: '17:00', home: '1C', away: '2F', ground: 'Houston' },
  { num: 77, phase: 'ROUND_OF_32', date: '2026-06-30', time: '21:00', home: '1I', away: '3C/D/F/G/H', ground: 'East Rutherford' },
  { num: 78, phase: 'ROUND_OF_32', date: '2026-06-30', time: '17:00', home: '2E', away: '2I', ground: 'Arlington' },
  { num: 79, phase: 'ROUND_OF_32', date: '2026-07-01', time: '01:00', home: '1A', away: '3C/E/F/H/I', ground: 'Mexico City' },
  { num: 80, phase: 'ROUND_OF_32', date: '2026-07-01', time: '16:00', home: '1L', away: '3E/H/I/J/K', ground: 'Atlanta' },
  { num: 81, phase: 'ROUND_OF_32', date: '2026-07-02', time: '00:00', home: '1D', away: '3B/E/F/I/J', ground: 'Santa Clara' },
  { num: 82, phase: 'ROUND_OF_32', date: '2026-07-01', time: '20:00', home: '1G', away: '3A/E/H/I/J', ground: 'Seattle' },
  { num: 83, phase: 'ROUND_OF_32', date: '2026-07-02', time: '23:00', home: '2K', away: '2L', ground: 'Toronto' },
  { num: 84, phase: 'ROUND_OF_32', date: '2026-07-02', time: '19:00', home: '1H', away: '2J', ground: 'Los Angeles' },
  { num: 85, phase: 'ROUND_OF_32', date: '2026-07-03', time: '03:00', home: '1B', away: '3E/F/G/I/J', ground: 'Vancouver' },
  { num: 86, phase: 'ROUND_OF_32', date: '2026-07-03', time: '22:00', home: '1J', away: '2H', ground: 'Miami Gardens' },
  { num: 87, phase: 'ROUND_OF_32', date: '2026-07-04', time: '01:30', home: '1K', away: '3D/E/I/J/L', ground: 'Kansas City' },
  { num: 88, phase: 'ROUND_OF_32', date: '2026-07-03', time: '18:00', home: '2D', away: '2G', ground: 'Arlington' },
  // Round of 16
  { num: 89, phase: 'ROUND_OF_16', date: '2026-07-04', time: '21:00', home: 'W74', away: 'W77', ground: 'Philadelphia' },
  { num: 90, phase: 'ROUND_OF_16', date: '2026-07-04', time: '17:00', home: 'W73', away: 'W75', ground: 'Houston' },
  { num: 91, phase: 'ROUND_OF_16', date: '2026-07-05', time: '20:00', home: 'W76', away: 'W78', ground: 'East Rutherford' },
  { num: 92, phase: 'ROUND_OF_16', date: '2026-07-06', time: '00:00', home: 'W79', away: 'W80', ground: 'Mexico City' },
  { num: 93, phase: 'ROUND_OF_16', date: '2026-07-06', time: '19:00', home: 'W83', away: 'W84', ground: 'Arlington' },
  { num: 94, phase: 'ROUND_OF_16', date: '2026-07-07', time: '00:00', home: 'W81', away: 'W82', ground: 'Seattle' },
  { num: 95, phase: 'ROUND_OF_16', date: '2026-07-07', time: '16:00', home: 'W86', away: 'W88', ground: 'Atlanta' },
  { num: 96, phase: 'ROUND_OF_16', date: '2026-07-07', time: '20:00', home: 'W85', away: 'W87', ground: 'Vancouver' },
  // Quarter-finals
  { num: 97, phase: 'QUARTER_FINAL', date: '2026-07-09', time: '20:00', home: 'W89', away: 'W90', ground: 'Foxborough' },
  { num: 98, phase: 'QUARTER_FINAL', date: '2026-07-10', time: '19:00', home: 'W93', away: 'W94', ground: 'Los Angeles' },
  { num: 99, phase: 'QUARTER_FINAL', date: '2026-07-11', time: '21:00', home: 'W91', away: 'W92', ground: 'Miami Gardens' },
  { num: 100, phase: 'QUARTER_FINAL', date: '2026-07-12', time: '01:00', home: 'W95', away: 'W96', ground: 'Kansas City' },
  // Semi-finals
  { num: 101, phase: 'SEMI_FINAL', date: '2026-07-14', time: '19:00', home: 'W97', away: 'W98', ground: 'Arlington' },
  { num: 102, phase: 'SEMI_FINAL', date: '2026-07-15', time: '19:00', home: 'W99', away: 'W100', ground: 'Atlanta' },
  // Third place
  { num: 103, phase: 'THIRD_PLACE', date: '2026-07-18', time: '21:00', home: 'L101', away: 'L102', ground: 'Miami Gardens' },
  // Final
  { num: 104, phase: 'FINAL', date: '2026-07-19', time: '19:00', home: 'W101', away: 'W102', ground: 'East Rutherford' },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getFlagUrl(isoCode: string): string {
  return `https://flagcdn.com/w80/${isoCode}.png`;
}

function parseScheduledAt(date: string, time: string): Date {
  return new Date(`${date}T${time}:00.000Z`);
}

function extractGroupLetter(groupStr: string): string {
  // "Group A" -> "A"
  return groupStr.replace('Group ', '');
}

function buildPlaceholder(code: string): string {
  // "1A" -> "Winner Group A", "2A" -> "Runner-up Group A", "3A/B/C/D/F" -> "3rd Place A/B/C/D/F"
  // "W74" -> "Winner Match 74", "L101" -> "Loser Match 101"
  if (code.startsWith('W')) {
    return `Winner Match ${code.slice(1)}`;
  }
  if (code.startsWith('L')) {
    return `Loser Match ${code.slice(1)}`;
  }
  const pos = code[0];
  const groups = code.slice(1);
  if (pos === '1') {
    return `Winner Group ${groups}`;
  }
  if (pos === '2') {
    return `Runner-up Group ${groups}`;
  }
  if (pos === '3') {
    return `3rd Place ${groups}`;
  }
  return code;
}

// ---------------------------------------------------------------------------
// Main seed function
// ---------------------------------------------------------------------------

async function seed(): Promise<void> {
  console.log('🏆 Starting World Cup 2026 seed...\n');

  await prisma.$transaction(async (tx) => {
    // -----------------------------------------------------------------------
    // 1. Create or find tournament
    // -----------------------------------------------------------------------

    let tournament = await tx.tournament.findUnique({
      where: { slug: 'world-cup-2026' },
    });

    if (tournament) {
      console.log(`✅ Tournament already exists: ${tournament.name} (${tournament.id})`);
    } else {
      tournament = await tx.tournament.create({
        data: {
          name: 'FIFA World Cup 2026',
          slug: 'world-cup-2026',
          type: 'WORLD_CUP',
          description: 'The 23rd FIFA World Cup, hosted by Canada, Mexico, and the United States.',
          startDate: new Date('2026-06-11'),
          endDate: new Date('2026-07-19'),
          status: 'UPCOMING',
        },
      });
      console.log(`✅ Tournament created: ${tournament.name} (${tournament.id})`);
    }

    const tournamentId = tournament.id;

    // -----------------------------------------------------------------------
    // 2. Upsert phases
    // -----------------------------------------------------------------------

    for (const p of PHASES) {
      await tx.tournamentPhase.upsert({
        where: {
          tournamentId_phase: { tournamentId, phase: p.phase },
        },
        update: { multiplier: p.multiplier, sortOrder: p.sortOrder },
        create: {
          tournamentId,
          phase: p.phase,
          multiplier: p.multiplier,
          sortOrder: p.sortOrder,
        },
      });
    }
    console.log(`✅ ${PHASES.length} phases upserted`);

    // -----------------------------------------------------------------------
    // 3. Upsert bonus types
    // -----------------------------------------------------------------------

    for (const b of BONUS_TYPES) {
      await tx.tournamentBonusType.upsert({
        where: {
          tournamentId_key: { tournamentId, key: b.key },
        },
        update: { label: b.label, points: b.points, sortOrder: b.sortOrder },
        create: {
          tournamentId,
          key: b.key,
          label: b.label,
          points: b.points,
          sortOrder: b.sortOrder,
        },
      });
    }
    console.log(`✅ ${BONUS_TYPES.length} bonus types upserted`);

    // -----------------------------------------------------------------------
    // 4. Create teams and tournament_teams
    // -----------------------------------------------------------------------

    const teamMap = new Map<string, string>(); // name -> id

    for (const teamDef of TEAMS) {
      // Find existing team by shortName
      let team = await tx.team.findFirst({
        where: { shortName: teamDef.code },
      });

      if (!team) {
        team = await tx.team.create({
          data: {
            name: teamDef.name,
            shortName: teamDef.code,
            flagUrl: getFlagUrl(teamDef.isoCode),
            country: teamDef.name,
          },
        });
        console.log(`  🏳️ Created team: ${teamDef.name} (${teamDef.code})`);
      }

      teamMap.set(teamDef.name, team.id);

      // Upsert tournament_team
      await tx.tournamentTeam.upsert({
        where: {
          tournamentId_teamId: { tournamentId, teamId: team.id },
        },
        update: { groupLetter: teamDef.group },
        create: {
          tournamentId,
          teamId: team.id,
          groupLetter: teamDef.group,
        },
      });
    }
    console.log(`✅ ${TEAMS.length} teams and tournament_teams upserted`);

    // -----------------------------------------------------------------------
    // 5. Delete existing matches for this tournament (idempotent re-seed)
    // -----------------------------------------------------------------------

    const deletedMatches = await tx.match.deleteMany({
      where: { tournamentId },
    });
    if (deletedMatches.count > 0) {
      console.log(`🗑️  Deleted ${deletedMatches.count} existing matches (re-seed)`);
    }

    // -----------------------------------------------------------------------
    // 6. Create group stage matches
    // -----------------------------------------------------------------------

    let matchNumber = 1;

    for (const m of MATCHES_DATA) {
      const homeTeamId = teamMap.get(m.team1) ?? null;
      const awayTeamId = teamMap.get(m.team2) ?? null;
      const groupLetter = m.group ? extractGroupLetter(m.group) : null;

      await tx.match.create({
        data: {
          tournamentId,
          homeTeamId,
          awayTeamId,
          phase: 'GROUP_STAGE',
          groupLetter,
          matchNumber,
          scheduledAt: parseScheduledAt(m.date, m.time),
          venue: m.ground,
          city: m.ground,
          homeTeamPlaceholder: homeTeamId ? null : m.team1,
          awayTeamPlaceholder: awayTeamId ? null : m.team2,
        },
      });

      matchNumber++;
    }
    console.log(`✅ ${MATCHES_DATA.length} group stage matches created`);

    // -----------------------------------------------------------------------
    // 7. Create knockout stage matches (with placeholders)
    // -----------------------------------------------------------------------

    for (const km of KNOCKOUT_MATCHES) {
      await tx.match.create({
        data: {
          tournamentId,
          homeTeamId: null,
          awayTeamId: null,
          phase: km.phase,
          groupLetter: null,
          matchNumber: km.num,
          scheduledAt: parseScheduledAt(km.date, km.time),
          venue: km.ground,
          city: km.ground,
          homeTeamPlaceholder: buildPlaceholder(km.home),
          awayTeamPlaceholder: buildPlaceholder(km.away),
        },
      });
    }
    console.log(`✅ ${KNOCKOUT_MATCHES.length} knockout stage matches created`);
  });

  const totalMatches = MATCHES_DATA.length + KNOCKOUT_MATCHES.length;
  console.log(`\n🎉 Seed completed! ${TEAMS.length} teams, ${totalMatches} matches.`);
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

seed()
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
