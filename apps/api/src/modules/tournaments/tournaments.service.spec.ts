import { Test, TestingModule } from '@nestjs/testing';
import { TournamentsService } from './tournaments.service';
import { PrismaService } from '../../config/prisma.service';

const mockPrisma = {
  tournament: {
    findMany: jest.fn(),
  },
};

async function createService(): Promise<{ service: TournamentsService }> {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      TournamentsService,
      { provide: PrismaService, useValue: mockPrisma },
    ],
  }).compile();

  return {
    service: module.get<TournamentsService>(TournamentsService),
  };
}

describe('TournamentsService', () => {
  let service: TournamentsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockPrisma.tournament.findMany.mockResolvedValue([]);
    ({ service } = await createService());
  });

  describe('findAll', () => {
    it('should apply status IN filter when statuses is provided', async () => {
      await service.findAll({ statuses: ['UPCOMING', 'IN_PROGRESS'] });

      expect(mockPrisma.tournament.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isActive: true,
            status: { in: ['UPCOMING', 'IN_PROGRESS'] },
          }),
        }),
      );
    });

    it('should preserve single status filter behavior', async () => {
      await service.findAll({ status: 'UPCOMING' });

      expect(mockPrisma.tournament.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isActive: true,
            status: { in: ['UPCOMING'] },
          }),
        }),
      );
    });

    it('should not add status filter when no status is provided', async () => {
      await service.findAll();

      expect(mockPrisma.tournament.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            isActive: true,
          },
        }),
      );
    });
  });
});
