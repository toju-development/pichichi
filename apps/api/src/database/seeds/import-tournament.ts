/**
 * Tournament Import Script
 *
 * Imports tournament data (teams, matches, phases, players) from API-Football
 * into the Pichichi database. Supports search mode, dry-run, and idempotent
 * upserts for safe re-runs.
 *
 * Usage:
 *   npx tsx src/database/seeds/import-tournament.ts --search "world cup"
 *   npx tsx src/database/seeds/import-tournament.ts --league 1 --season 2026
 *   npx tsx src/database/seeds/import-tournament.ts --league 1 --season 2026 --dry-run
 *   npx tsx src/database/seeds/import-tournament.ts --league 1 --season 2026 --include-players
 *
 * Or via npm script:
 *   npm run import-tournament -- --league 1 --season 2026
 *
 * @see docs/EXTERNAL-API.md
 */

import 'dotenv/config';

import { MatchPhase, PrismaClient, TournamentStatus } from '@prisma/client';

import {
  buildTeamGroupMap,
  createApiFootballClient,
  type ApiFootballLeague,
} from './api-football-client.js';
import {
  generateTournamentSlug,
  mapFixtureData,
  mapMatchPhase,
  mapPlayerData,
  mapTeamData,
  mapTournamentStatus,
  mapTournamentType,
} from './mappers.js';

// ---------------------------------------------------------------------------
// Phase multipliers (mirrors packages/shared/src/constants/scoring.ts)
// Seed scripts use direct values to avoid cross-package import complexity.
// ---------------------------------------------------------------------------

const PHASE_MULTIPLIERS: Record<MatchPhase, number> = {
  GROUP_STAGE: 1,
  ROUND_OF_32: 2,
  ROUND_OF_16: 2,
  QUARTER_FINAL: 3,
  SEMI_FINAL: 3,
  THIRD_PLACE: 3,
  FINAL: 3,
} as const;

const PHASE_SORT_ORDER: Record<MatchPhase, number> = {
  GROUP_STAGE: 0,
  ROUND_OF_32: 1,
  ROUND_OF_16: 2,
  QUARTER_FINAL: 3,
  SEMI_FINAL: 4,
  THIRD_PLACE: 5,
  FINAL: 6,
} as const;

// ---------------------------------------------------------------------------
// Standard bonus types
// ---------------------------------------------------------------------------

const STANDARD_BONUS_TYPES = [
  { key: 'CHAMPION', label: 'Champion', points: 10, sortOrder: 0 },
  { key: 'TOP_SCORER', label: 'Top Scorer', points: 10, sortOrder: 1 },
  { key: 'MVP', label: 'Most Valuable Player', points: 10, sortOrder: 2 },
  { key: 'REVELATION', label: 'Revelation Team', points: 10, sortOrder: 3 },
] as const;

// ---------------------------------------------------------------------------
// CLI Argument Parsing
// ---------------------------------------------------------------------------

interface CliArgs {
  mode: 'search' | 'import';
  searchText?: string;
  leagueId?: number;
  season?: number;
  includePlayers: boolean;
  dryRun: boolean;
  linkSlug?: string;
  delayMs: number;
}

function printHelp(): void {
  console.log(`
Tournament Import Script — Pichichi

USAGE:
  npx tsx src/database/seeds/import-tournament.ts [OPTIONS]

MODES:
  --search <text>           Search tournaments in API-Football by name
  --league <id> --season <year>   Import a tournament by league ID and season

OPTIONS:
  --include-players         Also import player squads for each team
  --dry-run                 Fetch data and show what would change, without writing to DB
  --link-slug <slug>        Link to an existing tournament by slug instead of creating new
  --delay <ms>              Delay between API calls in ms (default: 7000)
  --help                    Show this help message

EXAMPLES:
  # Search for World Cup tournaments
  npx tsx src/database/seeds/import-tournament.ts --search "world cup"

  # Import FIFA World Cup 2026
  npx tsx src/database/seeds/import-tournament.ts --league 1 --season 2026

  # Import with players and dry-run
  npx tsx src/database/seeds/import-tournament.ts --league 1 --season 2026 --include-players --dry-run

  # Link import to existing seed tournament
  npx tsx src/database/seeds/import-tournament.ts --league 1 --season 2026 --link-slug world-cup-2026

ENVIRONMENT:
  API_FOOTBALL_KEY          Required. API key for api-football.com (v3)
`);
}

