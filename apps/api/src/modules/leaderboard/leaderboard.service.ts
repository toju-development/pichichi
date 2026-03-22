import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
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

@Injectable()
export class LeaderboardService {
  private readonly logger = new Logger(LeaderboardService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ---------------------------------------------------------------------------
  // Get group leaderboard (general ranking)
  // ---------------------------------------------------------------------------

  async getGroupLeaderboard(
    groupId: string,
    userId: string,
    tournamentId?: string,
  ): Promise<LeaderboardResponseDto> {
    const group = await this.requireMembership(groupId, userId);

    const rows = await this.queryLeaderboard(groupId, tournamentId);

    const entries = this.assignPositions(rows);

    const totalMembers = await this.prisma.groupMember.count({
      where: { groupId, isActive: true },
    });

    return {
      groupId,
      groupName: group.name,
      tournamentId: tournamentId ?? null,
      entries,
      totalMembers,
    };
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

    const rows = await this.queryLeaderboard(groupId, tournamentId, phase);

    const entries = this.assignPositions(rows);

    const totalMembers = await this.prisma.groupMember.count({
      where: { groupId, isActive: true },
    });

    return {
      groupId,
      groupName: group.name,
      tournamentId,
      entries,
      totalMembers,
    };
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
}
