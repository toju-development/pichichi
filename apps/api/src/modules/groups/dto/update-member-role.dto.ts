import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { GroupMemberRole } from '@prisma/client';

export class UpdateMemberRoleDto {
  @ApiProperty({
    description: 'New role for the member',
    enum: GroupMemberRole,
    example: GroupMemberRole.ADMIN,
  })
  @IsEnum(GroupMemberRole)
  role!: GroupMemberRole;
}
