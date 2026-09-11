import type { StopwatchTimer, TimeValue } from './timer';
import { toTimestamp } from './timer';

export interface CountdownParts {
  totalMilliseconds: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  milliseconds: number;
  isExpired: boolean;
}

export function splitCountdown(target: TimeValue, now: TimeValue = Date.now()): CountdownParts {
  const totalMilliseconds = Math.max(0, toTimestamp(target) - toTimestamp(now));
  const totalSeconds = Math.floor(totalMilliseconds / 1000);
  return {
    totalMilliseconds,
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    milliseconds: totalMilliseconds % 1000,
    isExpired: toTimestamp(target) <= toTimestamp(now),
  };
}

export function getStopwatchElapsed(timer: Pick<StopwatchTimer, 'startTime' | 'isRunning' | 'pausedAt' | 'totalPausedTime'>, now: TimeValue = Date.now()): number {
  if (timer.startTime === null || timer.startTime === undefined) return 0;
  const end = timer.isRunning ? toTimestamp(now) : toTimestamp(timer.pausedAt ?? now);
  return Math.max(0, end - toTimestamp(timer.startTime) - timer.totalPausedTime);
}

export function formatTimeUnit(value: number): string {
  return String(Math.max(0, value)).padStart(2, '0');
}
