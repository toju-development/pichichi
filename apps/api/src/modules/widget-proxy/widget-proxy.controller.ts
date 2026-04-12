/**
 * Widget Proxy Controller — Public endpoint for API-Football widget requests.
 *
 * Exposes a wildcard catch-all route that proxies any path under
 * `/widgets/football/*` to API-Football v3 with caching.
 *
 * This is PUBLIC (no auth guard) because the widget makes these calls
 * from a WebView that doesn't have user auth tokens.
 *
 * CORS is handled by the global CORS config in `main.ts` which uses a
 * function-based origin that accepts `null` origins from WebViews.
 */

import { Controller, Get, Req } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import type { Request } from 'express';

import { WidgetProxyService } from './widget-proxy.service.js';

@ApiExcludeController()
@Controller('widgets/football')
export class WidgetProxyController {
  constructor(private readonly widgetProxyService: WidgetProxyService) {}

  /**
   * Wildcard proxy — catches all GET requests under `/widgets/football/*`.
   *
   * Examples:
   * - GET /api/v1/widgets/football/fixtures?id=12345
   * - GET /api/v1/widgets/football/fixtures/events?fixture=12345
   * - GET /api/v1/widgets/football/fixtures/statistics?fixture=12345
   * - GET /api/v1/widgets/football/fixtures/lineups?fixture=12345
   */
  @Get('*path')
  async proxyAll(@Req() req: Request): Promise<unknown> {
    // Express v5 named wildcard: `*path` captures everything after the prefix.
    // req.params.path contains the matched wildcard segment.
    const wildcardPath = (req.params as Record<string, string>).path ?? '';
    const apiPath = `/${wildcardPath}`;

    // Forward all query parameters
    const query: Record<string, string> = {};
    for (const [key, value] of Object.entries(req.query)) {
      if (typeof value === 'string') {
        query[key] = value;
      }
    }

    return this.widgetProxyService.proxyRequest(apiPath, query);
  }
}
