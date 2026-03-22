import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({ description: 'User unique ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  id!: string;

  @ApiProperty({ description: 'User email address', example: 'messi@example.com' })
  email!: string;

  @ApiProperty({ description: 'Display name', example: 'Lionel Messi' })
  displayName!: string;

  @ApiProperty({ description: 'Unique username', example: 'lionelmessi4821' })
  username!: string;

  @ApiPropertyOptional({ description: 'Avatar URL', example: 'https://lh3.googleusercontent.com/...' })
  avatarUrl?: string | null;

  @ApiProperty({ description: 'Account creation date' })
  createdAt!: Date;
}
