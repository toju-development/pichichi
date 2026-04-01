import {
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import type { PredictionPointType } from '@prisma/client';
import { PrismaService } from '../../config/prisma.service.js';
import { EventsGateway } from '../../gateways/events.gateway.js';

export interface CalculatePointsResult {
  matchId: string;
  totalPredictions: number;
  results: {
    exact: number;
    goalDiff: number;
    winner: number;
    miss: number;
  };
}

@Injectable()
export class ScoringService {
  private readonly logger = new Logger(ScoringService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsGateway: EventsGateway,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  // ---------------------------------------------------------------------------
  // Pure scoring calculation — no side effects
  // ---------------------------------------------------------------------------

  calculatePoints(
    predictedHome: number,
    predictedAway: number,
    actualHome: number,
    actualAway: number,
    multiplier: number,
  ): { points: number; pointType: PredictionPointType } {
    // Exact score
    if (predictedHome === actualHome && predictedAway === actualAway) {
      return { points: 5 * multiplier, pointType: 'EXACT' };
    }

    // Goal difference match (same diff, NOT same winner only)
    if (predictedHome - predictedAway === actualHome - actualAway) {
      return { points: 3 * multiplier, pointType: 'GOAL_DIFF' };
    }

    // Correct winner (or correct draw)
    if (
      Math.sign(predictedHome - predictedAway) ===
      Math.sign(actualHome - actualAway)
    ) {
      return { points: 1 * multiplier, pointType: 'WINNER' };
    }

    // Miss
    return { points: 0, pointType: 'MISS' };
  }

  // ---------------------------------------------------------------------------
  // Orchestrates: fetch match -> calculate all predictions -> update DB -> emit
  // ---------------------------------------------------------------------------

  async calculatePointsForMatch(matchId: string): Promise<CalculatePointsResult> {
    // 1. Get the match with tournament and phases
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
      include: {
        tournament: {
          include: { phases: true },
        },
      },
    });

    if (!match) {
      throw new NotFoundException('Match not found');
    }

    if (match.homeScore === null || match.awayScore === null) {
      throw new ConflictException('Match does not have a final score yet');
    }

    const actualHome = match.homeScore;
    const actualAway = match.awayScore;

    // 2. Get the multiplier for this match's phase
    const tournamentPhase = match.tournament.phases.find(
      (p) => p.phase === match.phase,
    );
    const multiplier = tournamentPhase?.multiplier ?? 1;

    // 3. Get ALL predictions for this match (across ALL groups)
    const predictions = await this.prisma.prediction.findMany({
      where: { matchId },
    });

    const results = { exact: 0, goalDiff: 0, winner: 0, miss: 0 };

    // 4. Calculate points for each prediction and group by (pointType, points)
    const groups = new Map<string, { pointType: PredictionPointType; points: number; ids: string[] }>();

    for (const prediction of predictions) {
      const { points, pointType } = this.calculatePoints(
        prediction.predictedHome,
        prediction.predictedAway,
        actualHome,
        actualAway,
        multiplier,
      );

      if (pointType === 'EXACT') results.exact++;
      else if (pointType === 'GOAL_DIFF') results.goalDiff++;
      else if (pointType === 'WINNER') results.winner++;
      else results.miss++;

      const groupKey = `${pointType}:${points}`;
      const existing = groups.get(groupKey);
      if (existing) {
        existing.ids.push(prediction.id);
      } else {
        groups.set(groupKey, { pointType, points, ids: [prediction.id] });
      }
    }

    // 5. Bulk update predictions grouped by (pointType, points) — reduces N ops to ~4-6
    const bulkUpdates = [...groups.values()].map((group) =>
      this.prisma.prediction.updateMany({
        where: { id: { in: group.ids } },
        data: { pointsEarned: group.points, pointType: group.pointType },
      }),
    );

    await this.prisma.$transaction(bulkUpdates);

    this.logger.log(
      `Points calculated for match ${matchId}: ${predictions.length} predictions ` +
      `(exact: ${results.exact}, goalDiff: ${results.goalDiff}, winner: ${results.winner}, miss: ${results.miss})`,
    );

    // Emit real-time events to affected groups
    const affectedGroupIds = [
      ...new Set(predictions.map((p) => p.groupId)),
    ];

    for (const groupId of affectedGroupIds) {
      this.eventsGateway.emitPredictionPointsCalculated(groupId, matchId, {
        totalPredictions: predictions.length,
        results,
      });
      this.eventsGateway.emitLeaderboardUpdate(groupId, {
        matchId,
        reason: 'points_calculated',
      });
    }

    // Invalidate leaderboard caches for affected groups
    await this.invalidateLeaderboardCache(
      affectedGroupIds,
      match.tournamentId,
      match.phase,
    );

    return {
      matchId,
      totalPredictions: predictions.length,
      results,
    };
  }

  // ---------------------------------------------------------------------------
  // Cache invalidation
  // ---------------------------------------------------------------------------

  /**
   * Invalidate leaderboard caches for affected groups after scoring.
   *
   * Since cache-manager v7 doesn't support wildcard deletes, we delete
   * the specific key patterns we know the leaderboard service creates:
   *   - lb:{groupId}:all:all         (general leaderboard, no filters)
   *   - lb:{groupId}:{tournamentId}:all  (tournament-filtered)
   *   - lb:{groupId}:{tournamentId}:{phase}  (phase-filtered)
   */
  private async invalidateLeaderboardCache(
    groupIds: string[],
    tournamentId: string,
    phase: string,
  ): Promise<void> {
    const keysToDelete: string[] = [];

    for (const groupId of groupIds) {
      keysToDelete.push(
        `lb:${groupId}:all:all`,
        `lb:${groupId}:${tournamentId}:all`,
        `lb:${groupId}:${tournamentId}:${phase}`,
      );
    }

    if (keysToDelete.length === 0) return;

    try {
      await this.cache.mdel(keysToDelete);
      this.logger.debug(
        `Invalidated ${keysToDelete.length} leaderboard cache keys for ${groupIds.length} groups`,
      );
    } catch (err) {
      this.logger.warn(
        `Cache invalidation failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
      );
    }
  }
}
