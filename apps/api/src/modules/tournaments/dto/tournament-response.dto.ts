import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { MatchPhase, TournamentStatus, TournamentType } from '@prisma/client';

export class TournamentPhaseResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id!: string;

  @ApiProperty({ enum: ['GROUP_STAGE', 'ROUND_OF_32', 'ROUND_OF_16', 'QUARTER_FINAL', 'SEMI_FINAL', 'THIRD_PLACE', 'FINAL'] })
  phase!: MatchPhase;

  @ApiProperty({ example: 1 })
  multiplier!: number;

  @ApiProperty({ example: 0 })
  sortOrder!: number;
}

export class TournamentBonusTypeResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id!: string;

  @ApiProperty({ example: 'top_scorer' })
  key!: string;

  @ApiProperty({ example: 'Top Scorer' })
  label!: string;

  @ApiProperty({ example: 10 })
  points!: number;

  @ApiProperty({ example: 0 })
  sortOrder!: number;
}

export class TournamentResponseDto {
  @ApiProperty({ description: 'Tournament ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  id!: string;

  @ApiProperty({ description: 'Tournament name', example: 'FIFA World Cup 2026' })
  name!: string;

  @ApiProperty({ description: 'URL-friendly slug', example: 'world-cup-2026' })
  slug!: string;

  @ApiProperty({ description: 'Tournament type', enum: ['WORLD_CUP', 'COPA_AMERICA', 'EURO', 'CHAMPIONS_LEAGUE', 'CUSTOM'] })
  type!: TournamentType;

  @ApiPropertyOptional({ description: 'Description', example: 'The 2026 FIFA World Cup' })
  description?: string | null;

  @ApiPropertyOptional({ description: 'Logo URL', example: 'https://example.com/logo.png' })
  logoUrl?: string | null;

  @ApiProperty({ description: 'Start date' })
  startDate!: Date;

  @ApiProperty({ description: 'End date' })
  endDate!: Date;

  @ApiProperty({ description: 'Tournament status', enum: ['DRAFT', 'UPCOMING', 'IN_PROGRESS', 'FINISHED', 'CANCELLED'] })
  status!: TournamentStatus;

  @ApiProperty({ description: 'Whether the tournament is active', example: true })
  isActive!: boolean;

  @ApiProperty({ description: 'Creation date' })
  createdAt!: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt!: Date;

  @ApiPropertyOptional({ description: 'Tournament phases', type: [TournamentPhaseResponseDto] })
  phases?: TournamentPhaseResponseDto[];

  @ApiPropertyOptional({ description: 'Bonus prediction types', type: [TournamentBonusTypeResponseDto] })
  bonusTypes?: TournamentBonusTypeResponseDto[];

  @ApiPropertyOptional({ description: 'Number of teams in the tournament', example: 32 })
  teamCount?: number;
}
