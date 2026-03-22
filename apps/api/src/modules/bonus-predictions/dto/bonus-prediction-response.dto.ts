import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BonusTypeDto {
  @ApiProperty({ description: 'Bonus type ID' })
  id!: string;

  @ApiProperty({ description: 'Bonus type key', example: 'champion' })
  key!: string;

  @ApiProperty({ description: 'Bonus type label', example: 'Champion' })
  label!: string;

  @ApiProperty({ description: 'Points awarded if correct', example: 10 })
  points!: number;

  @ApiProperty({ description: 'Display order', example: 1 })
  sortOrder!: number;
}

export class BonusPredictionResponseDto {
  @ApiProperty({ description: 'Bonus prediction ID' })
  id!: string;

  @ApiProperty({ description: 'User ID' })
  userId!: string;

  @ApiProperty({ description: 'Group ID' })
  groupId!: string;

  @ApiProperty({ description: 'Bonus type ID' })
  bonusTypeId!: string;

  @ApiProperty({ description: 'Predicted value', example: 'Argentina' })
  predictedValue!: string;

  @ApiPropertyOptional({ description: 'Whether the prediction is correct' })
  isCorrect?: boolean | null;

  @ApiProperty({ description: 'Points earned', example: 10 })
  pointsEarned!: number;

  @ApiPropertyOptional({ description: 'When the prediction was locked' })
  lockedAt?: Date | null;

  @ApiPropertyOptional({ description: 'Bonus type info', type: BonusTypeDto })
  bonusType?: BonusTypeDto;

  @ApiProperty({ description: 'Creation date' })
  createdAt!: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt!: Date;
}

export class UserBonusPredictionDto {
  @ApiProperty({ description: 'Bonus prediction ID' })
  id!: string;

  @ApiProperty({ description: 'User ID' })
  userId!: string;

  @ApiProperty({ description: 'User display name' })
  displayName!: string;

  @ApiPropertyOptional({ description: 'User avatar URL' })
  avatarUrl?: string | null;

  @ApiProperty({ description: 'Bonus type ID' })
  bonusTypeId!: string;

  @ApiProperty({ description: 'Predicted value', example: 'Argentina' })
  predictedValue!: string;

  @ApiPropertyOptional({ description: 'Whether the prediction is correct' })
  isCorrect?: boolean | null;

  @ApiProperty({ description: 'Points earned', example: 10 })
  pointsEarned!: number;
}

export class GroupBonusPredictionsResponseDto {
  @ApiProperty({ description: 'Group ID' })
  groupId!: string;

  @ApiProperty({ description: 'Tournament ID' })
  tournamentId!: string;

  @ApiProperty({
    description: 'Whether all predictions are visible (tournament started)',
    example: true,
  })
  revealed!: boolean;

  @ApiProperty({
    description: 'All users\' bonus predictions (only own if not revealed)',
    type: [UserBonusPredictionDto],
  })
  predictions!: UserBonusPredictionDto[];
}
