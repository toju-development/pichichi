import { Global, Module, Logger } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import type { CacheModuleOptions } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import { Keyv, type KeyvStoreAdapter } from 'keyv';
import Redis from 'ioredis';

const MAX_RETRY_ATTEMPTS = 3;

/**
 * Creates a Keyv-compatible store backed by ioredis.
 *
 * `@nestjs/cache-manager` v3 + `cache-manager` v7 use Keyv under the hood.
 * Since we have `ioredis` but no `@keyv/redis`, we implement a minimal
 * `KeyvStoreAdapter` wrapping ioredis directly.
 *
 * Retry behaviour:
 * - `retryStrategy` gives up after {@link MAX_RETRY_ATTEMPTS} attempts, logging
 *   a single warning so the console is never flooded.
 * - Once retries are exhausted ioredis stops reconnecting and individual
 *   operations silently return `undefined`/`false` (graceful degradation).
 */
function createIoredisKeyvStore(redisUrl: string): KeyvStoreAdapter {
  const logger = new Logger('RedisKeyvStore');
  let errorLogged = false;

  const redis = new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    retryStrategy(times: number): number | null {
      if (times > MAX_RETRY_ATTEMPTS) {
        if (!errorLogged) {
          logger.warn(
            `Redis unreachable after ${MAX_RETRY_ATTEMPTS} attempts — falling back to in-memory cache`,
          );
          errorLogged = true;
        }
        return null; // stop retrying
      }
      return Math.min(times * 200, 2000);
    },
  });

  redis.on('error', () => {
    // Intentionally swallowed — retryStrategy already logs once on give-up.
    // This prevents ioredis from printing a warning on every failed attempt.
  });

  redis.on('connect', () => {
    errorLogged = false; // reset so reconnection issues are logged again
    logger.log('Redis connected');
  });

  // Connect eagerly but don't block if it fails
  redis.connect().catch(() => {
    // retryStrategy handles all logging
  });

  const listeners = new Map<string, Array<(...args: any[]) => void>>();

  const store: KeyvStoreAdapter = {
    opts: {},
    async get(key: string) {
      try {
        const val = await redis.get(key);
        return val === null ? undefined : (val as any);
      } catch {
        return undefined;
      }
    },
    async set(key: string, value: any, ttl?: number) {
      try {
        if (ttl && ttl > 0) {
          // Keyv passes TTL in milliseconds
          await redis.set(key, value as string, 'PX', ttl);
        } else {
          await redis.set(key, value as string);
        }
      } catch {
        // Graceful degradation — ignore write failures
      }
    },
    async delete(key: string) {
      try {
        const result = await redis.del(key);
        return result > 0;
      } catch {
        return false;
      }
    },
    async clear() {
      try {
        await redis.flushdb();
      } catch {
        // Graceful degradation
      }
    },
    async has(key: string) {
      try {
        const exists = await redis.exists(key);
        return exists > 0;
      } catch {
        return false;
      }
    },
    async deleteMany(keys: string[]) {
      try {
        if (keys.length === 0) return true;
        const result = await redis.del(...keys);
        return result > 0;
      } catch {
        return false;
      }
    },
    on(event: string, listener: (...args: any[]) => void) {
      if (!listeners.has(event)) {
        listeners.set(event, []);
      }
      listeners.get(event)!.push(listener);
      return store;
    },
  };

  return store;
}

@Global()
@Module({
  imports: [
    CacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService): CacheModuleOptions => {
        const logger = new Logger('RedisModule');
        const redisUrl = config.get<string>('REDIS_URL');

        if (!redisUrl) {
          logger.log('Redis not configured, using in-memory cache');
          return { ttl: 300_000 }; // 5 minutes in milliseconds
        }

        logger.log('Configuring Redis-backed cache');
        const store = createIoredisKeyvStore(redisUrl);

        return {
          stores: new Keyv({ store, useKeyPrefix: true, namespace: 'cache' }),
          ttl: 300_000, // 5 minutes in milliseconds
        } as CacheModuleOptions;
      },
    }),
  ],
})
export class RedisModule {}
