import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { BonusPredictionsService } from './bonus-predictions.service';
import { PrismaService } from '../../config/prisma.service';

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

const mockPrisma = {
  tournamentBonusType: { findMany: jest.fn() },
  bonusPrediction: { findMany: jest.fn(), updateMany: jest.fn() },
  $transaction: jest.fn(),
};

async function createService(): Promise<{
  service: BonusPredictionsService;
  prisma: typeof mockPrisma;
}> {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      BonusPredictionsService,
      { provide: PrismaService, useValue: mockPrisma },
    ],
  }).compile();

  return {
    service: module.get<BonusPredictionsService>(BonusPredictionsService),
    prisma: mockPrisma,
  };
}

// ---------------------------------------------------------------------------
// Fixture factories
// ---------------------------------------------------------------------------

function makeBonusType(
  overrides: Partial<{
    id: string;
    key: string;
    label: string;
    points: number;
    sortOrder: number;
    tournamentId: string;
  }> = {},
) {
  return {
    id: 'bt-1',
    key: 'TOP_SCORER',
    label: 'Top Scorer',
    points: 10,
    sortOrder: 1,
    tournamentId: 'tournament-1',
    ...overrides,
  };
}

function makePrediction(
  overrides: Partial<{
    id: string;
    userId: string;
    groupId: string;
    bonusTypeId: string;
    predictedValue: string;
    isCorrect: boolean | null;
    pointsEarned: number;
  }> = {},
) {
  return {
    id: 'pred-1',
    userId: 'user-1',
    groupId: 'group-1',
    bonusTypeId: 'bt-1',
    predictedValue: 'Messi',
    isCorrect: null,
    pointsEarned: 0,
    ...overrides,
  };
}

// =============================================================================
// Tests
// =============================================================================

