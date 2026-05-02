const TIMEZONE_FALLBACK_REASON = {
  MISSING: 'missing',
  INVALID_FORMAT: 'invalid_format',
  INVALID_IANA: 'invalid_iana',
} as const;

type TimezoneFallbackReason =
  (typeof TIMEZONE_FALLBACK_REASON)[keyof typeof TIMEZONE_FALLBACK_REASON];

const DEFAULT_LOCALE = 'en-US';

const IANA_TIMEZONE_SHAPE_REGEX =
  /^[A-Za-z][A-Za-z0-9_+-]*(\/[A-Za-z0-9_+-]+)+$/;

const TIME_PARTS_FORMATTER_CACHE = new Map<string, Intl.DateTimeFormat>();

export const DEFAULT_TIMEZONE = 'UTC';

interface TimezoneParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

export interface TimezoneResolution {
  input?: string;
  normalized: string;
  valid: boolean;
  fallbackApplied: boolean;
  reason?: TimezoneFallbackReason;
}

export interface UtcDayBounds {
  startUtc: Date;
  endUtcExclusive: Date;
  localDate: string;
}

export function normalizeTimezoneInput(tz?: string): string {
  const normalizedInput = tz?.trim();

  if (!normalizedInput) {
    return DEFAULT_TIMEZONE;
  }

  const upperValue = normalizedInput.toUpperCase();
  if (upperValue === 'UTC' || upperValue === 'GMT') {
    return DEFAULT_TIMEZONE;
  }

  const canonical = getCanonicalIanaTimezone(normalizedInput);
  return canonical ?? normalizedInput;
}

export function isValidIanaTimezone(tz: string): boolean {
  return getCanonicalIanaTimezone(tz) !== null;
}

export function resolveTimezoneOrFallback(tz?: string): TimezoneResolution {
  const input = tz?.trim();

  if (!input) {
    return {
      input: tz,
      normalized: DEFAULT_TIMEZONE,
      valid: false,
      fallbackApplied: true,
      reason: TIMEZONE_FALLBACK_REASON.MISSING,
    };
  }

  const normalized = normalizeTimezoneInput(input);
  const canonical = getCanonicalIanaTimezone(normalized);

  if (!canonical) {
    const reason = IANA_TIMEZONE_SHAPE_REGEX.test(normalized)
      ? TIMEZONE_FALLBACK_REASON.INVALID_IANA
      : TIMEZONE_FALLBACK_REASON.INVALID_FORMAT;

    return {
      input,
      normalized: DEFAULT_TIMEZONE,
      valid: false,
      fallbackApplied: true,
      reason,
    };
  }

  return {
    input,
    normalized: canonical,
    valid: true,
    fallbackApplied: false,
  };
}

export function getLocalDayBoundsUtc(
  timeZone: string,
  now: Date = new Date(),
): UtcDayBounds {
  const resolvedTimezone =
    getCanonicalIanaTimezone(timeZone) ?? DEFAULT_TIMEZONE;
  const localNowParts = getTimePartsInZone(now, resolvedTimezone);

  const startUtc = zonedDateTimeToUtc(
    localNowParts.year,
    localNowParts.month,
    localNowParts.day,
    0,
    0,
    0,
    resolvedTimezone,
  );

  const nextDate = addOneLocalDay(
    localNowParts.year,
    localNowParts.month,
    localNowParts.day,
  );

  const endUtcExclusive = zonedDateTimeToUtc(
    nextDate.year,
    nextDate.month,
    nextDate.day,
    0,
    0,
    0,
    resolvedTimezone,
  );

  return {
    startUtc,
    endUtcExclusive,
    localDate: `${localNowParts.year}-${pad2(localNowParts.month)}-${pad2(localNowParts.day)}`,
  };
}

function getCanonicalIanaTimezone(tz: string): string | null {
  if (!tz) {
    return null;
  }

  try {
    return new Intl.DateTimeFormat(DEFAULT_LOCALE, {
      timeZone: tz,
    }).resolvedOptions().timeZone;
  } catch {
    return null;
  }
}

function getFormatter(timeZone: string): Intl.DateTimeFormat {
  const cached = TIME_PARTS_FORMATTER_CACHE.get(timeZone);
  if (cached) {
    return cached;
  }

  const formatter = new Intl.DateTimeFormat(DEFAULT_LOCALE, {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });

  TIME_PARTS_FORMATTER_CACHE.set(timeZone, formatter);
  return formatter;
}

function getTimePartsInZone(date: Date, timeZone: string): TimezoneParts {
  const formatter = getFormatter(timeZone);
  const parts = formatter.formatToParts(date);

  const readPart = (type: Intl.DateTimeFormatPartTypes): number => {
    const found = parts.find((part) => part.type === type)?.value;

    if (!found) {
      throw new Error(`Unable to read timezone part: ${type}`);
    }

    return Number(found);
  };

  return {
    year: readPart('year'),
    month: readPart('month'),
    day: readPart('day'),
    hour: readPart('hour'),
    minute: readPart('minute'),
    second: readPart('second'),
  };
}

function zonedDateTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  timeZone: string,
): Date {
  const targetAsUtc = Date.UTC(year, month - 1, day, hour, minute, second);
  let guess = targetAsUtc;

  for (let i = 0; i < 4; i++) {
    const zoned = getTimePartsInZone(new Date(guess), timeZone);
    const zonedAsUtc = Date.UTC(
      zoned.year,
      zoned.month - 1,
      zoned.day,
      zoned.hour,
      zoned.minute,
      zoned.second,
    );
    const delta = zonedAsUtc - targetAsUtc;

    if (delta === 0) {
      break;
    }

    guess -= delta;
  }

  return new Date(guess);
}

function addOneLocalDay(
  year: number,
  month: number,
  day: number,
): {
  year: number;
  month: number;
  day: number;
} {
  const utcDate = new Date(Date.UTC(year, month - 1, day));
  utcDate.setUTCDate(utcDate.getUTCDate() + 1);

  return {
    year: utcDate.getUTCFullYear(),
    month: utcDate.getUTCMonth() + 1,
    day: utcDate.getUTCDate(),
  };
}

function pad2(value: number): string {
  return value.toString().padStart(2, '0');
}
