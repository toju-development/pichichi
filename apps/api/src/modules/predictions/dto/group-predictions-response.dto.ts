import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { PredictionPointType } from '@prisma/client';

export class UserPredictionDto {
  @ApiProperty({ description: 'Prediction ID' })
  id!: string;

  @ApiProperty({ description: 'User ID' })
  userId!: string;

  @ApiProperty({ description: 'User display name' })
  displayName!: string;

  @ApiPropertyOptional({ description: 'User avatar URL' })
  avatarUrl?: string | null;

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
}

export class GroupPredictionsResponseDto {
  @ApiProperty({ description: 'Match ID' })
  matchId!: string;

  @ApiProperty({ description: 'Group ID' })
  groupId!: string;

  @ApiProperty({
    description: 'Match status',
    enum: ['SCHEDULED', 'LIVE', 'FINISHED', 'POSTPONED', 'CANCELLED'],
  })
  matchStatus!: string;

  @ApiProperty({
    description: 'Whether all predictions are visible (match started)',
    example: true,
  })
  revealed!: boolean;

  @ApiProperty({
    description: 'Predictions (only own if not revealed)',
    type: [UserPredictionDto],
  })
  predictions!: UserPredictionDto[];
}
