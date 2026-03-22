import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateBonusPredictionDto {
  @ApiProperty({
    description: 'Group ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  @IsNotEmpty()
  groupId!: string;

  @ApiProperty({
    description: 'Tournament Bonus Type ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  @IsNotEmpty()
  bonusTypeId!: string;

  @ApiProperty({
    description: 'Predicted value (e.g. team name, player name)',
    example: 'Argentina',
    maxLength: 200,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  predictedValue!: string;
}
