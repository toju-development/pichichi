/**
 * Widget Proxy Module — Caching proxy for API-Football widget requests.
 *
 * Uses the global cache provided by RedisModule (Redis when available,
 * in-memory fallback otherwise). No additional cache setup needed.
 */

import { Module } from '@nestjs/common';

import { WidgetProxyController } from './widget-proxy.controller.js';
import { WidgetProxyService } from './widget-proxy.service.js';

@Module({
  controllers: [WidgetProxyController],
  providers: [WidgetProxyService],
})
export class WidgetProxyModule {}
