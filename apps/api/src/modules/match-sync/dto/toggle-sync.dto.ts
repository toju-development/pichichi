import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class ToggleSyncDto {
  @ApiProperty({
    description: 'Whether automatic match sync should be enabled',
    example: true,
  })
  @IsBoolean()
  enabled!: boolean;
}
