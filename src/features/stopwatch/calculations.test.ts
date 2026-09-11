import { describe, expect, it } from 'vitest';
import { getStopwatchElapsed } from './calculations';

describe('stopwatch calculations', () => {
  it('accounts for paused time while running', () => {
    expect(getStopwatchElapsed({
      startTime: 1_000,
      isRunning: true,
      pausedAt: null,
      totalPausedTime: 250,
    }, 2_000)).toBe(750);
  });

  it('uses pausedAt as the endpoint when stopped', () => {
    expect(getStopwatchElapsed({
      startTime: 1_000,
      isRunning: false,
      pausedAt: 1_500,
      totalPausedTime: 100,
    }, 9_000)).toBe(400);
  });
});
