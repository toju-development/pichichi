import { Module } from '@nestjs/common';
import { BonusPredictionsController } from './bonus-predictions.controller.js';
import { BonusPredictionsService } from './bonus-predictions.service.js';

@Module({
  controllers: [BonusPredictionsController],
  providers: [BonusPredictionsService],
  exports: [BonusPredictionsService],
})
export class BonusPredictionsModule {}