function parseArgs(argv: string[]): CliArgs | null {
  const args = argv.slice(2);

  if (args.includes('--help')) {
    printHelp();
    process.exit(0);
  }

  if (args.length === 0) {
    printHelp();
    return null;
  }

  let searchText: string | undefined;
  let leagueId: number | undefined;
  let season: number | undefined;
  let includePlayers = false;
  let dryRun = false;
  let linkSlug: string | undefined;
  let delayMs = 7000;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '--search': {
        const val = args[++i];
        if (!val || val.startsWith('--')) {
          console.error('Error: --search requires a text argument');
          return null;
        }
        searchText = val;
        break;
      }
      case '--league': {
        const val = args[++i];
        const parsed = parseInt(val, 10);
        if (isNaN(parsed) || parsed <= 0) {
          console.error('Error: --league requires a positive integer');
          return null;
        }
        leagueId = parsed;
        break;
      }
      case '--season': {
        const val = args[++i];
        const parsed = parseInt(val, 10);
        if (isNaN(parsed) || parsed < 1900 || parsed > 2100) {
          console.error('Error: --season requires a valid year (1900-2100)');
          return null;
        }
        season = parsed;
        break;
      }
      case '--include-players':
        includePlayers = true;
        break;
      case '--dry-run':
        dryRun = true;
        break;
      case '--link-slug': {
        const val = args[++i];
        if (!val || val.startsWith('--')) {
          console.error('Error: --link-slug requires a slug argument');
          return null;
        }
        linkSlug = val;
        break;
      }
      case '--delay': {
        const val = args[++i];
        const parsed = parseInt(val, 10);
        if (isNaN(parsed) || parsed < 0) {
          console.error('Error: --delay requires a non-negative integer (ms)');
          return null;
        }
        delayMs = parsed;
        break;
      }
      default:
        console.error(`Error: Unknown argument "${arg}"`);
        printHelp();
        return null;
    }
  }

  // Validate mutually exclusive modes
  if (searchText && leagueId) {
    console.error('Error: --search and --league are mutually exclusive. Use one or the other.');
    return null;
  }

  // Search mode
  if (searchText) {
    return { mode: 'search', searchText, includePlayers, dryRun, delayMs };
  }

  // Import mode — requires both --league and --season
  if (leagueId && season) {
    return { mode: 'import', leagueId, season, includePlayers, dryRun, linkSlug, delayMs };
  }

  if (leagueId && !season) {
    console.error('Error: --season is required when using --league');
    return null;
  }

  if (!leagueId && season) {
    console.error('Error: --league is required when using --season');
    return null;
  }

  console.error('Error: Provide either --search <text> or --league <id> --season <year>');
  printHelp();
  return null;
}

// ---------------------------------------------------------------------------
// Search Mode
// ---------------------------------------------------------------------------

async function runSearchMode(
  searchText: string,
  apiKey: string,
  delayMs: number,
): Promise<void> {
  const client = createApiFootballClient({ apiKey, delayMs });

  console.log(`\n🔍 Searching tournaments matching "${searchText}"...\n`);

  const leagues = await client.searchLeagues(searchText);

  if (leagues.length === 0) {
    console.log('  No results found. Try a different search term.');
    console.log(`\n📡 API calls used: ${client.getApiCallCount()}`);
    return;
  }

  // Table header
  const header = '  ID      Type     Name                                 Country          Seasons';
  const separator = '  ─────   ──────   ────────────────────────────────────  ───────────────  ───────';

  console.log(header);
  console.log(separator);

  for (const league of leagues) {
    const id = String(league.league.id).padEnd(6);
    const type = league.league.type.padEnd(7);
    const name = league.league.name.slice(0, 36).padEnd(36);
    const country = (league.country.name ?? '').slice(0, 15).padEnd(15);
    const seasons = league.seasons
      .map((s) => s.year)
      .sort((a, b) => b - a)
      .slice(0, 5)
      .join(', ');

    console.log(`  ${id}  ${type}  ${name}  ${country}  ${seasons}`);
  }

  console.log(`\n  ${leagues.length} result(s) found.`);
  console.log(`📡 API calls used: ${client.getApiCallCount()}`);
}

