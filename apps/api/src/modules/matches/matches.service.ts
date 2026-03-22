import {
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import type { MatchStatus } from '@prisma/client';
import { PrismaService } from '../../config/prisma.service.js';
import { PredictionsService } from '../predictions/predictions.service.js';
import { EventsGateway } from '../../gateways/events.gateway.js';
import type { CreateMatchDto } from './dto/create-match.dto.js';
import type { UpdateMatchDto } from './dto/update-match.dto.js';
import type { MatchFiltersDto } from './dto/match-filters.dto.js';
import type { MatchResponseDto } from './dto/match-response.dto.js';

const MATCH_INCLUDE = {
  homeTeam: true,
  awayTeam: true,
} as const;

@Injectable()
export class MatchesService {
  private readonly logger = new Logger(MatchesService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => PredictionsService))
    private readonly predictionsService: PredictionsService,
    private readonly eventsGateway: EventsGateway,
  ) {}

  // ---------------------------------------------------------------------------
  // List matches with filters
  // ---------------------------------------------------------------------------

  async findAll(filters: MatchFiltersDto): Promise<MatchResponseDto[]> {
    const dateFilter = filters.date
      ? {
          scheduledAt: {
            gte: new Date(`${filters.date}T00:00:00.000Z`),
            lt: new Date(`${filters.date}T23:59:59.999Z`),
          },
        }
      : {};

    const matches = await this.prisma.match.findMany({
      where: {
        tournamentId: filters.tournamentId,
        ...(filters.phase ? { phase: filters.phase } : {}),
        ...(filters.status ? { status: filters.status } : {}),
        ...dateFilter,
      },
      include: MATCH_INCLUDE,
      orderBy: [{ scheduledAt: 'asc' }, { matchNumber: 'asc' }],
    });

    return matches.map((m) => this.toResponseDto(m));
  }

  // ---------------------------------------------------------------------------
  // Get match by ID
  // ---------------------------------------------------------------------------

  async findById(id: string): Promise<MatchResponseDto> {
    const match = await this.prisma.match.findUnique({
      where: { id },
      include: MATCH_INCLUDE,
    });

    if (!match) {
      throw new NotFoundException('Match not found');
    }

    return this.toResponseDto(match);
  }

  // ---------------------------------------------------------------------------
  // Get upcoming matches
  // ---------------------------------------------------------------------------

  async findUpcoming(
    tournamentId: string,
    limit = 5,
  ): Promise<MatchResponseDto[]> {
    const matches = await this.prisma.match.findMany({
      where: {
        tournamentId,
        status: 'SCHEDULED',
        scheduledAt: { gte: new Date() },
      },
      include: MATCH_INCLUDE,
      orderBy: { scheduledAt: 'asc' },
      take: limit,
    });

    return matches.map((m) => this.toResponseDto(m));
  }

  // ---------------------------------------------------------------------------
  // Get live matches
  // ---------------------------------------------------------------------------

  async findLive(tournamentId: string): Promise<MatchResponseDto[]> {
    const matches = await this.prisma.match.findMany({
      where: {
        tournamentId,
        status: 'LIVE',
      },
      include: MATCH_INCLUDE,
      orderBy: { scheduledAt: 'asc' },
    });

    return matches.map((m) => this.toResponseDto(m));
  }

  // ---------------------------------------------------------------------------
  // Create match
  // ---------------------------------------------------------------------------

  async create(dto: CreateMatchDto): Promise<MatchResponseDto> {
    const match = await this.prisma.match.create({
      data: {
        tournamentId: dto.tournamentId,
        homeTeamId: dto.homeTeamId ?? null,
        awayTeamId: dto.awayTeamId ?? null,
        phase: dto.phase,
        groupLetter: dto.groupLetter ?? null,
        matchNumber: dto.matchNumber ?? null,
        scheduledAt: new Date(dto.scheduledAt),
        venue: dto.venue ?? null,
        city: dto.city ?? null,
        homeTeamPlaceholder: dto.homeTeamPlaceholder ?? null,
        awayTeamPlaceholder: dto.awayTeamPlaceholder ?? null,
      },
      include: MATCH_INCLUDE,
    });

    return this.toResponseDto(match);
  }

  // ---------------------------------------------------------------------------
  // Update match
  // ---------------------------------------------------------------------------

  async update(id: string, dto: UpdateMatchDto): Promise<MatchResponseDto> {
    const existing = await this.prisma.match.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Match not found');
    }

    const match = await this.prisma.match.update({
      where: { id },
      data: {
        ...(dto.homeTeamId !== undefined ? { homeTeamId: dto.homeTeamId ?? null } : {}),
        ...(dto.awayTeamId !== undefined ? { awayTeamId: dto.awayTeamId ?? null } : {}),
        ...(dto.phase !== undefined ? { phase: dto.phase } : {}),
        ...(dto.groupLetter !== undefined ? { groupLetter: dto.groupLetter ?? null } : {}),
        ...(dto.matchNumber !== undefined ? { matchNumber: dto.matchNumber ?? null } : {}),
        ...(dto.scheduledAt !== undefined ? { scheduledAt: new Date(dto.scheduledAt) } : {}),
        ...(dto.venue !== undefined ? { venue: dto.venue ?? null } : {}),
        ...(dto.city !== undefined ? { city: dto.city ?? null } : {}),
        ...(dto.homeTeamPlaceholder !== undefined ? { homeTeamPlaceholder: dto.homeTeamPlaceholder ?? null } : {}),
        ...(dto.awayTeamPlaceholder !== undefined ? { awayTeamPlaceholder: dto.awayTeamPlaceholder ?? null } : {}),
        ...(dto.homeScore !== undefined ? { homeScore: dto.homeScore } : {}),
        ...(dto.awayScore !== undefined ? { awayScore: dto.awayScore } : {}),
        ...(dto.homeScorePenalties !== undefined ? { homeScorePenalties: dto.homeScorePenalties } : {}),
        ...(dto.awayScorePenalties !== undefined ? { awayScorePenalties: dto.awayScorePenalties } : {}),
        ...(dto.isExtraTime !== undefined ? { isExtraTime: dto.isExtraTime } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
      },
      include: MATCH_INCLUDE,
    });

    return this.toResponseDto(match);
  }

  // ---------------------------------------------------------------------------
  // Update score (specialized method for result updates)
  // ---------------------------------------------------------------------------

  async updateScore(
    id: string,
    homeScore: number,
    awayScore: number,
    status: MatchStatus,
    isExtraTime?: boolean,
    homeScorePenalties?: number,
    awayScorePenalties?: number,
  ): Promise<MatchResponseDto> {
    const existing = await this.prisma.match.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Match not found');
    }

    const match = await this.prisma.match.update({
      where: { id },
      data: {
        homeScore,
        awayScore,
        status,
        ...(isExtraTime !== undefined ? { isExtraTime } : {}),
        ...(homeScorePenalties !== undefined ? { homeScorePenalties } : {}),
        ...(awayScorePenalties !== undefined ? { awayScorePenalties } : {}),
      },
      include: MATCH_INCLUDE,
    });

    this.logger.log(
      `Score updated for match ${id}: ${homeScore}-${awayScore} (status: ${status})`,
    );

    const responseDto = this.toResponseDto(match);

    // Emit real-time score update
    this.eventsGateway.emitMatchScoreUpdate(id, responseDto);

    // Emit status update if status changed
    this.eventsGateway.emitMatchStatusUpdate(id, {
      matchId: id,
      status,
    });

    // Trigger point calculation when match finishes
    if (status === 'FINISHED') {
      try {
        const result = await this.predictionsService.calculatePointsForMatch(id);
        this.logger.log(
          `Points calculated for match ${id}: ${result.totalPredictions} predictions processed`,
        );
      } catch (error) {
        this.logger.error(
          `Failed to calculate points for match ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
    }

    return responseDto;
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private toResponseDto(
    match: {
      id: string;
      tournamentId: string;
      homeTeamId: string | null;
      awayTeamId: string | null;
      phase: string;
      groupLetter: string | null;
      matchNumber: number | null;
      scheduledAt: Date;
      venue: string | null;
      city: string | null;
      status: string;
      homeScore: number | null;
      awayScore: number | null;
      homeScorePenalties: number | null;
      awayScorePenalties: number | null;
      isExtraTime: boolean;
      homeTeamPlaceholder: string | null;
      awayTeamPlaceholder: string | null;
      createdAt: Date;
      updatedAt: Date;
      homeTeam?: { id: string; name: string; shortName: string; flagUrl: string | null } | null;
      awayTeam?: { id: string; name: string; shortName: string; flagUrl: string | null } | null;
    },
  ): MatchResponseDto {
    return {
      id: match.id,
      tournamentId: match.tournamentId,
      homeTeam: match.homeTeam
        ? {
            id: match.homeTeam.id,
            name: match.homeTeam.name,
            shortName: match.homeTeam.shortName,
            flagUrl: match.homeTeam.flagUrl,
          }
        : null,
      awayTeam: match.awayTeam
        ? {
            id: match.awayTeam.id,
            name: match.awayTeam.name,
            shortName: match.awayTeam.shortName,
            flagUrl: match.awayTeam.flagUrl,
          }
        : null,
      phase: match.phase as MatchResponseDto['phase'],
      groupLetter: match.groupLetter,
      matchNumber: match.matchNumber,
      scheduledAt: match.scheduledAt,
      venue: match.venue,
      city: match.city,
      status: match.status as MatchResponseDto['status'],
      homeScore: match.homeScore,
      awayScore: match.awayScore,
      homeScorePenalties: match.homeScorePenalties,
      awayScorePenalties: match.awayScorePenalties,
      isExtraTime: match.isExtraTime,
      homeTeamPlaceholder: match.homeTeamPlaceholder,
      awayTeamPlaceholder: match.awayTeamPlaceholder,
      createdAt: match.createdAt,
      updatedAt: match.updatedAt,
    };
  }
}
