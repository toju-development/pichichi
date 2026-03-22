import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { PredictionPointType } from '@prisma/client';

export class PredictionMatchDto {
  @ApiProperty({ description: 'Match ID' })
  id!: string;

  @ApiProperty({ description: 'Scheduled date and time' })
  scheduledAt!: Date;

  @ApiProperty({ description: 'Match status', enum: ['SCHEDULED', 'LIVE', 'FINISHED', 'POSTPONED', 'CANCELLED'] })
  status!: string;

  @ApiPropertyOptional({ description: 'Home team name' })
  homeTeamName?: string | null;

  @ApiPropertyOptional({ description: 'Away team name' })
  awayTeamName?: string | null;

  @ApiPropertyOptional({ description: 'Home team short name' })
  homeTeamShortName?: string | null;

  @ApiPropertyOptional({ description: 'Away team short name' })
  awayTeamShortName?: string | null;

  @ApiPropertyOptional({ description: 'Home team flag URL' })
  homeTeamFlagUrl?: string | null;

  @ApiPropertyOptional({ description: 'Away team flag URL' })
  awayTeamFlagUrl?: string | null;

  @ApiPropertyOptional({ description: 'Actual home score' })
  homeScore?: number | null;

  @ApiPropertyOptional({ description: 'Actual away score' })
  awayScore?: number | null;

  @ApiProperty({ description: 'Match phase' })
  phase!: string;
}

export class PredictionResponseDto {
  @ApiProperty({ description: 'Prediction ID' })
  id!: string;

  @ApiProperty({ description: 'User ID' })
  userId!: string;

  @ApiProperty({ description: 'Match ID' })
  matchId!: string;

  @ApiProperty({ description: 'Group ID' })
  groupId!: string;

  @ApiProperty({ description: 'Predicted home score', example: 2 })
  predictedHome!: number;

  @ApiProperty({ description: 'Predicted away score', example: 1 })
  predictedAway!: number;

  @ApiProperty({ description: 'Points earned', example: 5 })
  pointsEarned!: number;

  @ApiPropertyOptional({
    description: 'Point type',
    enum: ['EXACT', 'GOAL_DIFF', 'WINNER', 'MISS'],
  })
  pointType?: PredictionPointType | null;

  @ApiPropertyOptional({ description: 'Match info', type: PredictionMatchDto })
  match?: PredictionMatchDto;

  @ApiProperty({ description: 'Creation date' })
  createdAt!: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt!: Date;
}