// ---------------------------------------------------------------------------
// Import Pipeline
// ---------------------------------------------------------------------------

interface ImportCounts {
  teamsCreated: number;
  teamsUpdated: number;
  matchesCreated: number;
  matchesUpdated: number;
  phasesCreated: number;
  bonusTypesCreated: number;
  playersCreated: number;
  playersUpdated: number;
  tournamentPlayersCreated: number;
  tournamentPlayersUpdated: number;
  tournamentAction: 'created' | 'updated';
}

function logPrefix(dryRun: boolean): string {
  return dryRun ? '[DRY RUN] ' : '';
}

/**
 * Extract full group name from API-Football round string.
 *
 * PRIMARY: Look up from teamGroupMap by team external ID (from /standings endpoint).
 * FALLBACK: When standings map is empty, parse the round string with a regex.
 *
 * The regex captures "Group A" through "Group H" (full name, not just the letter).
 * It rejects "Group Stage" because the word boundary \b after [A-H] won't match "Stage".
 *
 * @returns Full group name like "Group A", or null if not a group-stage round.
 */
function extractGroupName(round: string): string | null {
  const match = round.match(/^(Group\s+[A-H])\b/i);
  if (!match) return null;
  // Normalize to "Group X" with uppercase letter
  const letter = match[1].slice(-1).toUpperCase();
  return `Group ${letter}`;
}

