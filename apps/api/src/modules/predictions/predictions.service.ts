import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { PredictionPointType } from '@prisma/client';
import { PrismaService } from '../../config/prisma.service.js';
import { EventsGateway } from '../../gateways/events.gateway.js';
import type { CreatePredictionDto } from './dto/create-prediction.dto.js';
import type { PredictionResponseDto, PredictionMatchDto } from './dto/prediction-response.dto.js';
import type { GroupPredictionsResponseDto, UserPredictionDto } from './dto/group-predictions-response.dto.js';
import type { PredictionStatsResponseDto } from './dto/prediction-stats-response.dto.js';

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
export class PredictionsService {
  private readonly logger = new Logger(PredictionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsGateway: EventsGateway,
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

    // 3. Server-side time check — NEVER trust client
    if (match.scheduledAt <= new Date()) {
      throw new ConflictException('Predictions are locked for this match');
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
  // Calculate points for a match (THE CORE SCORING LOGIC)
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

    // 4. Calculate points for each prediction
    const updates = predictions.map((prediction) => {
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

      return this.prisma.prediction.update({
        where: { id: prediction.id },
        data: { pointsEarned: points, pointType },
      });
    });

    // 5. Update all predictions
    await this.prisma.$transaction(updates);

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

    return {
      matchId,
      totalPredictions: predictions.length,
      results,
    };
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

  private calculatePoints(
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
