import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TournamentsController } from './tournaments.controller';
import { TournamentsService } from './tournaments.service';

const mockTournamentsService = {
  findAll: jest.fn(),
};

async function createController(): Promise<TournamentsController> {
  const module: TestingModule = await Test.createTestingModule({
    controllers: [TournamentsController],
    providers: [
      { provide: TournamentsService, useValue: mockTournamentsService },
    ],
  }).compile();

  return module.get<TournamentsController>(TournamentsController);
}

describe('TournamentsController', () => {
  let controller: TournamentsController;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockTournamentsService.findAll.mockResolvedValue([]);
    controller = await createController();
  });

  describe('findAll', () => {
    it('should parse CSV statuses and delegate as statuses array', async () => {
      await controller.findAll(undefined, 'UPCOMING,IN_PROGRESS');

      expect(mockTournamentsService.findAll).toHaveBeenCalledWith({
        type: undefined,
        status: undefined,
        statuses: ['UPCOMING', 'IN_PROGRESS'],
      });
    });

    it('should parse repeated statuses query params', async () => {
      await controller.findAll(undefined, ['UPCOMING', 'IN_PROGRESS']);

      expect(mockTournamentsService.findAll).toHaveBeenCalledWith({
        type: undefined,
        status: undefined,
        statuses: ['UPCOMING', 'IN_PROGRESS'],
      });
    });

    it('should keep single status behavior when statuses is not provided', async () => {
      await controller.findAll('UPCOMING');

      expect(mockTournamentsService.findAll).toHaveBeenCalledWith({
        type: undefined,
        status: 'UPCOMING',
        statuses: undefined,
      });
    });

    it('should throw BadRequestException for invalid statuses', async () => {
      await expect(
        controller.findAll(undefined, 'UPCOMING,INVALID_STATUS'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
