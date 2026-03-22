import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from '../../users/dto/user-response.dto.js';

export class AuthResponseDto {
  @ApiProperty({
    description: 'JWT access token (expires in 15 minutes)',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken!: string;

  @ApiProperty({
    description: 'JWT refresh token (expires in 30 days)',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refreshToken!: string;

  @ApiProperty({ description: 'Authenticated user data', type: UserResponseDto })
  user!: UserResponseDto;
}
