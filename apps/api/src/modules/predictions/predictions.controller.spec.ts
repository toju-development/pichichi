import { Test, TestingModule } from '@nestjs/testing';
import { PredictionsController } from './predictions.controller';
import { PredictionsService } from './predictions.service';
import { ScoringService } from '../scoring/scoring.service';

// ---------------------------------------------------------------------------
// Mock definitions
// ---------------------------------------------------------------------------

const mockPredictionsService = {
  upsert: jest.fn(),
  findByGroupAndUser: jest.fn(),
  findByMatchAndGroup: jest.fn(),
  findByGroupAndMember: jest.fn(),
  findUserPrediction: jest.fn(),
  getStats: jest.fn(),
};

const mockScoringService = {
  calculatePointsForMatch: jest.fn(),
};

// ---------------------------------------------------------------------------
// Test module builder
// ---------------------------------------------------------------------------

async function createController(): Promise<PredictionsController> {
  const module: TestingModule = await Test.createTestingModule({
    controllers: [PredictionsController],
    providers: [
      { provide: PredictionsService, useValue: mockPredictionsService },
      { provide: ScoringService, useValue: mockScoringService },
    ],
  }).compile();

  return module.get<PredictionsController>(PredictionsController);
}

// =============================================================================
// Tests
// =============================================================================

describe('PredictionsController', () => {
  let controller: PredictionsController;

  const mockUser = { sub: 'user-uuid-123', email: 'test@test.com' };

  beforeEach(async () => {
    jest.clearAllMocks();
    controller = await createController();
  });

  // ---------------------------------------------------------------------------
  // GET /predictions/group/:groupId/member/:userId
  // ---------------------------------------------------------------------------

  describe('findByGroupAndMember', () => {
    const groupId = 'group-uuid-1';
    const targetUserId = 'target-user-uuid';

    it('should call service with correct parameters', async () => {
      const mockResponse = {
        userId: targetUserId,
        displayName: 'Target',
        avatarUrl: null,
        totalPoints: 42,
        predictions: [],
      };
      mockPredictionsService.findByGroupAndMember.mockResolvedValue(mockResponse);

      const result = await controller.findByGroupAndMember(
        mockUser,
        groupId,
        targetUserId,
      );

      expect(result).toEqual(mockResponse);
      expect(mockPredictionsService.findByGroupAndMember).toHaveBeenCalledWith(
        groupId,
        targetUserId,
        mockUser.sub,
      );
    });

    it('should propagate service errors', async () => {
      mockPredictionsService.findByGroupAndMember.mockRejectedValue(
        new Error('Forbidden'),
      );

      await expect(
        controller.findByGroupAndMember(mockUser, groupId, targetUserId),
      ).rejects.toThrow('Forbidden');
    });

    it('should return response with predictions array and totalPoints', async () => {
      const mockResponse = {
        userId: targetUserId,
        displayName: 'Player',
        avatarUrl: null,
        totalPoints: 100,
        predictions: [
          {
            id: 'pred-1',
            matchId: 'match-1',
            predictedHome: 2,
            predictedAway: 1,
            pointsEarned: 3,
            pointType: 'EXACT',
            match: {
              scheduledAt: '2026-06-15T18:00:00.000Z',
              status: 'FINISHED',
              homeScore: 2,
              awayScore: 1,
              phase: 'GROUP_STAGE',
              homeTeamName: 'Argentina',
              awayTeamName: 'Brazil',
              homeTeamShortName: 'ARG',
              awayTeamShortName: 'BRA',
              homeTeamFlagUrl: null,
              awayTeamFlagUrl: null,
            },
            tournamentId: 'tournament-1',
            tournamentName: 'World Cup 2026',
            tournamentLogoUrl: null,
          },
        ],
      };
      mockPredictionsService.findByGroupAndMember.mockResolvedValue(mockResponse);

      const result = await controller.findByGroupAndMember(
        mockUser,
        groupId,
        targetUserId,
      );

      expect(result.totalPoints).toBe(100);
      expect(result.predictions).toHaveLength(1);
    });
  });

  // ---------------------------------------------------------------------------
  // Guard metadata
  // ---------------------------------------------------------------------------

  describe('guard metadata', () => {
    it('should have JwtAuthGuard applied at controller level', () => {
      const guards = Reflect.getMetadata('__guards__', PredictionsController);
      expect(guards).toBeDefined();
      expect(guards).toHaveLength(1);
      expect(guards[0].name).toBe('JwtAuthGuard');
    });
  });
});
