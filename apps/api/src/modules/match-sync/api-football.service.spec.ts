import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';

import { ApiFootballService } from './api-football.service';
import type {
  ApiFootballFixture,
  ApiFootballResponse,
  ApiFootballTopScorer,
} from './api-football.types';

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

const FAKE_API_KEY = 'test-api-key-123';

const mockConfigService = {
  get: jest.fn(),
};

async function createService(
  apiKey: string = FAKE_API_KEY,
): Promise<{
  service: ApiFootballService;
  config: typeof mockConfigService;
}> {
  mockConfigService.get.mockImplementation(
    (key: string, defaultValue?: string) => {
      if (key === 'API_FOOTBALL_KEY') return apiKey;
      return defaultValue;
    },
  );

  const module: TestingModule = await Test.createTestingModule({
    providers: [
      ApiFootballService,
      { provide: ConfigService, useValue: mockConfigService },
    ],
  }).compile();

  return {
    service: module.get<ApiFootballService>(ApiFootballService),
    config: mockConfigService,
  };
}

// ---------------------------------------------------------------------------
// Fixture factories
// ---------------------------------------------------------------------------

function makeFixtureResponse(
  fixtures: ApiFootballFixture[],
): ApiFootballResponse<ApiFootballFixture> {
  return {
    get: 'fixtures',
    parameters: {},
    errors: {},
    results: fixtures.length,
    paging: { current: 1, total: 1 },
    response: fixtures,
  };
}

function makeFixture(id: number): ApiFootballFixture {
  return {
    fixture: {
      id,
      referee: null,
      timezone: 'UTC',
      date: '2026-06-15T18:00:00+00:00',
      timestamp: 1781625600,
      periods: { first: null, second: null },
      venue: { id: 1, name: 'Stadium', city: 'City' },
      status: { long: 'Not Started', short: 'NS', elapsed: null, extra: null },
    },
    league: {
      id: 1,
      name: 'World Cup',
      country: 'World',
      logo: 'https://example.com/logo.png',
      flag: null,
      season: 2026,
      round: 'Group A - 1',
    },
    teams: {
      home: { id: 1, name: 'Team A', logo: 'https://example.com/a.png', winner: null },
      away: { id: 2, name: 'Team B', logo: 'https://example.com/b.png', winner: null },
    },
    goals: { home: null, away: null },
    score: {
      halftime: { home: null, away: null },
      fulltime: { home: null, away: null },
      extratime: { home: null, away: null },
      penalty: { home: null, away: null },
    },
  };
}

function makeTopScorerResponse(
  scorers: ApiFootballTopScorer[],
): ApiFootballResponse<ApiFootballTopScorer> {
  return {
    get: 'players/topscorers',
    parameters: {},
    errors: {},
    results: scorers.length,
    paging: { current: 1, total: 1 },
    response: scorers,
  };
}

function makeTopScorer(playerId: number, goals: number): ApiFootballTopScorer {
  return {
    player: {
      id: playerId,
      name: `Player ${playerId}`,
      firstname: 'First',
      lastname: 'Last',
      photo: 'https://example.com/photo.png',
      nationality: 'AR',
    },
    statistics: [
      {
        team: { id: 10, name: 'Team X', logo: 'https://example.com/team.png' },
        league: {
          id: 1,
          name: 'World Cup',
          country: 'World',
          logo: 'https://example.com/logo.png',
          flag: null,
          season: 2026,
        },
        games: { appearences: 5, minutes: 450, position: 'Attacker' },
        goals: { total: goals, assists: 2 },
      },
    ],
  };
}

function mockFetchSuccess(body: unknown, rateLimitRemaining = '95'): void {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: true,
    status: 200,
    statusText: 'OK',
    headers: new Headers({
      'x-ratelimit-requests-remaining': rateLimitRemaining,
    }),
    json: () => Promise.resolve(body),
  });
}

function mockFetchError(status: number, statusText = 'Error'): void {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    statusText,
    headers: new Headers({
      'x-ratelimit-requests-remaining': '50',
    }),
    json: () => Promise.resolve({ errors: {}, response: [] }),
  });
}

// =============================================================================
// Tests
// =============================================================================

