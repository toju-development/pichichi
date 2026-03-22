import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LeaderboardEntryDto {
  @ApiProperty({ description: 'Position in the leaderboard (shared for ties)', example: 1 })
  position!: number;

  @ApiProperty({ description: 'User ID' })
  userId!: string;

  @ApiProperty({ description: 'User display name', example: 'Juan Pérez' })
  displayName!: string;

  @ApiProperty({ description: 'Username', example: 'juanpe' })
  username!: string;

  @ApiPropertyOptional({ description: 'User avatar URL' })
  avatarUrl?: string | null;

  @ApiProperty({ description: 'Total points (predictions + bonus)', example: 42 })
  totalPoints!: number;

  @ApiProperty({ description: 'Number of exact score predictions', example: 3 })
  exactCount!: number;

  @ApiProperty({ description: 'Number of goal difference predictions', example: 5 })
  goalDiffCount!: number;

  @ApiProperty({ description: 'Number of winner-only predictions', example: 4 })
  winnerCount!: number;

  @ApiProperty({ description: 'Number of missed predictions', example: 3 })
  missCount!: number;

  @ApiProperty({ description: 'Points from bonus predictions', example: 10 })
  bonusPoints!: number;

  @ApiProperty({ description: 'Current prediction streak', example: 3 })
  streak!: number;
}
