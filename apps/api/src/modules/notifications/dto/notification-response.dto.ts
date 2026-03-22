import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { NotificationType } from '@prisma/client';

export class NotificationResponseDto {
  @ApiProperty({ description: 'Notification ID' })
  id!: string;

  @ApiProperty({
    description: 'Notification type',
    enum: [
      'MATCH_REMINDER',
      'MATCH_RESULT',
      'PREDICTION_DEADLINE',
      'GROUP_INVITE',
      'LEADERBOARD_CHANGE',
      'BONUS_REMINDER',
    ],
  })
  type!: NotificationType;

  @ApiProperty({ description: 'Notification title', example: 'Match starting soon!' })
  title!: string;

  @ApiProperty({ description: 'Notification body', example: 'Argentina vs Brazil starts in 30 minutes' })
  body!: string;

  @ApiPropertyOptional({ description: 'Additional data (JSON)', example: { matchId: '550e8400-e29b-41d4-a716-446655440000' } })
  data?: Record<string, unknown> | null;

  @ApiProperty({ description: 'Whether the notification has been read', example: false })
  isRead!: boolean;

  @ApiProperty({ description: 'Creation date' })
  createdAt!: Date;
}
