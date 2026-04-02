/**
 * API-Football v3 — Injectable HTTP Client
 *
 * NestJS injectable service wrapping the API-Football v3 API.
 * Uses native fetch (Node 18+), tracks rate limits from response headers,
 * and handles errors gracefully (never throws — returns empty arrays).
 *
 * IMPORTANT: API-Football rejects requests with extra headers.
 * Only `x-apisports-key` is allowed.
 *
 * @see https://www.api-football.com/documentation-v3
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type {
  ApiFootballFixture,
  ApiFootballResponse,
  ApiFootballTopScorer,
} from './api-football.types.js';

const BASE_URL = 'https://v3.football.api-sports.io';
const MAX_IDS_PER_REQUEST = 20;

@Injectable()
export class ApiFootballService {
  private readonly logger = new Logger(ApiFootballService.name);
  private readonly apiKey: string;
  private rateLimitRemaining = -1;
  private hasLoggedMissingKey = false;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('API_FOOTBALL_KEY', '');
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /**
   * Batch-fetch fixtures by their API-Football IDs.
   *
   * Automatically splits into multiple calls when more than 20 IDs are provided
   * (API-Football limit). Uses dash-separated IDs format: `/fixtures?ids=1-2-3`.
   */
  async fetchFixturesByIds(ids: number[]): Promise<ApiFootballFixture[]> {
    if (ids.length === 0) return [];

    if (!this.guardApiKey()) return [];

    const batches = this.chunkArray(ids, MAX_IDS_PER_REQUEST);
    const results: ApiFootballFixture[] = [];

    for (const batch of batches) {
      const dashSeparatedIds = batch.join('-');
      const fixtures = await this.request<ApiFootballFixture>(
        '/fixtures',
        { ids: dashSeparatedIds },
      );
      results.push(...fixtures);
    }

    return results;
  }

  /**
   * Fetch top scorers for a league/season.
   *
   * Uses `/players/topscorers?league=X&season=Y`.
   */
  async fetchTopScorers(
    leagueId: number,
    season: number,
  ): Promise<ApiFootballTopScorer[]> {
    if (!this.guardApiKey()) return [];

    return this.request<ApiFootballTopScorer>('/players/topscorers', {
      league: String(leagueId),
      season: String(season),
    });
  }

  /**
   * Returns the last known daily rate limit remaining from response headers.
   * Returns -1 if no API call has been made yet.
   */
  getRateLimitRemaining(): number {
    return this.rateLimitRemaining;
  }

  /**
   * Returns true if the API key is configured (non-empty).
   */
  isAvailable(): boolean {
    return this.apiKey.trim() !== '';
  }

  // ---------------------------------------------------------------------------
  // Private Helpers
  // ---------------------------------------------------------------------------

  /**
   * Core HTTP request method. Only sends `x-apisports-key` — no extra headers.
   *
   * Error handling:
   * - Network errors → log warning, return []
   * - HTTP 429 → log warning, return []
   * - HTTP 500+ → log warning, return []
   * - API-level errors (200 with error body) → log warning, return []
   */
  private async request<T>(
    endpoint: string,
    params: Record<string, string>,
  ): Promise<T[]> {
    const url = new URL(`${BASE_URL}${endpoint}`);
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }

    const urlString = url.toString();

    try {
      const response = await fetch(urlString, {
        method: 'GET',
        headers: {
          'x-apisports-key': this.apiKey,
        },
      });

      this.trackRateLimit(response);

      this.logger.log(
        `API call: ${endpoint} → ${response.status} | Rate limit remaining: ${this.rateLimitRemaining}`,
      );

      if (response.status === 429) {
        this.logger.warn(
          `Rate limited (429) on ${endpoint}. Returning empty result.`,
        );
        return [];
      }

      if (response.status >= 500) {
        this.logger.warn(
          `Server error (${response.status}) on ${endpoint}. Returning empty result.`,
        );
        return [];
      }

      if (!response.ok) {
        this.logger.warn(
          `HTTP error (${response.status}) on ${endpoint}: ${response.statusText}`,
        );
        return [];
      }

      const body = (await response.json()) as ApiFootballResponse<T>;

      // API-Football can return 200 with error messages in the body
      const errorKeys = Object.keys(body.errors);
      if (errorKeys.length > 0) {
        const errorMsg = errorKeys
          .map((k) => `${k}: ${body.errors[k]}`)
          .join(', ');
        this.logger.warn(`API-level error on ${endpoint}: ${errorMsg}`);
        return [];
      }

      return body.response;
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(
        `Network error on ${endpoint}: ${message}. Returning empty result.`,
      );
      return [];
    }
  }

  /**
   * Extract rate limit info from response headers.
   *
   * API-Football returns:
   * - `x-ratelimit-requests-remaining` — daily remaining
   * - `X-RateLimit-Remaining` — per-minute remaining (not tracked here)
   */
  private trackRateLimit(response: Response): void {
    const remaining = response.headers.get('x-ratelimit-requests-remaining');
    if (remaining !== null) {
      this.rateLimitRemaining = parseInt(remaining, 10);
    }
  }

  /**
   * Guard: checks if API key is configured. Logs a warning once if missing.
   * Returns true if the key is available, false otherwise.
   */
  private guardApiKey(): boolean {
    if (this.isAvailable()) return true;

    if (!this.hasLoggedMissingKey) {
      this.logger.warn(
        'API_FOOTBALL_KEY is not configured. API calls will be skipped.',
      );
      this.hasLoggedMissingKey = true;
    }

    return false;
  }

  /**
   * Split an array into chunks of at most `size` elements.
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}
