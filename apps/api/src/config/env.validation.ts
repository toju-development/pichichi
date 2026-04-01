/**
 * Environment variable validation — runs at startup.
 *
 * If any required variable is missing, the app crashes immediately with
 * a clear error message instead of failing silently at runtime when the
 * variable is first accessed (e.g. during a Google OAuth call).
 *
 * Uses a plain validation function (no extra deps) passed to
 * `ConfigModule.forRoot({ validate })`.
 */

interface EnvironmentVariables {
  GOOGLE_CLIENT_ID: string;
  APPLE_CLIENT_ID: string;
  JWT_SECRET: string;
  DATABASE_URL: string;
  REDIS_URL?: string;
}

const REQUIRED_VARS: readonly (keyof EnvironmentVariables)[] = [
  'GOOGLE_CLIENT_ID',
  'APPLE_CLIENT_ID',
  'JWT_SECRET',
  'DATABASE_URL',
] as const;

export function validateEnv(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const missing: string[] = [];

  for (const key of REQUIRED_VARS) {
    const value = config[key];

    if (typeof value !== 'string' || value.trim() === '') {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `❌ Missing required environment variables:\n` +
        missing.map((v) => `   - ${v}`).join('\n') +
        `\n\nCheck your .env file or deployment config.`,
    );
  }

  return {
    GOOGLE_CLIENT_ID: config.GOOGLE_CLIENT_ID as string,
    APPLE_CLIENT_ID: config.APPLE_CLIENT_ID as string,
    JWT_SECRET: config.JWT_SECRET as string,
    DATABASE_URL: config.DATABASE_URL as string,
    ...(typeof config.REDIS_URL === 'string' && config.REDIS_URL.trim() !== ''
      ? { REDIS_URL: config.REDIS_URL as string }
      : {}),
  };
}
