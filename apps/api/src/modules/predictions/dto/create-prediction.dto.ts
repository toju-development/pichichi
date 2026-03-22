import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsUUID, Min } from 'class-validator';

export class CreatePredictionDto {
  @ApiProperty({
    description: 'Match ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  @IsNotEmpty()
  matchId!: string;

  @ApiProperty({
    description: 'Group ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  @IsNotEmpty()
  groupId!: string;

  @ApiProperty({
    description: 'Predicted home team score',
    example: 2,
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  predictedHome!: number;

  @ApiProperty({
    description: 'Predicted away team score',
    example: 1,
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  predictedAway!: number;
}
