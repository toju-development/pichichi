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
        homeTeam?: { name: string; shortName: string; flagUrl: string | null } | null;
        awayTeam?: { name: string; shortName: string; flagUrl: string | null } | null;
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
          homeTeamFlagUrl: prediction.match.homeTeam?.flagUrl ?? null,
          awayTeamFlagUrl: prediction.match.awayTeam?.flagUrl ?? null,
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
