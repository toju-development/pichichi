/**
 * Widget Proxy Service — Caching proxy for API-Football widget requests.
 *
 * Proxies HTTP requests to API-Football v3, caching responses with
 * status-aware TTL to minimize API quota consumption.
 *
 * TTL strategy:
 * - FINISHED matches (FT, AET, PEN): 7 days
 * - LIVE matches (1H, 2H, HT, ET, BT, P, LIVE, INT): 60 seconds
 * - NOT STARTED (NS, TBD): 1 hour
 * - POSTPONED/CANCELLED (PST, CANC, ABD, AWD, WO, SUSP): 24 hours
 * - Non-fixture endpoints or unknown status: 60 seconds (safe default)
 *
 * Uses the global cache provided by RedisModule (@nestjs/cache-manager),
 * which gracefully falls back to in-memory when Redis is unavailable.
 */

import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

// ---------------------------------------------------------------------------
// TTL Constants (milliseconds)
// ---------------------------------------------------------------------------

const TTL_FINISHED = 7 * 24 * 60 * 60 * 1000; // 7 days
const TTL_LIVE = 60 * 1000; // 60 seconds
const TTL_NOT_STARTED = 60 * 60 * 1000; // 1 hour
const TTL_POSTPONED = 24 * 60 * 60 * 1000; // 24 hours
const TTL_DEFAULT = 60 * 1000; // 60 seconds (safe for live scenarios)

// ---------------------------------------------------------------------------
// Status Sets
// ---------------------------------------------------------------------------

const FINISHED_STATUSES = new Set(['FT', 'AET', 'PEN']);
const LIVE_STATUSES = new Set([
  '1H',
  '2H',
  'HT',
  'ET',
  'BT',
  'P',
  'LIVE',
  'INT',
]);
const NOT_STARTED_STATUSES = new Set(['NS', 'TBD']);
const POSTPONED_STATUSES = new Set(['PST', 'CANC', 'ABD', 'AWD', 'WO', 'SUSP']);

const API_FOOTBALL_BASE_URL = 'https://v3.football.api-sports.io';

@Injectable()
export class WidgetProxyService {
  private readonly logger = new Logger(WidgetProxyService.name);
  private readonly apiKey: string;

  constructor(
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {
    this.apiKey = this.configService.get<string>('API_FOOTBALL_KEY', '');
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /**
   * Proxy a request to API-Football with caching.
   *
   * @param path    The API-Football endpoint path (e.g., `/fixtures`)
   * @param query   Query parameters from the incoming request
   * @returns       The JSON response from API-Football (or cache)
   */
  async proxyRequest(
    path: string,
    query: Record<string, string>,
  ): Promise<unknown> {
    const cacheKey = this.buildCacheKey(path, query);

    // 1. Check cache
    const cached = await this.cacheGet(cacheKey);
    if (cached !== undefined) {
      this.logger.debug(`Cache HIT: ${cacheKey}`);
      return cached;
    }

    // 2. Fetch from API-Football
    const data = await this.fetchFromApiFootball(path, query);
    if (data === null) {
      // Error from API-Football — don't cache, return error response
      return {
        errors: { proxy: 'Failed to fetch from API-Football' },
        results: 0,
        response: [],
      };
    }

    // 3. Determine TTL and cache
    const ttl = this.determineTtl(path, data);
    await this.cacheSet(cacheKey, data, ttl);

    this.logger.debug(`Cache SET: ${cacheKey} (TTL: ${ttl}ms)`);
    return data;
  }

  // ---------------------------------------------------------------------------
  // Private Helpers
  // ---------------------------------------------------------------------------

  /**
   * Build a deterministic cache key from path + sorted query params.
   * Example: `widget:football:/fixtures?id=12345`
   */
  private buildCacheKey(path: string, query: Record<string, string>): string {
    const sortedParams = Object.keys(query)
      .sort()
      .map((k) => `${k}=${query[k]}`)
      .join('&');

    const queryString = sortedParams ? `?${sortedParams}` : '';
    return `widget:football:${path}${queryString}`;
  }

  /**
   * Fetch data from API-Football v3.
   *
   * IMPORTANT: API-Football rejects requests with extra headers.
   * Only `x-apisports-key` is allowed.
   */
  private async fetchFromApiFootball(
    path: string,
    query: Record<string, string>,
  ): Promise<Record<string, unknown> | null> {
    const url = new URL(`${API_FOOTBALL_BASE_URL}${path}`);
    for (const [key, value] of Object.entries(query)) {
      url.searchParams.set(key, value);
    }

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: { 'x-apisports-key': this.apiKey },
      });

      if (!response.ok) {
        this.logger.warn(
          `API-Football error: ${response.status} ${response.statusText} on ${path}`,
        );
        return null;
      }

      const body = (await response.json()) as Record<string, unknown>;

      // API-Football can return 200 with error messages in the body
      const errors = body.errors as Record<string, string> | undefined;
      if (errors && Object.keys(errors).length > 0) {
        const errorMsg = Object.entries(errors)
          .map(([k, v]) => `${k}: ${v}`)
          .join(', ');
        this.logger.warn(
          `API-Football API-level error on ${path}: ${errorMsg}`,
        );
        return null;
      }

      return body;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`Network error proxying ${path}: ${message}`);
      return null;
    }
  }

  /**
   * Determine cache TTL based on the API-Football response content.
   *
   * For `/fixtures` endpoint: inspects `response[0].fixture.status.short`
   * For other endpoints (events, statistics, lineups): uses safe default (60s)
   */
  private determineTtl(path: string, data: unknown): number {
    // Only apply smart TTL to the /fixtures endpoint (not sub-resources)
    if (
      !path.startsWith('/fixtures') ||
      path.includes('/events') ||
      path.includes('/statistics') ||
      path.includes('/lineups') ||
      path.includes('/players')
    ) {
      return TTL_DEFAULT;
    }

    try {
      const body = data as {
        response?: Array<{ fixture?: { status?: { short?: string } } }>;
      };
      const status = body?.response?.[0]?.fixture?.status?.short;

      if (!status) return TTL_DEFAULT;

      if (FINISHED_STATUSES.has(status)) return TTL_FINISHED;
      if (LIVE_STATUSES.has(status)) return TTL_LIVE;
      if (NOT_STARTED_STATUSES.has(status)) return TTL_NOT_STARTED;
      if (POSTPONED_STATUSES.has(status)) return TTL_POSTPONED;

      return TTL_DEFAULT;
    } catch {
      return TTL_DEFAULT;
    }
  }

  // ---------------------------------------------------------------------------
  // Cache Helpers (graceful degradation — never throw on cache errors)
  // ---------------------------------------------------------------------------

  /** Read from cache, returning undefined on miss or error */
  private async cacheGet(key: string): Promise<unknown> {
    try {
      return await this.cache.get(key);
    } catch (err: unknown) {
      this.logger.warn(
        `Cache get failed (key=${key}): ${err instanceof Error ? err.message : 'Unknown error'}`,
      );
      return undefined;
    }
  }

  /** Write to cache with TTL, silently ignoring errors */
  private async cacheSet(
    key: string,
    value: unknown,
    ttl: number,
  ): Promise<void> {
    try {
      await this.cache.set(key, value, ttl);
    } catch (err: unknown) {
      this.logger.warn(
        `Cache set failed (key=${key}): ${err instanceof Error ? err.message : 'Unknown error'}`,
      );
    }
  }
}
