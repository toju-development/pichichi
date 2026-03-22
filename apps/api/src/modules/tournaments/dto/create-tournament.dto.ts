import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { MatchPhase, TournamentType } from '@prisma/client';

export class CreateTournamentPhaseDto {
  @ApiProperty({
    description: 'Match phase',
    enum: MatchPhase,
    example: MatchPhase.GROUP_STAGE,
  })
  @IsEnum(MatchPhase)
  phase!: MatchPhase;

  @ApiProperty({ description: 'Points multiplier for this phase', example: 1 })
  @IsInt()
  @Min(1)
  multiplier!: number;

  @ApiProperty({ description: 'Display sort order', example: 0 })
  @IsInt()
  @Min(0)
  sortOrder!: number;
}

export class CreateTournamentBonusTypeDto {
  @ApiProperty({ description: 'Unique key identifier', example: 'top_scorer' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  key!: string;

  @ApiProperty({ description: 'Display label', example: 'Top Scorer' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  label!: string;

  @ApiProperty({ description: 'Points awarded', example: 10 })
  @IsInt()
  @Min(0)
  points!: number;

  @ApiProperty({ description: 'Display sort order', example: 0 })
  @IsInt()
  @Min(0)
  sortOrder!: number;
}

export class CreateTournamentDto {
  @ApiProperty({
    description: 'Tournament name',
    example: 'FIFA World Cup 2026',
    maxLength: 200,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;

  @ApiProperty({
    description: 'URL-friendly slug',
    example: 'world-cup-2026',
    maxLength: 200,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  slug!: string;

  @ApiProperty({
    description: 'Tournament type',
    enum: TournamentType,
    example: TournamentType.WORLD_CUP,
  })
  @IsEnum(TournamentType)
  type!: TournamentType;

  @ApiPropertyOptional({
    description: 'Tournament description',
    example: 'The 2026 FIFA World Cup',
    maxLength: 500,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({
    description: 'Logo URL',
    example: 'https://example.com/logo.png',
    maxLength: 500,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  logoUrl?: string;

  @ApiProperty({
    description: 'Tournament start date (ISO 8601)',
    example: '2026-06-11T00:00:00.000Z',
  })
  @IsDateString()
  startDate!: string;

  @ApiProperty({
    description: 'Tournament end date (ISO 8601)',
    example: '2026-07-19T00:00:00.000Z',
  })
  @IsDateString()
  endDate!: string;

  @ApiProperty({
    description: 'Tournament phases with multipliers',
    type: [CreateTournamentPhaseDto],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateTournamentPhaseDto)
  phases!: CreateTournamentPhaseDto[];

  @ApiPropertyOptional({
    description: 'Bonus prediction types',
    type: [CreateTournamentBonusTypeDto],
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateTournamentBonusTypeDto)
  bonusTypes?: CreateTournamentBonusTypeDto[];
}
