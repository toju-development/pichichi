import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateGroupDto {
  @ApiPropertyOptional({
    description: 'Group name',
    example: 'Los Cracks del Mundial',
    maxLength: 100,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    description: 'Group description',
    example: 'Grupo de amigos para el Mundial 2026',
    maxLength: 500,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;
}
