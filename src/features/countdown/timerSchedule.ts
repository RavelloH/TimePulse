import { getTimerType, type CountdownTimer, type StopwatchTimer, type Timer } from '../../domain/timer';

const SECOND_MS = 1_000;

function toTimestamp(value: Date | number | string | null | undefined): number {
  if (value instanceof Date) return value.getTime();
  if (value === null || value === undefined) return Number.NaN;
  return new Date(value).getTime();
}

/**
 * Returns the delay to the next display boundary for a timer.
 * Countdown boundaries follow the target timestamp; stopwatch boundaries
 * follow its start timestamp. This avoids drift from a fixed 1000ms interval.
 */
export function getNextTimerUpdateDelay(timer: Timer, now: number): number {
  switch (getTimerType(timer)) {
    case 'countdown': {
      const remaining = toTimestamp((timer as CountdownTimer).targetDate) - now;
      if (!Number.isFinite(remaining) || remaining <= 0) return SECOND_MS;

      // The displayed integer changes just after each exact remaining-second boundary.
      return Math.max(1, (remaining % SECOND_MS) + 1);
    }

    case 'stopwatch': {
      const stopwatch = timer as StopwatchTimer;
      if (!stopwatch.isRunning) return SECOND_MS;

      const elapsed = now - toTimestamp(stopwatch.startTime) - (stopwatch.totalPausedTime || 0);
      if (!Number.isFinite(elapsed) || elapsed < 0) return SECOND_MS;

      const elapsedWithinSecond = elapsed % SECOND_MS;
      return SECOND_MS - elapsedWithinSecond;
    }

    case 'worldclock':
      return SECOND_MS - (now % SECOND_MS);
  }
}
