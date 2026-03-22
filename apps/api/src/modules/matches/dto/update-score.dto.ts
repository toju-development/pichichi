import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  Min,
} from 'class-validator';
import { MatchStatus } from '@prisma/client';

export class UpdateScoreDto {
  @ApiProperty({ description: 'Home team score', example: 2 })
  @IsInt()
  @IsNotEmpty()
  @Min(0)
  homeScore!: number;

  @ApiProperty({ description: 'Away team score', example: 1 })
  @IsInt()
  @IsNotEmpty()
  @Min(0)
  awayScore!: number;

  @ApiProperty({
    description: 'Match status after score update',
    enum: MatchStatus,
    example: MatchStatus.FINISHED,
  })
  @IsEnum(MatchStatus)
  status!: MatchStatus;

  @ApiPropertyOptional({
    description: 'Whether the match went to extra time',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  isExtraTime?: boolean;

  @ApiPropertyOptional({
    description: 'Home team penalty score',
    example: 4,
  })
  @IsInt()
  @IsOptional()
  @Min(0)
  homeScorePenalties?: number;

  @ApiPropertyOptional({
    description: 'Away team penalty score',
    example: 3,
  })
  @IsInt()
  @IsOptional()
  @Min(0)
  awayScorePenalties?: number;
}
