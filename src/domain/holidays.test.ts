import { describe, expect, it } from 'vitest';
import { findNextHoliday, getHolidaysList } from './holidays';

describe('holiday domain rules', () => {
  it('returns future holidays in chronological order', () => {
    const now = new Date('2026-01-02T00:00:00.000Z');
    const holidays = getHolidaysList(now);

    expect(holidays.length).toBeGreaterThan(0);
    expect(new Date(holidays[0].date).getTime()).toBeGreaterThan(now.getTime());
    expect(holidays.every((holiday, index) => index === 0 || new Date(holiday.date) >= new Date(holidays[index - 1].date))).toBe(true);
  });

  it('always supplies a next holiday fallback', () => {
    const holiday = findNextHoliday(new Date('2099-12-31T23:59:59.000Z'));
    expect(holiday).toMatchObject({ name: expect.any(String), color: expect.any(String) });
  });
});
