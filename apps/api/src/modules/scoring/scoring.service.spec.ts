import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { ScoringService } from './scoring.service';
import { PrismaService } from '../../config/prisma.service';
import { EventsGateway } from '../../gateways/events.gateway';
import { NotificationsService } from '../notifications/notifications.service';

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

const mockPrisma = {
  match: { findUnique: jest.fn() },
  prediction: { findMany: jest.fn(), updateMany: jest.fn() },
  $transaction: jest.fn(),
};

const mockEventsGateway = {
  emitMatchUpdated: jest.fn(),
};

const mockCache = {
  mdel: jest.fn(),
};

const mockNotificationsService = {
  createMany: jest.fn(),
};

async function createService(): Promise<{
  service: ScoringService;
  prisma: typeof mockPrisma;
  events: typeof mockEventsGateway;
  cache: typeof mockCache;
  notifications: typeof mockNotificationsService;
}> {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      ScoringService,
      { provide: PrismaService, useValue: mockPrisma },
      { provide: EventsGateway, useValue: mockEventsGateway },
      { provide: NotificationsService, useValue: mockNotificationsService },
      { provide: CACHE_MANAGER, useValue: mockCache },
    ],
  }).compile();

  return {
    service: module.get<ScoringService>(ScoringService),
    prisma: mockPrisma,
    events: mockEventsGateway,
    cache: mockCache,
    notifications: mockNotificationsService,
  };
}

// =============================================================================
// Task 6.1 — calculatePoints (pure function)
// =============================================================================

