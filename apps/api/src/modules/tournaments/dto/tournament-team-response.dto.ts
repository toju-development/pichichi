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

  @ApiPropertyOptional({ description: 'Team flag URL', example: 'https://example.com/flags/arg.png' })
  flagUrl?: string | null;

  @ApiPropertyOptional({ description: 'Group letter', example: 'A' })
  groupLetter?: string | null;

  @ApiProperty({ description: 'Whether the team is eliminated', example: false })
  isEliminated!: boolean;
}
