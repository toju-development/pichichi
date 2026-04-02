import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class ResolveBonusByKeyDto {
  @ApiProperty({
    description: 'Tournament ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  @IsNotEmpty()
  tournamentId!: string;

  @ApiProperty({
    description: "Bonus type key (e.g. 'CHAMPION', 'TOP_SCORER', 'MVP', 'REVELATION')",
    example: 'CHAMPION',
  })
  @IsString()
  @IsNotEmpty()
  key!: string;

  @ApiProperty({
    description: 'The correct answer value (e.g. team or player name)',
    example: 'Argentina',
  })
  @IsString()
  @IsNotEmpty()
  correctValue!: string;
}
