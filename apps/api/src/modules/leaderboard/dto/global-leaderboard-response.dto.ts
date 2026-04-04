import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LeaderboardEntryDto } from './leaderboard-entry.dto.js';

export class GlobalLeaderboardResponseDto {
  @ApiProperty({
    description: 'Leaderboard entries for the current page',
    type: [LeaderboardEntryDto],
  })
  entries!: LeaderboardEntryDto[];

  @ApiProperty({
    description: 'Total users with points in the global ranking',
    example: 342,
  })
  total!: number;

  @ApiPropertyOptional({
    description: 'Current authenticated user position (null if user has 0 points)',
    type: LeaderboardEntryDto,
    nullable: true,
  })
  currentUserEntry!: LeaderboardEntryDto | null;
}
