import { Module } from '@nestjs/common';
import { MatchSyncController } from './match-sync.controller.js';
import { MatchSyncService } from './match-sync.service.js';
import { ApiFootballService } from './api-football.service.js';
import { MatchesModule } from '../matches/matches.module.js';
import { BonusPredictionsModule } from '../bonus-predictions/bonus-predictions.module.js';

@Module({
  imports: [MatchesModule, BonusPredictionsModule],
  controllers: [MatchSyncController],
  providers: [ApiFootballService, MatchSyncService],
  exports: [MatchSyncService],
})
export class MatchSyncModule {}
