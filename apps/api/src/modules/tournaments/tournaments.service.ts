import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { MatchPhase, TournamentStatus, TournamentType } from '@prisma/client';
import { PrismaService } from '../../config/prisma.service.js';
import type { CreateTournamentDto } from './dto/create-tournament.dto.js';
import type { UpdateTournamentDto } from './dto/update-tournament.dto.js';
import type { TournamentResponseDto } from './dto/tournament-response.dto.js';
import type { TournamentTeamResponseDto } from './dto/tournament-team-response.dto.js';

@Injectable()
export class TournamentsService {
  private readonly logger = new Logger(TournamentsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ---------------------------------------------------------------------------
  // Create tournament
  // ---------------------------------------------------------------------------

  async create(dto: CreateTournamentDto): Promise<TournamentResponseDto> {
    const existingSlug = await this.prisma.tournament.findUnique({
      where: { slug: dto.slug },
    });

    if (existingSlug) {
      throw new ConflictException(`A tournament with slug "${dto.slug}" already exists`);
    }

    const tournament = await this.prisma.$transaction(async (tx) => {
      const created = await tx.tournament.create({
        data: {
          name: dto.name,
          slug: dto.slug,
          type: dto.type,
          description: dto.description ?? null,
          logoUrl: dto.logoUrl ?? null,
          startDate: new Date(dto.startDate),
          endDate: new Date(dto.endDate),
          phases: {
            create: dto.phases.map((p) => ({
              phase: p.phase,
              multiplier: p.multiplier,
              sortOrder: p.sortOrder,
            })),
          },
          ...(dto.bonusTypes?.length
            ? {
                bonusTypes: {
                  create: dto.bonusTypes.map((b) => ({
                    key: b.key,
                    label: b.label,
                    points: b.points,
                    sortOrder: b.sortOrder,
                  })),
                },
              }
            : {}),
        },
        include: {
          phases: { orderBy: { sortOrder: 'asc' } },
          bonusTypes: { orderBy: { sortOrder: 'asc' } },
        },
      });

      return created;
    });

    return this.toResponseDto(tournament);
  }

  // ---------------------------------------------------------------------------
  // List tournaments
  // ---------------------------------------------------------------------------

  async findAll(filters?: {
    status?: TournamentStatus;
    type?: TournamentType;
  }): Promise<TournamentResponseDto[]> {
    const tournaments = await this.prisma.tournament.findMany({
      where: {
        isActive: true,
        ...(filters?.status ? { status: filters.status } : {}),
        ...(filters?.type ? { type: filters.type } : {}),
      },
      include: {
        _count: { select: { tournamentTeams: true } },
      },
      orderBy: { startDate: 'asc' },
    });

    return tournaments.map((t) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      type: t.type,
      description: t.description,
      logoUrl: t.logoUrl,
      startDate: t.startDate,
      endDate: t.endDate,
      status: t.status,
      isActive: t.isActive,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
      teamCount: t._count.tournamentTeams,
    }));
  }

  // ---------------------------------------------------------------------------
  // Get tournament by slug
  // ---------------------------------------------------------------------------

  async findBySlug(slug: string): Promise<TournamentResponseDto> {
    const tournament = await this.prisma.tournament.findUnique({
      where: { slug, isActive: true },
      include: {
        phases: { orderBy: { sortOrder: 'asc' } },
        bonusTypes: { orderBy: { sortOrder: 'asc' } },
        _count: { select: { tournamentTeams: true } },
      },
    });

    if (!tournament) {
      throw new NotFoundException('Tournament not found');
    }

    return {
      ...this.toResponseDto(tournament),
      teamCount: tournament._count.tournamentTeams,
    };
  }

  // ---------------------------------------------------------------------------
  // Get tournament by ID
  // ---------------------------------------------------------------------------

  async findById(id: string): Promise<TournamentResponseDto> {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id, isActive: true },
      include: {
        phases: { orderBy: { sortOrder: 'asc' } },
        bonusTypes: { orderBy: { sortOrder: 'asc' } },
      },
    });

    if (!tournament) {
      throw new NotFoundException('Tournament not found');
    }

    return this.toResponseDto(tournament);
  }

  // ---------------------------------------------------------------------------
  // Update tournament
  // ---------------------------------------------------------------------------

  async update(
    id: string,
    dto: UpdateTournamentDto,
  ): Promise<TournamentResponseDto> {
    const existing = await this.prisma.tournament.findUnique({
      where: { id, isActive: true },
    });

    if (!existing) {
      throw new NotFoundException('Tournament not found');
    }

    // Check slug uniqueness if changed
    if (dto.slug && dto.slug !== existing.slug) {
      const slugTaken = await this.prisma.tournament.findUnique({
        where: { slug: dto.slug },
      });

      if (slugTaken) {
        throw new ConflictException(`A tournament with slug "${dto.slug}" already exists`);
      }
    }

    const tournament = await this.prisma.$transaction(async (tx) => {
      // Upsert phases if provided
      if (dto.phases) {
        await tx.tournamentPhase.deleteMany({
          where: { tournamentId: id },
        });

        await tx.tournamentPhase.createMany({
          data: dto.phases.map((p) => ({
            tournamentId: id,
            phase: p.phase,
            multiplier: p.multiplier,
            sortOrder: p.sortOrder,
          })),
        });
      }

      // Upsert bonus types if provided
      if (dto.bonusTypes) {
        await tx.tournamentBonusType.deleteMany({
          where: { tournamentId: id },
        });

        await tx.tournamentBonusType.createMany({
          data: dto.bonusTypes.map((b) => ({
            tournamentId: id,
            key: b.key,
            label: b.label,
            points: b.points,
            sortOrder: b.sortOrder,
          })),
        });
      }

      return tx.tournament.update({
        where: { id },
        data: {
          ...(dto.name !== undefined ? { name: dto.name } : {}),
          ...(dto.slug !== undefined ? { slug: dto.slug } : {}),
          ...(dto.type !== undefined ? { type: dto.type } : {}),
          ...(dto.description !== undefined ? { description: dto.description } : {}),
          ...(dto.logoUrl !== undefined ? { logoUrl: dto.logoUrl } : {}),
          ...(dto.startDate !== undefined ? { startDate: new Date(dto.startDate) } : {}),
          ...(dto.endDate !== undefined ? { endDate: new Date(dto.endDate) } : {}),
        },
        include: {
          phases: { orderBy: { sortOrder: 'asc' } },
          bonusTypes: { orderBy: { sortOrder: 'asc' } },
        },
      });
    });

    return this.toResponseDto(tournament);
  }

  // ---------------------------------------------------------------------------
  // Soft delete tournament
  // ---------------------------------------------------------------------------

  async delete(id: string): Promise<void> {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id, isActive: true },
    });

    if (!tournament) {
      throw new NotFoundException('Tournament not found');
    }

    await this.prisma.tournament.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // ---------------------------------------------------------------------------
  // Get teams in tournament
  // ---------------------------------------------------------------------------

  async getTeams(tournamentId: string): Promise<TournamentTeamResponseDto[]> {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId, isActive: true },
    });

    if (!tournament) {
      throw new NotFoundException('Tournament not found');
    }

    const tournamentTeams = await this.prisma.tournamentTeam.findMany({
      where: { tournamentId },
      include: { team: true },
      orderBy: [{ groupLetter: 'asc' }, { team: { name: 'asc' } }],
    });

    return tournamentTeams.map((tt) => ({
      id: tt.id,
      teamId: tt.team.id,
      name: tt.team.name,
      shortName: tt.team.shortName,
      flagUrl: tt.team.flagUrl,
      groupLetter: tt.groupLetter,
      isEliminated: tt.isEliminated,
    }));
  }

  // ---------------------------------------------------------------------------
  // Add team to tournament
  // ---------------------------------------------------------------------------

  async addTeam(
    tournamentId: string,
    teamId: string,
    groupLetter?: string,
  ): Promise<TournamentTeamResponseDto> {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId, isActive: true },
    });

    if (!tournament) {
      throw new NotFoundException('Tournament not found');
    }

    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      throw new NotFoundException('Team not found');
    }

    const existing = await this.prisma.tournamentTeam.findUnique({
      where: { tournamentId_teamId: { tournamentId, teamId } },
    });

    if (existing) {
      throw new ConflictException('Team is already in this tournament');
    }

    const tournamentTeam = await this.prisma.tournamentTeam.create({
      data: {
        tournamentId,
        teamId,
        groupLetter: groupLetter ?? null,
      },
      include: { team: true },
    });

    return {
      id: tournamentTeam.id,
      teamId: tournamentTeam.team.id,
      name: tournamentTeam.team.name,
      shortName: tournamentTeam.team.shortName,
      flagUrl: tournamentTeam.team.flagUrl,
      groupLetter: tournamentTeam.groupLetter,
      isEliminated: tournamentTeam.isEliminated,
    };
  }

  // ---------------------------------------------------------------------------
  // Remove team from tournament
  // ---------------------------------------------------------------------------

  async removeTeam(tournamentId: string, teamId: string): Promise<void> {
    const tournamentTeam = await this.prisma.tournamentTeam.findUnique({
      where: { tournamentId_teamId: { tournamentId, teamId } },
    });

    if (!tournamentTeam) {
      throw new NotFoundException('Team is not in this tournament');
    }

    await this.prisma.tournamentTeam.delete({
      where: { id: tournamentTeam.id },
    });
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private toResponseDto(
    tournament: {
      id: string;
      name: string;
      slug: string;
      type: TournamentType;
      description: string | null;
      logoUrl: string | null;
      startDate: Date;
      endDate: Date;
      status: TournamentStatus;
      isActive: boolean;
      createdAt: Date;
      updatedAt: Date;
      phases?: { id: string; phase: MatchPhase; multiplier: number; sortOrder: number }[];
      bonusTypes?: { id: string; key: string; label: string; points: number; sortOrder: number }[];
    },
  ): TournamentResponseDto {
    return {
      id: tournament.id,
      name: tournament.name,
      slug: tournament.slug,
      type: tournament.type,
      description: tournament.description,
      logoUrl: tournament.logoUrl,
      startDate: tournament.startDate,
      endDate: tournament.endDate,
      status: tournament.status,
      isActive: tournament.isActive,
      createdAt: tournament.createdAt,
      updatedAt: tournament.updatedAt,
      phases: tournament.phases?.map((p) => ({
        id: p.id,
        phase: p.phase,
        multiplier: p.multiplier,
        sortOrder: p.sortOrder,
      })),
      bonusTypes: tournament.bonusTypes?.map((b) => ({
        id: b.id,
        key: b.key,
        label: b.label,
        points: b.points,
        sortOrder: b.sortOrder,
      })),
    };
  }
}
