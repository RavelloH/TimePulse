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

export interface CalendarDurationParts {
  years: number;
  months: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

/** @deprecated Use CalendarDurationParts. */
export type StopwatchCalendarParts = CalendarDurationParts;

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;

function getDaysInMonth(year: number, month: number): number {
  const lastDay = new Date(0);
  lastDay.setUTCHours(0, 0, 0, 0);
  lastDay.setUTCFullYear(year, month + 1, 0);
  return lastDay.getUTCDate();
}

type ZonedDateTimeParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  millisecond: number;
};

const zonedDateTimeFormatters = new Map<string, Intl.DateTimeFormat>();

function getZonedDateTimeFormatter(timeZone: string): Intl.DateTimeFormat {
  let formatter = zonedDateTimeFormatters.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    });
    zonedDateTimeFormatters.set(timeZone, formatter);
  }
  return formatter;
}

function getZonedDateTimeParts(timestamp: number, timeZone: string): ZonedDateTimeParts {
  const values: Record<string, number> = {};
  for (const part of getZonedDateTimeFormatter(timeZone).formatToParts(new Date(timestamp))) {
    if (part.type !== 'literal') values[part.type] = Number(part.value);
  }

  return {
    year: values.year,
    month: values.month,
    day: values.day,
    hour: values.hour === 24 ? 0 : values.hour,
    minute: values.minute,
    second: values.second,
    millisecond: ((timestamp % 1000) + 1000) % 1000,
  };
}

function getWallClockTimestamp(parts: ZonedDateTimeParts): number {
  const result = new Date(0);
  result.setUTCHours(0, 0, 0, 0);
  result.setUTCFullYear(parts.year, parts.month - 1, parts.day);
  result.setUTCHours(parts.hour, parts.minute, parts.second, parts.millisecond);
  return result.getTime();
}

function sameZonedDateTime(left: ZonedDateTimeParts, right: ZonedDateTimeParts): boolean {
  return left.year === right.year &&
    left.month === right.month &&
    left.day === right.day &&
    left.hour === right.hour &&
    left.minute === right.minute &&
    left.second === right.second &&
    left.millisecond === right.millisecond;
}

/**
 * Converts a local calendar date and time into an instant. Sampling nearby
 * offsets also handles daylight-saving gaps and repeated local times without
 * relying on the machine's own timezone.
 */
function zonedDateTimeToTimestamp(parts: ZonedDateTimeParts, timeZone: string): number {
  const wallClockTimestamp = getWallClockTimestamp(parts);
  const offsets = new Set<number>();

  for (let hours = -48; hours <= 48; hours += 12) {
    const sampleTimestamp = wallClockTimestamp + hours * HOUR_MS;
    const sampleParts = getZonedDateTimeParts(sampleTimestamp, timeZone);
    offsets.add(getWallClockTimestamp(sampleParts) - sampleTimestamp);
  }

  const candidates = [...offsets].map(offset => wallClockTimestamp - offset);
  const exactMatch = candidates
    .filter(candidate => sameZonedDateTime(getZonedDateTimeParts(candidate, timeZone), parts))
    .sort((left, right) => left - right);

  if (exactMatch.length > 0) return exactMatch[0];

  // A local time can be skipped when clocks move forward. In that case use
  // the first valid local time after the requested one (for example 02:30 -> 03:30).
  const afterRequestedTime = candidates
    .map(candidate => ({
      candidate,
      wallClockDelta: getWallClockTimestamp(getZonedDateTimeParts(candidate, timeZone)) - wallClockTimestamp,
    }))
    .filter(({ wallClockDelta }) => wallClockDelta > 0)
    .sort((left, right) => left.wallClockDelta - right.wallClockDelta || left.candidate - right.candidate);

  if (afterRequestedTime.length > 0) return afterRequestedTime[0].candidate;
  return candidates[0] ?? wallClockTimestamp;
}

