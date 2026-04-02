import { ApiProperty } from '@nestjs/swagger';

export class SyncResultDto {
  @ApiProperty({
    description: 'Number of matches that were actually synced or updated',
    example: 12,
  })
  syncedMatches!: number;

  @ApiProperty({
    description: 'Errors encountered during the sync process',
    example: ['Failed to fetch fixture 12345: timeout'],
    type: [String],
  })
  errors!: string[];

  @ApiProperty({
    description: 'Human-readable summary of the sync operation',
    example: 'Synced 12 matches with 0 errors',
  })
  message!: string;

  @ApiProperty({
    description: 'Current state of the sync toggle after the operation',
    example: true,
  })
  syncEnabled!: boolean;
}
