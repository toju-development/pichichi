import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { GroupMemberRole } from '@prisma/client';

export class GroupResponseDto {
  @ApiProperty({ description: 'Group unique ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  id!: string;

  @ApiProperty({ description: 'Group name', example: 'Los Cracks del Mundial' })
  name!: string;

  @ApiPropertyOptional({ description: 'Group description', example: 'Grupo de amigos para el Mundial 2026' })
  description?: string | null;

  @ApiProperty({ description: '8-character invite code', example: 'AB3D5FG7' })
  inviteCode!: string;

  @ApiProperty({ description: 'ID of the user who created the group', example: '550e8400-e29b-41d4-a716-446655440000' })
  createdBy!: string;

  @ApiProperty({ description: 'Max number of members allowed', example: 50 })
  maxMembers!: number;

  @ApiProperty({ description: 'Number of active members', example: 12 })
  memberCount!: number;

  @ApiProperty({ description: 'Current user role in the group', enum: ['ADMIN', 'MEMBER'], example: 'ADMIN' })
  userRole!: GroupMemberRole;

  @ApiProperty({ description: 'Current user total points in this group', example: 42 })
  userPoints!: number;

  @ApiProperty({ description: 'Group creation date' })
  createdAt!: Date;
}
