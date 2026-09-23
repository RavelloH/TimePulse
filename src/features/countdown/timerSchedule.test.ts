import { describe, expect, it } from 'vitest';
import type { CountdownTimer, StopwatchTimer, WorldClockTimer } from '../../domain/timer';
import { getNextTimerUpdateDelay } from './timerSchedule';

const countdown = (targetDate: number): CountdownTimer => ({
  id: 'countdown',
  name: 'Countdown',
  type: 'countdown',
  targetDate,
  timezone: 'UTC',
});

const stopwatch = (overrides: Partial<StopwatchTimer> = {}): StopwatchTimer => ({
  id: 'stopwatch',
  name: 'Stopwatch',
  type: 'stopwatch',
  startTime: 0,
  isRunning: true,
  totalPausedTime: 0,
  laps: [],
  ...overrides,
});

const worldClock: WorldClockTimer = {
  id: 'world-clock',
  name: 'World clock',
  type: 'worldclock',
  timezone: 'UTC',
  city: 'UTC',
  country: 'UTC',
};

describe('timer update scheduling', () => {
  it('aligns countdown updates to the target timestamp, including its millisecond offset', () => {
    expect(getNextTimerUpdateDelay(countdown(10_750), 0)).toBe(751);
    expect(getNextTimerUpdateDelay(countdown(10_000), 0)).toBe(1);
  });

  it('checks expired countdowns periodically without creating a fixed interval drift', () => {
    expect(getNextTimerUpdateDelay(countdown(0), 10)).toBe(1_000);
  });

  it('aligns running stopwatch updates to elapsed-second boundaries', () => {
    expect(getNextTimerUpdateDelay(stopwatch({ startTime: 750 }), 3_500)).toBe(250);
    expect(getNextTimerUpdateDelay(stopwatch({ startTime: 500 }), 3_500)).toBe(1_000);
  });

  it('keeps paused stopwatches available for external timer changes', () => {
    expect(getNextTimerUpdateDelay(stopwatch({ isRunning: false }), 3_500)).toBe(1_000);
  });

  it('aligns world-clock updates to the next wall-clock second', () => {
    expect(getNextTimerUpdateDelay(worldClock, 1_500)).toBe(500);
    expect(getNextTimerUpdateDelay(worldClock, 1_000)).toBe(1_000);
  });
});
