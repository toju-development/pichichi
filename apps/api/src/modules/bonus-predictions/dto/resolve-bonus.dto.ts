import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class ResolveBonusDto {
  @ApiProperty({
    description: 'Whether the bonus prediction is correct',
    example: true,
  })
  @IsBoolean()
  isCorrect!: boolean;
}
