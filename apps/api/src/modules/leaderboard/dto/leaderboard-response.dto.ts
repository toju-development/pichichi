import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LeaderboardEntryDto } from './leaderboard-entry.dto.js';

export class LeaderboardResponseDto {
  @ApiProperty({ description: 'Group ID' })
  groupId!: string;

  @ApiProperty({ description: 'Group name', example: 'Los Pibes' })
  groupName!: string;

  @ApiPropertyOptional({ description: 'Tournament ID (if filtered)' })
  tournamentId?: string | null;

  @ApiProperty({ description: 'Leaderboard entries', type: [LeaderboardEntryDto] })
  entries!: LeaderboardEntryDto[];

  @ApiProperty({ description: 'Total active members in the group', example: 12 })
  totalMembers!: number;
}
