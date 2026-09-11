import { describe, expect, it } from 'vitest';
import { getTimerType, parseSyncPayload, parseTimer } from './timer';

describe('timer boundary parsing', () => {
  it('treats old records without a type as countdowns and retains fields', () => {
    const timer = parseTimer({
      id: 'legacy',
      name: 'Legacy timer',
      targetDate: '2026-01-01T00:00:00.000Z',
      timezone: 'UTC',
      legacyField: 'keep-me',
    });

    expect(timer).toMatchObject({ type: undefined, id: 'legacy', legacyField: 'keep-me' });
    expect(getTimerType(timer ?? {})).toBe('countdown');
  });

  it('rejects malformed records without throwing', () => {
    expect(parseTimer({ name: 'missing id' })).toBeNull();
    expect(parseSyncPayload({ timers: 'not-an-array' })).toEqual({ timers: [], activeTimerId: null });
  });

  it('normalizes stopwatch state at the boundary', () => {
    expect(parseTimer({ id: 'watch', name: 'Watch', type: 'stopwatch' })).toMatchObject({
      type: 'stopwatch',
      isRunning: false,
      totalPausedTime: 0,
      laps: [],
    });
  });
});
