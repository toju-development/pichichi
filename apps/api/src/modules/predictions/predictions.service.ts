import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { PredictionPointType } from '@prisma/client';
import { LOCK_BUFFER_MINUTES } from '@pichichi/shared';
import { PrismaService } from '../../config/prisma.service.js';
import type { MemberPredictionItemDto, MemberPredictionsResponseDto } from '@pichichi/shared';
import type { CreatePredictionDto } from './dto/create-prediction.dto.js';
import type { PredictionResponseDto, PredictionMatchDto } from './dto/prediction-response.dto.js';
import type { GroupPredictionsResponseDto, UserPredictionDto } from './dto/group-predictions-response.dto.js';
import type { PredictionStatsResponseDto } from './dto/prediction-stats-response.dto.js';

@Injectable()
export class PredictionsService {
  private readonly logger = new Logger(PredictionsService.name);

  constructor(
    private readonly prisma: PrismaService,
  ) {}

  // ---------------------------------------------------------------------------
  // Upsert prediction (create or update)
  // ---------------------------------------------------------------------------

  async upsert(
    userId: string,
    dto: CreatePredictionDto,
  ): Promise<PredictionResponseDto> {
    // 1. Validate user is active member of the group
    const membership = await this.prisma.groupMember.findFirst({
      where: { groupId: dto.groupId, userId, isActive: true },
    });

    if (!membership) {
      throw new ForbiddenException('You are not an active member of this group');
    }

    // 2. Validate match exists and is SCHEDULED
    const match = await this.prisma.match.findUnique({
      where: { id: dto.matchId },
      include: { homeTeam: true, awayTeam: true },
    });

    if (!match) {
      throw new NotFoundException('Match not found');
    }

    if (match.status !== 'SCHEDULED') {
      throw new ConflictException('Predictions are locked for this match');
    }

    // 3. Server-side time check with 5-minute lock buffer — NEVER trust client
    const lockTime = new Date(
      match.scheduledAt.getTime() - LOCK_BUFFER_MINUTES * 60 * 1000,
    );
    if (lockTime <= new Date()) {
      throw new ConflictException('Predictions are locked for this match');
    }

    // 3.5. Validate the match's tournament belongs to the target group
    const groupTournament = await this.prisma.groupTournament.findUnique({
      where: {
        groupId_tournamentId: {
          groupId: dto.groupId,
          tournamentId: match.tournamentId,
        },
      },
    });

    if (!groupTournament) {
      throw new ForbiddenException(
        'This tournament is not part of this group',
      );
    }

    // 4. Upsert prediction (unique constraint: userId + matchId + groupId)
    const prediction = await this.prisma.prediction.upsert({
      where: {
        userId_matchId_groupId: {
          userId,
          matchId: dto.matchId,
          groupId: dto.groupId,
        },
      },
      update: {
        predictedHome: dto.predictedHome,
        predictedAway: dto.predictedAway,
      },
      create: {
        userId,
        matchId: dto.matchId,
        groupId: dto.groupId,
        predictedHome: dto.predictedHome,
        predictedAway: dto.predictedAway,
      },
      include: {
        match: {
          include: { homeTeam: true, awayTeam: true },
        },
      },
    });

    return this.toResponseDto(prediction);
  }

  // ---------------------------------------------------------------------------
  // Find all predictions for a user in a group
  // ---------------------------------------------------------------------------

  async findByGroupAndUser(
    groupId: string,
    userId: string,
  ): Promise<PredictionResponseDto[]> {
    // Validate membership
    const membership = await this.prisma.groupMember.findFirst({
      where: { groupId, userId, isActive: true },
    });

    if (!membership) {
      throw new ForbiddenException('You are not an active member of this group');
    }

    const predictions = await this.prisma.prediction.findMany({
      where: { groupId, userId },
      include: {
        match: {
          include: { homeTeam: true, awayTeam: true },
        },
      },
      orderBy: { match: { scheduledAt: 'asc' } },
    });

    return predictions.map((p) => this.toResponseDto(p));
  }

  // ---------------------------------------------------------------------------
  // Find all predictions for a match in a group (social reveal)
  // ---------------------------------------------------------------------------

