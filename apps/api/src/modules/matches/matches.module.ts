import { Module } from '@nestjs/common';
import { MatchesController } from './matches.controller.js';
import { MatchesService } from './matches.service.js';
import { ScoringModule } from '../scoring/scoring.module.js';

@Module({
  imports: [ScoringModule],
  controllers: [MatchesController],
  providers: [MatchesService],
  exports: [MatchesService],
})
export class MatchesModule {}
