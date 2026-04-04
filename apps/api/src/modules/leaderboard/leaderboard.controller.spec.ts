import { Test, TestingModule } from '@nestjs/testing';
import { LeaderboardController } from './leaderboard.controller';
import { LeaderboardService } from './leaderboard.service';
import type { GlobalLeaderboardResponseDto } from './dto/global-leaderboard-response.dto';

// ---------------------------------------------------------------------------
// Mock definitions
// ---------------------------------------------------------------------------

const mockLeaderboardService = {
  getGroupLeaderboard: jest.fn(),
  getGroupLeaderboardByPhase: jest.fn(),
  getUserPosition: jest.fn(),
  getGlobalLeaderboard: jest.fn(),
};

const mockUser = { sub: 'user-uuid-123', email: 'test@test.com' };

// ---------------------------------------------------------------------------
// Test module builder
// ---------------------------------------------------------------------------

async function createController(): Promise<LeaderboardController> {
  const module: TestingModule = await Test.createTestingModule({
    controllers: [LeaderboardController],
    providers: [
      { provide: LeaderboardService, useValue: mockLeaderboardService },
    ],
  }).compile();

  return module.get<LeaderboardController>(LeaderboardController);
}

// =============================================================================
// Tests — GET /leaderboard/global
// =============================================================================

describe('LeaderboardController — GET /leaderboard/global', () => {
  let controller: LeaderboardController;

  const mockGlobalResponse: GlobalLeaderboardResponseDto = {
    entries: [
      {
        position: 1,
        userId: 'user-1',
        displayName: 'Player One',
        username: 'player1',
        avatarUrl: null,
        totalPoints: 50,
        exactCount: 5,
        goalDiffCount: 3,
        winnerCount: 2,
        missCount: 1,
        bonusPoints: 10,
        streak: 0,
      },
    ],
    total: 42,
    currentUserEntry: null,
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    controller = await createController();
  });

  // ---------------------------------------------------------------------------
  // Delegates to service with correct parameters
  // ---------------------------------------------------------------------------

  it('should call service with default limit=20 and offset=0 when no query params', async () => {
    mockLeaderboardService.getGlobalLeaderboard.mockResolvedValue(mockGlobalResponse);

    const result = await controller.getGlobalLeaderboard(mockUser);

    expect(mockLeaderboardService.getGlobalLeaderboard).toHaveBeenCalledWith(
      'user-uuid-123',
      20,
      0,
    );
    expect(result).toEqual(mockGlobalResponse);
  });

  it('should pass custom limit and offset to service', async () => {
    mockLeaderboardService.getGlobalLeaderboard.mockResolvedValue(mockGlobalResponse);

    await controller.getGlobalLeaderboard(mockUser, '10', '40');

    expect(mockLeaderboardService.getGlobalLeaderboard).toHaveBeenCalledWith(
      'user-uuid-123',
      10,
      40,
    );
  });

  // ---------------------------------------------------------------------------
  // Limit clamping (max 50)
  // ---------------------------------------------------------------------------

  it('should clamp limit to max 50', async () => {
    mockLeaderboardService.getGlobalLeaderboard.mockResolvedValue(mockGlobalResponse);

    await controller.getGlobalLeaderboard(mockUser, '100', '0');

    expect(mockLeaderboardService.getGlobalLeaderboard).toHaveBeenCalledWith(
      'user-uuid-123',
      50,
      0,
    );
  });

  it('should clamp limit to min 1', async () => {
    mockLeaderboardService.getGlobalLeaderboard.mockResolvedValue(mockGlobalResponse);

    await controller.getGlobalLeaderboard(mockUser, '0', '0');

    expect(mockLeaderboardService.getGlobalLeaderboard).toHaveBeenCalledWith(
      'user-uuid-123',
      1,
      0,
    );
  });

  // ---------------------------------------------------------------------------
  // Invalid query params default correctly
  // ---------------------------------------------------------------------------

  it('should default to 20 when limit is not a number', async () => {
    mockLeaderboardService.getGlobalLeaderboard.mockResolvedValue(mockGlobalResponse);

    await controller.getGlobalLeaderboard(mockUser, 'abc', 'xyz');

    expect(mockLeaderboardService.getGlobalLeaderboard).toHaveBeenCalledWith(
      'user-uuid-123',
      20,
      0,
    );
  });

  it('should handle negative offset by clamping to 0', async () => {
    mockLeaderboardService.getGlobalLeaderboard.mockResolvedValue(mockGlobalResponse);

    await controller.getGlobalLeaderboard(mockUser, '20', '-10');

    expect(mockLeaderboardService.getGlobalLeaderboard).toHaveBeenCalledWith(
      'user-uuid-123',
      20,
      0,
    );
  });

  // ---------------------------------------------------------------------------
  // Returns correct response shape
  // ---------------------------------------------------------------------------

  it('should return entries, total, and currentUserEntry', async () => {
    const responseWithUser: GlobalLeaderboardResponseDto = {
      ...mockGlobalResponse,
      currentUserEntry: {
        position: 15,
        userId: 'user-uuid-123',
        displayName: 'Test User',
        username: 'testuser',
        avatarUrl: 'https://avatar.url',
        totalPoints: 25,
        exactCount: 2,
        goalDiffCount: 3,
        winnerCount: 1,
        missCount: 4,
        bonusPoints: 5,
        streak: 0,
      },
    };

    mockLeaderboardService.getGlobalLeaderboard.mockResolvedValue(responseWithUser);

    const result = await controller.getGlobalLeaderboard(mockUser);

    expect(result.entries).toHaveLength(1);
    expect(result.total).toBe(42);
    expect(result.currentUserEntry).not.toBeNull();
    expect(result.currentUserEntry!.userId).toBe('user-uuid-123');
  });

  // ---------------------------------------------------------------------------
  // Error propagation
  // ---------------------------------------------------------------------------

  it('should propagate service errors', async () => {
    mockLeaderboardService.getGlobalLeaderboard.mockRejectedValue(
      new Error('Database error'),
    );

    await expect(
      controller.getGlobalLeaderboard(mockUser),
    ).rejects.toThrow('Database error');
  });
});
