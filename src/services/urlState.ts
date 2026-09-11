export const SUPPORTED_HASHES = [
  'add',
  'login',
  'share',
  'manage',
  'background',
  'fullscreen-settings',
  'footer',
] as const;

export type SupportedHash = (typeof SUPPORTED_HASHES)[number];

export function readUrlParams(url: Location = window.location): URLSearchParams {
  return new URLSearchParams(url.search);
}

export function readHash(url: Location = window.location): string {
  return url.hash.replace(/^#/, '');
}

export function clearSyncParams(): void {
  const params = new URLSearchParams(window.location.search);
  params.delete('syncId');
  params.delete('syncPass');
  const nextUrl = `${window.location.pathname}${params.toString() ? `?${params}` : ''}${window.location.hash}`;
  window.history.replaceState({}, document.title, nextUrl);
}