async function runImportPipeline(
  args: CliArgs,
  apiKey: string,
): Promise<void> {
  const { leagueId, season, includePlayers, dryRun, linkSlug, delayMs } = args;
  const prefix = logPrefix(dryRun);
  const startTime = Date.now();

  if (!leagueId || !season) {
    throw new Error('leagueId and season are required for import mode');
  }

  const prisma = new PrismaClient();
  const client = createApiFootballClient({ apiKey, delayMs });

  const counts: ImportCounts = {
    teamsCreated: 0,
    teamsUpdated: 0,
    matchesCreated: 0,
    matchesUpdated: 0,
    phasesCreated: 0,
    bonusTypesCreated: 0,
    playersCreated: 0,
    playersUpdated: 0,
    tournamentPlayersCreated: 0,
    tournamentPlayersUpdated: 0,
    tournamentAction: 'created',
  };

  try {
    // Verify DB connection
    await prisma.$connect();

    // ─────────────────────────────────────────────────────────────────────
    // 1. Fetch league info
    // ─────────────────────────────────────────────────────────────────────

    console.log(`\n${prefix}📡 Fetching league info for league=${leagueId}, season=${season}...`);

    const league = await client.fetchLeague(leagueId, season);

    if (!league) {
      console.error(`\n❌ No league found for ID ${leagueId} in season ${season}.`);
      console.error('   Use --search to find valid league IDs.');
      process.exit(1);
    }

    const tournamentType = mapTournamentType(league);
    const slug = linkSlug ?? generateTournamentSlug(league.league.name, season);
    const seasonData = league.seasons.find((s) => s.year === season);
    const tournamentStatus = mapTournamentStatus(seasonData);

    console.log(`${prefix}🏆 Importing: ${league.league.name} (${league.league.type}) → status: ${tournamentStatus}`);

    // ─────────────────────────────────────────────────────────────────────
    // 2. Upsert Tournament
    // ─────────────────────────────────────────────────────────────────────

    let tournamentId: string;

    if (dryRun) {
      const existing = await findExistingTournament(prisma, slug, leagueId, season);
      counts.tournamentAction = existing ? 'updated' : 'created';
      tournamentId = existing?.id ?? 'dry-run-id';
      console.log(`${prefix}✅ Tournament: would be ${counts.tournamentAction} "${league.league.name}"`);
    } else {
      const result = await upsertTournament(prisma, {
        slug,
        name: league.league.name,
        type: tournamentType,
        logoUrl: league.league.logo,
        externalLeagueId: leagueId,
        externalSeason: season,
        startDate: seasonData ? new Date(seasonData.start) : new Date(),
        endDate: seasonData ? new Date(seasonData.end) : new Date(),
        status: tournamentStatus,
      });
      tournamentId = result.id;
      counts.tournamentAction = result.action;
      console.log(`${prefix}✅ Tournament: ${result.action} "${league.league.name}"`);
    }

    // ─────────────────────────────────────────────────────────────────────
    // 3. Fetch & upsert Teams
    // ─────────────────────────────────────────────────────────────────────

    console.log(`${prefix}📡 Fetching teams...`);

    const apiTeams = await client.fetchTeams(leagueId, season);
    // Map<externalId, prismaTeamId>
    const teamExternalToId = new Map<number, string>();

    if (apiTeams.length === 0) {
      console.warn(`${prefix}⚠️  No teams returned from API.`);
    } else {
      for (const apiTeam of apiTeams) {
        const mapped = mapTeamData(apiTeam);

        try {
          if (dryRun) {
            const existing = await prisma.team.findUnique({
              where: { externalId: mapped.externalId },
            });
            if (existing) {
              counts.teamsUpdated++;
              teamExternalToId.set(mapped.externalId, existing.id);
            } else {
              counts.teamsCreated++;
              teamExternalToId.set(mapped.externalId, 'dry-run-team-id');
            }
          } else {
            // Pre-check to track created vs updated (Team has no timestamps)
            const existingTeam = await prisma.team.findUnique({
              where: { externalId: mapped.externalId },
              select: { id: true },
            });

            const team = await prisma.team.upsert({
              where: { externalId: mapped.externalId },
              update: {
                name: mapped.name,
                shortName: mapped.shortName,
                logoUrl: mapped.logoUrl,
                country: mapped.country,
              },
              create: {
                name: mapped.name,
                shortName: mapped.shortName,
                logoUrl: mapped.logoUrl,
                country: mapped.country,
                externalId: mapped.externalId,
              },
            });

            if (existingTeam) {
              counts.teamsUpdated++;
            } else {
              counts.teamsCreated++;
            }

            teamExternalToId.set(mapped.externalId, team.id);
          }
        } catch (error) {
          console.error(
            `${prefix}⚠️  Failed to upsert team "${mapped.name}" (externalId: ${mapped.externalId}):`,
            error instanceof Error ? error.message : error,
          );
        }
      }

      console.log(
        `${prefix}⚽ Teams: ${apiTeams.length} found — Created: ${counts.teamsCreated} | Updated: ${counts.teamsUpdated}`,
      );
    }

    // ─────────────────────────────────────────────────────────────────────
    // 4. Fetch standings (primary source for team→group mapping)
    // ─────────────────────────────────────────────────────────────────────

    console.log(`${prefix}📡 Fetching standings...`);

    const standings = await client.fetchStandings(leagueId, season);
    const teamGroupMap = buildTeamGroupMap(standings);

    console.log(`${prefix}📊 Found ${teamGroupMap.size} team→group mappings from standings`);

    // ─────────────────────────────────────────────────────────────────────
    // 4a. Fetch fixtures (needed for phases + match upserts)
    // ─────────────────────────────────────────────────────────────────────

    console.log(`${prefix}📡 Fetching fixtures...`);

    const apiFixtures = await client.fetchFixtures(leagueId, season);
    const mappedFixtures = apiFixtures.map(mapFixtureData);

    // Build fallback group name lookup from group-stage fixtures (only used
    // when standings returned no data — e.g. tournament hasn't started yet).
    // Map<externalTeamId, groupName>
    if (teamGroupMap.size === 0) {
      console.log(`${prefix}⚠️  Standings empty — falling back to regex on round strings`);

      for (const fixture of mappedFixtures) {
        const groupName = extractGroupName(fixture.round);
        if (groupName) {
          if (fixture.homeTeamExternalId) {
            teamGroupMap.set(fixture.homeTeamExternalId, groupName);
          }
          if (fixture.awayTeamExternalId) {
            teamGroupMap.set(fixture.awayTeamExternalId, groupName);
          }
        }
      }

      console.log(`${prefix}📊 Regex fallback found ${teamGroupMap.size} team→group mappings`);
    }

    // ─────────────────────────────────────────────────────────────────────
    // 4b. Upsert TournamentTeams
    // ─────────────────────────────────────────────────────────────────────

    if (!dryRun) {
      let ttCount = 0;

      for (const [externalId, teamId] of teamExternalToId.entries()) {
        const groupName = teamGroupMap.get(externalId) ?? null;

        try {
          await prisma.tournamentTeam.upsert({
            where: {
              tournamentId_teamId: { tournamentId, teamId },
            },
            update: { groupName },
            create: { tournamentId, teamId, groupName },
          });
          ttCount++;
        } catch (error) {
          console.error(
            `${prefix}⚠️  Failed to link team (externalId: ${externalId}) to tournament:`,
            error instanceof Error ? error.message : error,
          );
        }
      }

      console.log(`${prefix}🔗 TournamentTeams: ${ttCount} linked`);
    } else {
      console.log(`${prefix}🔗 TournamentTeams: ${teamExternalToId.size} would be linked`);
    }

    // ─────────────────────────────────────────────────────────────────────
    // 5. Derive & upsert TournamentPhases
    // ─────────────────────────────────────────────────────────────────────

    const uniqueRounds = [...new Set(apiFixtures.map((f) => f.league.round))];
    const uniquePhases = [...new Set(uniqueRounds.map(mapMatchPhase))];

    if (dryRun) {
      counts.phasesCreated = uniquePhases.length;
      console.log(`${prefix}📊 Phases: ${uniquePhases.join(', ')} (${uniquePhases.length} would be created/verified)`);
    } else {
      for (const phase of uniquePhases) {
        try {
          await prisma.tournamentPhase.upsert({
            where: {
              tournamentId_phase: { tournamentId, phase },
            },
            update: {
              multiplier: PHASE_MULTIPLIERS[phase],
              sortOrder: PHASE_SORT_ORDER[phase],
            },
            create: {
              tournamentId,
              phase,
              multiplier: PHASE_MULTIPLIERS[phase],
              sortOrder: PHASE_SORT_ORDER[phase],
            },
          });
          counts.phasesCreated++;
        } catch (error) {
          console.error(
            `${prefix}⚠️  Failed to upsert phase "${phase}":`,
            error instanceof Error ? error.message : error,
          );
        }
      }

      console.log(`${prefix}📊 Phases: ${uniquePhases.join(', ')} (${counts.phasesCreated} created/verified)`);
    }

    // ─────────────────────────────────────────────────────────────────────
    // 6. Upsert TournamentBonusTypes
    // ─────────────────────────────────────────────────────────────────────

    if (dryRun) {
      counts.bonusTypesCreated = STANDARD_BONUS_TYPES.length;
      console.log(`${prefix}🎯 Bonus types: ${STANDARD_BONUS_TYPES.length} would be created/verified`);
    } else {
      for (const bonus of STANDARD_BONUS_TYPES) {
        try {
          await prisma.tournamentBonusType.upsert({
            where: {
              tournamentId_key: { tournamentId, key: bonus.key },
            },
            update: {
              label: bonus.label,
              points: bonus.points,
              sortOrder: bonus.sortOrder,
            },
            create: {
              tournamentId,
              key: bonus.key,
              label: bonus.label,
              points: bonus.points,
              sortOrder: bonus.sortOrder,
            },
          });
          counts.bonusTypesCreated++;
        } catch (error) {
          console.error(
            `${prefix}⚠️  Failed to upsert bonus type "${bonus.key}":`,
            error instanceof Error ? error.message : error,
          );
        }
      }

      console.log(`${prefix}🎯 Bonus types: ${counts.bonusTypesCreated} created/verified`);
    }

    // ─────────────────────────────────────────────────────────────────────
    // 7. Upsert Matches
    // ─────────────────────────────────────────────────────────────────────

    if (mappedFixtures.length === 0) {
      console.warn(`${prefix}⚠️  No fixtures returned from API.`);
    } else {
      let matchIndex = 0;

      for (const fixture of mappedFixtures) {
        matchIndex++;

        try {
          // Resolve team external IDs to Prisma UUIDs
          const homeTeamId = fixture.homeTeamExternalId
            ? teamExternalToId.get(fixture.homeTeamExternalId) ?? null
            : null;
          const awayTeamId = fixture.awayTeamExternalId
            ? teamExternalToId.get(fixture.awayTeamExternalId) ?? null
            : null;

          // For knockout with TBD teams, use API team name as placeholder
          const homeTeamPlaceholder =
            !homeTeamId && fixture.homeTeamExternalId === null
              ? apiFixtures[matchIndex - 1]?.teams.home.name ?? null
              : null;
          const awayTeamPlaceholder =
            !awayTeamId && fixture.awayTeamExternalId === null
              ? apiFixtures[matchIndex - 1]?.teams.away.name ?? null
              : null;

          const groupName = fixture.homeTeamExternalId
            ? teamGroupMap.get(fixture.homeTeamExternalId) ?? null
            : null;

          if (dryRun) {
            const existing = await prisma.match.findUnique({
              where: { externalId: fixture.externalId },
            });
            if (existing) {
              counts.matchesUpdated++;
            } else {
              counts.matchesCreated++;
            }
          } else {
            // Pre-check to track created vs updated
            const existingMatch = await prisma.match.findUnique({
              where: { externalId: fixture.externalId },
              select: { id: true },
            });

            await prisma.match.upsert({
              where: { externalId: fixture.externalId },
              update: {
                homeTeamId,
                awayTeamId,
                phase: fixture.phase,
                groupName,
                scheduledAt: fixture.scheduledAt,
                venue: fixture.venue,
                city: fixture.city,
                status: fixture.status,
                homeScore: fixture.homeScore,
                awayScore: fixture.awayScore,
                homeScorePenalties: fixture.homeScorePenalties,
                awayScorePenalties: fixture.awayScorePenalties,
                isExtraTime: fixture.isExtraTime,
                homeTeamPlaceholder,
                awayTeamPlaceholder,
              },
              create: {
                tournamentId,
                externalId: fixture.externalId,
                homeTeamId,
                awayTeamId,
                phase: fixture.phase,
                groupName,
                matchNumber: matchIndex,
                scheduledAt: fixture.scheduledAt,
                venue: fixture.venue,
                city: fixture.city,
                status: fixture.status,
                homeScore: fixture.homeScore,
                awayScore: fixture.awayScore,
                homeScorePenalties: fixture.homeScorePenalties,
                awayScorePenalties: fixture.awayScorePenalties,
                isExtraTime: fixture.isExtraTime,
                homeTeamPlaceholder,
                awayTeamPlaceholder,
              },
            });

            if (existingMatch) {
              counts.matchesUpdated++;
            } else {
              counts.matchesCreated++;
            }
          }
        } catch (error) {
          console.error(
            `${prefix}⚠️  Failed to upsert match (externalId: ${fixture.externalId}):`,
            error instanceof Error ? error.message : error,
          );
        }
      }

      console.log(
        `${prefix}📅 Matches: ${mappedFixtures.length} found — Created: ${counts.matchesCreated} | Updated: ${counts.matchesUpdated}`,
      );
    }

    // ─────────────────────────────────────────────────────────────────────
    // 8. [Optional] Fetch & upsert Players
    // ─────────────────────────────────────────────────────────────────────

    if (includePlayers) {
      const teamEntries = [...teamExternalToId.entries()];
      const totalTeams = teamEntries.length;
      let teamProgress = 0;

      for (const [externalTeamId, teamId] of teamEntries) {
        teamProgress++;
        console.log(`${prefix}👥 Players: Fetching squad ${teamProgress}/${totalTeams}...`);

        try {
          const squad = await client.fetchSquad(externalTeamId);

          if (!squad || squad.players.length === 0) {
            console.warn(
              `${prefix}  ⚠️  No squad data for team externalId=${externalTeamId}`,
            );
            continue;
          }

          for (const apiPlayer of squad.players) {
            const mapped = mapPlayerData(apiPlayer, squad.team.name);

            try {
              if (dryRun) {
                const existing = await prisma.player.findUnique({
                  where: { externalId: mapped.externalId },
                });
                if (existing) {
                  counts.playersUpdated++;

                  // Check TournamentPlayer
                  if (tournamentId !== 'dry-run-id') {
                    const existingTp = await prisma.tournamentPlayer.findUnique({
                      where: {
                        tournamentId_playerId: {
                          tournamentId,
                          playerId: existing.id,
                        },
                      },
                    });
                    if (existingTp) {
                      counts.tournamentPlayersUpdated++;
                    } else {
                      counts.tournamentPlayersCreated++;
                    }
                  } else {
                    counts.tournamentPlayersCreated++;
                  }
                } else {
                  counts.playersCreated++;
                  counts.tournamentPlayersCreated++;
                }
              } else {
                // Pre-check to track created vs updated
                const existingPlayer = await prisma.player.findUnique({
                  where: { externalId: mapped.externalId },
                  select: { id: true },
                });

                // Upsert Player
                const player = await prisma.player.upsert({
                  where: { externalId: mapped.externalId },
                  update: {
                    name: mapped.name,
                    photoUrl: mapped.photoUrl,
                    position: mapped.position,
                    nationality: mapped.nationality,
                  },
                  create: {
                    externalId: mapped.externalId,
                    name: mapped.name,
                    photoUrl: mapped.photoUrl,
                    position: mapped.position,
                    nationality: mapped.nationality,
                  },
                });

                if (existingPlayer) {
                  counts.playersUpdated++;
                } else {
                  counts.playersCreated++;
                }

                // Pre-check for TournamentPlayer
                const existingTp = await prisma.tournamentPlayer.findUnique({
                  where: {
                    tournamentId_playerId: {
                      tournamentId,
                      playerId: player.id,
                    },
                  },
                  select: { id: true },
                });

                // Upsert TournamentPlayer
                await prisma.tournamentPlayer.upsert({
                  where: {
                    tournamentId_playerId: {
                      tournamentId,
                      playerId: player.id,
                    },
                  },
                  update: {
                    teamId,
                    shirtNumber: mapped.shirtNumber,
                  },
                  create: {
                    tournamentId,
                    teamId,
                    playerId: player.id,
                    shirtNumber: mapped.shirtNumber,
                  },
                });

                if (existingTp) {
                  counts.tournamentPlayersUpdated++;
                } else {
                  counts.tournamentPlayersCreated++;
                }
              }
            } catch (error) {
              console.error(
                `${prefix}  ⚠️  Failed to upsert player "${mapped.name}" (externalId: ${mapped.externalId}):`,
                error instanceof Error ? error.message : error,
              );
            }
          }
        } catch (error) {
          console.error(
            `${prefix}⚠️  Failed to fetch squad for team externalId=${externalTeamId}:`,
            error instanceof Error ? error.message : error,
          );
        }
      }

      const totalPlayers = counts.playersCreated + counts.playersUpdated;
      console.log(
        `${prefix}👥 Players: ${totalPlayers} found — Created: ${counts.playersCreated} | Updated: ${counts.playersUpdated}`,
      );
    }

    // ─────────────────────────────────────────────────────────────────────
    // Summary
    // ─────────────────────────────────────────────────────────────────────

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log(`\n${prefix}✅ Import complete in ${duration}s`);
    console.log('');
    console.log(`${prefix}📊 Summary:`);
    console.log(`${prefix}  Tournament:   1 ${counts.tournamentAction}`);
    console.log(
      `${prefix}  Teams:        ${counts.teamsCreated + counts.teamsUpdated} (${counts.teamsCreated} created, ${counts.teamsUpdated} updated)`,
    );
    console.log(
      `${prefix}  Matches:      ${counts.matchesCreated + counts.matchesUpdated} (${counts.matchesCreated} created, ${counts.matchesUpdated} updated)`,
    );
    console.log(`${prefix}  Phases:       ${counts.phasesCreated} created/verified`);
    console.log(`${prefix}  Bonus Types:  ${counts.bonusTypesCreated} created/verified`);

    if (includePlayers) {
      const totalPlayers = counts.playersCreated + counts.playersUpdated;
      console.log(
        `${prefix}  Players:      ${totalPlayers} (${counts.playersCreated} created, ${counts.playersUpdated} updated)`,
      );
    }

    console.log(`${prefix}  API calls:    ${client.getApiCallCount()}`);
  } finally {
    await prisma.$disconnect();
  }
}

