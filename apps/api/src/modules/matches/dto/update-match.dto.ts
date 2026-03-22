import { ApiPropertyOptional } from '@nestjs/swagger';
import { PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  Min,
} from 'class-validator';
import { MatchStatus } from '@prisma/client';
import { CreateMatchDto } from './create-match.dto.js';

export class UpdateMatchDto extends PartialType(CreateMatchDto) {
  @ApiPropertyOptional({
    description: 'Home team score',
    example: 2,
  })
  @IsInt()
  @IsOptional()
  @Min(0)
  homeScore?: number;

  @ApiPropertyOptional({
    description: 'Away team score',
    example: 1,
  })
  @IsInt()
  @IsOptional()
  @Min(0)
  awayScore?: number;

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

  @ApiPropertyOptional({
    description: 'Whether the match went to extra time',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  isExtraTime?: boolean;

  @ApiPropertyOptional({
    description: 'Match status',
    enum: MatchStatus,
    example: MatchStatus.FINISHED,
  })
  @IsEnum(MatchStatus)
  @IsOptional()
  status?: MatchStatus;
}
