import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';

export class CreateGroupDto {
  @ApiProperty({
    description: 'Group name',
    example: 'Los Cracks del Mundial',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({
    description: 'Group description',
    example: 'Grupo de amigos para el Mundial 2026',
    maxLength: 500,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({
    description: 'Maximum number of members allowed in the group',
    example: 50,
    minimum: 2,
    maximum: 100,
    default: 50,
  })
  @IsInt()
  @Min(2)
  @Max(100)
  @IsOptional()
  maxMembers?: number;

  @ApiPropertyOptional({
    description: 'Tournament ID to associate with the group on creation',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  @IsOptional()
  tournamentId?: string;
}
