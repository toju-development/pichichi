import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { MatchPhase, MatchStatus } from '@prisma/client';

export class MatchTeamResponseDto {
  @ApiProperty({ description: 'Team ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  id!: string;

  @ApiProperty({ description: 'Team name', example: 'Argentina' })
  name!: string;

  @ApiProperty({ description: 'Team short name', example: 'ARG' })
  shortName!: string;

  @ApiPropertyOptional({ description: 'Team logo URL', example: 'https://media.api-sports.io/teams/26.png' })
  logoUrl?: string | null;
}

export class MatchResponseDto {
  @ApiProperty({ description: 'Match ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  id!: string;

  @ApiProperty({ description: 'Tournament ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  tournamentId!: string;

  @ApiPropertyOptional({ description: 'Home team info', type: MatchTeamResponseDto })
  homeTeam?: MatchTeamResponseDto | null;

  @ApiPropertyOptional({ description: 'Away team info', type: MatchTeamResponseDto })
  awayTeam?: MatchTeamResponseDto | null;

  @ApiProperty({ description: 'Match phase', enum: ['GROUP_STAGE', 'ROUND_OF_32', 'ROUND_OF_16', 'QUARTER_FINAL', 'SEMI_FINAL', 'THIRD_PLACE', 'FINAL'] })
  phase!: MatchPhase;

  @ApiPropertyOptional({ description: 'Group name', example: 'Group A' })
  groupName?: string | null;

  @ApiPropertyOptional({ description: 'Match number', example: 1 })
  matchNumber?: number | null;

  @ApiProperty({ description: 'Scheduled date and time' })
  scheduledAt!: Date;

  @ApiPropertyOptional({ description: 'Venue name', example: 'Estadio Azteca' })
  venue?: string | null;

  @ApiPropertyOptional({ description: 'City', example: 'Mexico City' })
  city?: string | null;

  @ApiProperty({ description: 'Match status', enum: ['SCHEDULED', 'LIVE', 'FINISHED', 'POSTPONED', 'CANCELLED'] })
  status!: MatchStatus;

  @ApiPropertyOptional({ description: 'Home team score', example: 2 })
  homeScore?: number | null;

  @ApiPropertyOptional({ description: 'Away team score', example: 1 })
  awayScore?: number | null;

  @ApiPropertyOptional({ description: 'Home team penalty score', example: 4 })
  homeScorePenalties?: number | null;

  @ApiPropertyOptional({ description: 'Away team penalty score', example: 3 })
  awayScorePenalties?: number | null;

  @ApiProperty({ description: 'Whether the match went to extra time', example: false })
  isExtraTime!: boolean;

  @ApiPropertyOptional({ description: 'Home team placeholder label', example: 'Winner Group A' })
  homeTeamPlaceholder?: string | null;

  @ApiPropertyOptional({ description: 'Away team placeholder label', example: 'Runner-up Group B' })
  awayTeamPlaceholder?: string | null;

  @ApiPropertyOptional({ description: 'API-Football fixture ID', example: 1208614 })
  externalId?: number | null;

  @ApiProperty({ description: 'Creation date' })
  createdAt!: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt!: Date;
}
