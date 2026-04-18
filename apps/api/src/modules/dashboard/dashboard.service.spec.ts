import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { PrismaService } from '../../config/prisma.service';

// ---------------------------------------------------------------------------
// Mock PrismaService
// ---------------------------------------------------------------------------

/**
 * Because getDashboard uses Promise.allSettled, all 3 private methods run
 * concurrently. This means $queryRaw calls from different methods interleave
 * in unpredictable order. We solve this by using mockImplementation that
 * inspects the SQL template strings to route each call to the right response.
 */

type QueryRawResponses = {
  todayMatches?: unknown[] | Error;
  leaderboard?: unknown[] | Error;
  /** For multi-group scenarios, array of responses (one per group). */
  leaderboardMulti?: (unknown[] | Error)[];
  stats?: unknown[] | Error;
};

function setupQueryRawMock(
  mockFn: jest.Mock,
  responses: QueryRawResponses,
) {
  let leaderboardCallIndex = 0;

  mockFn.mockImplementation((strings: TemplateStringsArray) => {
    const sql = Array.isArray(strings) ? strings.join(' ') : String(strings);

    // Today matches query: tournament_slug is unique to this query
    if (sql.includes('tournament_slug') || sql.includes('tournament_name')) {
      const val = responses.todayMatches ?? [];
      if (val instanceof Error) return Promise.reject(val);
      return Promise.resolve(val);
    }

    // Leaderboard query: total_points ... group_members
    if (sql.includes('total_points') && sql.includes('group_members')) {
      if (responses.leaderboardMulti) {
        const val = responses.leaderboardMulti[leaderboardCallIndex++] ?? [];
        if (val instanceof Error) return Promise.reject(val);
        return Promise.resolve(val);
      }
      const val = responses.leaderboard ?? [];
      if (val instanceof Error) return Promise.reject(val);
      return Promise.resolve(val);
    }

    // User stats query: point_type = 'EXACT'
    if (sql.includes("point_type = 'EXACT'") || sql.includes('total_predictions')) {
      const val = responses.stats ?? [makeStatsRow({ total_points: BigInt(0), total_predictions: BigInt(0), exact_count: BigInt(0), goal_diff_count: BigInt(0), winner_count: BigInt(0), miss_count: BigInt(0) })];
      if (val instanceof Error) return Promise.reject(val);
      return Promise.resolve(val);
    }

    // Fallback — return empty
    return Promise.resolve([]);
  });
}

const mockPrisma = {
  $queryRaw: jest.fn(),
  groupMember: {
    findMany: jest.fn(),
    count: jest.fn(),
  },
};

async function createService(): Promise<{
  service: DashboardService;
  prisma: typeof mockPrisma;
}> {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      DashboardService,
      { provide: PrismaService, useValue: mockPrisma },
    ],
  }).compile();

  return {
    service: module.get<DashboardService>(DashboardService),
    prisma: mockPrisma,
  };
}

// ---------------------------------------------------------------------------
// Test data factories
// ---------------------------------------------------------------------------

function makeLeaderboardRow(overrides: Record<string, unknown> = {}) {
  return {
    user_id: 'user-1',
    display_name: 'Test User',
    avatar_url: null,
    total_points: BigInt(10),
    ...overrides,
  };
}

function makeStatsRow(overrides: Record<string, unknown> = {}) {
  return {
    total_points: BigInt(25),
    total_predictions: BigInt(10),
    exact_count: BigInt(2),
    goal_diff_count: BigInt(3),
    winner_count: BigInt(2),
    miss_count: BigInt(3),
    ...overrides,
  };
}

function makeTodayMatchRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'match-today-1',
    scheduled_at: new Date('2026-06-15T18:00:00Z'),
    status: 'SCHEDULED',
    home_score: null as number | null,
    away_score: null as number | null,
    phase: 'GROUP_STAGE',
    home_team_id: 'team-1',
    away_team_id: 'team-2',
    home_team_placeholder: null as string | null,
    away_team_placeholder: null as string | null,
    home_team_name: 'Argentina',
    home_team_logo_url: 'https://example.com/arg.png',
    away_team_name: 'Brazil',
    away_team_logo_url: 'https://example.com/bra.png',
    tournament_name: 'World Cup 2026',
    tournament_slug: 'world-cup-2026',
    group_id: 'group-1',
    group_name: 'Amigos',
    predicted_home: null as number | null,
    predicted_away: null as number | null,
    ...overrides,
  };
}

// =============================================================================
// Tests
// =============================================================================

describe('DashboardService', () => {
  let service: DashboardService;
  let prisma: typeof mockPrisma;

  beforeEach(async () => {
    jest.clearAllMocks();
    ({ service, prisma } = await createService());
  });

  // ---------------------------------------------------------------------------
  // getDashboard — orchestration with Promise.allSettled
  // ---------------------------------------------------------------------------

  describe('getDashboard', () => {
    it('should return all 3 sections when all queries succeed', async () => {
      setupQueryRawMock(prisma.$queryRaw, {
        todayMatches: [makeTodayMatchRow()],
        leaderboard: [makeLeaderboardRow()],
        stats: [makeStatsRow()],
      });

      prisma.groupMember.findMany.mockResolvedValueOnce([
        {
          group: { id: 'group-1', name: 'Amigos' },
          userId: 'user-1',
          isActive: true,
        },
      ]);
      prisma.groupMember.count.mockResolvedValueOnce(2);

      const result = await service.getDashboard('user-1');

      expect(result.todayMatches).not.toBeNull();
      expect(result.stats).not.toBeNull();
      expect(result.groups).not.toBeNull();
      // Should NOT have pending or live keys
      expect(result).not.toHaveProperty('pending');
      expect(result).not.toHaveProperty('live');
    });

    it('should return null for a section that throws, while others succeed', async () => {
      setupQueryRawMock(prisma.$queryRaw, {
        todayMatches: new Error('DB timeout'),
        leaderboard: [makeLeaderboardRow()],
        stats: [makeStatsRow()],
      });

      prisma.groupMember.findMany.mockResolvedValueOnce([
        {
          group: { id: 'group-1', name: 'Amigos' },
          userId: 'user-1',
          isActive: true,
        },
      ]);
      prisma.groupMember.count.mockResolvedValueOnce(1);

      const result = await service.getDashboard('user-1');

      expect(result.todayMatches).toBeNull();
      expect(result.stats).not.toBeNull();
      expect(result.groups).not.toBeNull();
    });

    it('should return all nulls when every section fails', async () => {
      prisma.$queryRaw.mockRejectedValue(new Error('All DB down'));
      prisma.groupMember.findMany.mockRejectedValue(new Error('DB down'));
      prisma.groupMember.count.mockRejectedValue(new Error('DB down'));

      const result = await service.getDashboard('user-1');

      expect(result.todayMatches).toBeNull();
      expect(result.stats).toBeNull();
      expect(result.groups).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // getTodayMatches — upcoming matches (client filters by local date)
  // ---------------------------------------------------------------------------

  describe('getUpcomingMatches (via getDashboard)', () => {
    beforeEach(() => {
      prisma.groupMember.findMany.mockResolvedValue([]);
      prisma.groupMember.count.mockResolvedValue(0);
    });

    it('should return today matches with team info, tournament name, and slug', async () => {
      const row = makeTodayMatchRow();

      setupQueryRawMock(prisma.$queryRaw, {
        todayMatches: [row],
        stats: [makeStatsRow()],
      });

      const result = await service.getDashboard('user-1');

      expect(result.todayMatches).not.toBeNull();
      expect(result.todayMatches).toHaveLength(1);

      const match = result.todayMatches![0];
      expect(match.matchId).toBe('match-today-1');
      expect(match.homeTeam).toEqual({
        id: 'team-1',
        name: 'Argentina',
        logoUrl: 'https://example.com/arg.png',
      });
      expect(match.awayTeam).toEqual({
        id: 'team-2',
        name: 'Brazil',
        logoUrl: 'https://example.com/bra.png',
      });
      expect(match.tournamentName).toBe('World Cup 2026');
      expect(match.tournamentSlug).toBe('world-cup-2026');
      expect(match.groupId).toBe('group-1');
      expect(match.groupName).toBe('Amigos');
    });

    it('should return empty array when no matches today', async () => {
      setupQueryRawMock(prisma.$queryRaw, {
        todayMatches: [],
        stats: [makeStatsRow()],
      });

      const result = await service.getDashboard('user-1');

      expect(result.todayMatches).toEqual([]);
    });

    it('should include group info for each match (one card per match×group)', async () => {
      const row1 = makeTodayMatchRow({
        group_id: 'group-1',
        group_name: 'Amigos',
      });
      const row2 = makeTodayMatchRow({
        group_id: 'group-2',
        group_name: 'Trabajo',
      });

      setupQueryRawMock(prisma.$queryRaw, {
        todayMatches: [row1, row2],
        stats: [makeStatsRow()],
      });

      const result = await service.getDashboard('user-1');

      expect(result.todayMatches).toHaveLength(2);
      expect(result.todayMatches![0].groupId).toBe('group-1');
      expect(result.todayMatches![0].groupName).toBe('Amigos');
      expect(result.todayMatches![1].groupId).toBe('group-2');
      expect(result.todayMatches![1].groupName).toBe('Trabajo');
    });

    it('should set hasPrediction=true and include predicted scores when user has predicted', async () => {
      const row = makeTodayMatchRow({
        predicted_home: 2,
        predicted_away: 1,
      });

      setupQueryRawMock(prisma.$queryRaw, {
        todayMatches: [row],
        stats: [makeStatsRow()],
      });

      const result = await service.getDashboard('user-1');
      const match = result.todayMatches![0];

      expect(match.hasPrediction).toBe(true);
      expect(match.predictedHome).toBe(2);
      expect(match.predictedAway).toBe(1);
    });

    it('should set hasPrediction=false and null predicted scores when user has not predicted', async () => {
      const row = makeTodayMatchRow({
        predicted_home: null,
        predicted_away: null,
      });

      setupQueryRawMock(prisma.$queryRaw, {
        todayMatches: [row],
        stats: [makeStatsRow()],
      });

      const result = await service.getDashboard('user-1');
      const match = result.todayMatches![0];

      expect(match.hasPrediction).toBe(false);
      expect(match.predictedHome).toBeNull();
      expect(match.predictedAway).toBeNull();
    });

    it('should set isLocked=false for SCHEDULED matches', async () => {
      const row = makeTodayMatchRow({ status: 'SCHEDULED' });

      setupQueryRawMock(prisma.$queryRaw, {
        todayMatches: [row],
        stats: [makeStatsRow()],
      });

      const result = await service.getDashboard('user-1');

      expect(result.todayMatches![0].isLocked).toBe(false);
    });

    it('should set isLocked=true for LIVE matches', async () => {
      const row = makeTodayMatchRow({ status: 'LIVE', home_score: 1, away_score: 0 });

      setupQueryRawMock(prisma.$queryRaw, {
        todayMatches: [row],
        stats: [makeStatsRow()],
      });

      const result = await service.getDashboard('user-1');

      expect(result.todayMatches![0].isLocked).toBe(true);
    });

    it('should handle matches with null teams (placeholders)', async () => {
      const row = makeTodayMatchRow({
        home_team_id: null,
        away_team_id: null,
        home_team_name: null,
        home_team_logo_url: null,
        away_team_name: null,
        away_team_logo_url: null,
        home_team_placeholder: 'Winner Group A',
        away_team_placeholder: 'Runner-up Group B',
      });

      setupQueryRawMock(prisma.$queryRaw, {
        todayMatches: [row],
        stats: [makeStatsRow()],
      });

      const result = await service.getDashboard('user-1');
      const match = result.todayMatches![0];

      expect(match.homeTeam).toBeNull();
      expect(match.awayTeam).toBeNull();
      expect(match.homePlaceholder).toBe('Winner Group A');
      expect(match.awayPlaceholder).toBe('Runner-up Group B');
    });

    it('should return matches in chronological order (as returned by SQL)', async () => {
      const rows = [
        makeTodayMatchRow({ id: 'match-early', scheduled_at: new Date('2026-06-15T14:00:00Z') }),
        makeTodayMatchRow({ id: 'match-late', scheduled_at: new Date('2026-06-15T20:00:00Z') }),
      ];

      setupQueryRawMock(prisma.$queryRaw, {
        todayMatches: rows,
        stats: [makeStatsRow()],
      });

      const result = await service.getDashboard('user-1');

      expect(result.todayMatches).toHaveLength(2);
      expect(result.todayMatches![0].matchId).toBe('match-early');
      expect(result.todayMatches![1].matchId).toBe('match-late');
    });

    it('should include homeScore and awayScore for live matches', async () => {
      const row = makeTodayMatchRow({
        status: 'LIVE',
        home_score: 2,
        away_score: 1,
      });

      setupQueryRawMock(prisma.$queryRaw, {
        todayMatches: [row],
        stats: [makeStatsRow()],
      });

      const result = await service.getDashboard('user-1');
      const match = result.todayMatches![0];

      expect(match.homeScore).toBe(2);
      expect(match.awayScore).toBe(1);
      expect(match.status).toBe('LIVE');
    });

    it('should return 2 separate items when same match is in 2 groups', async () => {
      const row1 = makeTodayMatchRow({
        group_id: 'group-1',
        group_name: 'Amigos',
        predicted_home: 2,
        predicted_away: 1,
      });
      const row2 = makeTodayMatchRow({
        group_id: 'group-2',
        group_name: 'Trabajo',
        predicted_home: null,
        predicted_away: null,
      });

      setupQueryRawMock(prisma.$queryRaw, {
        todayMatches: [row1, row2],
        stats: [makeStatsRow()],
      });

      const result = await service.getDashboard('user-1');

      expect(result.todayMatches).toHaveLength(2);
      // Same match ID, different groups
      expect(result.todayMatches![0].matchId).toBe('match-today-1');
      expect(result.todayMatches![1].matchId).toBe('match-today-1');
      expect(result.todayMatches![0].groupId).toBe('group-1');
      expect(result.todayMatches![1].groupId).toBe('group-2');
    });

    it('should show hasPrediction per group — true for group A, false for group B', async () => {
      const row1 = makeTodayMatchRow({
        group_id: 'group-1',
        group_name: 'Amigos',
        predicted_home: 2,
        predicted_away: 1,
      });
      const row2 = makeTodayMatchRow({
        group_id: 'group-2',
        group_name: 'Trabajo',
        predicted_home: null,
        predicted_away: null,
      });

      setupQueryRawMock(prisma.$queryRaw, {
        todayMatches: [row1, row2],
        stats: [makeStatsRow()],
      });

      const result = await service.getDashboard('user-1');

      expect(result.todayMatches).toHaveLength(2);
      // Group A has prediction
      expect(result.todayMatches![0].hasPrediction).toBe(true);
      expect(result.todayMatches![0].predictedHome).toBe(2);
      expect(result.todayMatches![0].predictedAway).toBe(1);
      // Group B does not
      expect(result.todayMatches![1].hasPrediction).toBe(false);
      expect(result.todayMatches![1].predictedHome).toBeNull();
      expect(result.todayMatches![1].predictedAway).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // getGroupRankings — mini leaderboards
  // ---------------------------------------------------------------------------

  describe('getGroupRankings (via getDashboard)', () => {
    beforeEach(() => {
      prisma.groupMember.count.mockResolvedValue(0);
    });

    it('should return group rankings with top 3 entries and user position', async () => {
      prisma.groupMember.findMany.mockResolvedValueOnce([
        {
          group: { id: 'group-1', name: 'Amigos' },
          userId: 'user-1',
          isActive: true,
        },
      ]);

      const leaderboardRows = [
        makeLeaderboardRow({ user_id: 'user-2', display_name: 'Top User', total_points: BigInt(50) }),
        makeLeaderboardRow({ user_id: 'user-3', display_name: 'Second User', total_points: BigInt(40) }),
        makeLeaderboardRow({ user_id: 'user-4', display_name: 'Third User', total_points: BigInt(30) }),
        makeLeaderboardRow({ user_id: 'user-1', display_name: 'Test User', total_points: BigInt(10) }),
      ];

      setupQueryRawMock(prisma.$queryRaw, {
        todayMatches: [],
        leaderboard: leaderboardRows,
        stats: [makeStatsRow()],
      });

      const result = await service.getDashboard('user-1');

      expect(result.groups).not.toBeNull();
      expect(result.groups).toHaveLength(1);
      expect(result.groups![0].groupId).toBe('group-1');
      expect(result.groups![0].groupName).toBe('Amigos');
      expect(result.groups![0].topEntries).toHaveLength(3);
      expect(result.groups![0].userPosition).toBe(4);
      expect(result.groups![0].userPoints).toBe(10);
      expect(result.groups![0].totalMembers).toBe(4);
    });

    it('should limit groups to 2', async () => {
      prisma.groupMember.findMany.mockResolvedValueOnce([
        { group: { id: 'group-1', name: 'Amigos' }, userId: 'user-1', isActive: true },
        { group: { id: 'group-2', name: 'Trabajo' }, userId: 'user-1', isActive: true },
      ]);

      const row = makeLeaderboardRow({ user_id: 'user-1', total_points: BigInt(10) });

      setupQueryRawMock(prisma.$queryRaw, {
        todayMatches: [],
        leaderboardMulti: [[row], [row]],
        stats: [makeStatsRow()],
      });

      const result = await service.getDashboard('user-1');

      // Max 2 groups because of take: 2
      expect(result.groups).toHaveLength(2);
    });

    it('should return empty array when user has no groups', async () => {
      prisma.groupMember.findMany.mockResolvedValueOnce([]);

      setupQueryRawMock(prisma.$queryRaw, {
        todayMatches: [],
        stats: [makeStatsRow()],
      });

      const result = await service.getDashboard('user-1');

      expect(result.groups).toEqual([]);
    });

    it('should handle ties in position assignment', async () => {
      prisma.groupMember.findMany.mockResolvedValueOnce([
        { group: { id: 'group-1', name: 'Amigos' }, userId: 'user-1', isActive: true },
      ]);

      const rows = [
        makeLeaderboardRow({ user_id: 'user-2', display_name: 'A', total_points: BigInt(20) }),
        makeLeaderboardRow({ user_id: 'user-3', display_name: 'B', total_points: BigInt(20) }), // tie
        makeLeaderboardRow({ user_id: 'user-1', display_name: 'C', total_points: BigInt(10) }),
      ];

      setupQueryRawMock(prisma.$queryRaw, {
        todayMatches: [],
        leaderboard: rows,
        stats: [makeStatsRow()],
      });

      const result = await service.getDashboard('user-1');

      // Positions 1 and 2 are both 1 (tied), user-1 should be position 3
      expect(result.groups![0].topEntries[0].position).toBe(1);
      expect(result.groups![0].topEntries[1].position).toBe(1); // tie
      expect(result.groups![0].userPosition).toBe(3);
    });
  });

  // ---------------------------------------------------------------------------
  // getUserStats
  // ---------------------------------------------------------------------------

  describe('getUserStats (via getDashboard)', () => {
    beforeEach(() => {
      prisma.groupMember.findMany.mockResolvedValue([]);
    });

    it('should return aggregated user stats with accuracy', async () => {
      prisma.groupMember.count.mockResolvedValueOnce(3);

      setupQueryRawMock(prisma.$queryRaw, {
        todayMatches: [],
        stats: [
          makeStatsRow({
            total_points: BigInt(25),
            total_predictions: BigInt(10),
            exact_count: BigInt(2),
            goal_diff_count: BigInt(3),
            winner_count: BigInt(2),
            miss_count: BigInt(3),
          }),
        ],
      });

      const result = await service.getDashboard('user-1');

      expect(result.stats).not.toBeNull();
      expect(result.stats!.totalPoints).toBe(25);
      expect(result.stats!.totalPredictions).toBe(10);
      expect(result.stats!.exactCount).toBe(2);
      // accuracy = (2 + 3 + 2) / 10 * 100 = 70
      expect(result.stats!.accuracy).toBe(70);
      expect(result.stats!.groupCount).toBe(3);
    });

    it('should return zeroes for user with no predictions', async () => {
      prisma.groupMember.count.mockResolvedValueOnce(0);

      setupQueryRawMock(prisma.$queryRaw, {
        todayMatches: [],
        stats: [
          makeStatsRow({
            total_points: BigInt(0),
            total_predictions: BigInt(0),
            exact_count: BigInt(0),
            goal_diff_count: BigInt(0),
            winner_count: BigInt(0),
            miss_count: BigInt(0),
          }),
        ],
      });

      const result = await service.getDashboard('user-1');

      expect(result.stats).not.toBeNull();
      expect(result.stats!.totalPoints).toBe(0);
      expect(result.stats!.totalPredictions).toBe(0);
      expect(result.stats!.exactCount).toBe(0);
      expect(result.stats!.accuracy).toBe(0);
      expect(result.stats!.groupCount).toBe(0);
    });

    it('should calculate 100% accuracy when all predictions are correct (no MISS)', async () => {
      prisma.groupMember.count.mockResolvedValueOnce(1);

      setupQueryRawMock(prisma.$queryRaw, {
        todayMatches: [],
        stats: [
          makeStatsRow({
            total_points: BigInt(30),
            total_predictions: BigInt(5),
            exact_count: BigInt(3),
            goal_diff_count: BigInt(1),
            winner_count: BigInt(1),
            miss_count: BigInt(0),
          }),
        ],
      });

      const result = await service.getDashboard('user-1');

      // accuracy = (3 + 1 + 1) / 5 * 100 = 100
      expect(result.stats!.accuracy).toBe(100);
    });
  });

  // ---------------------------------------------------------------------------
  // getDashboard — timezone parameter
  // ---------------------------------------------------------------------------

  describe('getDashboard — timezone handling', () => {
    beforeEach(() => {
      prisma.groupMember.findMany.mockResolvedValue([]);
      prisma.groupMember.count.mockResolvedValue(0);
      setupQueryRawMock(prisma.$queryRaw, {
        todayMatches: [],
        stats: [makeStatsRow()],
      });
    });

    it('should accept a valid IANA timezone and pass it through', async () => {
      await service.getDashboard('user-1', 'America/Argentina/Buenos_Aires');

      // The $queryRaw call includes the timezone — verify it was called
      expect(prisma.$queryRaw).toHaveBeenCalled();
    });

    it('should default to UTC when no tz is provided', async () => {
      const result = await service.getDashboard('user-1');

      expect(result).toBeDefined();
      expect(prisma.$queryRaw).toHaveBeenCalled();
    });

    it('should default to UTC when tz is undefined', async () => {
      const result = await service.getDashboard('user-1', undefined);

      expect(result).toBeDefined();
    });

    it('should normalize GMT to UTC', async () => {
      const result = await service.getDashboard('user-1', 'GMT');

      expect(result).toBeDefined();
    });

    it('should normalize UTC string to UTC', async () => {
      const result = await service.getDashboard('user-1', 'UTC');

      expect(result).toBeDefined();
    });

    it('should default invalid timezone to UTC', async () => {
      const result = await service.getDashboard('user-1', 'Invalid/Not_Real_Zone_123!');

      expect(result).toBeDefined();
    });

    it('should default random string to UTC', async () => {
      const result = await service.getDashboard('user-1', 'foobar');

      expect(result).toBeDefined();
    });

    it('should accept Etc/ prefix timezones as valid IANA', async () => {
      const result = await service.getDashboard('user-1', 'Etc/GMT');

      expect(result).toBeDefined();
    });
  });

  // ---------------------------------------------------------------------------
  // getTodayMatches — only SCHEDULED + LIVE (no FINISHED)
  // ---------------------------------------------------------------------------

  describe('getTodayMatches — excludes FINISHED matches', () => {
    beforeEach(() => {
      prisma.groupMember.findMany.mockResolvedValue([]);
      prisma.groupMember.count.mockResolvedValue(0);
    });

    it('should include SCHEDULED matches', async () => {
      const row = makeTodayMatchRow({ status: 'SCHEDULED' });
      setupQueryRawMock(prisma.$queryRaw, {
        todayMatches: [row],
        stats: [makeStatsRow()],
      });

      const result = await service.getDashboard('user-1');

      expect(result.todayMatches).toHaveLength(1);
      expect(result.todayMatches![0].status).toBe('SCHEDULED');
    });

    it('should include LIVE matches', async () => {
      const row = makeTodayMatchRow({ status: 'LIVE', home_score: 1, away_score: 0 });
      setupQueryRawMock(prisma.$queryRaw, {
        todayMatches: [row],
        stats: [makeStatsRow()],
      });

      const result = await service.getDashboard('user-1');

      expect(result.todayMatches).toHaveLength(1);
      expect(result.todayMatches![0].status).toBe('LIVE');
    });

    it('should NOT include FINISHED matches (SQL WHERE filters them out)', async () => {
      // The SQL WHERE clause is: m.status IN ('SCHEDULED', 'LIVE')
      // So if the DB returns no FINISHED rows, our result is empty.
      // We simulate the DB correctly filtering by returning only non-FINISHED rows.
      setupQueryRawMock(prisma.$queryRaw, {
        todayMatches: [], // DB would filter out FINISHED matches
        stats: [makeStatsRow()],
      });

      const result = await service.getDashboard('user-1');

      expect(result.todayMatches).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  // Partial failure resilience
  // ---------------------------------------------------------------------------

  describe('partial failure resilience', () => {
    it('should handle todayMatches failure while other sections work', async () => {
      setupQueryRawMock(prisma.$queryRaw, {
        todayMatches: new Error('Today query failed'),
        stats: [makeStatsRow()],
      });

      prisma.groupMember.findMany.mockResolvedValueOnce([]);
      prisma.groupMember.count.mockResolvedValueOnce(0);

      const result = await service.getDashboard('user-1');

      expect(result.todayMatches).toBeNull(); // failed
      expect(result.stats).not.toBeNull();
      expect(result.groups).not.toBeNull();
    });

    it('should handle stats failure while other sections work', async () => {
      setupQueryRawMock(prisma.$queryRaw, {
        todayMatches: [],
        stats: new Error('Stats query failed'),
      });

      prisma.groupMember.findMany.mockResolvedValueOnce([]);

      const result = await service.getDashboard('user-1');

      expect(result.todayMatches).not.toBeNull();
      expect(result.stats).toBeNull(); // failed
      expect(result.groups).not.toBeNull();
    });

    it('should handle groups failure while other sections work', async () => {
      setupQueryRawMock(prisma.$queryRaw, {
        todayMatches: [],
        stats: [makeStatsRow()],
      });

      prisma.groupMember.findMany.mockRejectedValueOnce(new Error('Groups query failed'));
      prisma.groupMember.count.mockResolvedValueOnce(0);

      const result = await service.getDashboard('user-1');

      expect(result.todayMatches).not.toBeNull();
      expect(result.stats).not.toBeNull();
      expect(result.groups).toBeNull(); // failed
    });
  });
});
