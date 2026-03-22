import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({ description: 'Display name', example: 'Leo Messi' })
  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(100)
  displayName?: string;

  @ApiPropertyOptional({ description: 'Avatar URL', example: 'https://example.com/avatar.jpg' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  avatarUrl?: string;
}
