import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';

import { MatchSyncService } from './match-sync.service';
import { ApiFootballService } from './api-football.service';
import { MatchesService } from '../matches/matches.service';
import { BonusPredictionsService } from '../bonus-predictions/bonus-predictions.service';
import { PrismaService } from '../../config/prisma.service';
import type {
  ApiFootballFixture,
  ApiFootballFixtureStatus,
} from './api-football.types';

// ---------------------------------------------------------------------------
// Mock factories
// ---------------------------------------------------------------------------

function makeDbMatch(overrides: Record<string, unknown> = {}) {
  return {
    id: 'match-1',
    tournamentId: 'tournament-1',
    homeTeamId: 'team-home',
    awayTeamId: 'team-away',
    phase: 'GROUP_STAGE' as const,
    groupLetter: 'A',
    matchNumber: 1,
    scheduledAt: new Date('2026-06-15T18:00:00Z'),
    venue: 'Stadium',
    city: 'City',
    status: 'SCHEDULED' as const,
    homeScore: null as number | null,
    awayScore: null as number | null,
    homeScorePenalties: null as number | null,
    awayScorePenalties: null as number | null,
    isExtraTime: false,
    homeTeamPlaceholder: null,
    awayTeamPlaceholder: null,
    externalId: 100 as number | null,
    lastSyncedAt: null as Date | null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeApiFixture(overrides: {
  id?: number;
  statusShort?: string;
  statusLong?: string;
  homeGoals?: number | null;
  awayGoals?: number | null;
  homeWinner?: boolean | null;
  awayWinner?: boolean | null;
  homeTeamId?: number | null;
  awayTeamId?: number | null;
  homeTeamName?: string;
  awayTeamName?: string;
  penaltyHome?: number | null;
  penaltyAway?: number | null;
} = {}): ApiFootballFixture {
  return {
    fixture: {
      id: overrides.id ?? 100,
      referee: null,
      timezone: 'UTC',
      date: '2026-06-15T18:00:00+00:00',
      timestamp: 1781625600,
      periods: { first: null, second: null },
      venue: { id: 1, name: 'Stadium', city: 'City' },
      status: {
        long: overrides.statusLong ?? 'Not Started',
        short: (overrides.statusShort ?? 'NS') as ApiFootballFixtureStatus,
        elapsed: null,
        extra: null,
      },
    },
    league: {
      id: 1,
      name: 'World Cup',
      country: 'World',
      logo: 'https://example.com/logo.png',
      flag: null,
      season: 2026,
      round: 'Group A - 1',
    },
    teams: {
      home: {
        id: overrides.homeTeamId ?? 10,
        name: overrides.homeTeamName ?? 'Team A',
        logo: 'https://example.com/a.png',
        winner: overrides.homeWinner ?? null,
      },
      away: {
        id: overrides.awayTeamId ?? 20,
        name: overrides.awayTeamName ?? 'Team B',
        logo: 'https://example.com/b.png',
        winner: overrides.awayWinner ?? null,
      },
    },
    goals: {
      home: overrides.homeGoals ?? null,
      away: overrides.awayGoals ?? null,
    },
    score: {
      halftime: { home: null, away: null },
      fulltime: { home: null, away: null },
      extratime: { home: null, away: null },
      penalty: {
        home: overrides.penaltyHome ?? null,
        away: overrides.penaltyAway ?? null,
      },
    },
  };
}

// ---------------------------------------------------------------------------
// Mock definitions
// ---------------------------------------------------------------------------

const mockPrisma = {
  match: {
    count: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
  tournament: {
    update: jest.fn(),
  },
  team: {
    findFirst: jest.fn(),
  },
};

const mockApiFootball = {
  isAvailable: jest.fn().mockReturnValue(true),
  fetchFixturesByIds: jest.fn().mockResolvedValue([]),
  getRateLimitRemaining: jest.fn().mockReturnValue(-1),
};

const mockMatchesService = {
  updateScore: jest.fn().mockResolvedValue({}),
};

const mockBonusPredictions = {
  resolveByKey: jest
    .fn()
    .mockResolvedValue({ resolved: 0, correct: 0, incorrect: 0 }),
};

const mockConfigService = {
  get: jest.fn().mockReturnValue('false'),
};

const mockSchedulerRegistry = {
  addInterval: jest.fn(),
  deleteInterval: jest.fn(),
  getInterval: jest.fn(),
};

// ---------------------------------------------------------------------------
// Test module builder
// ---------------------------------------------------------------------------

async function createService(): Promise<MatchSyncService> {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      MatchSyncService,
      { provide: SchedulerRegistry, useValue: mockSchedulerRegistry },
      { provide: ConfigService, useValue: mockConfigService },
      { provide: PrismaService, useValue: mockPrisma },
      { provide: ApiFootballService, useValue: mockApiFootball },
      { provide: MatchesService, useValue: mockMatchesService },
      { provide: BonusPredictionsService, useValue: mockBonusPredictions },
    ],
  }).compile();

  return module.get<MatchSyncService>(MatchSyncService);
}

