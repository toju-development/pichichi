import {
  DEFAULT_TIMEZONE,
  getLocalDayBoundsUtc,
  isValidIanaTimezone,
  normalizeTimezoneInput,
  resolveTimezoneOrFallback,
} from './timezone.utils';

describe('timezone.utils', () => {
  describe('normalizeTimezoneInput', () => {
    it('should normalize GMT and UTC aliases to UTC', () => {
      expect(normalizeTimezoneInput('GMT')).toBe(DEFAULT_TIMEZONE);
      expect(normalizeTimezoneInput('utc')).toBe(DEFAULT_TIMEZONE);
    });

    it('should return canonical IANA timezone name', () => {
      expect(normalizeTimezoneInput('america/argentina/buenos_aires')).toBe(
        'America/Buenos_Aires',
      );
    });

    it('should default missing timezone to UTC', () => {
      expect(normalizeTimezoneInput(undefined)).toBe(DEFAULT_TIMEZONE);
      expect(normalizeTimezoneInput('   ')).toBe(DEFAULT_TIMEZONE);
    });
  });

  describe('isValidIanaTimezone', () => {
    it('should validate known IANA timezone and reject invalid ones', () => {
      expect(isValidIanaTimezone('Europe/Madrid')).toBe(true);
      expect(isValidIanaTimezone('Mars/Olympus')).toBe(false);
    });
  });

  describe('resolveTimezoneOrFallback', () => {
    it('should resolve valid timezone without fallback', () => {
      expect(resolveTimezoneOrFallback('America/New_York')).toEqual({
        input: 'America/New_York',
        normalized: 'America/New_York',
        valid: true,
        fallbackApplied: false,
      });
    });

    it('should fallback to UTC with invalid_format reason for malformed timezone', () => {
      expect(resolveTimezoneOrFallback('invalid-tz')).toEqual({
        input: 'invalid-tz',
        normalized: DEFAULT_TIMEZONE,
        valid: false,
        fallbackApplied: true,
        reason: 'invalid_format',
      });
    });

    it('should fallback to UTC with invalid_iana reason for unknown timezone', () => {
      expect(resolveTimezoneOrFallback('Mars/Olympus')).toEqual({
        input: 'Mars/Olympus',
        normalized: DEFAULT_TIMEZONE,
        valid: false,
        fallbackApplied: true,
        reason: 'invalid_iana',
      });
    });
  });

  describe('getLocalDayBoundsUtc', () => {
    it('should return semi-open bounds with invariant startUtc < endUtcExclusive', () => {
      const bounds = getLocalDayBoundsUtc(
        'UTC',
        new Date('2026-06-15T10:30:00.000Z'),
      );

      expect(bounds.localDate).toBe('2026-06-15');
      expect(bounds.startUtc.toISOString()).toBe('2026-06-15T00:00:00.000Z');
      expect(bounds.endUtcExclusive.toISOString()).toBe('2026-06-16T00:00:00.000Z');
      expect(bounds.startUtc.getTime()).toBeLessThan(bounds.endUtcExclusive.getTime());
    });

    it('should handle UTC+ offsets correctly (Asia/Tokyo)', () => {
      const bounds = getLocalDayBoundsUtc(
        'Asia/Tokyo',
        new Date('2026-06-15T10:30:00.000Z'),
      );

      expect(bounds.localDate).toBe('2026-06-15');
      expect(bounds.startUtc.toISOString()).toBe('2026-06-14T15:00:00.000Z');
      expect(bounds.endUtcExclusive.toISOString()).toBe('2026-06-15T15:00:00.000Z');
    });

    it('should handle DST spring-forward day in America/New_York', () => {
      const bounds = getLocalDayBoundsUtc(
        'America/New_York',
        new Date('2026-03-08T12:00:00.000Z'),
      );

      expect(bounds.localDate).toBe('2026-03-08');
      expect(bounds.startUtc.toISOString()).toBe('2026-03-08T05:00:00.000Z');
      expect(bounds.endUtcExclusive.toISOString()).toBe('2026-03-09T04:00:00.000Z');
      expect(bounds.endUtcExclusive.getTime() - bounds.startUtc.getTime()).toBe(
        23 * 60 * 60 * 1000,
      );
    });

    it('should handle DST fall-back day in America/New_York', () => {
      const bounds = getLocalDayBoundsUtc(
        'America/New_York',
        new Date('2026-11-01T12:00:00.000Z'),
      );

      expect(bounds.localDate).toBe('2026-11-01');
      expect(bounds.startUtc.toISOString()).toBe('2026-11-01T04:00:00.000Z');
      expect(bounds.endUtcExclusive.toISOString()).toBe('2026-11-02T05:00:00.000Z');
      expect(bounds.endUtcExclusive.getTime() - bounds.startUtc.getTime()).toBe(
        25 * 60 * 60 * 1000,
      );
    });
  });
});
