import { Injectable, Logger } from '@nestjs/common';
import type {
  DashboardResponseDto,
  DashboardGroupRankingDto,
  DashboardTodayMatchDto,
  DashboardUserStatsDto,
} from '@pichichi/shared';
import { PrismaService } from '../../config/prisma.service.js';

// ---------------------------------------------------------------------------
// Raw query result types
// ---------------------------------------------------------------------------

interface RawTodayMatchRow {
  id: string;
  scheduled_at: Date;
  status: string;
  home_score: number | null;
  away_score: number | null;
  phase: string;
  home_team_id: string | null;
  away_team_id: string | null;
  home_team_placeholder: string | null;
  away_team_placeholder: string | null;
  home_team_name: string | null;
  home_team_logo_url: string | null;
  away_team_name: string | null;
  away_team_logo_url: string | null;
  tournament_name: string;
  tournament_slug: string;
  group_id: string;
  group_name: string;
  predicted_home: number | null;
  predicted_away: number | null;
}

interface RawLeaderboardRow {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  total_points: bigint | number;
}

interface RawUserStatsRow {
  total_points: bigint | number;
  total_predictions: bigint | number;
  exact_count: bigint | number;
  goal_diff_count: bigint | number;
  winner_count: bigint | number;
  miss_count: bigint | number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Maximum number of upcoming matches to return.
 * The client filters by "today" using the device timezone, so
 * the backend is deliberately generous — returning all upcoming matches
 * avoids UTC vs. local-time mismatches.
 */
const MAX_UPCOMING_MATCHES = 20;

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  async getDashboard(userId: string): Promise<DashboardResponseDto> {
    const results = await Promise.allSettled([
      this.getTodayMatches(userId),
      this.getUserStats(userId),
      this.getGroupRankings(userId),
    ]);

    const extract = <T>(result: PromiseSettledResult<T>): T | null => {
      if (result.status === 'fulfilled') return result.value;
      this.logger.error(
        `Dashboard section failed: ${result.reason instanceof Error ? result.reason.message : String(result.reason)}`,
      );
      return null;
    };

    return {
      todayMatches: extract(results[0]),
      stats: extract(results[1]),
      groups: extract(results[2]),
    };
  }

  // ---------------------------------------------------------------------------
  // Today's matches (unified section)
  // ---------------------------------------------------------------------------

  private async getTodayMatches(
    userId: string,
  ): Promise<DashboardTodayMatchDto[]> {
    // Return all upcoming (not finished/cancelled/postponed) matches from the
    // user's active groups, plus any currently LIVE match.
    //
    // The client filters by "today" using the device timezone — this is the
    // same pattern the tournament screen uses (fetch all, group by local date).
    // The backend is deliberately timezone-agnostic here.
    const rows = await this.prisma.$queryRaw<RawTodayMatchRow[]>`
      SELECT
        m.id,
        m.scheduled_at,
        m.status,
        m.home_score,
        m.away_score,
        m.phase,
        m.home_team_id,
        m.away_team_id,
        m.home_team_placeholder,
        m.away_team_placeholder,
        ht.name       AS home_team_name,
        ht.logo_url   AS home_team_logo_url,
        at2.name      AS away_team_name,
        at2.logo_url  AS away_team_logo_url,
        t.name        AS tournament_name,
        t.slug        AS tournament_slug,
        g.id          AS group_id,
        g.name        AS group_name,
        (
          SELECT p.predicted_home FROM predictions p
          WHERE p.match_id = m.id AND p.user_id = ${userId}::uuid AND p.group_id = g.id
          LIMIT 1
        ) AS predicted_home,
        (
          SELECT p.predicted_away FROM predictions p
          WHERE p.match_id = m.id AND p.user_id = ${userId}::uuid AND p.group_id = g.id
          LIMIT 1
        ) AS predicted_away
      FROM matches m
      JOIN tournaments t ON t.id = m.tournament_id
      JOIN group_tournaments gt ON gt.tournament_id = m.tournament_id
      JOIN groups g ON g.id = gt.group_id
      JOIN group_members gm
        ON gm.group_id = g.id
        AND gm.user_id = ${userId}::uuid
        AND gm.is_active = true
      LEFT JOIN teams ht ON ht.id = m.home_team_id
      LEFT JOIN teams at2 ON at2.id = m.away_team_id
      WHERE (
        m.status NOT IN ('FINISHED', 'CANCELLED', 'POSTPONED')
        OR m.status = 'LIVE'
      )
      ORDER BY m.scheduled_at ASC, g.name ASC
      LIMIT ${MAX_UPCOMING_MATCHES}
    `;

    return rows.map((row) => ({
      matchId: row.id,
      homeTeam: row.home_team_id && row.home_team_name
        ? { id: row.home_team_id, name: row.home_team_name, logoUrl: row.home_team_logo_url }
        : null,
      awayTeam: row.away_team_id && row.away_team_name
        ? { id: row.away_team_id, name: row.away_team_name, logoUrl: row.away_team_logo_url }
        : null,
      homePlaceholder: row.home_team_placeholder,
      awayPlaceholder: row.away_team_placeholder,
      scheduledAt: row.scheduled_at.toISOString(),
      status: row.status,
      homeScore: row.home_score,
      awayScore: row.away_score,
      phase: row.phase,
      tournamentName: row.tournament_name,
      tournamentSlug: row.tournament_slug,
      groupId: row.group_id,
      groupName: row.group_name,
      hasPrediction: row.predicted_home !== null && row.predicted_away !== null,
      predictedHome: row.predicted_home,
      predictedAway: row.predicted_away,
      isLocked: row.status !== 'SCHEDULED',
    }));
  }

