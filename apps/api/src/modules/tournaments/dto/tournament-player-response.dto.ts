import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TournamentPlayerResponseDto {
  @ApiProperty({ description: 'TournamentPlayer ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  id!: string;

  @ApiProperty({ description: 'Player ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  playerId!: string;

  @ApiPropertyOptional({ description: 'External ID from API-Football', example: 154 })
  externalId!: number | null;

  @ApiProperty({ description: 'Player name', example: 'Lionel Messi' })
  name!: string;

  @ApiPropertyOptional({ description: 'Player photo URL', example: 'https://example.com/photos/messi.png' })
  photoUrl!: string | null;

  @ApiPropertyOptional({ description: 'Player position', example: 'Attacker' })
  position!: string | null;

  @ApiPropertyOptional({ description: 'Shirt number', example: 10 })
  shirtNumber!: number | null;

  @ApiProperty({ description: 'Team ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  teamId!: string;

  @ApiProperty({ description: 'Team name', example: 'Argentina' })
  teamName!: string;

  @ApiPropertyOptional({ description: 'Team logo URL', example: 'https://example.com/logos/arg.png' })
  teamLogoUrl!: string | null;

  @ApiPropertyOptional({ description: 'Team external ID from API-Football', example: 26 })
  teamExternalId!: number | null;
}
