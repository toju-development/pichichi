import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { Transform } from 'class-transformer';
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
    description:
      'Filter by match status. Supports a single value or comma-separated list (e.g. "LIVE,SCHEDULED").',
    example: 'SCHEDULED',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value == null) return undefined;
    const raw = Array.isArray(value) ? value : String(value).split(',');
    return raw.map((v: string) => v.trim()).filter(Boolean);
  })
  @IsArray()
  @IsEnum(MatchStatus, { each: true })
  status?: MatchStatus[];

  @ApiPropertyOptional({
    description: 'Filter by group letter (e.g. A, B, C)',
    example: 'A',
  })
  @IsString()
  @IsOptional()
  groupLetter?: string;

  @ApiPropertyOptional({
    description: 'Filter by date (ISO 8601 date, e.g. 2026-06-11)',
    example: '2026-06-11',
  })
  @IsDateString()
  @IsOptional()
  date?: string;
}
