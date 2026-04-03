/**
 * Match Sync Service — Smart Cron Orchestrator
 *
 * Dual-polling strategy for live match score synchronization:
 *
 * 1. Fixed heartbeat (`@Cron('0 * * * *')` — every hour):
 *    - DB-only query: checks for LIVE or upcoming SCHEDULED matches
 *    - Creates/destroys a dynamic interval via SchedulerRegistry
 *    - Cost: 1 SQL query per hour, 0 API calls
 *
 * 2. Dynamic interval (every 300s / 5 min, when active):
 *    - Fetches fixture data from API-Football
 *    - Detects score/status changes, delegates to MatchesService.updateScore()
 *    - Self-destroys when no more LIVE/upcoming matches
 *
 * @see https://docs.nestjs.com/techniques/task-scheduling
 */

import {
  Injectable,
  Logger,
  type OnModuleInit,
  type OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { SchedulerRegistry } from '@nestjs/schedule';
import type { Match, MatchStatus } from '@prisma/client';

import { PrismaService } from '../../config/prisma.service.js';
import { ApiFootballService } from './api-football.service.js';
import { MatchesService } from '../matches/matches.service.js';
import { BonusPredictionsService } from '../bonus-predictions/bonus-predictions.service.js';
import type { ApiFootballFixture } from './api-football.types.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DYNAMIC_INTERVAL_NAME = 'match-sync';
const DYNAMIC_INTERVAL_MS = 300_000; // 5 minutes
const UPCOMING_WINDOW_HOURS = 2;
const MIN_RATE_LIMIT_REMAINING = 10;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SyncResult {
  matchesChecked: number;
  matchesUpdated: number;
  tournamentsFinished: number;
  apiCallsMade: number;
  errors: string[];
}

// ---------------------------------------------------------------------------
// Status Mapping (API-Football → Prisma MatchStatus)
// ---------------------------------------------------------------------------

const STATUS_MAP: Record<string, MatchStatus> = {
  // Scheduled
  TBD: 'SCHEDULED',
  NS: 'SCHEDULED',

  // Live / In play
  '1H': 'LIVE',
  HT: 'LIVE',
  '2H': 'LIVE',
  ET: 'LIVE',
  BT: 'LIVE',
  P: 'LIVE',
  SUSP: 'LIVE',
  INT: 'LIVE',
  LIVE: 'LIVE',

  // Finished
  FT: 'FINISHED',
  AET: 'FINISHED',
  PEN: 'FINISHED',

  // Postponed
  PST: 'POSTPONED',

  // Cancelled
  CANC: 'CANCELLED',
  ABD: 'CANCELLED',
  AWD: 'CANCELLED',
  WO: 'CANCELLED',
} as const;

const EXTRA_TIME_STATUSES = new Set<string>(['AET', 'ET']);

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

@Injectable()
export class MatchSyncService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MatchSyncService.name);
  private syncEnabled = false;

  constructor(
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly apiFootballService: ApiFootballService,
    private readonly matchesService: MatchesService,
    private readonly bonusPredictionsService: BonusPredictionsService,
  ) {}

  // ---------------------------------------------------------------------------
  // Lifecycle Hooks
  // ---------------------------------------------------------------------------

  async onModuleInit(): Promise<void> {
    const envEnabled =
      this.configService.get<string>('SYNC_ENABLED', 'false') === 'true';
    const apiAvailable = this.apiFootballService.isAvailable();

    if (!envEnabled || !apiAvailable) {
      this.logger.log(
        `Match sync disabled (SYNC_ENABLED=${envEnabled}, API key available=${apiAvailable})`,
      );
      return;
    }

    this.syncEnabled = true;
    this.logger.log('Match sync enabled, heartbeat active');

    // Run an initial heartbeat check in case the server starts mid-tournament
    await this.handleHeartbeat();
  }

  onModuleDestroy(): void {
    this.destroyDynamicInterval();
  }

  // ---------------------------------------------------------------------------
  // Fixed Heartbeat — @Cron('0 * * * *') (every hour)
  // ---------------------------------------------------------------------------

  @Cron('0 * * * *', { name: 'match-sync-heartbeat' })
  async handleHeartbeat(): Promise<void> {
    if (!this.syncEnabled) return;

    try {
      const syncableCount = await this.countSyncableMatches();

      if (syncableCount > 0) {
        this.ensureDynamicIntervalRunning();
        this.logger.log(
          `Heartbeat: ${syncableCount} syncable match(es) found — dynamic interval active`,
        );
      } else {
        this.destroyDynamicInterval();
        this.logger.log(
          'Heartbeat: no syncable matches — dynamic interval stopped',
        );
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Heartbeat failed: ${message}`);
    }
  }

  // ---------------------------------------------------------------------------
  // Dynamic Interval — syncTick() (every 5 min, when active)
  // ---------------------------------------------------------------------------

  async syncTick(): Promise<SyncResult> {
    const result: SyncResult = {
      matchesChecked: 0,
      matchesUpdated: 0,
      tournamentsFinished: 0,
      apiCallsMade: 0,
      errors: [],
    };

    try {
      // Guard: skip if rate limit is too low
      const rateLimit = this.apiFootballService.getRateLimitRemaining();
      if (rateLimit !== -1 && rateLimit < MIN_RATE_LIMIT_REMAINING) {
        this.logger.warn(
          `syncTick skipped — rate limit too low (${rateLimit} remaining)`,
        );
        return result;
      }

      // Query syncable matches from DB
      const matches = await this.findSyncableMatches();

      if (matches.length === 0) {
        this.destroyDynamicInterval();
        this.logger.log('syncTick: no syncable matches — self-destroying interval');
        return result;
      }

      // Get external IDs (filter out nulls)
      const externalIds = matches
        .map((m) => m.externalId)
        .filter((id): id is number => id !== null);

      if (externalIds.length === 0) {
        this.logger.log('syncTick: no matches with externalId — skipping API call');
        return result;
      }

      // Fetch fixtures from API-Football
      this.logger.debug(`syncTick: fetching ${externalIds.length} fixtures: [${externalIds.join(', ')}]`);
      const fixtures = await this.apiFootballService.fetchFixturesByIds(externalIds);
      result.apiCallsMade = Math.ceil(externalIds.length / 20); // batches of 20

      this.logger.debug(`syncTick: API returned ${fixtures.length} fixture(s)`);

      if (fixtures.length === 0) {
        this.logger.warn('syncTick: API returned 0 fixtures — skipping this tick');
        return result;
      }

      // Build lookup: externalId → fixture
      const fixtureMap = new Map<number, ApiFootballFixture>();
      for (const fixture of fixtures) {
        fixtureMap.set(fixture.fixture.id, fixture);
      }

      result.matchesChecked = matches.length;

      // Process each match
      for (const dbMatch of matches) {
        if (dbMatch.externalId === null) continue;

        const apiFixture = fixtureMap.get(dbMatch.externalId);
        if (!apiFixture) {
          this.logger.warn(`Match ${dbMatch.id} (ext: ${dbMatch.externalId}) — fixture not found in API response, skipping`);
          continue;
        }

        try {
          if (this.hasMatchChanged(dbMatch, apiFixture)) {
            await this.applyMatchUpdate(dbMatch, apiFixture);
            result.matchesUpdated++;

            // Post-finish hooks: tournament auto-finish + champion auto-resolve
            const newStatus = this.mapApiStatus(
              apiFixture.fixture.status.short,
            );
            if (newStatus === 'FINISHED' && dbMatch.status !== 'FINISHED') {
              const tournamentFinished =
                await this.checkTournamentAutoFinish(dbMatch.tournamentId);
              if (tournamentFinished) {
                result.tournamentsFinished++;
              }

              if (dbMatch.phase === 'FINAL') {
                await this.resolveChampionBonus(dbMatch, apiFixture);
              }
            }
          } else {
            this.logger.debug(`Match ${dbMatch.id} (ext: ${dbMatch.externalId}) — no changes detected, skipping`);
          }

          // Update lastSyncedAt regardless of change
          await this.prisma.match.update({
            where: { id: dbMatch.id },
            data: { lastSyncedAt: new Date() },
          });
          this.logger.debug(`Match ${dbMatch.id} (ext: ${dbMatch.externalId}) — lastSyncedAt updated`);
        } catch (error: unknown) {
          const message =
            error instanceof Error ? error.message : 'Unknown error';
          const errMsg = `Failed to update match ${dbMatch.id} (ext: ${dbMatch.externalId}): ${message}`;
          this.logger.error(errMsg);
          result.errors.push(errMsg);
        }
      }

      const rateLimitNow = this.apiFootballService.getRateLimitRemaining();
      this.logger.log(
        `syncTick complete: checked=${result.matchesChecked}, ` +
          `updated=${result.matchesUpdated}, tournamentsFinished=${result.tournamentsFinished}, ` +
          `apiCalls=${result.apiCallsMade}, errors=${result.errors.length}, ` +
          `rateLimit=${rateLimitNow}`,
      );
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`syncTick failed: ${message}`);
      result.errors.push(`syncTick failed: ${message}`);
    }

    return result;
  }

  // ---------------------------------------------------------------------------
  // Admin Methods
  // ---------------------------------------------------------------------------

  /**
   * Trigger a manual sync — can be called regardless of SYNC_ENABLED.
   * Used by admin endpoints for on-demand sync.
   */
  async triggerManualSync(): Promise<SyncResult> {
    this.logger.log('Manual sync triggered');
    return this.syncTick();
  }

  /**
   * Enable or disable sync at runtime.
   * Destroying the dynamic interval immediately if disabling.
   */
  setSyncEnabled(enabled: boolean): void {
    this.syncEnabled = enabled;

    if (!enabled) {
      this.destroyDynamicInterval();
      this.logger.log('Sync disabled at runtime — dynamic interval destroyed');
    } else {
      this.logger.log('Sync enabled at runtime — next heartbeat will check for matches');
      // Run heartbeat check immediately when enabling
      this.handleHeartbeat().catch((error: unknown) => {
        const message =
          error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(`Failed to run heartbeat after enable: ${message}`);
      });
    }
  }

  /**
   * Returns whether sync is currently enabled (for admin status checks).
   */
  isSyncEnabled(): boolean {
    return this.syncEnabled;
  }

  // ---------------------------------------------------------------------------
  // Private — Change Detection
  // ---------------------------------------------------------------------------

  /**
   * Compare DB match state against API-Football fixture.
   * Returns true if any tracked field differs.
   */
  private hasMatchChanged(
    dbMatch: Match,
    apiFixture: ApiFootballFixture,
  ): boolean {
    const apiStatus = this.mapApiStatus(apiFixture.fixture.status.short);
    const apiHomeScore = apiFixture.goals.home;
    const apiAwayScore = apiFixture.goals.away;

    return (
      dbMatch.status !== apiStatus ||
      dbMatch.homeScore !== apiHomeScore ||
      dbMatch.awayScore !== apiAwayScore
    );
  }

  /**
   * Apply the fixture update to a DB match via MatchesService.updateScore().
   */
  private async applyMatchUpdate(
    dbMatch: Match,
    apiFixture: ApiFootballFixture,
  ): Promise<void> {
    const statusShort = apiFixture.fixture.status.short;
    const mappedStatus = this.mapApiStatus(statusShort);
    const homeScore = apiFixture.goals.home ?? 0;
    const awayScore = apiFixture.goals.away ?? 0;
    const isExtraTime = EXTRA_TIME_STATUSES.has(statusShort);
    const homeScorePenalties = apiFixture.score.penalty.home ?? undefined;
    const awayScorePenalties = apiFixture.score.penalty.away ?? undefined;

    this.logger.log(
      `Updating match ${dbMatch.id}: ` +
        `${dbMatch.homeScore ?? '?'}-${dbMatch.awayScore ?? '?'} (${dbMatch.status}) → ` +
        `${homeScore}-${awayScore} (${mappedStatus})`,
    );

    await this.matchesService.updateScore(
      dbMatch.id,
      homeScore,
      awayScore,
      mappedStatus,
      isExtraTime,
      homeScorePenalties,
      awayScorePenalties,
    );
  }

  // ---------------------------------------------------------------------------
  // Private — Post-Finish Hooks
  // ---------------------------------------------------------------------------

  /**
   * Check if all matches of a tournament are FINISHED.
   * If so, auto-transition the tournament status to FINISHED.
   */
  private async checkTournamentAutoFinish(
    tournamentId: string,
  ): Promise<boolean> {
    const unfinishedCount = await this.prisma.match.count({
      where: {
        tournamentId,
        status: { not: 'FINISHED' },
      },
    });

    if (unfinishedCount > 0) {
      this.logger.debug(`Tournament ${tournamentId}: ${unfinishedCount} unfinished match(es) remaining`);
      return false;
    }

    const tournament = await this.prisma.tournament.update({
      where: { id: tournamentId },
      data: { status: 'FINISHED' },
    });

    this.logger.log(
      `Tournament ${tournament.name} auto-finished — all matches complete`,
    );

    return true;
  }

  /**
   * When a FINAL match finishes, auto-resolve the CHAMPION bonus.
   * Determines the winner from the API fixture's teams.winner flag and
   * calls resolveByKey with the winning team's externalId.
   */
  private async resolveChampionBonus(
    dbMatch: Match,
    fixture: ApiFootballFixture,
  ): Promise<void> {
    // Determine the winner from API data (works for FT, AET, and PEN)
    const homeWon = fixture.teams.home.winner === true;
    const awayWon = fixture.teams.away.winner === true;

    if (!homeWon && !awayWon) {
      this.logger.warn(
        `FINAL match ${dbMatch.id} has no winner flag set — skipping champion auto-resolve`,
      );
      return;
    }

    // The API fixture team ID is the external ID
    const winnerApiTeamId = homeWon
      ? fixture.teams.home.id
      : fixture.teams.away.id;
    const winnerTeamName = homeWon
      ? fixture.teams.home.name
      : fixture.teams.away.name;

    if (winnerApiTeamId === null) {
      this.logger.warn(
        `FINAL match ${dbMatch.id} winner has no team ID — skipping champion auto-resolve`,
      );
      return;
    }

    // Look up our Team to get the externalId (should match the API team ID)
    const team = await this.prisma.team.findFirst({
      where: { externalId: winnerApiTeamId },
      select: { externalId: true },
    });

    if (!team?.externalId) {
      this.logger.warn(
        `Team with API ID ${winnerApiTeamId} not found in DB — skipping champion auto-resolve`,
      );
      return;
    }

    const resolveResult = await this.bonusPredictionsService.resolveByKey(
      dbMatch.tournamentId,
      'CHAMPION',
      String(team.externalId),
    );

    this.logger.log(
      `Champion auto-resolved: ${winnerTeamName} (externalId: ${team.externalId}) — ` +
        `${resolveResult.resolved} predictions resolved ` +
        `(${resolveResult.correct} correct, ${resolveResult.incorrect} incorrect)`,
    );
  }

  // ---------------------------------------------------------------------------
  // Private — Status Mapping
  // ---------------------------------------------------------------------------

  /**
   * Map an API-Football short status to our Prisma MatchStatus enum.
   */
  private mapApiStatus(apiStatus: string): MatchStatus {
    const mapped = STATUS_MAP[apiStatus];

    if (mapped) return mapped;

    this.logger.warn(
      `Unknown API-Football status: "${apiStatus}" — defaulting to SCHEDULED`,
    );
    return 'SCHEDULED';
  }

  // ---------------------------------------------------------------------------
  // Private — DB Queries
  // ---------------------------------------------------------------------------

  /**
   * Count matches that need checking:
   * - Has externalId (can be fetched from API-Football)
   * - Status is LIVE, OR status is SCHEDULED and scheduledAt within next 2 hours
   */
  private async countSyncableMatches(): Promise<number> {
    const windowEnd = new Date(
      Date.now() + UPCOMING_WINDOW_HOURS * 60 * 60 * 1000,
    );

    return this.prisma.match.count({
      where: {
        externalId: { not: null },
        OR: [
          { status: 'LIVE' },
          {
            status: 'SCHEDULED',
            scheduledAt: { lte: windowEnd },
          },
        ],
      },
    });
  }

  /**
   * Find matches eligible for sync (same criteria as countSyncableMatches).
   */
  private async findSyncableMatches(): Promise<Match[]> {
    const windowEnd = new Date(
      Date.now() + UPCOMING_WINDOW_HOURS * 60 * 60 * 1000,
    );

    return this.prisma.match.findMany({
      where: {
        externalId: { not: null },
        OR: [
          { status: 'LIVE' },
          {
            status: 'SCHEDULED',
            scheduledAt: { lte: windowEnd },
          },
        ],
      },
    });
  }

  // ---------------------------------------------------------------------------
  // Private — Dynamic Interval Management
  // ---------------------------------------------------------------------------

  /**
   * Ensure the dynamic interval is running. If it already exists, do nothing.
   */
  private ensureDynamicIntervalRunning(): void {
    if (this.hasDynamicInterval()) return;

    // Run immediately, don't wait for first interval tick
    this.syncTick().catch((error: unknown) => {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Initial syncTick failed: ${message}`);
    });

    const interval = setInterval(() => {
      this.syncTick().catch((error: unknown) => {
        const message =
          error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(`Dynamic interval syncTick failed: ${message}`);
      });
    }, DYNAMIC_INTERVAL_MS);

    this.schedulerRegistry.addInterval(DYNAMIC_INTERVAL_NAME, interval);
    this.logger.log(
      `Dynamic interval created (every ${DYNAMIC_INTERVAL_MS / 1000}s)`,
    );
  }

  /**
   * Destroy the dynamic interval if it exists. Safe to call even if not running.
   */
  private destroyDynamicInterval(): void {
    if (!this.hasDynamicInterval()) return;

    try {
      this.schedulerRegistry.deleteInterval(DYNAMIC_INTERVAL_NAME);
      this.logger.log('Dynamic interval destroyed');
    } catch (error: unknown) {
      // SchedulerRegistry.deleteInterval throws if interval doesn't exist
      const message =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`Failed to destroy dynamic interval: ${message}`);
    }
  }

  /**
   * Check if the dynamic interval currently exists in the registry.
   */
  private hasDynamicInterval(): boolean {
    try {
      this.schedulerRegistry.getInterval(DYNAMIC_INTERVAL_NAME);
      return true;
    } catch {
      return false;
    }
  }
}

export type { SyncResult };
