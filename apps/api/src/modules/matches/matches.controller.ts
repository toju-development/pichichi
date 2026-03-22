import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
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
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { MatchesService } from './matches.service.js';
import { CreateMatchDto } from './dto/create-match.dto.js';
import { UpdateMatchDto } from './dto/update-match.dto.js';
import { UpdateScoreDto } from './dto/update-score.dto.js';
import { MatchResponseDto } from './dto/match-response.dto.js';
import { MatchFiltersDto } from './dto/match-filters.dto.js';

@ApiTags('Matches')
@Controller('matches')
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @Get()
  @ApiOperation({ summary: 'List matches for a tournament with optional filters' })
  @ApiResponse({ status: 200, description: 'List of matches', type: [MatchResponseDto] })
  async findAll(
    @Query() filters: MatchFiltersDto,
  ): Promise<MatchResponseDto[]> {
    return this.matchesService.findAll(filters);
  }

  @Get('upcoming')
  @ApiOperation({ summary: 'Get upcoming scheduled matches' })
  @ApiQuery({ name: 'tournamentId', required: true, description: 'Tournament ID' })
  @ApiQuery({ name: 'limit', required: false, description: 'Max results (default 5)', type: Number })
  @ApiResponse({ status: 200, description: 'Upcoming matches', type: [MatchResponseDto] })
  async findUpcoming(
    @Query('tournamentId', ParseUUIDPipe) tournamentId: string,
    @Query('limit', new DefaultValuePipe(5), ParseIntPipe) limit: number,
  ): Promise<MatchResponseDto[]> {
    return this.matchesService.findUpcoming(tournamentId, limit);
  }

  @Get('live')
  @ApiOperation({ summary: 'Get live matches' })
  @ApiQuery({ name: 'tournamentId', required: true, description: 'Tournament ID' })
  @ApiResponse({ status: 200, description: 'Live matches', type: [MatchResponseDto] })
  async findLive(
    @Query('tournamentId', ParseUUIDPipe) tournamentId: string,
  ): Promise<MatchResponseDto[]> {
    return this.matchesService.findLive(tournamentId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get match by ID' })
  @ApiParam({ name: 'id', description: 'Match ID (UUID)' })
  @ApiResponse({ status: 200, description: 'Match details', type: MatchResponseDto })
  @ApiResponse({ status: 404, description: 'Match not found' })
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<MatchResponseDto> {
    return this.matchesService.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new match' })
  @ApiResponse({ status: 201, description: 'Match created', type: MatchResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(
    @Body() dto: CreateMatchDto,
  ): Promise<MatchResponseDto> {
    return this.matchesService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a match' })
  @ApiParam({ name: 'id', description: 'Match ID (UUID)' })
  @ApiResponse({ status: 200, description: 'Match updated', type: MatchResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Match not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMatchDto,
  ): Promise<MatchResponseDto> {
    return this.matchesService.update(id, dto);
  }

  @Patch(':id/score')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update match score' })
  @ApiParam({ name: 'id', description: 'Match ID (UUID)' })
  @ApiResponse({ status: 200, description: 'Score updated', type: MatchResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Match not found' })
  async updateScore(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateScoreDto,
  ): Promise<MatchResponseDto> {
    return this.matchesService.updateScore(
      id,
      dto.homeScore,
      dto.awayScore,
      dto.status,
      dto.isExtraTime,
      dto.homeScorePenalties,
      dto.awayScorePenalties,
    );
  }
}