describe('ApiFootballService', () => {
  let service: ApiFootballService;

  beforeEach(async () => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
    ({ service } = await createService());
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ---------------------------------------------------------------------------
  // isAvailable / guardApiKey
  // ---------------------------------------------------------------------------

  describe('isAvailable', () => {
    it('should return true when API key is configured', () => {
      expect(service.isAvailable()).toBe(true);
    });

    it('should return false when API key is empty', async () => {
      ({ service } = await createService(''));
      expect(service.isAvailable()).toBe(false);
    });

    it('should return false when API key is whitespace only', async () => {
      ({ service } = await createService('   '));
      expect(service.isAvailable()).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // fetchFixturesByIds
  // ---------------------------------------------------------------------------

  describe('fetchFixturesByIds', () => {
    it('should return fixture data when API responds successfully', async () => {
      const fixture = makeFixture(100);
      mockFetchSuccess(makeFixtureResponse([fixture]));

      const result = await service.fetchFixturesByIds([100]);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(fixture);
    });

    it('should return empty array for empty IDs without calling API', async () => {
      const result = await service.fetchFixturesByIds([]);

      expect(result).toEqual([]);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should return empty array when API_FOOTBALL_KEY is not configured', async () => {
      ({ service } = await createService(''));

      const result = await service.fetchFixturesByIds([1, 2, 3]);

      expect(result).toEqual([]);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should construct URL with dash-separated IDs', async () => {
      mockFetchSuccess(makeFixtureResponse([]));

      await service.fetchFixturesByIds([10, 20, 30]);

      const calledUrl = (global.fetch as jest.Mock).mock.calls[0][0] as string;
      expect(calledUrl).toContain('ids=10-20-30');
      expect(calledUrl).toContain('v3.football.api-sports.io/fixtures');
    });

    it('should send only x-apisports-key header', async () => {
      mockFetchSuccess(makeFixtureResponse([]));

      await service.fetchFixturesByIds([1]);

      const fetchOptions = (global.fetch as jest.Mock).mock.calls[0][1];
      expect(fetchOptions.headers).toEqual({
        'x-apisports-key': FAKE_API_KEY,
      });
      expect(fetchOptions.method).toBe('GET');
    });

    it('should batch IDs into chunks of max 20 per API call', async () => {
      // Generate 45 IDs → should result in 3 API calls (20, 20, 5)
      const ids = Array.from({ length: 45 }, (_, i) => i + 1);

      mockFetchSuccess(makeFixtureResponse([makeFixture(1)]));
      mockFetchSuccess(makeFixtureResponse([makeFixture(21)]));
      mockFetchSuccess(makeFixtureResponse([makeFixture(41)]));

      const result = await service.fetchFixturesByIds(ids);

      expect(global.fetch).toHaveBeenCalledTimes(3);
      expect(result).toHaveLength(3);

      // Verify first batch: IDs 1-20 dash-separated
      const firstUrl = (global.fetch as jest.Mock).mock.calls[0][0] as string;
      const firstIds = Array.from({ length: 20 }, (_, i) => i + 1).join('-');
      expect(firstUrl).toContain(`ids=${firstIds}`);

      // Verify third batch: IDs 41-45
      const thirdUrl = (global.fetch as jest.Mock).mock.calls[2][0] as string;
      const thirdIds = Array.from({ length: 5 }, (_, i) => i + 41).join('-');
      expect(thirdUrl).toContain(`ids=${thirdIds}`);
    });

    it('should aggregate results from all batches', async () => {
      const ids = Array.from({ length: 25 }, (_, i) => i + 1);
      const batch1Fixtures = [makeFixture(1), makeFixture(2)];
      const batch2Fixtures = [makeFixture(21)];

      mockFetchSuccess(makeFixtureResponse(batch1Fixtures));
      mockFetchSuccess(makeFixtureResponse(batch2Fixtures));

      const result = await service.fetchFixturesByIds(ids);

      expect(result).toHaveLength(3);
      expect(result[0].fixture.id).toBe(1);
      expect(result[1].fixture.id).toBe(2);
      expect(result[2].fixture.id).toBe(21);
    });

    it('should return empty array on HTTP 429 (rate limited)', async () => {
      mockFetchError(429, 'Too Many Requests');

      const result = await service.fetchFixturesByIds([1]);

      expect(result).toEqual([]);
    });

    it('should return empty array on HTTP 500 (server error)', async () => {
      mockFetchError(500, 'Internal Server Error');

      const result = await service.fetchFixturesByIds([1]);

      expect(result).toEqual([]);
    });

    it('should return empty array on HTTP 403 (forbidden)', async () => {
      mockFetchError(403, 'Forbidden');

      const result = await service.fetchFixturesByIds([1]);

      expect(result).toEqual([]);
    });

    it('should return empty array on network error (fetch throws)', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network timeout'),
      );

      const result = await service.fetchFixturesByIds([1]);

      expect(result).toEqual([]);
    });

    it('should return empty array when API returns 200 with error body', async () => {
      const errorResponse: ApiFootballResponse<ApiFootballFixture> = {
        get: 'fixtures',
        parameters: {},
        errors: { token: 'Error/Missing application key' },
        results: 0,
        paging: { current: 1, total: 1 },
        response: [],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({
          'x-ratelimit-requests-remaining': '90',
        }),
        json: () => Promise.resolve(errorResponse),
      });

      const result = await service.fetchFixturesByIds([1]);

      expect(result).toEqual([]);
    });

    it('should parse response data correctly with all nested fields', async () => {
      const fixture = makeFixture(999);
      fixture.goals = { home: 2, away: 1 };
      fixture.score.fulltime = { home: 2, away: 1 };
      fixture.fixture.status = {
        long: 'Match Finished',
        short: 'FT',
        elapsed: 90,
        extra: null,
      };
      fixture.teams.home.winner = true;
      fixture.teams.away.winner = false;

      mockFetchSuccess(makeFixtureResponse([fixture]));

      const result = await service.fetchFixturesByIds([999]);

      expect(result).toHaveLength(1);
      expect(result[0].goals.home).toBe(2);
      expect(result[0].goals.away).toBe(1);
      expect(result[0].fixture.status.short).toBe('FT');
      expect(result[0].teams.home.winner).toBe(true);
      expect(result[0].score.fulltime.home).toBe(2);
    });
  });

  // ---------------------------------------------------------------------------
  // fetchTopScorers
  // ---------------------------------------------------------------------------

  describe('fetchTopScorers', () => {
    it('should return top scorer data on success', async () => {
      const scorer = makeTopScorer(10, 5);
      mockFetchSuccess(makeTopScorerResponse([scorer]));

      const result = await service.fetchTopScorers(1, 2026);

      expect(result).toHaveLength(1);
      expect(result[0].player.id).toBe(10);
      expect(result[0].statistics[0].goals.total).toBe(5);
    });

    it('should construct URL with league and season params', async () => {
      mockFetchSuccess(makeTopScorerResponse([]));

      await service.fetchTopScorers(39, 2025);

      const calledUrl = (global.fetch as jest.Mock).mock.calls[0][0] as string;
      expect(calledUrl).toContain('league=39');
      expect(calledUrl).toContain('season=2025');
      expect(calledUrl).toContain('/players/topscorers');
    });

    it('should return empty array when API key is not configured', async () => {
      ({ service } = await createService(''));

      const result = await service.fetchTopScorers(1, 2026);

      expect(result).toEqual([]);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should return empty array on network error', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('DNS resolution failed'),
      );

      const result = await service.fetchTopScorers(1, 2026);

      expect(result).toEqual([]);
    });

    it('should return empty array on HTTP 500', async () => {
      mockFetchError(500);

      const result = await service.fetchTopScorers(1, 2026);

      expect(result).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  // Rate limit tracking
  // ---------------------------------------------------------------------------

  describe('getRateLimitRemaining', () => {
    it('should return -1 before any API call', () => {
      expect(service.getRateLimitRemaining()).toBe(-1);
    });

    it('should track remaining requests from response headers', async () => {
      mockFetchSuccess(makeFixtureResponse([]), '42');

      await service.fetchFixturesByIds([1]);

      expect(service.getRateLimitRemaining()).toBe(42);
    });

    it('should update rate limit on each API call', async () => {
      mockFetchSuccess(makeFixtureResponse([]), '100');
      await service.fetchFixturesByIds([1]);
      expect(service.getRateLimitRemaining()).toBe(100);

      mockFetchSuccess(makeFixtureResponse([]), '99');
      await service.fetchFixturesByIds([2]);
      expect(service.getRateLimitRemaining()).toBe(99);
    });

    it('should track rate limit even on error responses', async () => {
      mockFetchError(429);
      await service.fetchFixturesByIds([1]);

      expect(service.getRateLimitRemaining()).toBe(50);
    });
  });
});