// ---------------------------------------------------------------------------
// Tournament Upsert Helpers
// ---------------------------------------------------------------------------

interface TournamentUpsertData {
  slug: string;
  name: string;
  type: import('@prisma/client').TournamentType;
  logoUrl: string;
  externalLeagueId: number;
  externalSeason: number;
  startDate: Date;
  endDate: Date;
  status: TournamentStatus;
}

interface TournamentUpsertResult {
  id: string;
  action: 'created' | 'updated';
}

async function findExistingTournament(
  prisma: PrismaClient,
  slug: string,
  externalLeagueId: number,
  externalSeason: number,
): Promise<{ id: string } | null> {
  // Try by external IDs first (re-import case)
  const byExternal = await prisma.tournament.findUnique({
    where: {
      externalLeagueId_externalSeason: { externalLeagueId, externalSeason },
    },
    select: { id: true },
  });

  if (byExternal) return byExternal;

  // Try by slug (linking to existing seed data)
  const bySlug = await prisma.tournament.findUnique({
    where: { slug },
    select: { id: true },
  });

  return bySlug;
}

async function upsertTournament(
  prisma: PrismaClient,
  data: TournamentUpsertData,
): Promise<TournamentUpsertResult> {
  // First, check if a tournament with these external IDs exists
  const existing = await findExistingTournament(
    prisma,
    data.slug,
    data.externalLeagueId,
    data.externalSeason,
  );

  if (existing) {
    // Update existing tournament with external IDs + new data
    await prisma.tournament.update({
      where: { id: existing.id },
      data: {
        name: data.name,
        type: data.type,
        logoUrl: data.logoUrl,
        externalLeagueId: data.externalLeagueId,
        externalSeason: data.externalSeason,
        startDate: data.startDate,
        endDate: data.endDate,
        status: data.status,
      },
    });

    return { id: existing.id, action: 'updated' };
  }

  // Create new tournament
  const tournament = await prisma.tournament.create({
    data: {
      name: data.name,
      slug: data.slug,
      type: data.type,
      logoUrl: data.logoUrl,
      externalLeagueId: data.externalLeagueId,
      externalSeason: data.externalSeason,
      startDate: data.startDate,
      endDate: data.endDate,
      status: data.status,
    },
  });

  return { id: tournament.id, action: 'created' };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const args = parseArgs(process.argv);

  if (!args) {
    process.exit(1);
  }

  // Validate API key
  const apiKey = process.env.API_FOOTBALL_KEY;

  if (!apiKey) {
    console.error('❌ API_FOOTBALL_KEY is not set in environment variables.');
    console.error('   Add it to your .env file: API_FOOTBALL_KEY=your-key-here');
    process.exit(1);
  }

  if (args.mode === 'search') {
    await runSearchMode(args.searchText!, apiKey, args.delayMs);
  } else {
    await runImportPipeline(args, apiKey);
  }
}

main().catch((error) => {
  console.error('❌ Import failed:', error);
  process.exit(1);
});
