import { Test, TestingModule } from '@nestjs/testing';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import type { DashboardResponseDto } from '@pichichi/shared';

// ---------------------------------------------------------------------------
// Mock definitions
// ---------------------------------------------------------------------------

const mockDashboardService = {
  getDashboard: jest.fn(),
};

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

const mockUserId = 'user-uuid-123';

const mockDashboardResponse: DashboardResponseDto = {
  todayMatches: [
    {
      matchId: 'match-1',
      homeTeam: { id: 'team-1', name: 'Argentina', logoUrl: null },
      awayTeam: { id: 'team-2', name: 'Brazil', logoUrl: null },
      homePlaceholder: null,
      awayPlaceholder: null,
      scheduledAt: '2026-04-05T18:00:00.000Z',
      status: 'SCHEDULED',
      homeScore: null,
      awayScore: null,
      phase: 'GROUP_STAGE',
      tournamentName: 'World Cup 2026',
      tournamentSlug: 'world-cup-2026',
      groupId: 'group-1',
      groupName: 'Amigos',
      hasPrediction: false,
      predictedHome: null,
      predictedAway: null,
      externalId: 12345,
      isLocked: false,
    },
  ],
  stats: {
    totalPoints: 42,
    totalPredictions: 10,
    exactCount: 3,
    accuracy: 70,
    groupCount: 2,
  },
  groups: [],
};

// ---------------------------------------------------------------------------
// Test module builder
// ---------------------------------------------------------------------------

async function createController(): Promise<DashboardController> {
  const module: TestingModule = await Test.createTestingModule({
    controllers: [DashboardController],
    providers: [
      { provide: DashboardService, useValue: mockDashboardService },
    ],
  }).compile();

  return module.get<DashboardController>(DashboardController);
}

// =============================================================================
// Tests
// =============================================================================

describe('DashboardController', () => {
  let controller: DashboardController;

  beforeEach(async () => {
    jest.clearAllMocks();
    controller = await createController();
  });

  // ---------------------------------------------------------------------------
  // GET /dashboard
  // ---------------------------------------------------------------------------

  describe('getDashboard', () => {
    it('should return dashboard data from service', async () => {
      mockDashboardService.getDashboard.mockResolvedValue(mockDashboardResponse);

      const result = await controller.getDashboard({
        sub: mockUserId,
        email: 'test@test.com',
      });

      expect(result).toEqual(mockDashboardResponse);
    });

    it('should pass the correct userId (user.sub) to the service', async () => {
      mockDashboardService.getDashboard.mockResolvedValue(mockDashboardResponse);

      await controller.getDashboard({
        sub: mockUserId,
        email: 'test@test.com',
      });

      expect(mockDashboardService.getDashboard).toHaveBeenCalledTimes(1);
      expect(mockDashboardService.getDashboard).toHaveBeenCalledWith(mockUserId);
    });

    it('should propagate service errors', async () => {
      mockDashboardService.getDashboard.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(
        controller.getDashboard({ sub: mockUserId, email: 'test@test.com' }),
      ).rejects.toThrow('Database error');
    });

    it('should return response with null sections when service returns them', async () => {
      const partialResponse: DashboardResponseDto = {
        todayMatches: null,
        stats: null,
        groups: null,
      };
      mockDashboardService.getDashboard.mockResolvedValue(partialResponse);

      const result = await controller.getDashboard({
        sub: mockUserId,
        email: 'test@test.com',
      });

      expect(result.todayMatches).toBeNull();
      expect(result.stats).toBeNull();
      expect(result.groups).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // Guard metadata
  // ---------------------------------------------------------------------------

  describe('guard metadata', () => {
    it('should have JwtAuthGuard applied at controller level', () => {
      // Reflector reads guard metadata from the controller class
      const guards = Reflect.getMetadata('__guards__', DashboardController);
      expect(guards).toBeDefined();
      expect(guards).toHaveLength(1);

      // The guard is stored as a class reference
      const [GuardClass] = guards;
      expect(GuardClass.name).toBe('JwtAuthGuard');
    });
  });
});
