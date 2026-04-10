import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TournamentTeamResponseDto {
  @ApiProperty({ description: 'TournamentTeam join ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  id!: string;

  @ApiProperty({ description: 'Team ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  teamId!: string;

  @ApiProperty({ description: 'Team name', example: 'Argentina' })
  name!: string;

  @ApiProperty({ description: 'Team short name', example: 'ARG' })
  shortName!: string;

  @ApiPropertyOptional({ description: 'Team logo URL', example: 'https://example.com/logos/arg.png' })
  logoUrl?: string | null;

  @ApiPropertyOptional({ description: 'Group name', example: 'Group A' })
  groupName?: string | null;

  @ApiProperty({ description: 'Whether the team is eliminated', example: false })
  isEliminated!: boolean;

  @ApiPropertyOptional({ description: 'External ID from API-Football', example: 26 })
  externalId!: number | null;
}
