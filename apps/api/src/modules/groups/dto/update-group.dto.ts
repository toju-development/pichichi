import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

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

  @ApiPropertyOptional({
    description: 'Maximum number of members allowed (2–500, capped by plan limit)',
    example: 20,
    minimum: 2,
    maximum: 500,
  })
  @IsInt()
  @IsOptional()
  @Min(2)
  @Max(500)
  maxMembers?: number;
}
