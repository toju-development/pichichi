import {
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../config/prisma.service.js';
import type { LeaderboardEntryDto } from './dto/leaderboard-entry.dto.js';
import type { LeaderboardResponseDto } from './dto/leaderboard-response.dto.js';

interface RawLeaderboardRow {
  user_id: string;
  display_name: string;
  username: string;
  avatar_url: string | null;
  total_points: bigint | number;
  exact_count: bigint | number;
  goal_diff_count: bigint | number;
  winner_count: bigint | number;
  miss_count: bigint | number;
  bonus_points: bigint | number;
}

export interface RawGlobalLeaderboardRow {
  user_id: string;
  display_name: string;
  username: string;
  avatar_url: string | null;
  total_points: bigint | number;
  exact_count: bigint | number;
  goal_diff_count: bigint | number;
  winner_count: bigint | number;
  miss_count: bigint | number;
  bonus_points: bigint | number;
  position: bigint | number;
}

export interface GlobalLeaderboardQueryResult {
  entries: LeaderboardEntryDto[];
  total: number;
}

@Injectable()
export class LeaderboardService {
  private readonly logger = new Logger(LeaderboardService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  // ---------------------------------------------------------------------------
  // Get group leaderboard (general ranking)
  // ---------------------------------------------------------------------------

  async getGroupLeaderboard(
    groupId: string,
    userId: string,
    tournamentId?: string,
  ): Promise<LeaderboardResponseDto> {
    const group = await this.requireMembership(groupId, userId);

    const cacheKey = this.cacheKey(groupId, tournamentId);
    const cached = await this.cacheGet<LeaderboardResponseDto>(cacheKey);
    if (cached) {
      return cached;
    }

    const rows = await this.queryLeaderboard(groupId, tournamentId);

    const entries = this.assignPositions(rows);

    const totalMembers = await this.prisma.groupMember.count({
      where: { groupId, isActive: true },
    });

    const result: LeaderboardResponseDto = {
      groupId,
      groupName: group.name,
      tournamentId: tournamentId ?? null,
      entries,
      totalMembers,
    };

    await this.cacheSet(cacheKey, result);

    return result;
  }

  // ---------------------------------------------------------------------------
  // Get group leaderboard by phase
  // ---------------------------------------------------------------------------

  async getGroupLeaderboardByPhase(
    groupId: string,
    userId: string,
    tournamentId: string,
    phase: string,
  ): Promise<LeaderboardResponseDto> {
    const group = await this.requireMembership(groupId, userId);

    const cacheKey = this.cacheKey(groupId, tournamentId, phase);
    const cached = await this.cacheGet<LeaderboardResponseDto>(cacheKey);
    if (cached) {
      return cached;
    }

    const rows = await this.queryLeaderboard(groupId, tournamentId, phase);

    const entries = this.assignPositions(rows);

    const totalMembers = await this.prisma.groupMember.count({
      where: { groupId, isActive: true },
    });

    const result: LeaderboardResponseDto = {
      groupId,
      groupName: group.name,
      tournamentId,
      entries,
      totalMembers,
    };

    await this.cacheSet(cacheKey, result);

    return result;
  }

  // ---------------------------------------------------------------------------
  // Get user position (lightweight — for group list cards)
  // ---------------------------------------------------------------------------

  async getUserPosition(
    groupId: string,
    userId: string,
    tournamentId?: string,
  ): Promise<LeaderboardEntryDto> {
    await this.requireMembership(groupId, userId);

    const rows = await this.queryLeaderboard(groupId, tournamentId);
    const entries = this.assignPositions(rows);

    const userEntry = entries.find((e) => e.userId === userId);

    if (!userEntry) {
      throw new NotFoundException('User not found in leaderboard');
    }

    return userEntry;
  }

  // ---------------------------------------------------------------------------
  // Raw SQL query for leaderboard aggregation
  // ---------------------------------------------------------------------------

  private async queryLeaderboard(
    groupId: string,
    tournamentId?: string,
    phase?: string,
  ): Promise<RawLeaderboardRow[]> {
    // Build dynamic conditions
    const matchJoin = tournamentId
      ? Prisma.sql`LEFT JOIN matches m ON m.id = p.match_id`
      : Prisma.empty;

    const tournamentCondition = tournamentId
      ? Prisma.sql`AND m.tournament_id = ${tournamentId}::uuid`
      : Prisma.empty;

    const phaseCondition = phase
      ? Prisma.sql`AND m.phase = ${phase}::"MatchPhase"`
      : Prisma.empty;

    // For bonus predictions, only include them when NOT filtering by phase
    // (bonus points are tournament-level, not phase-level)
    const bonusJoin = phase
      ? Prisma.empty
      : Prisma.sql`
        LEFT JOIN (
          SELECT bp.user_id, bp.group_id, SUM(bp.points_earned) AS bp_points
          FROM bonus_predictions bp
          ${tournamentId ? Prisma.sql`JOIN tournament_bonus_types tbt ON tbt.id = bp.bonus_type_id AND tbt.tournament_id = ${tournamentId}::uuid` : Prisma.empty}
          GROUP BY bp.user_id, bp.group_id
        ) bp ON bp.user_id = u.id AND bp.group_id = gm.group_id`;

    const bonusSelect = phase
      ? Prisma.sql`0`
      : Prisma.sql`COALESCE(bp.bp_points, 0)`;

    const rows = await this.prisma.$queryRaw<RawLeaderboardRow[]>`
      SELECT
        u.id AS user_id,
        u.display_name,
        u.username,
        u.avatar_url,
        COALESCE(SUM(p.points_earned), 0) + ${bonusSelect} AS total_points,
        COUNT(CASE WHEN p.point_type = 'EXACT' THEN 1 END) AS exact_count,
        COUNT(CASE WHEN p.point_type = 'GOAL_DIFF' THEN 1 END) AS goal_diff_count,
        COUNT(CASE WHEN p.point_type = 'WINNER' THEN 1 END) AS winner_count,
        COUNT(CASE WHEN p.point_type = 'MISS' THEN 1 END) AS miss_count,
        ${bonusSelect} AS bonus_points
      FROM group_members gm
      JOIN users u ON u.id = gm.user_id
      LEFT JOIN predictions p ON p.user_id = u.id AND p.group_id = gm.group_id
      ${matchJoin}
      ${bonusJoin}
      WHERE gm.group_id = ${groupId}::uuid AND gm.is_active = true
      ${tournamentCondition}
      ${phaseCondition}
      GROUP BY u.id, u.display_name, u.username, u.avatar_url${phase ? Prisma.empty : Prisma.sql`, bp.bp_points`}
      ORDER BY total_points DESC, exact_count DESC
    `;

    return rows;
  }

  // ---------------------------------------------------------------------------
  // Assign positions (shared position for ties on totalPoints + exactCount)
  // ---------------------------------------------------------------------------

  private assignPositions(rows: RawLeaderboardRow[]): LeaderboardEntryDto[] {
    const entries: LeaderboardEntryDto[] = [];
    let currentPosition = 1;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]!;
      const totalPoints = Number(row.total_points);
      const exactCount = Number(row.exact_count);

      // If this is NOT the first row, check if different from previous
      if (i > 0) {
        const prevRow = rows[i - 1]!;
        const prevTotalPoints = Number(prevRow.total_points);
        const prevExactCount = Number(prevRow.exact_count);

        if (totalPoints !== prevTotalPoints || exactCount !== prevExactCount) {
          currentPosition = i + 1;
        }
      }

      entries.push({
        position: currentPosition,
        userId: row.user_id,
        displayName: row.display_name,
        username: row.username,
        avatarUrl: row.avatar_url,
        totalPoints,
        exactCount,
        goalDiffCount: Number(row.goal_diff_count),
        winnerCount: Number(row.winner_count),
        missCount: Number(row.miss_count),
        bonusPoints: Number(row.bonus_points),
        streak: 0, // TODO: Implement streak calculation
      });
    }

    return entries;
  }

  // ---------------------------------------------------------------------------
  // Global leaderboard — orchestrator with Redis caching
  // ---------------------------------------------------------------------------

  async getGlobalLeaderboard(
    userId: string,
    limit: number,
    offset: number,
  ): Promise<{
    entries: LeaderboardEntryDto[];
    total: number;
    currentUserEntry: LeaderboardEntryDto | null;
  }> {
    const cacheKey = 'lb:global:all';

    // 1. Try cache first
    let allData = await this.cacheGet<GlobalLeaderboardQueryResult>(cacheKey);

    // 2. Cache miss → query ALL results and cache them
    if (!allData) {
      allData = await this.queryGlobalLeaderboard(1_000_000, 0);
      await this.cacheSet(cacheKey, allData);
    }

    // 3. Slice in-memory for pagination
    const entries = allData.entries.slice(offset, offset + limit);

    // 4. Get current user's entry from cached data (avoid extra DB call)
    let currentUserEntry =
      allData.entries.find((e) => e.userId === userId) ?? null;

    // If user not in cache (0 points — excluded by HAVING), try DB as fallback
    if (!currentUserEntry) {
      currentUserEntry = await this.queryCurrentUserGlobalPosition(userId);
    }

    return {
      entries,
      total: allData.total,
      currentUserEntry,
    };
  }

  // ---------------------------------------------------------------------------
  // Global leaderboard — raw SQL query with deduplication
  // ---------------------------------------------------------------------------

  async queryGlobalLeaderboard(
    limit: number,
    offset: number,
  ): Promise<GlobalLeaderboardQueryResult> {
    // Pre-aggregate each source to user-level BEFORE joining to avoid fan-out.
    // Without this, a user with N match predictions × M bonus predictions
    // produces N×M rows, inflating SUM/COUNT by the cross-product factor.
    const rows = await this.prisma.$queryRaw<RawGlobalLeaderboardRow[]>`
      WITH deduped_predictions AS (
        SELECT
          p.user_id,
          p.match_id,
          MAX(p.points_earned) AS points_earned,
          (ARRAY_AGG(p.point_type ORDER BY p.points_earned DESC))[1] AS point_type
        FROM predictions p
        GROUP BY p.user_id, p.match_id
      ),
      user_match_points AS (
        SELECT
          user_id,
          COALESCE(SUM(points_earned), 0) AS match_points,
          COUNT(CASE WHEN point_type = 'EXACT' THEN 1 END) AS exact_count,
          COUNT(CASE WHEN point_type = 'GOAL_DIFF' THEN 1 END) AS goal_diff_count,
          COUNT(CASE WHEN point_type = 'WINNER' THEN 1 END) AS winner_count,
          COUNT(CASE WHEN point_type = 'MISS' THEN 1 END) AS miss_count
        FROM deduped_predictions
        GROUP BY user_id
      ),
      deduped_bonus AS (
        SELECT
          bp.user_id,
          bp.bonus_type_id,
          MAX(bp.points_earned) AS points_earned
        FROM bonus_predictions bp
        GROUP BY bp.user_id, bp.bonus_type_id
      ),
      user_bonus_points AS (
        SELECT
          user_id,
          COALESCE(SUM(points_earned), 0) AS bonus_points
        FROM deduped_bonus
        GROUP BY user_id
      ),
      user_totals AS (
        SELECT
          u.id AS user_id,
          u.display_name,
          u.username,
          u.avatar_url,
          COALESCE(ump.match_points, 0) + COALESCE(ubp.bonus_points, 0) AS total_points,
          COALESCE(ump.exact_count, 0) AS exact_count,
          COALESCE(ump.goal_diff_count, 0) AS goal_diff_count,
          COALESCE(ump.winner_count, 0) AS winner_count,
          COALESCE(ump.miss_count, 0) AS miss_count,
          COALESCE(ubp.bonus_points, 0) AS bonus_points,
          DENSE_RANK() OVER (
            ORDER BY COALESCE(ump.match_points, 0) + COALESCE(ubp.bonus_points, 0) DESC,
                     COALESCE(ump.exact_count, 0) DESC
          ) AS position
        FROM users u
        LEFT JOIN user_match_points ump ON ump.user_id = u.id
        LEFT JOIN user_bonus_points ubp ON ubp.user_id = u.id
        WHERE u.is_active = true
        AND (COALESCE(ump.match_points, 0) + COALESCE(ubp.bonus_points, 0)) > 0
      )
      SELECT * FROM user_totals
      ORDER BY position, exact_count DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const totalResult = await this.prisma.$queryRaw<[{ count: bigint }]>`
      WITH deduped_predictions AS (
        SELECT
          p.user_id,
          p.match_id,
          MAX(p.points_earned) AS points_earned
        FROM predictions p
        GROUP BY p.user_id, p.match_id
      ),
      user_match_points AS (
        SELECT
          user_id,
          COALESCE(SUM(points_earned), 0) AS match_points
        FROM deduped_predictions
        GROUP BY user_id
      ),
      deduped_bonus AS (
        SELECT
          bp.user_id,
          bp.bonus_type_id,
          MAX(bp.points_earned) AS points_earned
        FROM bonus_predictions bp
        GROUP BY bp.user_id, bp.bonus_type_id
      ),
      user_bonus_points AS (
        SELECT
          user_id,
          COALESCE(SUM(points_earned), 0) AS bonus_points
        FROM deduped_bonus
        GROUP BY user_id
      ),
      user_totals AS (
        SELECT u.id AS user_id
        FROM users u
        LEFT JOIN user_match_points ump ON ump.user_id = u.id
        LEFT JOIN user_bonus_points ubp ON ubp.user_id = u.id
        WHERE u.is_active = true
        AND (COALESCE(ump.match_points, 0) + COALESCE(ubp.bonus_points, 0)) > 0
      )
      SELECT COUNT(*)::bigint AS count FROM user_totals
    `;

    const total = Number(totalResult[0]?.count ?? 0);

    const entries: LeaderboardEntryDto[] = rows.map((row) => ({
      position: Number(row.position),
      userId: row.user_id,
      displayName: row.display_name,
      username: row.username,
      avatarUrl: row.avatar_url,
      totalPoints: Number(row.total_points),
      exactCount: Number(row.exact_count),
      goalDiffCount: Number(row.goal_diff_count),
      winnerCount: Number(row.winner_count),
      missCount: Number(row.miss_count),
      bonusPoints: Number(row.bonus_points),
      streak: 0,
    }));

    return { entries, total };
  }

  // ---------------------------------------------------------------------------
  // Current user's global position
  // ---------------------------------------------------------------------------

  async queryCurrentUserGlobalPosition(
    userId: string,
  ): Promise<LeaderboardEntryDto | null> {
    // Same user-level pre-aggregation as queryGlobalLeaderboard to avoid fan-out
    const rows = await this.prisma.$queryRaw<RawGlobalLeaderboardRow[]>`
      WITH deduped_predictions AS (
        SELECT
          p.user_id,
          p.match_id,
          MAX(p.points_earned) AS points_earned,
          (ARRAY_AGG(p.point_type ORDER BY p.points_earned DESC))[1] AS point_type
        FROM predictions p
        GROUP BY p.user_id, p.match_id
      ),
      user_match_points AS (
        SELECT
          user_id,
          COALESCE(SUM(points_earned), 0) AS match_points,
          COUNT(CASE WHEN point_type = 'EXACT' THEN 1 END) AS exact_count,
          COUNT(CASE WHEN point_type = 'GOAL_DIFF' THEN 1 END) AS goal_diff_count,
          COUNT(CASE WHEN point_type = 'WINNER' THEN 1 END) AS winner_count,
          COUNT(CASE WHEN point_type = 'MISS' THEN 1 END) AS miss_count
        FROM deduped_predictions
        GROUP BY user_id
      ),
      deduped_bonus AS (
        SELECT
          bp.user_id,
          bp.bonus_type_id,
          MAX(bp.points_earned) AS points_earned
        FROM bonus_predictions bp
        GROUP BY bp.user_id, bp.bonus_type_id
      ),
      user_bonus_points AS (
        SELECT
          user_id,
          COALESCE(SUM(points_earned), 0) AS bonus_points
        FROM deduped_bonus
        GROUP BY user_id
      ),
      user_totals AS (
        SELECT
          u.id AS user_id,
          u.display_name,
          u.username,
          u.avatar_url,
          COALESCE(ump.match_points, 0) + COALESCE(ubp.bonus_points, 0) AS total_points,
          COALESCE(ump.exact_count, 0) AS exact_count,
          COALESCE(ump.goal_diff_count, 0) AS goal_diff_count,
          COALESCE(ump.winner_count, 0) AS winner_count,
          COALESCE(ump.miss_count, 0) AS miss_count,
          COALESCE(ubp.bonus_points, 0) AS bonus_points,
          DENSE_RANK() OVER (
            ORDER BY COALESCE(ump.match_points, 0) + COALESCE(ubp.bonus_points, 0) DESC,
                     COALESCE(ump.exact_count, 0) DESC
          ) AS position
        FROM users u
        LEFT JOIN user_match_points ump ON ump.user_id = u.id
        LEFT JOIN user_bonus_points ubp ON ubp.user_id = u.id
        WHERE u.is_active = true
        AND (COALESCE(ump.match_points, 0) + COALESCE(ubp.bonus_points, 0)) > 0
      )
      SELECT * FROM user_totals
      WHERE user_id = ${userId}::uuid
    `;

    if (rows.length === 0) {
      return null;
    }

    const row = rows[0]!;
    return {
      position: Number(row.position),
      userId: row.user_id,
      displayName: row.display_name,
      username: row.username,
      avatarUrl: row.avatar_url,
      totalPoints: Number(row.total_points),
      exactCount: Number(row.exact_count),
      goalDiffCount: Number(row.goal_diff_count),
      winnerCount: Number(row.winner_count),
      missCount: Number(row.miss_count),
      bonusPoints: Number(row.bonus_points),
      streak: 0,
    };
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private async requireMembership(
    groupId: string,
    userId: string,
  ): Promise<{ name: string }> {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId, isActive: true },
      select: { name: true },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const membership = await this.prisma.groupMember.findFirst({
      where: { groupId, userId, isActive: true },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this group');
    }

    return group;
  }

  // ---------------------------------------------------------------------------
  // Cache helpers (graceful degradation — never throw on cache errors)
  // ---------------------------------------------------------------------------

  /** Build a deterministic cache key for a leaderboard query */
  private cacheKey(
    groupId: string,
    tournamentId?: string,
    phase?: string,
  ): string {
    return `lb:${groupId}:${tournamentId ?? 'all'}:${phase ?? 'all'}`;
  }

  /** Read from cache, returning undefined on miss or error */
  private async cacheGet<T>(key: string): Promise<T | undefined> {
    try {
      const value = await this.cache.get<T>(key);
      if (value !== undefined && value !== null) {
        this.logger.debug(`Cache HIT: ${key}`);
        return value;
      }
    } catch (err) {
      this.logger.warn(
        `Cache get failed (key=${key}): ${err instanceof Error ? err.message : 'Unknown error'}`,
      );
    }
    return undefined;
  }

  /** Write to cache, silently ignoring errors */
  private async cacheSet<T>(key: string, value: T): Promise<void> {
    try {
      await this.cache.set(key, value);
      this.logger.debug(`Cache SET: ${key}`);
    } catch (err) {
      this.logger.warn(
        `Cache set failed (key=${key}): ${err instanceof Error ? err.message : 'Unknown error'}`,
      );
    }
  }
}
