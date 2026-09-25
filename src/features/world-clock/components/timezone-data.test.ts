import { describe, expect, it } from 'vitest';
import {
  allTimezones,
  getTimezoneAccentColor,
  popularWorldClocks,
  timezoneAccentPalette,
} from './timezone-data';

describe('timezone picker data', () => {
  it('keeps timezone options unique by IANA timezone', () => {
    const timezones = allTimezones.map(({ timezone }) => timezone);
    expect(new Set(timezones).size).toBe(timezones.length);
  });

  it('preserves the established colors for popular world clocks', () => {
    for (const preset of popularWorldClocks) {
      expect(getTimezoneAccentColor(preset.timezone)).toBe(preset.color);
    }
  });

  it('assigns stable colors from the shared palette to other timezones', () => {
    const color = getTimezoneAccentColor('America/Denver');

    expect(getTimezoneAccentColor('America/Denver')).toBe(color);
    expect(timezoneAccentPalette).toContain(color);
    expect(new Set(allTimezones.map(({ timezone }) => getTimezoneAccentColor(timezone))).size)
      .toBeGreaterThan(1);
  });
});
