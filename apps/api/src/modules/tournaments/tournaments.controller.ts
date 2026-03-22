import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { TournamentStatus, TournamentType } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { TournamentsService } from './tournaments.service.js';
import { CreateTournamentDto } from './dto/create-tournament.dto.js';
import { UpdateTournamentDto } from './dto/update-tournament.dto.js';
import { AddTeamDto } from './dto/add-team.dto.js';
import { TournamentResponseDto } from './dto/tournament-response.dto.js';
import { TournamentTeamResponseDto } from './dto/tournament-team-response.dto.js';

@ApiTags('Tournaments')
@Controller('tournaments')
export class TournamentsController {
  constructor(private readonly tournamentsService: TournamentsService) {}

  @Get()
  @ApiOperation({ summary: 'List all tournaments' })
  @ApiQuery({ name: 'status', required: false, enum: ['DRAFT', 'UPCOMING', 'IN_PROGRESS', 'FINISHED', 'CANCELLED'] })
  @ApiQuery({ name: 'type', required: false, enum: ['WORLD_CUP', 'COPA_AMERICA', 'EURO', 'CHAMPIONS_LEAGUE', 'CUSTOM'] })
  @ApiResponse({ status: 200, description: 'List of tournaments', type: [TournamentResponseDto] })
  async findAll(
    @Query('status') status?: TournamentStatus,
    @Query('type') type?: TournamentType,
  ): Promise<TournamentResponseDto[]> {
    return this.tournamentsService.findAll({ status, type });
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get tournament by slug' })
  @ApiParam({ name: 'slug', description: 'Tournament slug' })
  @ApiResponse({ status: 200, description: 'Tournament details', type: TournamentResponseDto })
  @ApiResponse({ status: 404, description: 'Tournament not found' })
  async findBySlug(
    @Param('slug') slug: string,
  ): Promise<TournamentResponseDto> {
    return this.tournamentsService.findBySlug(slug);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new tournament' })
  @ApiResponse({ status: 201, description: 'Tournament created', type: TournamentResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 409, description: 'Slug already taken' })
  async create(
    @Body() dto: CreateTournamentDto,
  ): Promise<TournamentResponseDto> {
    return this.tournamentsService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a tournament' })
  @ApiParam({ name: 'id', description: 'Tournament ID (UUID)' })
  @ApiResponse({ status: 200, description: 'Tournament updated', type: TournamentResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Tournament not found' })
  @ApiResponse({ status: 409, description: 'Slug already taken' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTournamentDto,
  ): Promise<TournamentResponseDto> {
    return this.tournamentsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete a tournament' })
  @ApiParam({ name: 'id', description: 'Tournament ID (UUID)' })
  @ApiResponse({ status: 204, description: 'Tournament deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Tournament not found' })
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.tournamentsService.delete(id);
  }

  @Get(':id/teams')
  @ApiOperation({ summary: 'List teams in a tournament' })
  @ApiParam({ name: 'id', description: 'Tournament ID (UUID)' })
  @ApiResponse({ status: 200, description: 'List of teams', type: [TournamentTeamResponseDto] })
  @ApiResponse({ status: 404, description: 'Tournament not found' })
  async getTeams(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<TournamentTeamResponseDto[]> {
    return this.tournamentsService.getTeams(id);
  }

  @Post(':id/teams')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a team to a tournament' })
  @ApiParam({ name: 'id', description: 'Tournament ID (UUID)' })
  @ApiResponse({ status: 201, description: 'Team added', type: TournamentTeamResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Tournament or team not found' })
  @ApiResponse({ status: 409, description: 'Team already in tournament' })
  async addTeam(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddTeamDto,
  ): Promise<TournamentTeamResponseDto> {
    return this.tournamentsService.addTeam(id, dto.teamId, dto.groupLetter);
  }

  @Delete(':id/teams/:teamId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a team from a tournament' })
  @ApiParam({ name: 'id', description: 'Tournament ID (UUID)' })
  @ApiParam({ name: 'teamId', description: 'Team ID (UUID)' })
  @ApiResponse({ status: 204, description: 'Team removed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Team not in this tournament' })
  async removeTeam(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('teamId', ParseUUIDPipe) teamId: string,
  ): Promise<void> {
    return this.tournamentsService.removeTeam(id, teamId);
  }
}
