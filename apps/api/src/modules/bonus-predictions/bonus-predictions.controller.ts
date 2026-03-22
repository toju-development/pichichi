import {
  Body,
  Controller,
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
import { CurrentUser, type JwtUserPayload } from '../../common/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { BonusPredictionsService, type ResolveResult } from './bonus-predictions.service.js';
import { CreateBonusPredictionDto } from './dto/create-bonus-prediction.dto.js';
import { BonusPredictionResponseDto, GroupBonusPredictionsResponseDto } from './dto/bonus-prediction-response.dto.js';
import { ResolveBonusDto } from './dto/resolve-bonus.dto.js';

@ApiTags('Bonus Predictions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('bonus-predictions')
export class BonusPredictionsController {
  constructor(private readonly bonusPredictionsService: BonusPredictionsService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create or update a bonus prediction (upsert)' })
  @ApiResponse({ status: 200, description: 'Bonus prediction saved', type: BonusPredictionResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not a member of the group' })
  @ApiResponse({ status: 404, description: 'Bonus type not found' })
  @ApiResponse({ status: 409, description: 'Bonus predictions are locked' })
  async upsert(
    @CurrentUser() user: JwtUserPayload,
    @Body() dto: CreateBonusPredictionDto,
  ): Promise<BonusPredictionResponseDto> {
    return this.bonusPredictionsService.upsert(user.sub, dto);
  }

  @Get('group/:groupId')
  @ApiOperation({ summary: 'Get my bonus predictions in a group for a tournament' })
  @ApiParam({ name: 'groupId', description: 'Group ID (UUID)' })
  @ApiQuery({ name: 'tournamentId', description: 'Tournament ID (UUID)', required: true })
  @ApiResponse({ status: 200, description: 'List of bonus predictions', type: [BonusPredictionResponseDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not a member of the group' })
  async findByGroup(
    @CurrentUser() user: JwtUserPayload,
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Query('tournamentId', ParseUUIDPipe) tournamentId: string,
  ): Promise<BonusPredictionResponseDto[]> {
    return this.bonusPredictionsService.findByGroup(groupId, user.sub, tournamentId);
  }

  @Get('group/:groupId/all')
  @ApiOperation({ summary: 'Get all users\' bonus predictions in a group (revealed after tournament starts)' })
  @ApiParam({ name: 'groupId', description: 'Group ID (UUID)' })
  @ApiQuery({ name: 'tournamentId', description: 'Tournament ID (UUID)', required: true })
  @ApiResponse({ status: 200, description: 'Group bonus predictions', type: GroupBonusPredictionsResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not a member of the group' })
  async findAllByGroup(
    @CurrentUser() user: JwtUserPayload,
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Query('tournamentId', ParseUUIDPipe) tournamentId: string,
  ): Promise<GroupBonusPredictionsResponseDto> {
    return this.bonusPredictionsService.findAllByGroup(groupId, user.sub, tournamentId);
  }

  @Patch(':id/resolve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resolve a bonus prediction as correct or incorrect (admin)' })
  @ApiParam({ name: 'id', description: 'Bonus Prediction ID (UUID)' })
  @ApiResponse({ status: 200, description: 'Bonus prediction resolved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Bonus prediction not found' })
  async resolve(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ResolveBonusDto,
  ): Promise<ResolveResult> {
    return this.bonusPredictionsService.resolve(id, dto.isCorrect);
  }
}
