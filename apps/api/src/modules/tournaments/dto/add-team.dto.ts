import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class AddTeamDto {
  @ApiProperty({
    description: 'Team ID to add to the tournament',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  @IsNotEmpty()
  teamId!: string;

  @ApiPropertyOptional({
    description: 'Group name assignment (e.g. Group A, Group B)',
    example: 'Group A',
    maxLength: 50,
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  groupName?: string;
}
