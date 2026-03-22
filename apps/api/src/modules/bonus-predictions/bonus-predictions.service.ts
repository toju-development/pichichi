import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service.js';
import type { CreateBonusPredictionDto } from './dto/create-bonus-prediction.dto.js';
import type {
  BonusPredictionResponseDto,
  BonusTypeDto,
  UserBonusPredictionDto,
  GroupBonusPredictionsResponseDto,
} from './dto/bonus-prediction-response.dto.js';

export interface ResolveResult {
  id: string;
  isCorrect: boolean;
  pointsEarned: number;
}

export interface LockResult {
  tournamentId: string;
  lockedCount: number;
}

@Injectable()
export class BonusPredictionsService {
  private readonly logger = new Logger(BonusPredictionsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ---------------------------------------------------------------------------
  // Upsert bonus prediction (create or update)
  // ---------------------------------------------------------------------------

  async upsert(
    userId: string,
    dto: CreateBonusPredictionDto,
  ): Promise<BonusPredictionResponseDto> {
    // 1. Validate user is active member of the group
    const membership = await this.prisma.groupMember.findFirst({
      where: { groupId: dto.groupId, userId, isActive: true },
    });

    if (!membership) {
      throw new ForbiddenException('You are not an active member of this group');
    }

    // 2. Validate bonus type exists and get its tournament
    const bonusType = await this.prisma.tournamentBonusType.findUnique({
      where: { id: dto.bonusTypeId },
      include: { tournament: true },
    });

    if (!bonusType) {
      throw new NotFoundException('Bonus type not found');
    }

    // 3. Check if tournament has started (first match scheduledAt > now)
    const firstMatch = await this.prisma.match.findFirst({
      where: { tournamentId: bonusType.tournamentId },
      orderBy: { scheduledAt: 'asc' },
      select: { scheduledAt: true },
    });

    if (firstMatch && firstMatch.scheduledAt <= new Date()) {
      throw new ConflictException('Bonus predictions are locked');
    }

    // 4. Upsert prediction (unique constraint: userId + groupId + bonusTypeId)
    const prediction = await this.prisma.bonusPrediction.upsert({
      where: {
        userId_groupId_bonusTypeId: {
          userId,
          groupId: dto.groupId,
          bonusTypeId: dto.bonusTypeId,
        },
      },
      update: {
        predictedValue: dto.predictedValue,
      },
      create: {
        userId,
        groupId: dto.groupId,
        bonusTypeId: dto.bonusTypeId,
        predictedValue: dto.predictedValue,
      },
      include: {
        bonusType: true,
      },
    });

    return this.toResponseDto(prediction);
  }

  // ---------------------------------------------------------------------------
  // Find user's bonus predictions in a group for a tournament
  // ---------------------------------------------------------------------------

  async findByGroup(
    groupId: string,
    userId: string,
    tournamentId: string,
  ): Promise<BonusPredictionResponseDto[]> {
    // Validate membership
    const membership = await this.prisma.groupMember.findFirst({
      where: { groupId, userId, isActive: true },
    });

    if (!membership) {
      throw new ForbiddenException('You are not an active member of this group');
    }

    const predictions = await this.prisma.bonusPrediction.findMany({
      where: {
        groupId,
        userId,
        bonusType: { tournamentId },
      },
      include: {
        bonusType: true,
      },
      orderBy: { bonusType: { sortOrder: 'asc' } },
    });

    return predictions.map((p) => this.toResponseDto(p));
  }

  // ---------------------------------------------------------------------------
  // Find ALL users' bonus predictions in a group (post-start reveal)
  // ---------------------------------------------------------------------------

  async findAllByGroup(
    groupId: string,
    requestingUserId: string,
    tournamentId: string,
  ): Promise<GroupBonusPredictionsResponseDto> {
    // Validate membership
    const membership = await this.prisma.groupMember.findFirst({
      where: { groupId, userId: requestingUserId, isActive: true },
    });

    if (!membership) {
      throw new ForbiddenException('You are not an active member of this group');
    }

    // Check if tournament has started (first match scheduledAt > now → not started)
    const firstMatch = await this.prisma.match.findFirst({
      where: { tournamentId },
      orderBy: { scheduledAt: 'asc' },
      select: { scheduledAt: true },
    });

    const revealed = firstMatch ? firstMatch.scheduledAt <= new Date() : false;

    // If not revealed, only return the requesting user's predictions
    const whereClause = revealed
      ? { groupId, bonusType: { tournamentId } }
      : { groupId, userId: requestingUserId, bonusType: { tournamentId } };

    const predictions = await this.prisma.bonusPrediction.findMany({
      where: whereClause,
      include: {
        user: {
          select: { id: true, displayName: true, avatarUrl: true },
        },
        bonusType: true,
      },
      orderBy: [
        { bonusType: { sortOrder: 'asc' } },
        { user: { displayName: 'asc' } },
      ],
    });

    return {
      groupId,
      tournamentId,
      revealed,
      predictions: predictions.map((p) => this.toUserBonusPredictionDto(p)),
    };
  }

  // ---------------------------------------------------------------------------
  // Resolve a bonus prediction (admin marks as correct/incorrect)
  // ---------------------------------------------------------------------------

  async resolve(
    bonusPredictionId: string,
    isCorrect: boolean,
  ): Promise<ResolveResult> {
    const prediction = await this.prisma.bonusPrediction.findUnique({
      where: { id: bonusPredictionId },
      include: { bonusType: true },
    });

    if (!prediction) {
      throw new NotFoundException('Bonus prediction not found');
    }

    const pointsEarned = isCorrect ? prediction.bonusType.points : 0;

    const updated = await this.prisma.bonusPrediction.update({
      where: { id: bonusPredictionId },
      data: { isCorrect, pointsEarned },
    });

    this.logger.log(
      `Resolved bonus prediction ${bonusPredictionId}: isCorrect=${isCorrect}, points=${pointsEarned}`,
    );

    return {
      id: updated.id,
      isCorrect,
      pointsEarned,
    };
  }

  // ---------------------------------------------------------------------------
  // Lock all bonus predictions for a tournament
  // ---------------------------------------------------------------------------

  async lockByTournament(tournamentId: string): Promise<LockResult> {
    const result = await this.prisma.bonusPrediction.updateMany({
      where: {
        bonusType: { tournamentId },
        lockedAt: null,
      },
      data: { lockedAt: new Date() },
    });

    this.logger.log(
      `Locked ${result.count} bonus predictions for tournament ${tournamentId}`,
    );

    return {
      tournamentId,
      lockedCount: result.count,
    };
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private toResponseDto(
    prediction: {
      id: string;
      userId: string;
      groupId: string;
      bonusTypeId: string;
      predictedValue: string;
      isCorrect: boolean | null;
      pointsEarned: number;
      lockedAt: Date | null;
      createdAt: Date;
      updatedAt: Date;
      bonusType?: {
        id: string;
        key: string;
        label: string;
        points: number;
        sortOrder: number;
      };
    },
  ): BonusPredictionResponseDto {
    const bonusTypeDto: BonusTypeDto | undefined = prediction.bonusType
      ? {
          id: prediction.bonusType.id,
          key: prediction.bonusType.key,
          label: prediction.bonusType.label,
          points: prediction.bonusType.points,
          sortOrder: prediction.bonusType.sortOrder,
        }
      : undefined;

    return {
      id: prediction.id,
      userId: prediction.userId,
      groupId: prediction.groupId,
      bonusTypeId: prediction.bonusTypeId,
      predictedValue: prediction.predictedValue,
      isCorrect: prediction.isCorrect,
      pointsEarned: prediction.pointsEarned,
      lockedAt: prediction.lockedAt,
      bonusType: bonusTypeDto,
      createdAt: prediction.createdAt,
      updatedAt: prediction.updatedAt,
    };
  }

  private toUserBonusPredictionDto(
    prediction: {
      id: string;
      userId: string;
      bonusTypeId: string;
      predictedValue: string;
      isCorrect: boolean | null;
      pointsEarned: number;
      user: { id: string; displayName: string; avatarUrl: string | null };
    },
  ): UserBonusPredictionDto {
    return {
      id: prediction.id,
      userId: prediction.userId,
      displayName: prediction.user.displayName,
      avatarUrl: prediction.user.avatarUrl,
      bonusTypeId: prediction.bonusTypeId,
      predictedValue: prediction.predictedValue,
      isCorrect: prediction.isCorrect,
      pointsEarned: prediction.pointsEarned,
    };
  }
}