// =============================================================================
// Tests
// =============================================================================

describe('MatchSyncService', () => {
  let service: MatchSyncService;

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    // Default: getInterval throws (no dynamic interval exists)
    mockSchedulerRegistry.getInterval.mockImplementation(() => {
      throw new Error('No interval');
    });
    service = await createService();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // ---------------------------------------------------------------------------
  // onModuleInit / lifecycle
  // ---------------------------------------------------------------------------

  describe('onModuleInit', () => {
    it('should keep sync disabled when SYNC_ENABLED is false', async () => {
      mockConfigService.get.mockReturnValue('false');

      await service.onModuleInit();

      expect(service.isSyncEnabled()).toBe(false);
    });

    it('should keep sync disabled when API key is not available', async () => {
      mockConfigService.get.mockReturnValue('true');
      mockApiFootball.isAvailable.mockReturnValue(false);

      await service.onModuleInit();

      expect(service.isSyncEnabled()).toBe(false);
    });

    it('should enable sync and run heartbeat when SYNC_ENABLED=true and API available', async () => {
      mockConfigService.get.mockReturnValue('true');
      mockApiFootball.isAvailable.mockReturnValue(true);
      mockPrisma.match.count.mockResolvedValue(0);

      await service.onModuleInit();

      expect(service.isSyncEnabled()).toBe(true);
      // heartbeat was called → countSyncableMatches was called
      expect(mockPrisma.match.count).toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // setSyncEnabled / isSyncEnabled
  // ---------------------------------------------------------------------------

  describe('setSyncEnabled / isSyncEnabled', () => {
    it('should toggle sync on', () => {
      expect(service.isSyncEnabled()).toBe(false);

      service.setSyncEnabled(true);

      expect(service.isSyncEnabled()).toBe(true);
    });

    it('should toggle sync off and destroy dynamic interval', () => {
      // First enable it
      service.setSyncEnabled(true);

      // Simulate a running dynamic interval
      mockSchedulerRegistry.getInterval.mockReturnValue(
        setInterval(() => {}, 10000),
      );

      service.setSyncEnabled(false);

      expect(service.isSyncEnabled()).toBe(false);
      expect(mockSchedulerRegistry.deleteInterval).toHaveBeenCalledWith(
        'match-sync',
      );
    });

    it('should default to disabled (matching SYNC_ENABLED=false)', () => {
      expect(service.isSyncEnabled()).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // handleHeartbeat
  // ---------------------------------------------------------------------------

  describe('handleHeartbeat', () => {
    it('should skip entirely when sync is disabled', async () => {
      // sync is disabled by default
      await service.handleHeartbeat();

      expect(mockPrisma.match.count).not.toHaveBeenCalled();
    });

    it('should create dynamic interval when syncable matches exist', async () => {
      service.setSyncEnabled(true);
      mockPrisma.match.count.mockResolvedValue(3);

      await service.handleHeartbeat();

      expect(mockSchedulerRegistry.addInterval).toHaveBeenCalledWith(
        'match-sync',
        expect.anything(),
      );
    });

    it('should destroy dynamic interval when no syncable matches', async () => {
      service.setSyncEnabled(true);
      mockPrisma.match.count.mockResolvedValue(0);

      // Simulate existing dynamic interval
      mockSchedulerRegistry.getInterval.mockReturnValue(
        setInterval(() => {}, 10000),
      );

      await service.handleHeartbeat();

      expect(mockSchedulerRegistry.deleteInterval).toHaveBeenCalledWith(
        'match-sync',
      );
    });

    it('should not fail if heartbeat throws', async () => {
      service.setSyncEnabled(true);
      mockPrisma.match.count.mockRejectedValue(new Error('DB down'));

      await expect(service.handleHeartbeat()).resolves.toBeUndefined();
    });
  });

  // ---------------------------------------------------------------------------
  // syncTick — main sync logic
  // ---------------------------------------------------------------------------

  describe('syncTick', () => {
    it('should skip when rate limit is too low', async () => {
      mockApiFootball.getRateLimitRemaining.mockReturnValue(5); // below threshold of 10
      mockPrisma.match.findMany.mockResolvedValue([]);

      const result = await service.syncTick();

      expect(result.matchesChecked).toBe(0);
      expect(mockPrisma.match.findMany).not.toHaveBeenCalled();
    });

    it('should destroy interval and return early when no syncable matches exist', async () => {
      mockApiFootball.getRateLimitRemaining.mockReturnValue(-1);
      mockPrisma.match.findMany.mockResolvedValue([]);

      // Simulate existing dynamic interval
      mockSchedulerRegistry.getInterval.mockReturnValue(
        setInterval(() => {}, 10000),
      );

      const result = await service.syncTick();

      expect(result.matchesChecked).toBe(0);
      expect(mockSchedulerRegistry.deleteInterval).toHaveBeenCalledWith(
        'match-sync',
      );
    });

    it('should skip API call when no matches have externalId', async () => {
      mockApiFootball.getRateLimitRemaining.mockReturnValue(-1);
      mockPrisma.match.findMany.mockResolvedValue([
        makeDbMatch({ externalId: null }),
      ]);

      const result = await service.syncTick();

      expect(mockApiFootball.fetchFixturesByIds).not.toHaveBeenCalled();
      expect(result.matchesChecked).toBe(0);
    });

    it('should fetch fixtures and update matches that changed', async () => {
      const dbMatch = makeDbMatch({
        status: 'SCHEDULED',
        homeScore: null,
        awayScore: null,
      });
      const apiFixture = makeApiFixture({
        id: 100,
        statusShort: '1H',
        homeGoals: 1,
        awayGoals: 0,
      });

      mockApiFootball.getRateLimitRemaining.mockReturnValue(-1);
      mockPrisma.match.findMany.mockResolvedValue([dbMatch]);
      mockApiFootball.fetchFixturesByIds.mockResolvedValue([apiFixture]);
      mockPrisma.match.update.mockResolvedValue({});

      const result = await service.syncTick();

      expect(mockApiFootball.fetchFixturesByIds).toHaveBeenCalledWith([100]);
      expect(mockMatchesService.updateScore).toHaveBeenCalledWith(
        'match-1',
        1,
        0,
        'LIVE',
        false, // not extra time
        undefined,
        undefined,
      );
      expect(result.matchesChecked).toBe(1);
      expect(result.matchesUpdated).toBe(1);
    });

    it('should NOT call updateScore when nothing changed', async () => {
      const dbMatch = makeDbMatch({
        status: 'LIVE',
        homeScore: 1,
        awayScore: 0,
      });
      const apiFixture = makeApiFixture({
        id: 100,
        statusShort: '2H',
        homeGoals: 1,
        awayGoals: 0,
      });

      mockApiFootball.getRateLimitRemaining.mockReturnValue(-1);
      mockPrisma.match.findMany.mockResolvedValue([dbMatch]);
      mockApiFootball.fetchFixturesByIds.mockResolvedValue([apiFixture]);
      mockPrisma.match.update.mockResolvedValue({});

      const result = await service.syncTick();

      expect(mockMatchesService.updateScore).not.toHaveBeenCalled();
      expect(result.matchesUpdated).toBe(0);
    });

    it('should always update lastSyncedAt even when match has not changed', async () => {
      const dbMatch = makeDbMatch({
        status: 'LIVE',
        homeScore: 1,
        awayScore: 0,
      });
      const apiFixture = makeApiFixture({
        id: 100,
        statusShort: '2H',
        homeGoals: 1,
        awayGoals: 0,
      });

      mockApiFootball.getRateLimitRemaining.mockReturnValue(-1);
      mockPrisma.match.findMany.mockResolvedValue([dbMatch]);
      mockApiFootball.fetchFixturesByIds.mockResolvedValue([apiFixture]);
      mockPrisma.match.update.mockResolvedValue({});

      await service.syncTick();

      expect(mockPrisma.match.update).toHaveBeenCalledWith({
        where: { id: 'match-1' },
        data: { lastSyncedAt: expect.any(Date) },
      });
    });

    it('should handle extra time correctly (AET status)', async () => {
      const dbMatch = makeDbMatch({
        status: 'LIVE',
        homeScore: 1,
        awayScore: 1,
        phase: 'SEMI_FINAL',
      });
      const apiFixture = makeApiFixture({
        id: 100,
        statusShort: 'AET',
        homeGoals: 2,
        awayGoals: 1,
      });

      mockApiFootball.getRateLimitRemaining.mockReturnValue(-1);
      mockPrisma.match.findMany.mockResolvedValue([dbMatch]);
      mockApiFootball.fetchFixturesByIds.mockResolvedValue([apiFixture]);
      mockPrisma.match.update.mockResolvedValue({});

      await service.syncTick();

      expect(mockMatchesService.updateScore).toHaveBeenCalledWith(
        'match-1',
        2,
        1,
        'FINISHED',
        true, // isExtraTime = true for AET
        undefined,
        undefined,
      );
    });

    it('should handle penalty shootout (PEN status) with penalty scores', async () => {
      const dbMatch = makeDbMatch({
        status: 'LIVE',
        homeScore: 1,
        awayScore: 1,
        phase: 'QUARTER_FINAL',
      });
      const apiFixture = makeApiFixture({
        id: 100,
        statusShort: 'PEN',
        homeGoals: 1,
        awayGoals: 1,
        penaltyHome: 4,
        penaltyAway: 3,
      });

      mockApiFootball.getRateLimitRemaining.mockReturnValue(-1);
      mockPrisma.match.findMany.mockResolvedValue([dbMatch]);
      mockApiFootball.fetchFixturesByIds.mockResolvedValue([apiFixture]);
      mockPrisma.match.update.mockResolvedValue({});

      await service.syncTick();

      expect(mockMatchesService.updateScore).toHaveBeenCalledWith(
        'match-1',
        1,
        1,
        'FINISHED', // PEN maps to FINISHED
        false, // PEN is not in EXTRA_TIME_STATUSES
        4, // homeScorePenalties
        3, // awayScorePenalties
      );
    });

    it('should continue processing other matches when one fails', async () => {
      const dbMatch1 = makeDbMatch({ id: 'match-1', externalId: 100 });
      const dbMatch2 = makeDbMatch({
        id: 'match-2',
        externalId: 200,
        tournamentId: 'tournament-2',
      });
      // Use LIVE → 2H so status doesn't change to FINISHED (avoids post-finish hooks)
      const fixture1 = makeApiFixture({
        id: 100,
        statusShort: '2H',
        homeGoals: 2,
        awayGoals: 0,
      });
      const fixture2 = makeApiFixture({
        id: 200,
        statusShort: '2H',
        homeGoals: 1,
        awayGoals: 3,
      });

      mockApiFootball.getRateLimitRemaining.mockReturnValue(-1);
      mockPrisma.match.findMany.mockResolvedValue([dbMatch1, dbMatch2]);
      mockApiFootball.fetchFixturesByIds.mockResolvedValue([
        fixture1,
        fixture2,
      ]);

      // First match throws on updateScore, second succeeds
      mockMatchesService.updateScore
        .mockRejectedValueOnce(new Error('DB error'))
        .mockResolvedValueOnce({});
      mockPrisma.match.update.mockResolvedValue({});

      const result = await service.syncTick();

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('match-1');
      // match-2 should still get processed — updateScore called twice (once failed, once succeeded)
      expect(mockMatchesService.updateScore).toHaveBeenCalledTimes(2);
    });

    it('should return empty result when API returns 0 fixtures', async () => {
      const dbMatch = makeDbMatch();
      mockApiFootball.getRateLimitRemaining.mockReturnValue(-1);
      mockPrisma.match.findMany.mockResolvedValue([dbMatch]);
      mockApiFootball.fetchFixturesByIds.mockResolvedValue([]);

      const result = await service.syncTick();

      expect(result.matchesChecked).toBe(0);
      expect(result.matchesUpdated).toBe(0);
      expect(mockMatchesService.updateScore).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // hasMatchChanged (tested indirectly via syncTick)
  // ---------------------------------------------------------------------------

  describe('change detection (hasMatchChanged)', () => {
    beforeEach(() => {
      mockApiFootball.getRateLimitRemaining.mockReturnValue(-1);
      mockPrisma.match.update.mockResolvedValue({});
    });

    it('should detect score change (homeScore differs)', async () => {
      const dbMatch = makeDbMatch({
        status: 'LIVE',
        homeScore: 0,
        awayScore: 0,
      });
      const fixture = makeApiFixture({
        id: 100,
        statusShort: '1H',
        homeGoals: 1,
        awayGoals: 0,
      });

      mockPrisma.match.findMany.mockResolvedValue([dbMatch]);
      mockApiFootball.fetchFixturesByIds.mockResolvedValue([fixture]);

      const result = await service.syncTick();

      expect(mockMatchesService.updateScore).toHaveBeenCalled();
      expect(result.matchesUpdated).toBe(1);
    });

    it('should detect score change (awayScore differs)', async () => {
      const dbMatch = makeDbMatch({
        status: 'LIVE',
        homeScore: 0,
        awayScore: 0,
      });
      const fixture = makeApiFixture({
        id: 100,
        statusShort: '1H',
        homeGoals: 0,
        awayGoals: 1,
      });

      mockPrisma.match.findMany.mockResolvedValue([dbMatch]);
      mockApiFootball.fetchFixturesByIds.mockResolvedValue([fixture]);

      const result = await service.syncTick();

      expect(mockMatchesService.updateScore).toHaveBeenCalled();
      expect(result.matchesUpdated).toBe(1);
    });

    it('should detect status change (SCHEDULED → LIVE)', async () => {
      const dbMatch = makeDbMatch({
        status: 'SCHEDULED',
        homeScore: null,
        awayScore: null,
      });
      const fixture = makeApiFixture({
        id: 100,
        statusShort: '1H',
        homeGoals: 0,
        awayGoals: 0,
      });

      mockPrisma.match.findMany.mockResolvedValue([dbMatch]);
      mockApiFootball.fetchFixturesByIds.mockResolvedValue([fixture]);

      const result = await service.syncTick();

      // Status changed from SCHEDULED to LIVE so updateScore is called
      // (also score changed from null to 0, so it triggers)
      expect(mockMatchesService.updateScore).toHaveBeenCalled();
      expect(result.matchesUpdated).toBe(1);
    });

    it('should detect status change (LIVE → FINISHED)', async () => {
      const dbMatch = makeDbMatch({
        status: 'LIVE',
        homeScore: 2,
        awayScore: 1,
      });
      const fixture = makeApiFixture({
        id: 100,
        statusShort: 'FT',
        homeGoals: 2,
        awayGoals: 1,
      });

      mockPrisma.match.findMany.mockResolvedValue([dbMatch]);
      mockApiFootball.fetchFixturesByIds.mockResolvedValue([fixture]);

      const result = await service.syncTick();

      // Status changed from LIVE to FINISHED
      expect(mockMatchesService.updateScore).toHaveBeenCalled();
      expect(result.matchesUpdated).toBe(1);
    });

    it('should return false when nothing changed (same status and score)', async () => {
      const dbMatch = makeDbMatch({
        status: 'LIVE',
        homeScore: 1,
        awayScore: 0,
      });
      const fixture = makeApiFixture({
        id: 100,
        statusShort: '2H', // maps to LIVE
        homeGoals: 1,
        awayGoals: 0,
      });

      mockPrisma.match.findMany.mockResolvedValue([dbMatch]);
      mockApiFootball.fetchFixturesByIds.mockResolvedValue([fixture]);

      const result = await service.syncTick();

      expect(mockMatchesService.updateScore).not.toHaveBeenCalled();
      expect(result.matchesUpdated).toBe(0);
    });
  });

  // ---------------------------------------------------------------------------
  // triggerManualSync
  // ---------------------------------------------------------------------------

  describe('triggerManualSync', () => {
    it('should call syncTick and return its result', async () => {
      mockApiFootball.getRateLimitRemaining.mockReturnValue(-1);
      mockPrisma.match.findMany.mockResolvedValue([]);

      const result = await service.triggerManualSync();

      // It goes through syncTick which queries for syncable matches
      expect(result).toEqual({
        matchesChecked: 0,
        matchesUpdated: 0,
        tournamentsFinished: 0,
        apiCallsMade: 0,
        errors: [],
      });
    });

    it('should work even when sync is disabled (manual override)', async () => {
      expect(service.isSyncEnabled()).toBe(false);

      mockApiFootball.getRateLimitRemaining.mockReturnValue(-1);
      mockPrisma.match.findMany.mockResolvedValue([]);

      const result = await service.triggerManualSync();

      expect(result).toBeDefined();
      expect(result.errors).toHaveLength(0);
    });

    it('should return proper SyncResult shape with data', async () => {
      const dbMatch = makeDbMatch({
        status: 'LIVE',
        homeScore: 0,
        awayScore: 0,
      });
      const fixture = makeApiFixture({
        id: 100,
        statusShort: 'FT',
        homeGoals: 2,
        awayGoals: 1,
        homeWinner: true,
        awayWinner: false,
      });

      mockApiFootball.getRateLimitRemaining.mockReturnValue(-1);
      mockPrisma.match.findMany.mockResolvedValue([dbMatch]);
      mockApiFootball.fetchFixturesByIds.mockResolvedValue([fixture]);
      mockPrisma.match.update.mockResolvedValue({});
      mockPrisma.match.count.mockResolvedValue(0);
      mockPrisma.tournament.update.mockResolvedValue({ name: 'World Cup' });

      const result = await service.triggerManualSync();

      expect(result.matchesChecked).toBe(1);
      expect(result.matchesUpdated).toBe(1);
      expect(result.apiCallsMade).toBe(1);
      expect(result).toHaveProperty('tournamentsFinished');
      expect(result).toHaveProperty('errors');
    });
  });

  // ---------------------------------------------------------------------------
  // Tournament auto-finish (checkTournamentAutoFinish)
  // ---------------------------------------------------------------------------

  describe('tournament auto-finish', () => {
    beforeEach(() => {
      mockApiFootball.getRateLimitRemaining.mockReturnValue(-1);
      mockPrisma.match.update.mockResolvedValue({});
    });

    it('should auto-finish tournament when match becomes FINISHED and all matches are done', async () => {
      const dbMatch = makeDbMatch({
        status: 'LIVE',
        homeScore: 1,
        awayScore: 0,
      });
      const fixture = makeApiFixture({
        id: 100,
        statusShort: 'FT',
        homeGoals: 2,
        awayGoals: 0,
        homeWinner: true,
        awayWinner: false,
      });

      mockPrisma.match.findMany.mockResolvedValue([dbMatch]);
      mockApiFootball.fetchFixturesByIds.mockResolvedValue([fixture]);

      // 0 unfinished matches → tournament should auto-finish
      mockPrisma.match.count.mockResolvedValue(0);
      mockPrisma.tournament.update.mockResolvedValue({
        name: 'World Cup 2026',
      });

      const result = await service.syncTick();

      expect(mockPrisma.tournament.update).toHaveBeenCalledWith({
        where: { id: 'tournament-1' },
        data: { status: 'FINISHED' },
      });
      expect(result.tournamentsFinished).toBe(1);
    });

    it('should NOT finish tournament when some matches are still pending', async () => {
      const dbMatch = makeDbMatch({
        status: 'LIVE',
        homeScore: 1,
        awayScore: 0,
      });
      const fixture = makeApiFixture({
        id: 100,
        statusShort: 'FT',
        homeGoals: 2,
        awayGoals: 0,
        homeWinner: true,
        awayWinner: false,
      });

      mockPrisma.match.findMany.mockResolvedValue([dbMatch]);
      mockApiFootball.fetchFixturesByIds.mockResolvedValue([fixture]);

      // 3 unfinished matches → tournament should NOT auto-finish
      mockPrisma.match.count.mockResolvedValue(3);

      const result = await service.syncTick();

      expect(mockPrisma.tournament.update).not.toHaveBeenCalled();
      expect(result.tournamentsFinished).toBe(0);
    });

    it('should NOT check tournament auto-finish when match was already FINISHED', async () => {
      // The match was already FINISHED — so the transition FINISHED→FINISHED doesn't trigger the hook
      const dbMatch = makeDbMatch({
        status: 'FINISHED',
        homeScore: 2,
        awayScore: 0,
      });
      const fixture = makeApiFixture({
        id: 100,
        statusShort: 'FT',
        homeGoals: 3, // score changed but it's still FINISHED
        awayGoals: 0,
      });

      mockPrisma.match.findMany.mockResolvedValue([dbMatch]);
      mockApiFootball.fetchFixturesByIds.mockResolvedValue([fixture]);

      await service.syncTick();

      // The post-finish hook only triggers when newStatus === 'FINISHED' AND dbMatch.status !== 'FINISHED'
      expect(mockPrisma.match.count).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // Champion auto-resolve (resolveChampionBonus)
  // ---------------------------------------------------------------------------

  describe('champion auto-resolve', () => {
    beforeEach(() => {
      mockApiFootball.getRateLimitRemaining.mockReturnValue(-1);
      mockPrisma.match.update.mockResolvedValue({});
    });

    it('should resolve champion bonus when FINAL match finishes', async () => {
      const dbMatch = makeDbMatch({
        status: 'LIVE',
        homeScore: 1,
        awayScore: 1,
        phase: 'FINAL',
      });
      const fixture = makeApiFixture({
        id: 100,
        statusShort: 'AET',
        homeGoals: 2,
        awayGoals: 1,
        homeWinner: true,
        awayWinner: false,
        homeTeamId: 10,
        awayTeamId: 20,
      });

      mockPrisma.match.findMany.mockResolvedValue([dbMatch]);
      mockApiFootball.fetchFixturesByIds.mockResolvedValue([fixture]);
      // For tournament auto-finish check
      mockPrisma.match.count.mockResolvedValue(0);
      mockPrisma.tournament.update.mockResolvedValue({ name: 'World Cup' });
      // Team lookup
      mockPrisma.team.findFirst.mockResolvedValue({ externalId: 10 });
      mockBonusPredictions.resolveByKey.mockResolvedValue({
        resolved: 5,
        correct: 2,
        incorrect: 3,
      });

      await service.syncTick();

      expect(mockPrisma.team.findFirst).toHaveBeenCalledWith({
        where: { externalId: 10 },
        select: { externalId: true },
      });
      expect(mockBonusPredictions.resolveByKey).toHaveBeenCalledWith(
        'tournament-1',
        'CHAMPION',
        '10', // String(team.externalId)
      );
    });

    it('should resolve champion with away team when away wins', async () => {
      const dbMatch = makeDbMatch({
        status: 'LIVE',
        homeScore: 0,
        awayScore: 0,
        phase: 'FINAL',
      });
      const fixture = makeApiFixture({
        id: 100,
        statusShort: 'PEN',
        homeGoals: 1,
        awayGoals: 1,
        homeWinner: false,
        awayWinner: true,
        homeTeamId: 10,
        awayTeamId: 20,
        penaltyHome: 3,
        penaltyAway: 5,
      });

      mockPrisma.match.findMany.mockResolvedValue([dbMatch]);
      mockApiFootball.fetchFixturesByIds.mockResolvedValue([fixture]);
      mockPrisma.match.count.mockResolvedValue(0);
      mockPrisma.tournament.update.mockResolvedValue({ name: 'World Cup' });
      mockPrisma.team.findFirst.mockResolvedValue({ externalId: 20 });
      mockBonusPredictions.resolveByKey.mockResolvedValue({
        resolved: 3,
        correct: 1,
        incorrect: 2,
      });

      await service.syncTick();

      // Should look up the away team (winner)
      expect(mockPrisma.team.findFirst).toHaveBeenCalledWith({
        where: { externalId: 20 },
        select: { externalId: true },
      });
      expect(mockBonusPredictions.resolveByKey).toHaveBeenCalledWith(
        'tournament-1',
        'CHAMPION',
        '20',
      );
    });

    it('should NOT resolve champion when match is not FINAL phase', async () => {
      const dbMatch = makeDbMatch({
        status: 'LIVE',
        homeScore: 1,
        awayScore: 0,
        phase: 'SEMI_FINAL',
      });
      const fixture = makeApiFixture({
        id: 100,
        statusShort: 'FT',
        homeGoals: 2,
        awayGoals: 0,
        homeWinner: true,
        awayWinner: false,
      });

      mockPrisma.match.findMany.mockResolvedValue([dbMatch]);
      mockApiFootball.fetchFixturesByIds.mockResolvedValue([fixture]);
      mockPrisma.match.count.mockResolvedValue(1); // not all matches finished

      await service.syncTick();

      expect(mockBonusPredictions.resolveByKey).not.toHaveBeenCalled();
    });

    it('should skip champion resolve when no winner flag is set', async () => {
      const dbMatch = makeDbMatch({
        status: 'LIVE',
        homeScore: 0,
        awayScore: 0,
        phase: 'FINAL',
      });
      const fixture = makeApiFixture({
        id: 100,
        statusShort: 'FT',
        homeGoals: 1,
        awayGoals: 1,
        homeWinner: null, // draw? no winner flag
        awayWinner: null,
      });

      mockPrisma.match.findMany.mockResolvedValue([dbMatch]);
      mockApiFootball.fetchFixturesByIds.mockResolvedValue([fixture]);
      mockPrisma.match.count.mockResolvedValue(0);
      mockPrisma.tournament.update.mockResolvedValue({ name: 'World Cup' });

      await service.syncTick();

      expect(mockBonusPredictions.resolveByKey).not.toHaveBeenCalled();
    });

    it('should skip champion resolve when winning team not found in DB', async () => {
      const dbMatch = makeDbMatch({
        status: 'LIVE',
        homeScore: 0,
        awayScore: 0,
        phase: 'FINAL',
      });
      const fixture = makeApiFixture({
        id: 100,
        statusShort: 'FT',
        homeGoals: 2,
        awayGoals: 0,
        homeWinner: true,
        awayWinner: false,
        homeTeamId: 999,
      });

      mockPrisma.match.findMany.mockResolvedValue([dbMatch]);
      mockApiFootball.fetchFixturesByIds.mockResolvedValue([fixture]);
      mockPrisma.match.count.mockResolvedValue(0);
      mockPrisma.tournament.update.mockResolvedValue({ name: 'World Cup' });
      mockPrisma.team.findFirst.mockResolvedValue(null); // team not found

      await service.syncTick();

      expect(mockBonusPredictions.resolveByKey).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // Dynamic interval management
  // ---------------------------------------------------------------------------

  describe('dynamic interval management', () => {
    it('should create dynamic interval when syncable matches exist', async () => {
      service.setSyncEnabled(true);
      mockPrisma.match.count.mockResolvedValue(2);

      await service.handleHeartbeat();

      expect(mockSchedulerRegistry.addInterval).toHaveBeenCalledWith(
        'match-sync',
        expect.anything(),
      );
    });

    it('should NOT create duplicate interval if one already exists', async () => {
      service.setSyncEnabled(true);
      mockPrisma.match.count.mockResolvedValue(2);

      // Simulate that interval already exists
      mockSchedulerRegistry.getInterval.mockReturnValue(
        setInterval(() => {}, 10000),
      );

      await service.handleHeartbeat();

      expect(mockSchedulerRegistry.addInterval).not.toHaveBeenCalled();
    });

    it('should clear dynamic interval when no live matches (via heartbeat)', async () => {
      service.setSyncEnabled(true);
      mockPrisma.match.count.mockResolvedValue(0);

      // Simulate existing interval
      mockSchedulerRegistry.getInterval.mockReturnValue(
        setInterval(() => {}, 10000),
      );

      await service.handleHeartbeat();

      expect(mockSchedulerRegistry.deleteInterval).toHaveBeenCalledWith(
        'match-sync',
      );
    });

    it('should clear dynamic interval from syncTick when no matches returned', async () => {
      mockApiFootball.getRateLimitRemaining.mockReturnValue(-1);
      mockPrisma.match.findMany.mockResolvedValue([]);

      // Simulate existing interval
      mockSchedulerRegistry.getInterval.mockReturnValue(
        setInterval(() => {}, 10000),
      );

      await service.syncTick();

      expect(mockSchedulerRegistry.deleteInterval).toHaveBeenCalledWith(
        'match-sync',
      );
    });

    it('should handle destroy gracefully when interval does not exist', () => {
      // getInterval throws = no interval exists
      mockSchedulerRegistry.getInterval.mockImplementation(() => {
        throw new Error('No interval');
      });

      // onModuleDestroy calls destroyDynamicInterval
      expect(() => service.onModuleDestroy()).not.toThrow();
      // deleteInterval should NOT be called because hasDynamicInterval returns false
      expect(mockSchedulerRegistry.deleteInterval).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // Status mapping
  // ---------------------------------------------------------------------------

  describe('status mapping (tested via syncTick)', () => {
    beforeEach(() => {
      mockApiFootball.getRateLimitRemaining.mockReturnValue(-1);
      mockPrisma.match.update.mockResolvedValue({});
    });

    // [apiStatus, expectedMappedStatus, expectedIsExtraTime]
    const statusMappingCases: Array<[string, string, boolean]> = [
      ['NS', 'SCHEDULED', false],
      ['TBD', 'SCHEDULED', false],
      ['1H', 'LIVE', false],
      ['HT', 'LIVE', false],
      ['2H', 'LIVE', false],
      ['ET', 'LIVE', true], // ET is in EXTRA_TIME_STATUSES
      ['FT', 'FINISHED', false],
      ['AET', 'FINISHED', true], // AET is in EXTRA_TIME_STATUSES
      ['PEN', 'FINISHED', false],
      ['PST', 'POSTPONED', false],
      ['CANC', 'CANCELLED', false],
    ];

    it.each(statusMappingCases)(
      'should map API status "%s" to MatchStatus "%s"',
      async (apiStatus, expectedStatus, expectedIsExtraTime) => {
        const dbMatch = makeDbMatch({
          status: 'SCHEDULED',
          homeScore: null,
          awayScore: null,
        });
        const fixture = makeApiFixture({
          id: 100,
          statusShort: apiStatus,
          homeGoals: 0,
          awayGoals: 0,
        });

        mockPrisma.match.findMany.mockResolvedValue([dbMatch]);
        mockApiFootball.fetchFixturesByIds.mockResolvedValue([fixture]);

        // For statuses that transition to FINISHED, we need count mock for tournament check
        mockPrisma.match.count.mockResolvedValue(1); // unfinished matches remain → no auto-finish

        await service.syncTick();

        // For NS → SCHEDULED, status doesn't change but score does (null→0)
        // so updateScore should be called with the mapped status
        expect(mockMatchesService.updateScore).toHaveBeenCalledWith(
          'match-1',
          0,
          0,
          expectedStatus,
          expectedIsExtraTime,
          undefined,
          undefined,
        );
      },
    );
  });
});
