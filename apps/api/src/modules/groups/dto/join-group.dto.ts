import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class JoinGroupDto {
  @ApiProperty({
    description: 'Invite code to join the group (8 uppercase alphanumeric characters)',
    example: 'AB3D5FG7',
    minLength: 8,
    maxLength: 8,
  })
  @IsString()
  @IsNotEmpty()
  @Length(8, 8)
  inviteCode!: string;
}
