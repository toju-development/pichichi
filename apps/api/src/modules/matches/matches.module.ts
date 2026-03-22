import { forwardRef, Module } from '@nestjs/common';
import { MatchesController } from './matches.controller.js';
import { MatchesService } from './matches.service.js';
import { PredictionsModule } from '../predictions/predictions.module.js';

@Module({
  imports: [forwardRef(() => PredictionsModule)],
  controllers: [MatchesController],
  providers: [MatchesService],
  exports: [MatchesService],
})
export class MatchesModule {}
