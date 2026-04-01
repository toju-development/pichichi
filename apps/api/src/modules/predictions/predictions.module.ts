import { Module } from '@nestjs/common';
import { PredictionsController } from './predictions.controller.js';
import { PredictionsService } from './predictions.service.js';
import { ScoringModule } from '../scoring/scoring.module.js';

@Module({
  imports: [ScoringModule],
  controllers: [PredictionsController],
  providers: [PredictionsService],
})
export class PredictionsModule {}