describe('BonusPredictionsService', () => {
  let service: BonusPredictionsService;
  let prisma: typeof mockPrisma;

  beforeEach(async () => {
    jest.clearAllMocks();
    ({ service, prisma } = await createService());
  });

  // ---------------------------------------------------------------------------
  // resolveByKey — happy path
  // ---------------------------------------------------------------------------

  describe('resolveByKey — happy path', () => {
    it('should resolve matching predictions as correct with points', async () => {
      const bonusType = makeBonusType({ points: 10 });
      prisma.tournamentBonusType.findMany.mockResolvedValue([bonusType]);
      prisma.bonusPrediction.findMany.mockResolvedValue([
        makePrediction({ id: 'p1', predictedValue: 'Messi' }),
      ]);
      prisma.bonusPrediction.updateMany.mockResolvedValue({ count: 1 });
      prisma.$transaction.mockImplementation((promises: Promise<unknown>[]) =>
        Promise.all(promises),
      );

      const result = await service.resolveByKey(
        'tournament-1',
        'TOP_SCORER',
        'Messi',
      );

      expect(result).toEqual({ resolved: 1, correct: 1, incorrect: 0 });
      expect(prisma.bonusPrediction.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ['p1'] } },
        data: { isCorrect: true, pointsEarned: 10 },
      });
    });

    it('should resolve non-matching predictions as incorrect with 0 points', async () => {
      const bonusType = makeBonusType({ points: 10 });
      prisma.tournamentBonusType.findMany.mockResolvedValue([bonusType]);
      prisma.bonusPrediction.findMany.mockResolvedValue([
        makePrediction({ id: 'p1', predictedValue: 'Ronaldo' }),
      ]);
      prisma.bonusPrediction.updateMany.mockResolvedValue({ count: 1 });
      prisma.$transaction.mockImplementation((promises: Promise<unknown>[]) =>
        Promise.all(promises),
      );

      const result = await service.resolveByKey(
        'tournament-1',
        'TOP_SCORER',
        'Messi',
      );

      expect(result).toEqual({ resolved: 1, correct: 0, incorrect: 1 });
      expect(prisma.bonusPrediction.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ['p1'] } },
        data: { isCorrect: false, pointsEarned: 0 },
      });
    });

    it('should partition multiple predictions into correct and incorrect', async () => {
      const bonusType = makeBonusType({ points: 15 });
      prisma.tournamentBonusType.findMany.mockResolvedValue([bonusType]);
      prisma.bonusPrediction.findMany.mockResolvedValue([
        makePrediction({ id: 'p1', predictedValue: 'Messi' }),
        makePrediction({ id: 'p2', predictedValue: 'Ronaldo' }),
        makePrediction({ id: 'p3', predictedValue: 'Messi' }),
        makePrediction({ id: 'p4', predictedValue: 'Mbappé' }),
      ]);
      prisma.bonusPrediction.updateMany.mockResolvedValue({ count: 2 });
      prisma.$transaction.mockImplementation((promises: Promise<unknown>[]) =>
        Promise.all(promises),
      );

      const result = await service.resolveByKey(
        'tournament-1',
        'TOP_SCORER',
        'Messi',
      );

      expect(result).toEqual({ resolved: 4, correct: 2, incorrect: 2 });

      // Correct batch
      expect(prisma.bonusPrediction.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ['p1', 'p3'] } },
        data: { isCorrect: true, pointsEarned: 15 },
      });

      // Incorrect batch
      expect(prisma.bonusPrediction.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ['p2', 'p4'] } },
        data: { isCorrect: false, pointsEarned: 0 },
      });
    });
  });

  // ---------------------------------------------------------------------------
  // resolveByKey — case-insensitive matching
  // ---------------------------------------------------------------------------

  describe('resolveByKey — case-insensitive matching', () => {
    it('should match predictions case-insensitively', async () => {
      const bonusType = makeBonusType({ points: 10 });
      prisma.tournamentBonusType.findMany.mockResolvedValue([bonusType]);
      prisma.bonusPrediction.findMany.mockResolvedValue([
        makePrediction({ id: 'p1', predictedValue: 'messi' }),
        makePrediction({ id: 'p2', predictedValue: 'MESSI' }),
        makePrediction({ id: 'p3', predictedValue: 'Messi' }),
      ]);
      prisma.bonusPrediction.updateMany.mockResolvedValue({ count: 3 });
      prisma.$transaction.mockImplementation((promises: Promise<unknown>[]) =>
        Promise.all(promises),
      );

      const result = await service.resolveByKey(
        'tournament-1',
        'TOP_SCORER',
        'Messi',
      );

      expect(result).toEqual({ resolved: 3, correct: 3, incorrect: 0 });
      expect(prisma.bonusPrediction.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ['p1', 'p2', 'p3'] } },
        data: { isCorrect: true, pointsEarned: 10 },
      });
    });

    it('should trim whitespace when comparing values', async () => {
      const bonusType = makeBonusType({ points: 10 });
      prisma.tournamentBonusType.findMany.mockResolvedValue([bonusType]);
      prisma.bonusPrediction.findMany.mockResolvedValue([
        makePrediction({ id: 'p1', predictedValue: '  Messi  ' }),
      ]);
      prisma.bonusPrediction.updateMany.mockResolvedValue({ count: 1 });
      prisma.$transaction.mockImplementation((promises: Promise<unknown>[]) =>
        Promise.all(promises),
      );

      const result = await service.resolveByKey(
        'tournament-1',
        'TOP_SCORER',
        ' Messi ',
      );

      expect(result).toEqual({ resolved: 1, correct: 1, incorrect: 0 });
    });

    it('should find bonus type key case-insensitively', async () => {
      const bonusType = makeBonusType({ key: 'TOP_SCORER', points: 10 });
      prisma.tournamentBonusType.findMany.mockResolvedValue([bonusType]);
      prisma.bonusPrediction.findMany.mockResolvedValue([
        makePrediction({ id: 'p1', predictedValue: 'Messi' }),
      ]);
      prisma.bonusPrediction.updateMany.mockResolvedValue({ count: 1 });
      prisma.$transaction.mockImplementation((promises: Promise<unknown>[]) =>
        Promise.all(promises),
      );

      const result = await service.resolveByKey(
        'tournament-1',
        'top_scorer',
        'Messi',
      );

      expect(result).toEqual({ resolved: 1, correct: 1, incorrect: 0 });
    });
  });

  // ---------------------------------------------------------------------------
  // resolveByKey — idempotency
  // ---------------------------------------------------------------------------

  describe('resolveByKey — idempotency', () => {
    it('should skip already resolved predictions (isCorrect not null)', async () => {
      const bonusType = makeBonusType({ points: 10 });
      prisma.tournamentBonusType.findMany.mockResolvedValue([bonusType]);
      // findMany filters by isCorrect: null, so already-resolved are excluded
      prisma.bonusPrediction.findMany.mockResolvedValue([]);

      const result = await service.resolveByKey(
        'tournament-1',
        'TOP_SCORER',
        'Messi',
      );

      expect(result).toEqual({ resolved: 0, correct: 0, incorrect: 0 });
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('should only resolve unresolved ones when some are already resolved', async () => {
      const bonusType = makeBonusType({ points: 10 });
      prisma.tournamentBonusType.findMany.mockResolvedValue([bonusType]);
      // Only unresolved predictions are returned by the Prisma query (isCorrect: null)
      prisma.bonusPrediction.findMany.mockResolvedValue([
        makePrediction({ id: 'p3', predictedValue: 'Messi' }),
      ]);
      prisma.bonusPrediction.updateMany.mockResolvedValue({ count: 1 });
      prisma.$transaction.mockImplementation((promises: Promise<unknown>[]) =>
        Promise.all(promises),
      );

      const result = await service.resolveByKey(
        'tournament-1',
        'TOP_SCORER',
        'Messi',
      );

      // Only 1 resolved (the unresolved one)
      expect(result).toEqual({ resolved: 1, correct: 1, incorrect: 0 });
    });
  });

  // ---------------------------------------------------------------------------
  // resolveByKey — edge cases
  // ---------------------------------------------------------------------------

  describe('resolveByKey — edge cases', () => {
    it('should throw NotFoundException when bonus type key does not exist', async () => {
      prisma.tournamentBonusType.findMany.mockResolvedValue([
        makeBonusType({ key: 'TOP_SCORER' }),
      ]);

      await expect(
        service.resolveByKey('tournament-1', 'NONEXISTENT', 'Messi'),
      ).rejects.toThrow(NotFoundException);

      await expect(
        service.resolveByKey('tournament-1', 'NONEXISTENT', 'Messi'),
      ).rejects.toThrow(
        "Bonus type 'NONEXISTENT' not found for tournament tournament-1",
      );
    });

    it('should throw NotFoundException when no bonus types exist for tournament', async () => {
      prisma.tournamentBonusType.findMany.mockResolvedValue([]);

      await expect(
        service.resolveByKey('tournament-1', 'TOP_SCORER', 'Messi'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return zeroes when no unresolved predictions exist', async () => {
      prisma.tournamentBonusType.findMany.mockResolvedValue([
        makeBonusType(),
      ]);
      prisma.bonusPrediction.findMany.mockResolvedValue([]);

      const result = await service.resolveByKey(
        'tournament-1',
        'TOP_SCORER',
        'Messi',
      );

      expect(result).toEqual({ resolved: 0, correct: 0, incorrect: 0 });
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('should handle all predictions being correct', async () => {
      const bonusType = makeBonusType({ points: 10 });
      prisma.tournamentBonusType.findMany.mockResolvedValue([bonusType]);
      prisma.bonusPrediction.findMany.mockResolvedValue([
        makePrediction({ id: 'p1', predictedValue: 'Messi' }),
        makePrediction({ id: 'p2', predictedValue: 'messi' }),
      ]);
      prisma.bonusPrediction.updateMany.mockResolvedValue({ count: 2 });
      prisma.$transaction.mockImplementation((promises: Promise<unknown>[]) =>
        Promise.all(promises),
      );

      const result = await service.resolveByKey(
        'tournament-1',
        'TOP_SCORER',
        'Messi',
      );

      expect(result).toEqual({ resolved: 2, correct: 2, incorrect: 0 });

      // Only one updateMany call (correct batch only — no incorrect batch)
      expect(prisma.bonusPrediction.updateMany).toHaveBeenCalledTimes(1);
      expect(prisma.bonusPrediction.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ['p1', 'p2'] } },
        data: { isCorrect: true, pointsEarned: 10 },
      });
    });

    it('should handle all predictions being incorrect', async () => {
      const bonusType = makeBonusType({ points: 10 });
      prisma.tournamentBonusType.findMany.mockResolvedValue([bonusType]);
      prisma.bonusPrediction.findMany.mockResolvedValue([
        makePrediction({ id: 'p1', predictedValue: 'Ronaldo' }),
        makePrediction({ id: 'p2', predictedValue: 'Mbappé' }),
      ]);
      prisma.bonusPrediction.updateMany.mockResolvedValue({ count: 2 });
      prisma.$transaction.mockImplementation((promises: Promise<unknown>[]) =>
        Promise.all(promises),
      );

      const result = await service.resolveByKey(
        'tournament-1',
        'TOP_SCORER',
        'Messi',
      );

      expect(result).toEqual({ resolved: 2, correct: 0, incorrect: 2 });

      // Only one updateMany call (incorrect batch only — no correct batch)
      expect(prisma.bonusPrediction.updateMany).toHaveBeenCalledTimes(1);
      expect(prisma.bonusPrediction.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ['p1', 'p2'] } },
        data: { isCorrect: false, pointsEarned: 0 },
      });
    });

    it('should match numeric string values (e.g. jersey numbers)', async () => {
      const bonusType = makeBonusType({
        key: 'TOP_SCORER',
        points: 10,
      });
      prisma.tournamentBonusType.findMany.mockResolvedValue([bonusType]);
      prisma.bonusPrediction.findMany.mockResolvedValue([
        makePrediction({ id: 'p1', predictedValue: '123' }),
        makePrediction({ id: 'p2', predictedValue: '456' }),
      ]);
      prisma.bonusPrediction.updateMany.mockResolvedValue({ count: 1 });
      prisma.$transaction.mockImplementation((promises: Promise<unknown>[]) =>
        Promise.all(promises),
      );

      const result = await service.resolveByKey(
        'tournament-1',
        'TOP_SCORER',
        '123',
      );

      expect(result).toEqual({ resolved: 2, correct: 1, incorrect: 1 });
    });
  });

  // ---------------------------------------------------------------------------
  // resolveByKey — transaction behavior
  // ---------------------------------------------------------------------------

  describe('resolveByKey — transaction', () => {
    it('should use $transaction for bulk updates', async () => {
      const bonusType = makeBonusType({ points: 10 });
      prisma.tournamentBonusType.findMany.mockResolvedValue([bonusType]);
      prisma.bonusPrediction.findMany.mockResolvedValue([
        makePrediction({ id: 'p1', predictedValue: 'Messi' }),
        makePrediction({ id: 'p2', predictedValue: 'Ronaldo' }),
      ]);
      prisma.bonusPrediction.updateMany.mockResolvedValue({ count: 1 });
      prisma.$transaction.mockImplementation((promises: Promise<unknown>[]) =>
        Promise.all(promises),
      );

      await service.resolveByKey('tournament-1', 'TOP_SCORER', 'Messi');

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      const transactionArg = prisma.$transaction.mock.calls[0][0];
      // 1 correct batch + 1 incorrect batch = 2 updateMany calls
      expect(transactionArg).toHaveLength(2);
    });

    it('should pass only correct batch when no incorrect predictions', async () => {
      const bonusType = makeBonusType({ points: 10 });
      prisma.tournamentBonusType.findMany.mockResolvedValue([bonusType]);
      prisma.bonusPrediction.findMany.mockResolvedValue([
        makePrediction({ id: 'p1', predictedValue: 'Messi' }),
      ]);
      prisma.bonusPrediction.updateMany.mockResolvedValue({ count: 1 });
      prisma.$transaction.mockImplementation((promises: Promise<unknown>[]) =>
        Promise.all(promises),
      );

      await service.resolveByKey('tournament-1', 'TOP_SCORER', 'Messi');

      const transactionArg = prisma.$transaction.mock.calls[0][0];
      expect(transactionArg).toHaveLength(1);
    });

    it('should pass only incorrect batch when no correct predictions', async () => {
      const bonusType = makeBonusType({ points: 10 });
      prisma.tournamentBonusType.findMany.mockResolvedValue([bonusType]);
      prisma.bonusPrediction.findMany.mockResolvedValue([
        makePrediction({ id: 'p1', predictedValue: 'Ronaldo' }),
      ]);
      prisma.bonusPrediction.updateMany.mockResolvedValue({ count: 1 });
      prisma.$transaction.mockImplementation((promises: Promise<unknown>[]) =>
        Promise.all(promises),
      );

      await service.resolveByKey('tournament-1', 'TOP_SCORER', 'Messi');

      const transactionArg = prisma.$transaction.mock.calls[0][0];
      expect(transactionArg).toHaveLength(1);
    });

    it('should not call $transaction when no predictions to resolve', async () => {
      prisma.tournamentBonusType.findMany.mockResolvedValue([
        makeBonusType(),
      ]);
      prisma.bonusPrediction.findMany.mockResolvedValue([]);

      await service.resolveByKey('tournament-1', 'TOP_SCORER', 'Messi');

      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('should query unresolved predictions by bonusTypeId and isCorrect: null', async () => {
      const bonusType = makeBonusType({ id: 'bt-42' });
      prisma.tournamentBonusType.findMany.mockResolvedValue([bonusType]);
      prisma.bonusPrediction.findMany.mockResolvedValue([]);

      await service.resolveByKey('tournament-1', 'TOP_SCORER', 'Messi');

      expect(prisma.bonusPrediction.findMany).toHaveBeenCalledWith({
        where: {
          bonusTypeId: 'bt-42',
          isCorrect: null,
        },
      });
    });
  });
});
