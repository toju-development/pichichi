import { Test, TestingModule } from '@nestjs/testing';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';

// ---------------------------------------------------------------------------
// Mock definitions
// ---------------------------------------------------------------------------

const mockGroupsService = {
  create: jest.fn(),
  findAllByUser: jest.fn(),
  findById: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  joinByCode: jest.fn(),
  getMembers: jest.fn(),
  removeMember: jest.fn(),
  leaveGroup: jest.fn(),
  addTournament: jest.fn(),
  getGroupTournaments: jest.fn(),
  getUpcomingPredictions: jest.fn(),
  checkRemoveTournament: jest.fn(),
  removeTournament: jest.fn(),
};

// ---------------------------------------------------------------------------
// Test module builder
// ---------------------------------------------------------------------------

async function createController(): Promise<GroupsController> {
  const module: TestingModule = await Test.createTestingModule({
    controllers: [GroupsController],
    providers: [
      { provide: GroupsService, useValue: mockGroupsService },
    ],
  }).compile();

  return module.get<GroupsController>(GroupsController);
}

// =============================================================================
// Tests
// =============================================================================

describe('GroupsController', () => {
  let controller: GroupsController;

  const mockUser = { sub: 'user-uuid-123', email: 'test@test.com' };

  beforeEach(async () => {
    jest.clearAllMocks();
    controller = await createController();
  });

  // ---------------------------------------------------------------------------
  // GET /:id/upcoming-predictions
  // ---------------------------------------------------------------------------

  describe('getUpcomingPredictions', () => {
    const groupId = 'group-uuid-1';

    it('should call service with groupId, userId, and tz', async () => {
      mockGroupsService.getUpcomingPredictions.mockResolvedValue([]);

      const result = await controller.getUpcomingPredictions(
        mockUser,
        groupId,
        'America/Argentina/Buenos_Aires',
      );

      expect(result).toEqual([]);
      expect(mockGroupsService.getUpcomingPredictions).toHaveBeenCalledWith(
        groupId,
        mockUser.sub,
        'America/Argentina/Buenos_Aires',
      );
    });

    it('should pass undefined tz when not provided', async () => {
      mockGroupsService.getUpcomingPredictions.mockResolvedValue([]);

      await controller.getUpcomingPredictions(mockUser, groupId);

      expect(mockGroupsService.getUpcomingPredictions).toHaveBeenCalledWith(
        groupId,
        mockUser.sub,
        undefined,
      );
    });

    it('should return matches from service', async () => {
      const mockMatches = [
        {
          matchId: 'match-1',
          homeTeam: { id: 'team-1', name: 'Argentina', logoUrl: null },
          awayTeam: { id: 'team-2', name: 'Brazil', logoUrl: null },
          scheduledAt: '2026-06-15T18:00:00.000Z',
          status: 'SCHEDULED',
          hasPrediction: false,
        },
      ];
      mockGroupsService.getUpcomingPredictions.mockResolvedValue(mockMatches);

      const result = await controller.getUpcomingPredictions(mockUser, groupId);

      expect(result).toEqual(mockMatches);
    });

    it('should propagate service errors', async () => {
      mockGroupsService.getUpcomingPredictions.mockRejectedValue(
        new Error('Service error'),
      );

      await expect(
        controller.getUpcomingPredictions(mockUser, groupId),
      ).rejects.toThrow('Service error');
    });
  });

  // ---------------------------------------------------------------------------
  // Guard metadata
  // ---------------------------------------------------------------------------

  describe('guard metadata', () => {
    it('should have JwtAuthGuard applied at controller level', () => {
      const guards = Reflect.getMetadata('__guards__', GroupsController);
      expect(guards).toBeDefined();
      expect(guards).toHaveLength(1);
      expect(guards[0].name).toBe('JwtAuthGuard');
    });
  });
});
