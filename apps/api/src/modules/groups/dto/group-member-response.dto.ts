import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { GroupMemberRole } from '@prisma/client';

export class GroupMemberResponseDto {
  @ApiProperty({ description: 'Membership ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  id!: string;

  @ApiProperty({ description: 'User ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  userId!: string;

  @ApiProperty({ description: 'Display name', example: 'Lionel Messi' })
  displayName!: string;

  @ApiProperty({ description: 'Username', example: 'lionelmessi4821' })
  username!: string;

  @ApiPropertyOptional({ description: 'Avatar URL', example: 'https://lh3.googleusercontent.com/...' })
  avatarUrl?: string | null;

  @ApiProperty({ description: 'Member role in the group', enum: ['ADMIN', 'MEMBER'], example: 'ADMIN' })
  role!: GroupMemberRole;

  @ApiProperty({ description: 'Date the user joined the group' })
  joinedAt!: Date;
}
