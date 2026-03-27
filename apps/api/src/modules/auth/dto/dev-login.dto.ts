import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';

export class DevLoginDto {
  @ApiProperty({
    description: 'Email address for dev login (bypasses OAuth)',
    example: 'dev@example.com',
  })
  @IsEmail()
  email!: string;

  @ApiPropertyOptional({
    description: 'Display name for the user (defaults to email prefix)',
    example: 'Dev User',
  })
  @IsString()
  @IsOptional()
  displayName?: string;
}
