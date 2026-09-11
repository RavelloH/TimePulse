export function formatWorldClock(timezone: string, now: Date = new Date()): string {
  return new Intl.DateTimeFormat(undefined, {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(now);
}

export function resolveTimeZone(timezone: string | null | undefined): string {
  if (!timezone) return 'UTC';
  try {
    new Intl.DateTimeFormat(undefined, { timeZone: timezone }).format();
    return timezone;
  } catch {
    return 'UTC';
  }
}
