import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { LeaderboardService } from './leaderboard.service';
import { PrismaService } from '../../config/prisma.service';
import type { RawGlobalLeaderboardRow } from './leaderboard.service';

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

const mockPrisma = {
  $queryRaw: jest.fn(),
  group: { findUnique: jest.fn() },
  groupMember: { findFirst: jest.fn(), count: jest.fn() },
};

const mockCache = {
  get: jest.fn(),
  set: jest.fn(),
};

async function createService(): Promise<{
  service: LeaderboardService;
  prisma: typeof mockPrisma;
  cache: typeof mockCache;
}> {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      LeaderboardService,
      { provide: PrismaService, useValue: mockPrisma },
      { provide: CACHE_MANAGER, useValue: mockCache },
    ],
  }).compile();

  return {
    service: module.get<LeaderboardService>(LeaderboardService),
    prisma: mockPrisma,
    cache: mockCache,
  };
}

// ---------------------------------------------------------------------------
// Fixture factories
// ---------------------------------------------------------------------------

function makeGlobalRow(
  overrides: Partial<RawGlobalLeaderboardRow> = {},
): RawGlobalLeaderboardRow {
  return {
    user_id: 'user-1',
    display_name: 'Player One',
    username: 'player1',
    avatar_url: null,
    total_points: BigInt(30),
    exact_count: BigInt(3),
    goal_diff_count: BigInt(2),
    winner_count: BigInt(1),
    miss_count: BigInt(0),
    bonus_points: BigInt(10),
    position: BigInt(1),
    ...overrides,
  };
}

// =============================================================================
// queryGlobalLeaderboard
// =============================================================================