describe('ScoringService', () => {
  let service: ScoringService;

  beforeEach(async () => {
    jest.clearAllMocks();
    ({ service } = await createService());
  });

  // ---------------------------------------------------------------------------
  // EXACT — 5 pts × multiplier
  // ---------------------------------------------------------------------------

  describe('calculatePoints — EXACT', () => {
    it('should return EXACT for identical scores (2-1)', () => {
      const result = service.calculatePoints(2, 1, 2, 1, 1);
      expect(result).toEqual({ points: 5, pointType: 'EXACT' });
    });

    it('should return EXACT for 0-0 draw', () => {
      const result = service.calculatePoints(0, 0, 0, 0, 1);
      expect(result).toEqual({ points: 5, pointType: 'EXACT' });
    });

    it('should return EXACT for high scores (5-4)', () => {
      const result = service.calculatePoints(5, 4, 5, 4, 1);
      expect(result).toEqual({ points: 5, pointType: 'EXACT' });
    });

    it('should return EXACT for a draw (2-2)', () => {
      const result = service.calculatePoints(2, 2, 2, 2, 1);
      expect(result).toEqual({ points: 5, pointType: 'EXACT' });
    });

    it('should return EXACT for away win (0-3)', () => {
      const result = service.calculatePoints(0, 3, 0, 3, 1);
      expect(result).toEqual({ points: 5, pointType: 'EXACT' });
    });

    it('should apply x2 multiplier (EXACT in round of 16 = 10 pts)', () => {
      const result = service.calculatePoints(1, 0, 1, 0, 2);
      expect(result).toEqual({ points: 10, pointType: 'EXACT' });
    });

    it('should apply x3 multiplier (EXACT in final = 15 pts)', () => {
      const result = service.calculatePoints(1, 0, 1, 0, 3);
      expect(result).toEqual({ points: 15, pointType: 'EXACT' });
    });
  });

  // ---------------------------------------------------------------------------
  // GOAL_DIFF — 3 pts × multiplier
  // ---------------------------------------------------------------------------

  describe('calculatePoints — GOAL_DIFF', () => {
    it('should return GOAL_DIFF when goal difference matches (+2)', () => {
      // predicted 3-1 (diff +2), actual 2-0 (diff +2)
      const result = service.calculatePoints(3, 1, 2, 0, 1);
      expect(result).toEqual({ points: 3, pointType: 'GOAL_DIFF' });
    });

    it('should return GOAL_DIFF for same negative difference', () => {
      // predicted 0-2 (diff -2), actual 1-3 (diff -2)
      const result = service.calculatePoints(0, 2, 1, 3, 1);
      expect(result).toEqual({ points: 3, pointType: 'GOAL_DIFF' });
    });

    it('should return GOAL_DIFF for draws with different scores (1-1 vs 3-3)', () => {
      // Both have diff 0 but different scores → not EXACT
      const result = service.calculatePoints(1, 1, 3, 3, 1);
      expect(result).toEqual({ points: 3, pointType: 'GOAL_DIFF' });
    });

    it('should return GOAL_DIFF for 2-2 predicted vs 0-0 actual (diff 0 = 0)', () => {
      const result = service.calculatePoints(2, 2, 0, 0, 1);
      expect(result).toEqual({ points: 3, pointType: 'GOAL_DIFF' });
    });

    it('should apply x2 multiplier (GOAL_DIFF in R16 = 6 pts)', () => {
      const result = service.calculatePoints(3, 1, 2, 0, 2);
      expect(result).toEqual({ points: 6, pointType: 'GOAL_DIFF' });
    });

    it('should apply x3 multiplier (GOAL_DIFF in final = 9 pts)', () => {
      const result = service.calculatePoints(3, 1, 2, 0, 3);
      expect(result).toEqual({ points: 9, pointType: 'GOAL_DIFF' });
    });
  });

  // ---------------------------------------------------------------------------
  // WINNER — 1 pt × multiplier
  // ---------------------------------------------------------------------------

  describe('calculatePoints — WINNER', () => {
    it('should return WINNER when home team wins but different diff', () => {
      // predicted 2-0 (diff +2), actual 1-0 (diff +1) — same winner but different diff
      const result = service.calculatePoints(2, 0, 1, 0, 1);
      expect(result).toEqual({ points: 1, pointType: 'WINNER' });
    });

    it('should return WINNER when away team wins but different diff', () => {
      // predicted 0-1 (diff -1), actual 0-3 (diff -3)
      const result = service.calculatePoints(0, 1, 0, 3, 1);
      expect(result).toEqual({ points: 1, pointType: 'WINNER' });
    });

    it('should return WINNER for correct home win with large diff mismatch', () => {
      // predicted 5-0 (diff +5), actual 1-0 (diff +1)
      const result = service.calculatePoints(5, 0, 1, 0, 1);
      expect(result).toEqual({ points: 1, pointType: 'WINNER' });
    });

    it('should apply x2 multiplier (WINNER in R16 = 2 pts)', () => {
      const result = service.calculatePoints(2, 0, 1, 0, 2);
      expect(result).toEqual({ points: 2, pointType: 'WINNER' });
    });

    it('should apply x3 multiplier (WINNER in final = 3 pts)', () => {
      const result = service.calculatePoints(2, 0, 1, 0, 3);
      expect(result).toEqual({ points: 3, pointType: 'WINNER' });
    });
  });

  // ---------------------------------------------------------------------------
  // MISS — 0 pts (never multiplied)
  // ---------------------------------------------------------------------------

  describe('calculatePoints — MISS', () => {
    it('should return MISS when predicted wrong winner', () => {
      // predicted home win (2-0), actual away win (0-1)
      const result = service.calculatePoints(2, 0, 0, 1, 1);
      expect(result).toEqual({ points: 0, pointType: 'MISS' });
    });

    it('should return MISS when predicted draw but home wins', () => {
      // predicted draw (1-1), actual home win (2-0)
      const result = service.calculatePoints(1, 1, 2, 0, 1);
      expect(result).toEqual({ points: 0, pointType: 'MISS' });
    });

    it('should return MISS when predicted home win but draw happens', () => {
      // predicted home win (2-1), actual draw (1-1)
      const result = service.calculatePoints(2, 1, 1, 1, 1);
      expect(result).toEqual({ points: 0, pointType: 'MISS' });
    });

    it('should return MISS when predicted away win but home wins', () => {
      // predicted 0-2, actual 3-1
      const result = service.calculatePoints(0, 2, 3, 1, 1);
      expect(result).toEqual({ points: 0, pointType: 'MISS' });
    });

    it('should return 0 points even with x3 multiplier', () => {
      const result = service.calculatePoints(2, 0, 0, 1, 3);
      expect(result).toEqual({ points: 0, pointType: 'MISS' });
    });
  });

  // ---------------------------------------------------------------------------
  // Edge cases — tricky scenarios
  // ---------------------------------------------------------------------------

  describe('calculatePoints — edge cases', () => {
    it('same goal diff but different winner → GOAL_DIFF NOT WINNER', () => {
      // predicted 3-2 (diff +1), actual 2-1 (diff +1) — same diff, same winner
      // Actually this IS same diff AND same winner → should be GOAL_DIFF because diff check comes first
      const result = service.calculatePoints(3, 2, 2, 1, 1);
      expect(result).toEqual({ points: 3, pointType: 'GOAL_DIFF' });
    });

    it('predicted 1-0, actual 2-1 — same diff (+1) → GOAL_DIFF', () => {
      const result = service.calculatePoints(1, 0, 2, 1, 1);
      expect(result).toEqual({ points: 3, pointType: 'GOAL_DIFF' });
    });

    it('draw predicted (1-1), draw actual (0-0) — same diff (0) → GOAL_DIFF', () => {
      const result = service.calculatePoints(1, 1, 0, 0, 1);
      expect(result).toEqual({ points: 3, pointType: 'GOAL_DIFF' });
    });

    it('predicted 2-0, actual 3-1 — same diff (+2) → GOAL_DIFF not WINNER', () => {
      // Both home wins by 2, but different scores
      const result = service.calculatePoints(2, 0, 3, 1, 1);
      expect(result).toEqual({ points: 3, pointType: 'GOAL_DIFF' });
    });

    it('predicted 0-1, actual 2-3 — same diff (-1) → GOAL_DIFF', () => {
      const result = service.calculatePoints(0, 1, 2, 3, 1);
      expect(result).toEqual({ points: 3, pointType: 'GOAL_DIFF' });
    });
  });

  // =============================================================================
  // Task 6.2 — calculatePointsForMatch (orchestration)
  // =============================================================================

  describe('calculatePointsForMatch', () => {
    const matchId = 'match-1';
    const tournamentId = 'tournament-1';

    const baseMatch = {
      id: matchId,
      homeScore: 2,
      awayScore: 1,
      phase: 'GROUP_STAGE',
      tournamentId,
      homeTeam: { name: 'Argentina' },
      awayTeam: { name: 'Brasil' },
      tournament: {
        id: tournamentId,
        phases: [{ phase: 'GROUP_STAGE', multiplier: 1 }],
      },
    };

    // Actual score: 2-1 (diff +1, home wins)
    const basePredictions = [
      {
        id: 'pred-1',
        matchId,
        groupId: 'group-a',
        userId: 'user-1',
        predictedHome: 2,
        predictedAway: 1,
      }, // EXACT (2-1 = 2-1)
      {
        id: 'pred-2',
        matchId,
        groupId: 'group-a',
        userId: 'user-2',
        predictedHome: 3,
        predictedAway: 2,
      }, // GOAL_DIFF (diff +1 = diff +1)
      {
        id: 'pred-3',
        matchId,
        groupId: 'group-b',
        userId: 'user-3',
        predictedHome: 3,
        predictedAway: 0,
      }, // WINNER (home wins, but diff +3 ≠ +1)
      {
        id: 'pred-4',
        matchId,
        groupId: 'group-b',
        userId: 'user-4',
        predictedHome: 0,
        predictedAway: 2,
      }, // MISS (away win ≠ home win)
    ];

    beforeEach(() => {
      mockNotificationsService.createMany.mockResolvedValue({ count: 0 });
    });

    it('should fetch match with tournament, phases, and teams', async () => {
      mockPrisma.match.findUnique.mockResolvedValue(baseMatch);
      mockPrisma.prediction.findMany.mockResolvedValue(basePredictions);
      mockPrisma.$transaction.mockResolvedValue([]);
      mockNotificationsService.createMany.mockResolvedValue({ count: 0 });

      await service.calculatePointsForMatch(matchId);

      expect(mockPrisma.match.findUnique).toHaveBeenCalledWith({
        where: { id: matchId },
        include: {
          homeTeam: true,
          awayTeam: true,
          tournament: { include: { phases: true } },
        },
      });
    });

    it('should throw NotFoundException when match does not exist', async () => {
      mockPrisma.match.findUnique.mockResolvedValue(null);

      await expect(service.calculatePointsForMatch(matchId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException when match has no final score', async () => {
      mockPrisma.match.findUnique.mockResolvedValue({
        ...baseMatch,
        homeScore: null,
        awayScore: null,
      });

      await expect(service.calculatePointsForMatch(matchId)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should calculate points for each prediction using multiplier', async () => {
      mockPrisma.match.findUnique.mockResolvedValue(baseMatch);
      mockPrisma.prediction.findMany.mockResolvedValue(basePredictions);
      mockPrisma.$transaction.mockResolvedValue([]);

      const result = await service.calculatePointsForMatch(matchId);

      expect(result).toEqual({
        matchId,
        totalPredictions: 4,
        results: { exact: 1, goalDiff: 1, winner: 1, miss: 1 },
      });
    });

    it('should do bulk updateMany grouped by pointType', async () => {
      mockPrisma.match.findUnique.mockResolvedValue(baseMatch);
      mockPrisma.prediction.findMany.mockResolvedValue(basePredictions);
      mockPrisma.$transaction.mockResolvedValue([]);

      await service.calculatePointsForMatch(matchId);

      // $transaction should be called with an array of updateMany promises
      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
      const transactionArg = mockPrisma.$transaction.mock.calls[0][0];
      // 4 predictions mapped to 4 different point types → 4 groups
      expect(transactionArg).toHaveLength(4);
    });

    it('should group identical pointType+points into a single updateMany', async () => {
      const sameCategoryPredictions = [
        {
          id: 'pred-1',
          matchId,
          groupId: 'group-a',
          userId: 'user-1',
          predictedHome: 2,
          predictedAway: 1,
        }, // EXACT
        {
          id: 'pred-2',
          matchId,
          groupId: 'group-b',
          userId: 'user-2',
          predictedHome: 2,
          predictedAway: 1,
        }, // EXACT too
      ];

      mockPrisma.match.findUnique.mockResolvedValue(baseMatch);
      mockPrisma.prediction.findMany.mockResolvedValue(
        sameCategoryPredictions,
      );
      mockPrisma.$transaction.mockResolvedValue([]);

      await service.calculatePointsForMatch(matchId);

      // 2 EXACT predictions → 1 group
      const transactionArg = mockPrisma.$transaction.mock.calls[0][0];
      expect(transactionArg).toHaveLength(1);
    });

    it('should broadcast a single match:updated event', async () => {
      mockPrisma.match.findUnique.mockResolvedValue(baseMatch);
      mockPrisma.prediction.findMany.mockResolvedValue(basePredictions);
      mockPrisma.$transaction.mockResolvedValue([]);

      await service.calculatePointsForMatch(matchId);

      // Single broadcast, not per-group
      expect(mockEventsGateway.emitMatchUpdated).toHaveBeenCalledTimes(1);
      expect(mockEventsGateway.emitMatchUpdated).toHaveBeenCalledWith(matchId);
    });

    it('should invalidate leaderboard cache for affected groups', async () => {
      mockPrisma.match.findUnique.mockResolvedValue(baseMatch);
      mockPrisma.prediction.findMany.mockResolvedValue(basePredictions);
      mockPrisma.$transaction.mockResolvedValue([]);

      await service.calculatePointsForMatch(matchId);

      expect(mockCache.mdel).toHaveBeenCalledTimes(1);
      const deletedKeys = mockCache.mdel.mock.calls[0][0] as string[];

      // 2 groups × 3 key patterns = 6 keys + 1 global key = 7 keys
      expect(deletedKeys).toHaveLength(7);
      expect(deletedKeys).toContain('lb:group-a:all:all');
      expect(deletedKeys).toContain(`lb:group-a:${tournamentId}:all`);
      expect(deletedKeys).toContain(
        `lb:group-a:${tournamentId}:GROUP_STAGE`,
      );
      expect(deletedKeys).toContain('lb:group-b:all:all');
      expect(deletedKeys).toContain(`lb:group-b:${tournamentId}:all`);
      expect(deletedKeys).toContain(
        `lb:group-b:${tournamentId}:GROUP_STAGE`,
      );
      expect(deletedKeys).toContain('lb:global:all');
    });

    it('should use default multiplier 1 when phase not found', async () => {
      mockPrisma.match.findUnique.mockResolvedValue({
        ...baseMatch,
        phase: 'UNKNOWN_PHASE',
        tournament: {
          ...baseMatch.tournament,
          phases: [], // no phases defined
        },
      });
      mockPrisma.prediction.findMany.mockResolvedValue([
        {
          id: 'pred-1',
          matchId,
          groupId: 'group-a',
          userId: 'user-1',
          predictedHome: 2,
          predictedAway: 1,
        },
      ]);
      mockPrisma.$transaction.mockResolvedValue([]);

      const result = await service.calculatePointsForMatch(matchId);

      // EXACT with multiplier 1 → 5 points
      expect(result.results.exact).toBe(1);
    });

    it('should apply phase multiplier from tournament config', async () => {
      const finalMatch = {
        ...baseMatch,
        phase: 'FINAL',
        tournament: {
          ...baseMatch.tournament,
          phases: [
            { phase: 'GROUP_STAGE', multiplier: 1 },
            { phase: 'FINAL', multiplier: 3 },
          ],
        },
      };

      mockPrisma.match.findUnique.mockResolvedValue(finalMatch);
      mockPrisma.prediction.findMany.mockResolvedValue([
        {
          id: 'pred-1',
          matchId,
          groupId: 'group-a',
          userId: 'user-1',
          predictedHome: 2,
          predictedAway: 1,
        },
      ]);
      // Capture the updateMany call to verify the points passed
      mockPrisma.prediction.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.$transaction.mockImplementation(
        (promises: Promise<unknown>[]) => Promise.all(promises),
      );

      await service.calculatePointsForMatch(matchId);

      // Verify updateMany was called with 15 points (5 × 3)
      expect(mockPrisma.prediction.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ['pred-1'] } },
        data: { pointsEarned: 15, pointType: 'EXACT' },
      });
    });

    it('should handle zero predictions gracefully', async () => {
      mockPrisma.match.findUnique.mockResolvedValue(baseMatch);
      mockPrisma.prediction.findMany.mockResolvedValue([]);
      mockPrisma.$transaction.mockResolvedValue([]);

      const result = await service.calculatePointsForMatch(matchId);

      expect(result).toEqual({
        matchId,
        totalPredictions: 0,
        results: { exact: 0, goalDiff: 0, winner: 0, miss: 0 },
      });
      // Even with zero predictions, the match was scored → broadcast the update
      expect(mockEventsGateway.emitMatchUpdated).toHaveBeenCalledTimes(1);
      expect(mockEventsGateway.emitMatchUpdated).toHaveBeenCalledWith(matchId);
      // Global cache is always invalidated, even with no group-specific predictions
      expect(mockCache.mdel).toHaveBeenCalledTimes(1);
      const deletedKeys = mockCache.mdel.mock.calls[0][0] as string[];
      expect(deletedKeys).toEqual(['lb:global:all']);
      // No predictions → no notifications
      expect(mockNotificationsService.createMany).not.toHaveBeenCalled();
    });

    // -------------------------------------------------------------------------
    // MATCH_RESULT notifications
    // -------------------------------------------------------------------------

    describe('MATCH_RESULT notifications', () => {
      it('should create one notification per unique user after scoring', async () => {
        mockPrisma.match.findUnique.mockResolvedValue(baseMatch);
        mockPrisma.prediction.findMany.mockResolvedValue(basePredictions);
        mockPrisma.$transaction.mockResolvedValue([]);
        mockNotificationsService.createMany.mockResolvedValue({ count: 4 });

        await service.calculatePointsForMatch(matchId);

        // Wait for fire-and-forget promise to settle
        await new Promise((resolve) => setImmediate(resolve));

        expect(mockNotificationsService.createMany).toHaveBeenCalledTimes(1);
        const notifications = mockNotificationsService.createMany.mock.calls[0][0];
        expect(notifications).toHaveLength(4); // 4 unique users
        expect(notifications[0]).toEqual({
          userId: 'user-1',
          type: 'MATCH_RESULT',
          title: 'Terminó Argentina 2-1 Brasil',
          body: 'Ganaste 5 puntos',
          data: { matchId, points: 5 },
        });
      });

      it('should aggregate points per user when user predicted in multiple groups', async () => {
        // Same user (user-1) predicted in group-a and group-b
        const multiGroupPredictions = [
          {
            id: 'pred-1',
            matchId,
            groupId: 'group-a',
            userId: 'user-1',
            predictedHome: 2,
            predictedAway: 1,
          }, // EXACT → 5 pts
          {
            id: 'pred-2',
            matchId,
            groupId: 'group-b',
            userId: 'user-1',
            predictedHome: 3,
            predictedAway: 2,
          }, // GOAL_DIFF → 3 pts
          {
            id: 'pred-3',
            matchId,
            groupId: 'group-c',
            userId: 'user-1',
            predictedHome: 3,
            predictedAway: 0,
          }, // WINNER → 1 pt
        ];

        mockPrisma.match.findUnique.mockResolvedValue(baseMatch);
        mockPrisma.prediction.findMany.mockResolvedValue(multiGroupPredictions);
        mockPrisma.$transaction.mockResolvedValue([]);
        mockNotificationsService.createMany.mockResolvedValue({ count: 1 });

        await service.calculatePointsForMatch(matchId);

        await new Promise((resolve) => setImmediate(resolve));

        expect(mockNotificationsService.createMany).toHaveBeenCalledTimes(1);
        const notifications = mockNotificationsService.createMany.mock.calls[0][0];
        // ONE notification for user-1, not 3
        expect(notifications).toHaveLength(1);
        expect(notifications[0]).toEqual({
          userId: 'user-1',
          type: 'MATCH_RESULT',
          title: 'Terminó Argentina 2-1 Brasil',
          body: 'Ganaste 9 puntos', // 5 + 3 + 1
          data: { matchId, points: 9 },
        });
      });

      it('should not block scoring when notification creation fails', async () => {
        mockPrisma.match.findUnique.mockResolvedValue(baseMatch);
        mockPrisma.prediction.findMany.mockResolvedValue(basePredictions);
        mockPrisma.$transaction.mockResolvedValue([]);
        mockNotificationsService.createMany.mockRejectedValue(
          new Error('Notification service down'),
        );

        // Scoring MUST complete successfully even when notifications fail
        const result = await service.calculatePointsForMatch(matchId);

        expect(result).toEqual({
          matchId,
          totalPredictions: 4,
          results: { exact: 1, goalDiff: 1, winner: 1, miss: 1 },
        });

        // Wait for fire-and-forget to settle (error is caught internally)
        await new Promise((resolve) => setImmediate(resolve));
      });

      it('should not create notifications when there are no predictions', async () => {
        mockPrisma.match.findUnique.mockResolvedValue(baseMatch);
        mockPrisma.prediction.findMany.mockResolvedValue([]);
        mockPrisma.$transaction.mockResolvedValue([]);

        await service.calculatePointsForMatch(matchId);

        await new Promise((resolve) => setImmediate(resolve));

        expect(mockNotificationsService.createMany).not.toHaveBeenCalled();
      });
    });
  });
});
