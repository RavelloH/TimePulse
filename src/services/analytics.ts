export type AnalyticsData = Record<string, unknown> | undefined;

export function track(name: string, data?: AnalyticsData): void {
  if (typeof window === 'undefined' || typeof window.insightflare?.track !== 'function') return;
  try {
    window.insightflare.track(name, data);
  } catch (error) {
    console.warn('[analytics] track failed:', error);
  }
}

export function trackOnce(name: string, data?: AnalyticsData): void {
  if (typeof window === 'undefined' || typeof window.insightflare?.trackOnce !== 'function') return;
  try {
    window.insightflare.trackOnce(name, data);
  } catch (error) {
    console.warn('[analytics] trackOnce failed:', error);
  }
}

export function bucketDurationMs(ms: number): string {
  if (ms < 0) return 'past';
  const hours = ms / 3_600_000;
  if (hours < 1) return 'lt_1h';
  if (hours < 24) return 'lt_1d';
  if (hours < 24 * 7) return 'lt_1w';
  if (hours < 24 * 30) return 'lt_1m';
  if (hours < 24 * 365) return 'lt_1y';
  return 'gte_1y';
}

export function bucketFileSize(bytes: number): string {
  const kb = bytes / 1024;
  if (kb < 100) return 'lt_100kb';
  if (kb < 1024) return 'lt_1mb';
  if (kb < 5120) return 'lt_5mb';
  return 'gte_5mb';
}