  // ---------------------------------------------------------------------------
  // Group rankings (mini leaderboards)
  // ---------------------------------------------------------------------------

  private async getGroupRankings(
    userId: string,
  ): Promise<DashboardGroupRankingDto[]> {
    // Get user's active groups (limit 2)
    const memberships = await this.prisma.groupMember.findMany({
      where: { userId, isActive: true },
      include: {
        group: {
          select: { id: true, name: true },
        },
      },
      take: 2,
    });

    const rankings: DashboardGroupRankingDto[] = [];

    for (const membership of memberships) {
      const group = membership.group;

      // Get the full leaderboard for this group (raw SQL like LeaderboardService)
      const rows = await this.prisma.$queryRaw<RawLeaderboardRow[]>`
        SELECT
          u.id AS user_id,
          u.display_name,
          u.avatar_url,
          COALESCE(SUM(p.points_earned), 0) AS total_points
        FROM group_members gm
        JOIN users u ON u.id = gm.user_id
        LEFT JOIN predictions p ON p.user_id = u.id AND p.group_id = gm.group_id
        WHERE gm.group_id = ${group.id}::uuid AND gm.is_active = true
        GROUP BY u.id, u.display_name, u.avatar_url
        ORDER BY total_points DESC
      `;

      const totalMembers = rows.length;

      // Assign positions (with ties)
      const entries = rows.map((row, index) => {
        let position = index + 1;
        if (index > 0) {
          const prev = rows[index - 1]!;
          if (Number(row.total_points) === Number(prev.total_points)) {
            for (let j = index - 1; j >= 0; j--) {
              if (Number(rows[j]!.total_points) === Number(row.total_points)) {
                position = j + 1;
              } else {
                break;
              }
            }
          }
        }
        return {
          position,
          userId: row.user_id,
          displayName: row.display_name,
          avatarUrl: row.avatar_url,
          totalPoints: Number(row.total_points),
        };
      });

      // Top 3
      const topEntries = entries.slice(0, 3).map((e) => ({
        userId: e.userId,
        position: e.position,
        displayName: e.displayName,
        avatarUrl: e.avatarUrl,
        totalPoints: e.totalPoints,
      }));

      // User's position
      const userEntry = entries.find((e) => e.userId === userId);
      const userPosition = userEntry?.position ?? totalMembers;
      const userPoints = userEntry?.totalPoints ?? 0;

      rankings.push({
        groupId: group.id,
        groupName: group.name,
        userPosition,
        totalMembers,
        userPoints,
        topEntries,
      });
    }

    return rankings;
  }

  // ---------------------------------------------------------------------------
  // User stats (aggregated across all groups)
  // ---------------------------------------------------------------------------

  private async getUserStats(
    userId: string,
  ): Promise<DashboardUserStatsDto> {
    const rows = await this.prisma.$queryRaw<RawUserStatsRow[]>`
      SELECT
        COALESCE(SUM(points_earned), 0)                          AS total_points,
        COUNT(*)                                                  AS total_predictions,
        COUNT(CASE WHEN point_type = 'EXACT' THEN 1 END)         AS exact_count,
        COUNT(CASE WHEN point_type = 'GOAL_DIFF' THEN 1 END)     AS goal_diff_count,
        COUNT(CASE WHEN point_type = 'WINNER' THEN 1 END)        AS winner_count,
        COUNT(CASE WHEN point_type = 'MISS' THEN 1 END)          AS miss_count
      FROM predictions
      WHERE user_id = ${userId}::uuid
        AND point_type IS NOT NULL
    `;

    const row = rows[0];
    const totalPredictions = Number(row?.total_predictions ?? 0);
    const exactCount = Number(row?.exact_count ?? 0);
    const goalDiffCount = Number(row?.goal_diff_count ?? 0);
    const winnerCount = Number(row?.winner_count ?? 0);
    const missCount = Number(row?.miss_count ?? 0);
    const totalPoints = Number(row?.total_points ?? 0);

    const correctCount = exactCount + goalDiffCount + winnerCount;
    const accuracy =
      totalPredictions > 0
        ? Math.round((correctCount / totalPredictions) * 100)
        : 0;

    const groupCountResult = await this.prisma.groupMember.count({
      where: { userId, isActive: true },
    });

    return {
      totalPoints,
      totalPredictions,
      exactCount,
      accuracy,
      groupCount: groupCountResult,
    };
  }
}
