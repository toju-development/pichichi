import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { MatchPhase, MatchStatus } from '@prisma/client';

export class MatchFiltersDto {
  @ApiProperty({
    description: 'Tournament ID (required)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  @IsNotEmpty()
  tournamentId!: string;

  @ApiPropertyOptional({
    description: 'Filter by match phase',
    enum: MatchPhase,
    example: MatchPhase.GROUP_STAGE,
  })
  @IsEnum(MatchPhase)
  @IsOptional()
  phase?: MatchPhase;

  @ApiPropertyOptional({
    description: 'Filter by match status',
    enum: MatchStatus,
    example: MatchStatus.SCHEDULED,
  })
  @IsEnum(MatchStatus)
  @IsOptional()
  status?: MatchStatus;

  @ApiPropertyOptional({
    description: 'Filter by date (ISO 8601 date, e.g. 2026-06-11)',
    example: '2026-06-11',
  })
  @IsDateString()
  @IsOptional()
  date?: string;
}
