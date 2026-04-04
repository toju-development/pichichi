import { Test, TestingModule } from '@nestjs/testing';
import { NotificationType } from '@prisma/client';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../../config/prisma.service';

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

const mockPrisma = {
  notification: {
    create: jest.fn(),
    createMany: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    count: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
};

async function createService(): Promise<{
  service: NotificationsService;
  prisma: typeof mockPrisma;
}> {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      NotificationsService,
      { provide: PrismaService, useValue: mockPrisma },
    ],
  }).compile();

  return {
    service: module.get<NotificationsService>(NotificationsService),
    prisma: mockPrisma,
  };
}

// =============================================================================
// NotificationsService
// =============================================================================

describe('NotificationsService', () => {
  let service: NotificationsService;
  let prisma: typeof mockPrisma;

  beforeEach(async () => {
    jest.clearAllMocks();
    ({ service, prisma } = await createService());
  });

  // ---------------------------------------------------------------------------
  // createMany()
  // ---------------------------------------------------------------------------

  describe('createMany', () => {
    it('should batch-insert multiple notifications and return the count', async () => {
      prisma.notification.createMany.mockResolvedValue({ count: 3 });

      const entries = [
        {
          userId: 'user-1',
          type: 'MATCH_RESULT' as const,
          title: 'Argentina vs Brazil',
          body: '2-1 — You earned 5 points!',
          data: { matchId: 'm1', tournamentId: 't1' },
        },
        {
          userId: 'user-2',
          type: 'MATCH_RESULT' as const,
          title: 'Argentina vs Brazil',
          body: '2-1 — You earned 3 points!',
          data: { matchId: 'm1', tournamentId: 't1' },
        },
        {
          userId: 'user-3',
          type: 'MATCH_RESULT' as const,
          title: 'Argentina vs Brazil',
          body: '2-1 — You earned 0 points',
          data: { matchId: 'm1', tournamentId: 't1' },
        },
      ];

      const result = await service.createMany(entries);

      expect(result).toEqual({ count: 3 });
      expect(prisma.notification.createMany).toHaveBeenCalledTimes(1);
      expect(prisma.notification.createMany).toHaveBeenCalledWith({
        data: entries.map((e) => ({
          userId: e.userId,
          type: e.type,
          title: e.title,
          body: e.body,
          data: e.data,
        })),
      });
    });

    it('should handle an empty array gracefully (count: 0)', async () => {
      prisma.notification.createMany.mockResolvedValue({ count: 0 });

      const result = await service.createMany([]);

      expect(result).toEqual({ count: 0 });
      expect(prisma.notification.createMany).toHaveBeenCalledTimes(1);
      expect(prisma.notification.createMany).toHaveBeenCalledWith({ data: [] });
    });

    it('should log the count of created notifications', async () => {
      prisma.notification.createMany.mockResolvedValue({ count: 5 });
      const logSpy = jest.spyOn(service['logger'], 'log');

      await service.createMany([
        {
          userId: 'user-1',
          type: 'GROUP_JOIN' as const,
          title: 'Los Pibes',
          body: 'Juan joined the group',
        },
        {
          userId: 'user-2',
          type: 'GROUP_JOIN' as const,
          title: 'Los Pibes',
          body: 'Juan joined the group',
        },
        {
          userId: 'user-3',
          type: 'GROUP_JOIN' as const,
          title: 'Los Pibes',
          body: 'Juan joined the group',
        },
        {
          userId: 'user-4',
          type: 'GROUP_JOIN' as const,
          title: 'Los Pibes',
          body: 'Juan joined the group',
        },
        {
          userId: 'user-5',
          type: 'GROUP_JOIN' as const,
          title: 'Los Pibes',
          body: 'Juan joined the group',
        },
      ]);

      expect(logSpy).toHaveBeenCalledWith('Created 5 notifications');
    });

    it('should handle entries without optional data field', async () => {
      prisma.notification.createMany.mockResolvedValue({ count: 1 });

      const entries = [
        {
          userId: 'user-1',
          type: 'MATCH_REMINDER' as const,
          title: 'Match starting soon',
          body: 'Argentina vs Brazil kicks off in 30 minutes!',
        },
      ];

      const result = await service.createMany(entries);

      expect(result).toEqual({ count: 1 });
      expect(prisma.notification.createMany).toHaveBeenCalledWith({
        data: [
          {
            userId: 'user-1',
            type: 'MATCH_REMINDER',
            title: 'Match starting soon',
            body: 'Argentina vs Brazil kicks off in 30 minutes!',
            data: undefined,
          },
        ],
      });
    });
  });
});
