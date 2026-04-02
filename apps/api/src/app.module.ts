import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor.js';
import { PrismaModule } from './config/prisma.module.js';
import { RedisModule } from './config/redis.module.js';
import { validateEnv } from './config/env.validation.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { TournamentsModule } from './modules/tournaments/tournaments.module.js';
import { GroupsModule } from './modules/groups/groups.module.js';
import { MatchesModule } from './modules/matches/matches.module.js';
import { PredictionsModule } from './modules/predictions/predictions.module.js';
import { ScoringModule } from './modules/scoring/scoring.module.js';
import { LeaderboardModule } from './modules/leaderboard/leaderboard.module.js';
import { BonusPredictionsModule } from './modules/bonus-predictions/bonus-predictions.module.js';
import { NotificationsModule } from './modules/notifications/notifications.module.js';
import { PlansModule } from './modules/plans/plans.module.js';
import { MatchSyncModule } from './modules/match-sync/match-sync.module.js';
import { EventsModule } from './gateways/events.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate: validateEnv,
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    RedisModule,
    EventsModule,
    AuthModule,
    UsersModule,
    TournamentsModule,
    GroupsModule,
    MatchesModule,
    PredictionsModule,
    ScoringModule,
    LeaderboardModule,
    BonusPredictionsModule,
    NotificationsModule,
    PlansModule,
    MatchSyncModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}
