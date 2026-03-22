import { ApiProperty } from '@nestjs/swagger';

export class PredictionStatsResponseDto {
  @ApiProperty({ description: 'Total points earned', example: 42 })
  totalPoints!: number;

  @ApiProperty({ description: 'Total predictions made', example: 15 })
  totalPredictions!: number;

  @ApiProperty({ description: 'Exact score predictions', example: 3 })
  exactCount!: number;

  @ApiProperty({ description: 'Goal difference predictions', example: 5 })
  goalDiffCount!: number;

  @ApiProperty({ description: 'Winner only predictions', example: 4 })
  winnerCount!: number;

  @ApiProperty({ description: 'Missed predictions', example: 3 })
  missCount!: number;
}
