import { describe, expect, it } from 'vitest';
import { formatWorldClock, resolveTimeZone } from './timezone';

describe('world clock timezone helpers', () => {
  it('falls back to UTC for unknown timezones', () => {
    expect(resolveTimeZone('Not/A_Timezone')).toBe('UTC');
    expect(resolveTimeZone(null)).toBe('UTC');
  });

  it('formats a valid timezone deterministically', () => {
    expect(formatWorldClock('UTC', new Date('2026-01-01T12:34:56.000Z'))).toContain('12:34:56');
  });
});
