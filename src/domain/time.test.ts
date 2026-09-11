import { describe, expect, it } from 'vitest';
import { formatTimeUnit, getStopwatchElapsed, splitCountdown } from './time';

describe('time domain functions', () => {
  it('splits a countdown without changing the display units', () => {
    const now = Date.parse('2026-01-01T00:00:00.000Z');
    const target = Date.parse('2026-01-02T02:03:04.567Z');
    expect(splitCountdown(target, now)).toMatchObject({
      days: 1,
      hours: 2,
      minutes: 3,
      seconds: 4,
      milliseconds: 567,
      isExpired: false,
    });
  });

  it('clamps expired countdowns to zero', () => {
    expect(splitCountdown(1000, 2000)).toMatchObject({
      totalMilliseconds: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isExpired: true,
    });
  });

  it('subtracts paused time from a stopwatch', () => {
    expect(getStopwatchElapsed({
      startTime: 1000,
      isRunning: false,
      pausedAt: 10000,
      totalPausedTime: 2500,
    }, 20000)).toBe(6500);
  });

  it('pads display units', () => {
    expect(formatTimeUnit(4)).toBe('04');
  });
});
