import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { MatchPhase } from '@prisma/client';

export class CreateMatchDto {
  @ApiProperty({
    description: 'Tournament ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  @IsNotEmpty()
  tournamentId!: string;

  @ApiPropertyOptional({
    description: 'Home team ID (null for knockout placeholder matches)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  @IsOptional()
  homeTeamId?: string;

  @ApiPropertyOptional({
    description: 'Away team ID (null for knockout placeholder matches)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  @IsOptional()
  awayTeamId?: string;

  @ApiProperty({
    description: 'Match phase',
    enum: MatchPhase,
    example: MatchPhase.GROUP_STAGE,
  })
  @IsEnum(MatchPhase)
  phase!: MatchPhase;

  @ApiPropertyOptional({
    description: 'Group letter (for group stage matches)',
    example: 'A',
    maxLength: 2,
  })
  @IsString()
  @IsOptional()
  @MaxLength(2)
  groupLetter?: string;

  @ApiPropertyOptional({
    description: 'Match number in the tournament',
    example: 1,
  })
  @IsInt()
  @IsOptional()
  @Min(1)
  matchNumber?: number;

  @ApiProperty({
    description: 'Scheduled date and time (ISO 8601)',
    example: '2026-06-11T18:00:00.000Z',
  })
  @IsDateString()
  scheduledAt!: string;

  @ApiPropertyOptional({
    description: 'Venue name',
    example: 'Estadio Azteca',
    maxLength: 200,
  })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  venue?: string;

  @ApiPropertyOptional({
    description: 'City where the match is played',
    example: 'Mexico City',
    maxLength: 100,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({
    description: 'Placeholder label for home team (knockout stage)',
    example: 'Winner Group A',
    maxLength: 50,
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  homeTeamPlaceholder?: string;

  @ApiPropertyOptional({
    description: 'Placeholder label for away team (knockout stage)',
    example: 'Runner-up Group B',
    maxLength: 50,
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  awayTeamPlaceholder?: string;
}
