import type { Timer } from '../domain/timer';
import { parseTimers } from '../domain/timer';

export interface SharePayload {
  timers: Timer[];
}

export function encodeSharePayload(timers: Timer[]): string {
  const minimalTimers = timers.map((timer) => {
    const baseTimer: Record<string, unknown> = {
      id: timer.id,
      name: timer.name,
      type: timer.type,
      color: timer.color,
    };

    if (timer.type === 'stopwatch') {
      baseTimer.startTime = timer.startTime;
      baseTimer.isRunning = timer.isRunning;
    } else if (timer.type === 'worldclock') {
      baseTimer.timezone = timer.timezone;
      baseTimer.city = timer.city;
      baseTimer.country = timer.country;
    } else {
      baseTimer.targetDate = timer.targetDate;
    }

    return baseTimer;
  });

  return btoa(encodeURIComponent(JSON.stringify({ timers: minimalTimers })));
}

export function decodeSharePayload(value: string): SharePayload | null {
  try {
    const parsed: unknown = JSON.parse(decodeURIComponent(atob(value)));
    if (typeof parsed !== 'object' || parsed === null || !('timers' in parsed)) return null;
    return { timers: parseTimers((parsed as { timers?: unknown }).timers) };
  } catch (error) {
    console.error('解析分享URL失败:', error);
    return null;
  }
}

export function createShareUrl(timers: Timer[]): string {
  const encoded = encodeSharePayload(timers);
  if (encoded.length > 2000) console.warn('分享数据过长，可能导致二维码生成失败或URL过长问题');
  return encoded;
}

export function parseShareUrl(value: string): { timers: Timer[] } | null {
  try {
    const parsed: unknown = JSON.parse(decodeURIComponent(atob(value)));
    if (typeof parsed !== 'object' || parsed === null || !('timers' in parsed)) return null;
    return { timers: parseTimers((parsed as { timers?: unknown }).timers) };
  } catch (error) {
    console.error('解析分享URL失败:', error);
    return null;
  }
}
