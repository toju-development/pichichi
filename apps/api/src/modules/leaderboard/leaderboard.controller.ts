import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
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
import { CurrentUser, type JwtUserPayload } from '../../common/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { LeaderboardService } from './leaderboard.service.js';
import { LeaderboardResponseDto } from './dto/leaderboard-response.dto.js';
import { LeaderboardEntryDto } from './dto/leaderboard-entry.dto.js';
import { GlobalLeaderboardResponseDto } from './dto/global-leaderboard-response.dto.js';

@ApiTags('Leaderboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('leaderboard')
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Get('global')
  @ApiOperation({ summary: 'Get global leaderboard across all groups' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of entries per page (default 20, max 50)',
    example: 20,
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    description: 'Number of entries to skip (default 0)',
    example: 0,
  })
  @ApiResponse({ status: 200, description: 'Global leaderboard', type: GlobalLeaderboardResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getGlobalLeaderboard(
    @CurrentUser() user: JwtUserPayload,
    @Query('limit') rawLimit?: string,
    @Query('offset') rawOffset?: string,
  ): Promise<GlobalLeaderboardResponseDto> {
    const parsedLimit = Number(rawLimit);
    const limit = Math.min(Math.max(Number.isNaN(parsedLimit) ? 20 : parsedLimit, 1), 50);
    const parsedOffset = Number(rawOffset);
    const offset = Math.max(Number.isNaN(parsedOffset) ? 0 : parsedOffset, 0);

    return this.leaderboardService.getGlobalLeaderboard(
      user.sub,
      limit,
      offset,
    );
  }

  @Get('group/:groupId')
  @ApiOperation({ summary: 'Get group leaderboard' })
  @ApiParam({ name: 'groupId', description: 'Group ID (UUID)' })
  @ApiQuery({ name: 'tournamentId', required: false, description: 'Filter by tournament ID' })
  @ApiResponse({ status: 200, description: 'Group leaderboard', type: LeaderboardResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not a member of the group' })
  @ApiResponse({ status: 404, description: 'Group not found' })
  async getGroupLeaderboard(
    @CurrentUser() user: JwtUserPayload,
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Query('tournamentId') tournamentId?: string,
  ): Promise<LeaderboardResponseDto> {
    return this.leaderboardService.getGroupLeaderboard(
      groupId,
      user.sub,
      tournamentId,
    );
  }

  @Get('group/:groupId/phase/:phase')
  @ApiOperation({ summary: 'Get group leaderboard filtered by match phase' })
  @ApiParam({ name: 'groupId', description: 'Group ID (UUID)' })
  @ApiParam({ name: 'phase', description: 'Match phase (e.g. GROUP_STAGE, ROUND_OF_16)' })
  @ApiQuery({ name: 'tournamentId', required: true, description: 'Tournament ID (required for phase filter)' })
  @ApiResponse({ status: 200, description: 'Phase leaderboard', type: LeaderboardResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not a member of the group' })
  @ApiResponse({ status: 404, description: 'Group not found' })
  async getGroupLeaderboardByPhase(
    @CurrentUser() user: JwtUserPayload,
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Param('phase') phase: string,
    @Query('tournamentId', ParseUUIDPipe) tournamentId: string,
  ): Promise<LeaderboardResponseDto> {
    return this.leaderboardService.getGroupLeaderboardByPhase(
      groupId,
      user.sub,
      tournamentId,
      phase,
    );
  }

  @Get('group/:groupId/me')
  @ApiOperation({ summary: 'Get my position in the group leaderboard' })
  @ApiParam({ name: 'groupId', description: 'Group ID (UUID)' })
  @ApiQuery({ name: 'tournamentId', required: false, description: 'Filter by tournament ID' })
  @ApiResponse({ status: 200, description: 'User position and points', type: LeaderboardEntryDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not a member of the group' })
  @ApiResponse({ status: 404, description: 'Group not found' })
  async getMyPosition(
    @CurrentUser() user: JwtUserPayload,
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Query('tournamentId') tournamentId?: string,
  ): Promise<LeaderboardEntryDto> {
    return this.leaderboardService.getUserPosition(
      groupId,
      user.sub,
      tournamentId,
    );
  }
}
