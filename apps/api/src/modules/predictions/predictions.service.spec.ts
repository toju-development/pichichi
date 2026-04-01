import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, ForbiddenException } from '@nestjs/common';
import { PredictionsService } from './predictions.service';
import { PrismaService } from '../../config/prisma.service';

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

const mockPrisma = {
  groupMember: { findFirst: jest.fn() },
  match: { findUnique: jest.fn() },
  groupTournament: { findUnique: jest.fn() },
  prediction: { upsert: jest.fn() },
};

async function createService(): Promise<{
  service: PredictionsService;
  prisma: typeof mockPrisma;
}> {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      PredictionsService,
      { provide: PrismaService, useValue: mockPrisma },
    ],
  }).compile();

  return {
    service: module.get<PredictionsService>(PredictionsService),
    prisma: mockPrisma,
  };
}

// ---------------------------------------------------------------------------
// Common fixtures
// ---------------------------------------------------------------------------

const userId = 'user-1';
const matchId = 'match-1';
const groupId = 'group-1';
const tournamentId = 'tournament-1';

const baseDto = {
  matchId,
  groupId,
  predictedHome: 2,
  predictedAway: 1,
};

const activeMembership = {
  id: 'member-1',
  userId,
  groupId,
  isActive: true,
};

function createMatch(minutesUntilKickoff: number) {
  const scheduledAt = new Date(Date.now() + minutesUntilKickoff * 60 * 1000);
  return {
    id: matchId,
    tournamentId,
    status: 'SCHEDULED',
    scheduledAt,
    homeTeam: { name: 'Argentina', shortName: 'ARG', flagUrl: null },
    awayTeam: { name: 'Brasil', shortName: 'BRA', flagUrl: null },
  };
}

const groupTournamentRecord = {
  groupId,
  tournamentId,
};

const upsertedPrediction = {
  id: 'pred-1',
  userId,
  matchId,
  groupId,
  predictedHome: 2,
  predictedAway: 1,
  pointsEarned: 0,
  pointType: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  match: {
    id: matchId,
    scheduledAt: new Date(Date.now() + 60 * 60 * 1000),
    status: 'SCHEDULED',
    homeScore: null,
    awayScore: null,
    phase: 'GROUP_STAGE',
    homeTeam: { name: 'Argentina', shortName: 'ARG', flagUrl: null },
    awayTeam: { name: 'Brasil', shortName: 'BRA', flagUrl: null },
  },
};

// =============================================================================
// Tests
// =============================================================================

describe('PredictionsService', () => {
  let service: PredictionsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    ({ service } = await createService());
  });

  // ---------------------------------------------------------------------------
  // Lock buffer tests (Task 6.3)
  // ---------------------------------------------------------------------------

  describe('upsert — lock buffer', () => {
    beforeEach(() => {
      // Always pass membership and groupTournament checks
      mockPrisma.groupMember.findFirst.mockResolvedValue(activeMembership);
      mockPrisma.groupTournament.findUnique.mockResolvedValue(
        groupTournamentRecord,
      );
      mockPrisma.prediction.upsert.mockResolvedValue(upsertedPrediction);
    });

    it('should allow prediction 6 minutes before kickoff', async () => {
      mockPrisma.match.findUnique.mockResolvedValue(createMatch(6));

      // Should NOT throw
      const result = await service.upsert(userId, baseDto);
      expect(result).toBeDefined();
      expect(result.id).toBe('pred-1');
    });

    it('should reject prediction exactly 5 minutes before kickoff', async () => {
      // At exactly 5 minutes, lockTime <= now is true
      // lockTime = scheduledAt - 5min = now + 5min - 5min = now
      // lockTime <= new Date() → true → rejected
      mockPrisma.match.findUnique.mockResolvedValue(createMatch(5));

      await expect(service.upsert(userId, baseDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should reject prediction 4 minutes 59 seconds before kickoff', async () => {
      // 4min 59s = 4.983 min → lockTime = now + 4.983min - 5min = now - 0.017min (in the past)
      const minutesBeforeKickoff = 4 + 59 / 60; // 4.9833...
      mockPrisma.match.findUnique.mockResolvedValue(
        createMatch(minutesBeforeKickoff),
      );

      await expect(service.upsert(userId, baseDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should reject prediction after kickoff', async () => {
      // Kickoff was 10 minutes ago → scheduledAt is in the past
      mockPrisma.match.findUnique.mockResolvedValue(createMatch(-10));

      await expect(service.upsert(userId, baseDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should reject prediction at kickoff time (0 minutes before)', async () => {
      mockPrisma.match.findUnique.mockResolvedValue(createMatch(0));

      await expect(service.upsert(userId, baseDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should reject prediction when match is not SCHEDULED', async () => {
      const liveMatch = {
        ...createMatch(60), // far in the future but already LIVE
        status: 'LIVE',
      };
      mockPrisma.match.findUnique.mockResolvedValue(liveMatch);

      await expect(service.upsert(userId, baseDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should allow prediction 5 minutes and 1 second before kickoff', async () => {
      const minutesBeforeKickoff = 5 + 1 / 60; // just over 5 min → lockTime > now
      mockPrisma.match.findUnique.mockResolvedValue(
        createMatch(minutesBeforeKickoff),
      );

      const result = await service.upsert(userId, baseDto);
      expect(result).toBeDefined();
    });
  });

  // ---------------------------------------------------------------------------
  // GroupTournament validation tests (Task 6.3)
  // ---------------------------------------------------------------------------

  describe('upsert — GroupTournament validation', () => {
    beforeEach(() => {
      // Always pass membership check
      mockPrisma.groupMember.findFirst.mockResolvedValue(activeMembership);
      // Always have a valid scheduled match far in the future
      mockPrisma.match.findUnique.mockResolvedValue(createMatch(60));
      mockPrisma.prediction.upsert.mockResolvedValue(upsertedPrediction);
    });

    it('should allow prediction when tournament IS in group', async () => {
      mockPrisma.groupTournament.findUnique.mockResolvedValue(
        groupTournamentRecord,
      );

      const result = await service.upsert(userId, baseDto);
      expect(result).toBeDefined();
      expect(result.id).toBe('pred-1');
    });

    it('should reject prediction when tournament is NOT in group', async () => {
      mockPrisma.groupTournament.findUnique.mockResolvedValue(null);

      await expect(service.upsert(userId, baseDto)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should reject with correct message when tournament not in group', async () => {
      mockPrisma.groupTournament.findUnique.mockResolvedValue(null);

      await expect(service.upsert(userId, baseDto)).rejects.toThrow(
        'This tournament is not part of this group',
      );
    });

    it('should query groupTournament with correct composite key', async () => {
      mockPrisma.groupTournament.findUnique.mockResolvedValue(
        groupTournamentRecord,
      );

      await service.upsert(userId, baseDto);

      expect(mockPrisma.groupTournament.findUnique).toHaveBeenCalledWith({
        where: {
          groupId_tournamentId: {
            groupId,
            tournamentId,
          },
        },
      });
    });
  });
});