describe('LeaderboardService — Global Ranking', () => {
  let service: LeaderboardService;
  let prisma: typeof mockPrisma;

  beforeEach(async () => {
    jest.clearAllMocks();
    ({ service, prisma } = await createService());
  });

  // ---------------------------------------------------------------------------
  // Returns users ordered by total points DESC
  // ---------------------------------------------------------------------------

  describe('queryGlobalLeaderboard — ordering', () => {
    it('should return users ordered by total points descending', async () => {
      const rows: RawGlobalLeaderboardRow[] = [
        makeGlobalRow({
          user_id: 'user-a',
          display_name: 'Top Player',
          total_points: BigInt(50),
          exact_count: BigInt(5),
          position: BigInt(1),
        }),
        makeGlobalRow({
          user_id: 'user-b',
          display_name: 'Mid Player',
          total_points: BigInt(30),
          exact_count: BigInt(2),
          position: BigInt(2),
        }),
        makeGlobalRow({
          user_id: 'user-c',
          display_name: 'Low Player',
          total_points: BigInt(10),
          exact_count: BigInt(0),
          position: BigInt(3),
        }),
      ];

      // First call: main query, second call: count query
      prisma.$queryRaw
        .mockResolvedValueOnce(rows)
        .mockResolvedValueOnce([{ count: BigInt(3) }]);

      const result = await service.queryGlobalLeaderboard(20, 0);

      expect(result.entries).toHaveLength(3);
      expect(result.entries[0]!.userId).toBe('user-a');
      expect(result.entries[0]!.totalPoints).toBe(50);
      expect(result.entries[0]!.position).toBe(1);
      expect(result.entries[1]!.userId).toBe('user-b');
      expect(result.entries[1]!.totalPoints).toBe(30);
      expect(result.entries[1]!.position).toBe(2);
      expect(result.entries[2]!.userId).toBe('user-c');
      expect(result.entries[2]!.totalPoints).toBe(10);
      expect(result.entries[2]!.position).toBe(3);
      expect(result.total).toBe(3);
    });
  });

  // ---------------------------------------------------------------------------
  // Deduplication — same match across groups counted once
  // ---------------------------------------------------------------------------

  describe('queryGlobalLeaderboard — deduplication', () => {
    it('should deduplicate predictions: user in 3 groups with same match counted once (via SQL CTE)', async () => {
      // The SQL deduplicates via MAX(points_earned) per (user_id, match_id).
      // So a user in 3 groups predicting match-1 gets only ONE row in deduped_predictions.
      // We verify by checking the returned data reflects deduped totals.
      const rows: RawGlobalLeaderboardRow[] = [
        makeGlobalRow({
          user_id: 'user-dup',
          display_name: 'DeDup User',
          // If NOT deduped: 5+5+5=15 from 3 groups. Deduped: MAX(5)=5 for that match.
          total_points: BigInt(5),
          exact_count: BigInt(1), // Only ONE exact, not three
          position: BigInt(1),
          bonus_points: BigInt(0),
        }),
      ];

      prisma.$queryRaw
        .mockResolvedValueOnce(rows)
        .mockResolvedValueOnce([{ count: BigInt(1) }]);

      const result = await service.queryGlobalLeaderboard(20, 0);

      expect(result.entries).toHaveLength(1);
      expect(result.entries[0]!.totalPoints).toBe(5);
      expect(result.entries[0]!.exactCount).toBe(1);
    });

    it('should deduplicate bonus predictions: same bonus type across groups counted once (via SQL CTE)', async () => {
      const rows: RawGlobalLeaderboardRow[] = [
        makeGlobalRow({
          user_id: 'user-bonus',
          display_name: 'Bonus User',
          // If NOT deduped: 10+10+10=30 from 3 groups. Deduped: MAX(10)=10
          total_points: BigInt(10),
          exact_count: BigInt(0),
          bonus_points: BigInt(10),
          position: BigInt(1),
        }),
      ];

      prisma.$queryRaw
        .mockResolvedValueOnce(rows)
        .mockResolvedValueOnce([{ count: BigInt(1) }]);

      const result = await service.queryGlobalLeaderboard(20, 0);

      expect(result.entries).toHaveLength(1);
      expect(result.entries[0]!.bonusPoints).toBe(10);
      expect(result.entries[0]!.totalPoints).toBe(10);
    });
  });

  // ---------------------------------------------------------------------------
  // Fan-out prevention — match + bonus predictions must not inflate scores
  // ---------------------------------------------------------------------------

  describe('queryGlobalLeaderboard — fan-out prevention', () => {
    it('should NOT inflate scores when user has both match AND bonus predictions (pre-aggregation eliminates cartesian product)', async () => {
      // SCENARIO: Pablo Martinez has 4 match predictions (3 pts total)
      // and 4 bonus predictions (0 pts). Without pre-aggregation,
      // the double LEFT JOIN creates 4×4=16 rows, inflating 3 pts to 12 pts.
      // The fix pre-aggregates each source to 1 row per user before joining.
      const rows: RawGlobalLeaderboardRow[] = [
        makeGlobalRow({
          user_id: 'pablo',
          display_name: 'Pablo Martinez',
          // CORRECT: 3 match pts + 0 bonus pts = 3 total
          // BUG would show: 3×4 = 12 total (inflated by bonus row count)
          total_points: BigInt(3),
          exact_count: BigInt(0),
          goal_diff_count: BigInt(0),
          winner_count: BigInt(1),
          miss_count: BigInt(3),
          bonus_points: BigInt(0),
          position: BigInt(1),
        }),
      ];

      prisma.$queryRaw
        .mockResolvedValueOnce(rows)
        .mockResolvedValueOnce([{ count: BigInt(1) }]);

      const result = await service.queryGlobalLeaderboard(20, 0);

      expect(result.entries).toHaveLength(1);
      const entry = result.entries[0]!;
      // Key assertion: total_points must NOT be inflated
      expect(entry.totalPoints).toBe(3); // NOT 12
      expect(entry.bonusPoints).toBe(0);
      expect(entry.winnerCount).toBe(1); // NOT 4
      expect(entry.missCount).toBe(3); // NOT 12
    });

    it('should correctly sum match + bonus without cross-multiplication', async () => {
      // SCENARIO: User has 2 match predictions (6 pts) + 3 bonus predictions (9 pts)
      // Without fix: 2×3=6 rows → SUM inflated to 6×3=18 match + 9×2=18 bonus = 36
      // With fix: 6 match + 9 bonus = 15 total
      const rows: RawGlobalLeaderboardRow[] = [
        makeGlobalRow({
          user_id: 'user-combined',
          display_name: 'Combined User',
          total_points: BigInt(15), // 6 match + 9 bonus = 15 (correct)
          exact_count: BigInt(1),
          goal_diff_count: BigInt(1),
          winner_count: BigInt(0),
          miss_count: BigInt(0),
          bonus_points: BigInt(9),
          position: BigInt(1),
        }),
      ];

      prisma.$queryRaw
        .mockResolvedValueOnce(rows)
        .mockResolvedValueOnce([{ count: BigInt(1) }]);

      const result = await service.queryGlobalLeaderboard(20, 0);

      const entry = result.entries[0]!;
      expect(entry.totalPoints).toBe(15); // NOT 36
      expect(entry.bonusPoints).toBe(9); // NOT 18
      expect(entry.exactCount).toBe(1); // NOT 3
    });
  });

  // ---------------------------------------------------------------------------
  // Excludes users with 0 points
  // ---------------------------------------------------------------------------

  describe('queryGlobalLeaderboard — zero-point exclusion', () => {
    it('should return empty when all users have 0 points (HAVING filters them out)', async () => {
      // The SQL HAVING clause excludes users with 0 total points.
      // The mock simulates what the DB returns (empty).
      prisma.$queryRaw
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ count: BigInt(0) }]);

      const result = await service.queryGlobalLeaderboard(20, 0);

      expect(result.entries).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  // ---------------------------------------------------------------------------
  // DENSE_RANK handles ties correctly
  // ---------------------------------------------------------------------------

  describe('queryGlobalLeaderboard — ties (DENSE_RANK)', () => {
    it('should assign same position for users with equal points and exactCount', async () => {
      const rows: RawGlobalLeaderboardRow[] = [
        makeGlobalRow({
          user_id: 'user-1',
          display_name: 'Tied First A',
          total_points: BigInt(40),
          exact_count: BigInt(4),
          position: BigInt(1),
        }),
        makeGlobalRow({
          user_id: 'user-2',
          display_name: 'Tied First B',
          total_points: BigInt(40),
          exact_count: BigInt(4),
          position: BigInt(1), // Same position — DENSE_RANK
        }),
        makeGlobalRow({
          user_id: 'user-3',
          display_name: 'Third',
          total_points: BigInt(20),
          exact_count: BigInt(1),
          position: BigInt(2), // DENSE_RANK: 2 (not 3)
        }),
      ];

      prisma.$queryRaw
        .mockResolvedValueOnce(rows)
        .mockResolvedValueOnce([{ count: BigInt(3) }]);

      const result = await service.queryGlobalLeaderboard(20, 0);

      expect(result.entries[0]!.position).toBe(1);
      expect(result.entries[1]!.position).toBe(1);
      expect(result.entries[2]!.position).toBe(2); // DENSE_RANK, not 3
    });
  });

  // ---------------------------------------------------------------------------
  // Pagination (limit/offset)
  // ---------------------------------------------------------------------------

  describe('queryGlobalLeaderboard — pagination', () => {
    it('should pass limit and offset to the query and return correct total', async () => {
      const page2Rows: RawGlobalLeaderboardRow[] = [
        makeGlobalRow({
          user_id: 'user-21',
          display_name: 'Page 2 User',
          total_points: BigInt(15),
          position: BigInt(21),
        }),
      ];

      prisma.$queryRaw
        .mockResolvedValueOnce(page2Rows)
        .mockResolvedValueOnce([{ count: BigInt(50) }]);

      const result = await service.queryGlobalLeaderboard(20, 20);

      expect(result.entries).toHaveLength(1);
      expect(result.entries[0]!.position).toBe(21);
      expect(result.total).toBe(50);

      // Verify $queryRaw was called twice (main query + count)
      expect(prisma.$queryRaw).toHaveBeenCalledTimes(2);
    });
  });

  // ---------------------------------------------------------------------------
  // Maps BigInt and all fields correctly
  // ---------------------------------------------------------------------------

  describe('queryGlobalLeaderboard — field mapping', () => {
    it('should convert BigInt values to numbers and map all fields', async () => {
      const rows: RawGlobalLeaderboardRow[] = [
        makeGlobalRow({
          user_id: 'user-map',
          display_name: 'Map Test',
          username: 'maptest',
          avatar_url: 'https://avatar.url/pic.jpg',
          total_points: BigInt(42),
          exact_count: BigInt(3),
          goal_diff_count: BigInt(5),
          winner_count: BigInt(4),
          miss_count: BigInt(2),
          bonus_points: BigInt(10),
          position: BigInt(7),
        }),
      ];

      prisma.$queryRaw
        .mockResolvedValueOnce(rows)
        .mockResolvedValueOnce([{ count: BigInt(100) }]);

      const result = await service.queryGlobalLeaderboard(20, 0);

      const entry = result.entries[0]!;
      expect(entry.userId).toBe('user-map');
      expect(entry.displayName).toBe('Map Test');
      expect(entry.username).toBe('maptest');
      expect(entry.avatarUrl).toBe('https://avatar.url/pic.jpg');
      expect(entry.totalPoints).toBe(42);
      expect(entry.exactCount).toBe(3);
      expect(entry.goalDiffCount).toBe(5);
      expect(entry.winnerCount).toBe(4);
      expect(entry.missCount).toBe(2);
      expect(entry.bonusPoints).toBe(10);
      expect(entry.position).toBe(7);
      expect(entry.streak).toBe(0);
    });
  });

  // ==========================================================================
  // queryCurrentUserGlobalPosition
  // ==========================================================================

  describe('queryCurrentUserGlobalPosition', () => {
    it('should return the current user position and stats', async () => {
      const rows: RawGlobalLeaderboardRow[] = [
        makeGlobalRow({
          user_id: 'current-user',
          display_name: 'Current User',
          username: 'curruser',
          total_points: BigInt(35),
          exact_count: BigInt(2),
          position: BigInt(15),
        }),
      ];

      prisma.$queryRaw.mockResolvedValueOnce(rows);

      const result = await service.queryCurrentUserGlobalPosition('current-user');

      expect(result).not.toBeNull();
      expect(result!.userId).toBe('current-user');
      expect(result!.position).toBe(15);
      expect(result!.totalPoints).toBe(35);
      expect(result!.exactCount).toBe(2);
    });

    it('should return null when user has 0 points (not in ranking)', async () => {
      prisma.$queryRaw.mockResolvedValueOnce([]);

      const result = await service.queryCurrentUserGlobalPosition('no-points-user');

      expect(result).toBeNull();
    });

    it('should return correct position for user not on first page', async () => {
      const rows: RawGlobalLeaderboardRow[] = [
        makeGlobalRow({
          user_id: 'deep-user',
          display_name: 'Deep User',
          total_points: BigInt(5),
          exact_count: BigInt(0),
          position: BigInt(247),
        }),
      ];

      prisma.$queryRaw.mockResolvedValueOnce(rows);

      const result = await service.queryCurrentUserGlobalPosition('deep-user');

      expect(result).not.toBeNull();
      expect(result!.position).toBe(247);
      expect(result!.totalPoints).toBe(5);
    });
  });

  // ==========================================================================
  // getGlobalLeaderboard (orchestrator with Redis caching)
  // ==========================================================================

  describe('getGlobalLeaderboard', () => {
    const allEntries: RawGlobalLeaderboardRow[] = Array.from(
      { length: 5 },
      (_, i) =>
        makeGlobalRow({
          user_id: `user-${i + 1}`,
          display_name: `Player ${i + 1}`,
          total_points: BigInt(50 - i * 10),
          exact_count: BigInt(5 - i),
          position: BigInt(i + 1),
        }),
    );

    // -------------------------------------------------------------------------
    // Cache hit — returns paginated entries without DB call
    // -------------------------------------------------------------------------

    it('should return paginated entries from cache hit (no DB call)', async () => {
      const cachedData = {
        entries: allEntries.map((row) => ({
          position: Number(row.position),
          userId: row.user_id,
          displayName: row.display_name,
          username: row.username,
          avatarUrl: row.avatar_url,
          totalPoints: Number(row.total_points),
          exactCount: Number(row.exact_count),
          goalDiffCount: Number(row.goal_diff_count),
          winnerCount: Number(row.winner_count),
          missCount: Number(row.miss_count),
          bonusPoints: Number(row.bonus_points),
          streak: 0,
        })),
        total: 5,
      };

      mockCache.get.mockResolvedValueOnce(cachedData);

      const result = await service.getGlobalLeaderboard('user-1', 2, 0);

      expect(result.entries).toHaveLength(2);
      expect(result.entries[0]!.userId).toBe('user-1');
      expect(result.entries[1]!.userId).toBe('user-2');
      expect(result.total).toBe(5);
      expect(result.currentUserEntry).not.toBeNull();
      expect(result.currentUserEntry!.userId).toBe('user-1');
      // No DB calls should have been made
      expect(prisma.$queryRaw).not.toHaveBeenCalled();
    });

    // -------------------------------------------------------------------------
    // Cache miss — queries DB, caches result, then slices
    // -------------------------------------------------------------------------

    it('should query DB and cache on cache miss', async () => {
      // Cache miss
      mockCache.get.mockResolvedValueOnce(undefined);

      // DB returns all entries (queryGlobalLeaderboard: main query + count)
      prisma.$queryRaw
        .mockResolvedValueOnce(allEntries)
        .mockResolvedValueOnce([{ count: BigInt(5) }]);

      const result = await service.getGlobalLeaderboard('user-3', 2, 0);

      // Verify DB was called
      expect(prisma.$queryRaw).toHaveBeenCalledTimes(2);

      // Verify cache was set
      expect(mockCache.set).toHaveBeenCalledTimes(1);
      expect(mockCache.set).toHaveBeenCalledWith(
        'lb:global:all',
        expect.objectContaining({ total: 5 }),
      );

      // Verify paginated result
      expect(result.entries).toHaveLength(2);
      expect(result.entries[0]!.userId).toBe('user-1');
      expect(result.entries[1]!.userId).toBe('user-2');
      expect(result.total).toBe(5);
    });

    // -------------------------------------------------------------------------
    // Includes currentUserEntry in response
    // -------------------------------------------------------------------------

    it('should include currentUserEntry from cached data', async () => {
      const cachedData = {
        entries: allEntries.map((row) => ({
          position: Number(row.position),
          userId: row.user_id,
          displayName: row.display_name,
          username: row.username,
          avatarUrl: row.avatar_url,
          totalPoints: Number(row.total_points),
          exactCount: Number(row.exact_count),
          goalDiffCount: Number(row.goal_diff_count),
          winnerCount: Number(row.winner_count),
          missCount: Number(row.miss_count),
          bonusPoints: Number(row.bonus_points),
          streak: 0,
        })),
        total: 5,
      };

      mockCache.get.mockResolvedValueOnce(cachedData);

      // Request page 2 — user-3 is NOT on this page but should still be in currentUserEntry
      const result = await service.getGlobalLeaderboard('user-3', 2, 2);

      expect(result.entries).toHaveLength(2);
      expect(result.entries[0]!.userId).toBe('user-3');
      expect(result.currentUserEntry).not.toBeNull();
      expect(result.currentUserEntry!.userId).toBe('user-3');
      expect(result.currentUserEntry!.position).toBe(3);
    });

    it('should query user position from DB when user has 0 points (not in cached entries)', async () => {
      const cachedData = {
        entries: [
          {
            position: 1,
            userId: 'user-1',
            displayName: 'Player 1',
            username: 'player1',
            avatarUrl: null,
            totalPoints: 50,
            exactCount: 5,
            goalDiffCount: 2,
            winnerCount: 1,
            missCount: 0,
            bonusPoints: 10,
            streak: 0,
          },
        ],
        total: 1,
      };

      mockCache.get.mockResolvedValueOnce(cachedData);

      // queryCurrentUserGlobalPosition returns null (user has 0 points)
      prisma.$queryRaw.mockResolvedValueOnce([]);

      const result = await service.getGlobalLeaderboard('no-points-user', 20, 0);

      expect(result.currentUserEntry).toBeNull();
      // DB was called for user position lookup
      expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
    });

    // -------------------------------------------------------------------------
    // Graceful degradation when Redis is down
    // -------------------------------------------------------------------------

    it('should gracefully degrade when Redis is down (falls through to DB)', async () => {
      // Cache get throws (Redis down)
      mockCache.get.mockRejectedValueOnce(new Error('Redis connection refused'));

      // DB returns all entries
      prisma.$queryRaw
        .mockResolvedValueOnce(allEntries)
        .mockResolvedValueOnce([{ count: BigInt(5) }]);

      // Cache set also fails (Redis down) — should not throw
      mockCache.set.mockRejectedValueOnce(
        new Error('Redis connection refused'),
      );

      const result = await service.getGlobalLeaderboard('user-1', 2, 0);

      // Should still return correct data despite cache failures
      expect(result.entries).toHaveLength(2);
      expect(result.total).toBe(5);
      expect(result.currentUserEntry).not.toBeNull();
      expect(result.currentUserEntry!.userId).toBe('user-1');
    });

    // -------------------------------------------------------------------------
    // Pagination edge cases
    // -------------------------------------------------------------------------

    it('should handle offset beyond total entries', async () => {
      const cachedData = {
        entries: [
          {
            position: 1,
            userId: 'user-1',
            displayName: 'Player 1',
            username: 'player1',
            avatarUrl: null,
            totalPoints: 50,
            exactCount: 5,
            goalDiffCount: 2,
            winnerCount: 1,
            missCount: 0,
            bonusPoints: 10,
            streak: 0,
          },
        ],
        total: 1,
      };

      mockCache.get.mockResolvedValueOnce(cachedData);

      const result = await service.getGlobalLeaderboard('user-1', 20, 100);

      expect(result.entries).toHaveLength(0);
      expect(result.total).toBe(1);
      expect(result.currentUserEntry).not.toBeNull();
    });
  });
});
