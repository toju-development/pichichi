import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser, type JwtUserPayload } from '../../common/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { PredictionsService } from './predictions.service.js';
import { ScoringService, type CalculatePointsResult } from '../scoring/scoring.service.js';
import { CreatePredictionDto } from './dto/create-prediction.dto.js';
import { PredictionResponseDto } from './dto/prediction-response.dto.js';
import { GroupPredictionsResponseDto } from './dto/group-predictions-response.dto.js';
import { PredictionStatsResponseDto } from './dto/prediction-stats-response.dto.js';

@ApiTags('Predictions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('predictions')
export class PredictionsController {
  constructor(
    private readonly predictionsService: PredictionsService,
    private readonly scoringService: ScoringService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create or update a prediction (auto-save / upsert)' })
  @ApiResponse({ status: 200, description: 'Prediction saved', type: PredictionResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not a member of the group' })
  @ApiResponse({ status: 404, description: 'Match not found' })
  @ApiResponse({ status: 409, description: 'Predictions are locked' })
  async upsert(
    @CurrentUser() user: JwtUserPayload,
    @Body() dto: CreatePredictionDto,
  ): Promise<PredictionResponseDto> {
    return this.predictionsService.upsert(user.sub, dto);
  }

  @Get('group/:groupId')
  @ApiOperation({ summary: 'Get all my predictions in a group' })
  @ApiParam({ name: 'groupId', description: 'Group ID (UUID)' })
  @ApiResponse({ status: 200, description: 'List of predictions', type: [PredictionResponseDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not a member of the group' })
  async findByGroupAndUser(
    @CurrentUser() user: JwtUserPayload,
    @Param('groupId', ParseUUIDPipe) groupId: string,
  ): Promise<PredictionResponseDto[]> {
    return this.predictionsService.findByGroupAndUser(groupId, user.sub);
  }

  @Get('group/:groupId/match/:matchId')
  @ApiOperation({ summary: 'Get predictions for a match in a group (respects visibility rules)' })
  @ApiParam({ name: 'groupId', description: 'Group ID (UUID)' })
  @ApiParam({ name: 'matchId', description: 'Match ID (UUID)' })
  @ApiResponse({ status: 200, description: 'Group predictions for match', type: GroupPredictionsResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not a member of the group' })
  @ApiResponse({ status: 404, description: 'Match not found' })
  async findByMatchAndGroup(
    @CurrentUser() user: JwtUserPayload,
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Param('matchId', ParseUUIDPipe) matchId: string,
  ): Promise<GroupPredictionsResponseDto> {
    return this.predictionsService.findByMatchAndGroup(matchId, groupId, user.sub);
  }

  @Get('group/:groupId/stats')
  @ApiOperation({ summary: 'Get my prediction stats in a group' })
  @ApiParam({ name: 'groupId', description: 'Group ID (UUID)' })
  @ApiResponse({ status: 200, description: 'Prediction stats', type: PredictionStatsResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not a member of the group' })
  async getStats(
    @CurrentUser() user: JwtUserPayload,
    @Param('groupId', ParseUUIDPipe) groupId: string,
  ): Promise<PredictionStatsResponseDto> {
    return this.predictionsService.getStats(user.sub, groupId);
  }

  @Post('calculate/:matchId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Trigger point calculation for a match (admin-only intent)' })
  @ApiParam({ name: 'matchId', description: 'Match ID (UUID)' })
  @ApiResponse({ status: 200, description: 'Points calculated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Match not found' })
  @ApiResponse({ status: 409, description: 'Match does not have a final score' })
  async calculatePoints(
    @Param('matchId', ParseUUIDPipe) matchId: string,
  ): Promise<CalculatePointsResult> {
    return this.scoringService.calculatePointsForMatch(matchId);
  }
}