function addZonedCalendarMonths(
  anchor: ZonedDateTimeParts,
  months: number,
  timeZone: string,
  anchorTimestamp: number,
): number {
  if (months === 0) return anchorTimestamp;
  const monthIndex = anchor.year * 12 + anchor.month - 1 + months;
  const year = Math.floor(monthIndex / 12);
  const month = monthIndex - year * 12 + 1;
  const day = Math.min(anchor.day, getDaysInMonth(year, month - 1));
  return zonedDateTimeToTimestamp({ ...anchor, year, month, day }, timeZone);
}

function addZonedCalendarDays(
  anchor: ZonedDateTimeParts,
  days: number,
  timeZone: string,
  anchorTimestamp: number,
): number {
  if (days === 0) return anchorTimestamp;
  const date = new Date(0);
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCFullYear(anchor.year, anchor.month - 1, anchor.day + days);
  return zonedDateTimeToTimestamp({
    ...anchor,
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  }, timeZone);
}

function getCalendarDayNumber(parts: ZonedDateTimeParts): number {
  const utcDate = new Date(0);
  utcDate.setUTCHours(0, 0, 0, 0);
  utcDate.setUTCFullYear(parts.year, parts.month - 1, parts.day);
  return utcDate.getTime() / DAY_MS;
}

/**
 * Splits a positive interval into calendar years, months and days, followed
 * by the remaining hours, minutes and seconds. Calendar units use the given
 * timezone; month anniversaries stay anchored to the start date and clamp to
 * the last day when a target month is shorter.
 */
export function splitCalendarDuration(
  startValue: TimeValue | null | undefined,
  endValue: TimeValue | null | undefined,
  timeZone: string = Intl.DateTimeFormat().resolvedOptions().timeZone,
): CalendarDurationParts {
  const startTimestamp = toTimestamp(startValue);
  const endTimestamp = toTimestamp(endValue);
  const zero = { years: 0, months: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
  if (!Number.isFinite(startTimestamp) || !Number.isFinite(endTimestamp) || endTimestamp <= startTimestamp) {
    return zero;
  }

  const start = getZonedDateTimeParts(startTimestamp, timeZone);
  const end = getZonedDateTimeParts(endTimestamp, timeZone);
  let totalMonths = (end.year - start.year) * 12 + end.month - start.month;

  while (totalMonths > 0 && addZonedCalendarMonths(start, totalMonths, timeZone, startTimestamp) > endTimestamp) {
    totalMonths -= 1;
  }
  while (addZonedCalendarMonths(start, totalMonths + 1, timeZone, startTimestamp) <= endTimestamp) {
    totalMonths += 1;
  }

  const afterMonthsTimestamp = addZonedCalendarMonths(start, totalMonths, timeZone, startTimestamp);
  const afterMonths = getZonedDateTimeParts(afterMonthsTimestamp, timeZone);
  let days = Math.max(0, getCalendarDayNumber(end) - getCalendarDayNumber(afterMonths));
  while (days > 0 && addZonedCalendarDays(afterMonths, days, timeZone, afterMonthsTimestamp) > endTimestamp) {
    days -= 1;
  }
  while (addZonedCalendarDays(afterMonths, days + 1, timeZone, afterMonthsTimestamp) <= endTimestamp) {
    days += 1;
  }

  const remainder = Math.max(0, endTimestamp - addZonedCalendarDays(afterMonths, days, timeZone, afterMonthsTimestamp));

  return {
    years: Math.floor(totalMonths / 12),
    months: totalMonths % 12,
    days,
    hours: Math.floor(remainder / HOUR_MS),
    minutes: Math.floor((remainder % HOUR_MS) / MINUTE_MS),
    seconds: Math.floor((remainder % MINUTE_MS) / 1000),
  };
}

/** @deprecated Use splitCalendarDuration. */
export function splitStopwatchCalendarDuration(
  startValue: TimeValue | null | undefined,
  endValue: TimeValue | null | undefined,
): StopwatchCalendarParts {
  return splitCalendarDuration(startValue, endValue);
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
