import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AppleAuthDto {
  @ApiProperty({
    description: 'Identity token (JWT) received from Apple Sign-In',
    example: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  @IsNotEmpty()
  token!: string;

  @ApiPropertyOptional({
    description: 'First name (only sent by Apple on first login)',
    example: 'Lionel',
  })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional({
    description: 'Last name (only sent by Apple on first login)',
    example: 'Messi',
  })
  @IsString()
  @IsOptional()
  lastName?: string;
}