  async findByMatchAndGroup(
    matchId: string,
    groupId: string,
    requestingUserId: string,
  ): Promise<GroupPredictionsResponseDto> {
    // Validate membership
    const membership = await this.prisma.groupMember.findFirst({
      where: { groupId, userId: requestingUserId, isActive: true },
    });

    if (!membership) {
      throw new ForbiddenException('You are not an active member of this group');
    }

    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
    });

    if (!match) {
      throw new NotFoundException('Match not found');
    }

    const revealed = match.status !== 'SCHEDULED';

    // If SCHEDULED, only return the requesting user's prediction
    const whereClause = revealed
      ? { matchId, groupId }
      : { matchId, groupId, userId: requestingUserId };

    const predictions = await this.prisma.prediction.findMany({
      where: whereClause,
      include: {
        user: {
          select: { id: true, displayName: true, avatarUrl: true },
        },
      },
      orderBy: { user: { displayName: 'asc' } },
    });

    return {
      matchId,
      groupId,
      matchStatus: match.status,
      revealed,
      predictions: predictions.map((p) => this.toUserPredictionDto(p)),
    };
  }

  // ---------------------------------------------------------------------------
  // Find single prediction for a specific match/group/user
  // ---------------------------------------------------------------------------

  async findUserPrediction(
    matchId: string,
    groupId: string,
    userId: string,
  ): Promise<PredictionResponseDto | null> {
    const prediction = await this.prisma.prediction.findUnique({
      where: {
        userId_matchId_groupId: { userId, matchId, groupId },
      },
      include: {
        match: {
          include: { homeTeam: true, awayTeam: true },
        },
      },
    });

    if (!prediction) {
      return null;
    }

    return this.toResponseDto(prediction);
  }

  // ---------------------------------------------------------------------------
  // Get user stats in a group
  // ---------------------------------------------------------------------------

  async getStats(
    userId: string,
    groupId: string,
  ): Promise<PredictionStatsResponseDto> {
    // Validate membership
    const membership = await this.prisma.groupMember.findFirst({
      where: { groupId, userId, isActive: true },
    });

    if (!membership) {
      throw new ForbiddenException('You are not an active member of this group');
    }

    const predictions = await this.prisma.prediction.findMany({
      where: { userId, groupId, pointType: { not: null } },
      select: { pointsEarned: true, pointType: true },
    });

    const totalPredictions = predictions.length;
    let totalPoints = 0;
    let exactCount = 0;
    let goalDiffCount = 0;
    let winnerCount = 0;
    let missCount = 0;

    for (const p of predictions) {
      totalPoints += p.pointsEarned;
      if (p.pointType === 'EXACT') exactCount++;
      else if (p.pointType === 'GOAL_DIFF') goalDiffCount++;
      else if (p.pointType === 'WINNER') winnerCount++;
      else if (p.pointType === 'MISS') missCount++;
    }

    return {
      totalPoints,
      totalPredictions,
      exactCount,
      goalDiffCount,
      winnerCount,
      missCount,
    };
  }

  // ---------------------------------------------------------------------------
  // Find predictions for a specific member in a group (visible to all members)
  // ---------------------------------------------------------------------------

  async findByGroupAndMember(
    groupId: string,
    userId: string,
    requestingUserId: string,
  ): Promise<MemberPredictionsResponseDto> {
    // Validate requesting user is active member of the group
    const membership = await this.prisma.groupMember.findFirst({
      where: { groupId, userId: requestingUserId, isActive: true },
    });

    if (!membership) {
      throw new ForbiddenException('You are not an active member of this group');
    }

    // Fetch target user info
    const targetUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, displayName: true, avatarUrl: true },
    });

    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    // Raw SQL: predictions joined with matches, teams, and tournaments
    // Filter: only FINISHED and LIVE matches in tournaments belonging to this group
    const predictions = await this.prisma.$queryRaw<
      Array<{
        id: string;
        matchId: string;
        predictedHome: number;
        predictedAway: number;
        pointsEarned: number;
        pointType: string | null;
        scheduledAt: Date;
        status: string;
        homeScore: number | null;
        awayScore: number | null;
        phase: string;
        homeTeamName: string | null;
        awayTeamName: string | null;
        homeTeamShortName: string | null;
        awayTeamShortName: string | null;
        homeTeamFlagUrl: string | null;
        awayTeamFlagUrl: string | null;
        tournamentId: string;
        tournamentName: string;
        tournamentLogoUrl: string | null;
      }>
    >`
      SELECT
        p.id,
        p.match_id AS "matchId",
        p.predicted_home AS "predictedHome",
        p.predicted_away AS "predictedAway",
        p.points_earned AS "pointsEarned",
        p.point_type AS "pointType",
        m.scheduled_at AS "scheduledAt",
        m.status,
        m.home_score AS "homeScore",
        m.away_score AS "awayScore",
        m.phase,
        ht.name AS "homeTeamName",
        at.name AS "awayTeamName",
        ht.short_name AS "homeTeamShortName",
        at.short_name AS "awayTeamShortName",
        ht.logo_url AS "homeTeamFlagUrl",
        at.logo_url AS "awayTeamFlagUrl",
        t.id AS "tournamentId",
        t.name AS "tournamentName",
        t.logo_url AS "tournamentLogoUrl"
      FROM predictions p
      JOIN matches m ON m.id = p.match_id
      JOIN tournaments t ON t.id = m.tournament_id
      JOIN group_tournaments gt ON gt.tournament_id = t.id AND gt.group_id = p.group_id
      LEFT JOIN teams ht ON ht.id = m.home_team_id
      LEFT JOIN teams at ON at.id = m.away_team_id
      WHERE p.user_id = ${userId}::uuid
        AND p.group_id = ${groupId}::uuid
        AND m.status IN ('FINISHED', 'LIVE')
      ORDER BY m.scheduled_at DESC
      LIMIT 50
    `;

    // Calculate total points
    const totalPointsResult = await this.prisma.$queryRaw<
      Array<{ total: bigint | null }>
    >`
      SELECT COALESCE(SUM(p.points_earned), 0) AS total
      FROM predictions p
      JOIN matches m ON m.id = p.match_id
      JOIN group_tournaments gt ON gt.tournament_id = m.tournament_id AND gt.group_id = p.group_id
      WHERE p.user_id = ${userId}::uuid
        AND p.group_id = ${groupId}::uuid
        AND p.point_type IS NOT NULL
    `;

    const totalPoints = Number(totalPointsResult[0]?.total ?? 0);

    return {
      userId: targetUser.id,
      displayName: targetUser.displayName,
      avatarUrl: targetUser.avatarUrl,
      totalPoints,
      predictions: predictions.map((row) => ({
        id: row.id,
        matchId: row.matchId,
        predictedHome: row.predictedHome,
        predictedAway: row.predictedAway,
        pointsEarned: row.pointsEarned,
        pointType: row.pointType as MemberPredictionItemDto['pointType'],
        match: {
          scheduledAt: row.scheduledAt.toISOString(),
          status: row.status as MemberPredictionItemDto['match']['status'],
          homeScore: row.homeScore,
          awayScore: row.awayScore,
          phase: row.phase as MemberPredictionItemDto['match']['phase'],
          homeTeamName: row.homeTeamName,
          awayTeamName: row.awayTeamName,
          homeTeamShortName: row.homeTeamShortName,
          awayTeamShortName: row.awayTeamShortName,
          homeTeamFlagUrl: row.homeTeamFlagUrl,
          awayTeamFlagUrl: row.awayTeamFlagUrl,
        },
        tournamentId: row.tournamentId,
        tournamentName: row.tournamentName,
        tournamentLogoUrl: row.tournamentLogoUrl,
      })),
    };
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private toResponseDto(
    prediction: {
      id: string;
      userId: string;
      matchId: string;
      groupId: string;
      predictedHome: number;
      predictedAway: number;
      pointsEarned: number;
      pointType: PredictionPointType | null;
      createdAt: Date;
      updatedAt: Date;
      match?: {
        id: string;
        scheduledAt: Date;
        status: string;
        homeScore: number | null;
        awayScore: number | null;
        phase: string;
        homeTeam?: { name: string; shortName: string; logoUrl: string | null } | null;
        awayTeam?: { name: string; shortName: string; logoUrl: string | null } | null;
      };
    },
  ): PredictionResponseDto {
    const matchDto: PredictionMatchDto | undefined = prediction.match
      ? {
          id: prediction.match.id,
          scheduledAt: prediction.match.scheduledAt,
          status: prediction.match.status,
          homeTeamName: prediction.match.homeTeam?.name ?? null,
          awayTeamName: prediction.match.awayTeam?.name ?? null,
          homeTeamShortName: prediction.match.homeTeam?.shortName ?? null,
          awayTeamShortName: prediction.match.awayTeam?.shortName ?? null,
          homeTeamFlagUrl: prediction.match.homeTeam?.logoUrl ?? null,
          awayTeamFlagUrl: prediction.match.awayTeam?.logoUrl ?? null,
          homeScore: prediction.match.homeScore,
          awayScore: prediction.match.awayScore,
          phase: prediction.match.phase,
        }
      : undefined;

    return {
      id: prediction.id,
      userId: prediction.userId,
      matchId: prediction.matchId,
      groupId: prediction.groupId,
      predictedHome: prediction.predictedHome,
      predictedAway: prediction.predictedAway,
      pointsEarned: prediction.pointsEarned,
      pointType: prediction.pointType,
      match: matchDto,
      createdAt: prediction.createdAt,
      updatedAt: prediction.updatedAt,
    };
  }

  private toUserPredictionDto(
    prediction: {
      id: string;
      userId: string;
      predictedHome: number;
      predictedAway: number;
      pointsEarned: number;
      pointType: PredictionPointType | null;
      user: { id: string; displayName: string; avatarUrl: string | null };
    },
  ): UserPredictionDto {
    return {
      id: prediction.id,
      userId: prediction.userId,
      displayName: prediction.user.displayName,
      avatarUrl: prediction.user.avatarUrl,
      predictedHome: prediction.predictedHome,
      predictedAway: prediction.predictedAway,
      pointsEarned: prediction.pointsEarned,
      pointType: prediction.pointType,
    };
  }
}
