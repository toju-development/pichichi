import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RegisterDeviceDto {
  @ApiProperty({
    description: 'Firebase Cloud Messaging token for push notifications',
    example: 'dGVzdC1mY20tdG9rZW4...',
  })
  @IsString()
  @IsNotEmpty()
  fcmToken!: string;
}
