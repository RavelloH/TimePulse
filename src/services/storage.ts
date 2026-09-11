import type { BackgroundSettings, FullscreenSettings } from '../domain/settings';
import type { SyncPayload, Timer } from '../domain/timer';
import { parseSyncPayload, parseTimers } from '../domain/timer';

export const STORAGE_KEYS = {
  timers: 'timers',
  activeTimerId: 'activeTimerId',
  theme: 'theme',
  accentColor: 'accent-color',
  background: 'timepulse_background_settings',
  fullscreen: 'timepulse_fullscreen_settings',
  syncId: 'timepulse_sync_id',
  syncPassword: 'timepulse_sync_password',
  notificationPreference: 'timepulse_notification_preference',
} as const;

export function readJson<T>(key: string, fallback: T, storage: Storage = localStorage): T {
  try {
    const raw = storage.getItem(key);
    if (!raw) return fallback;
    const parsed: unknown = JSON.parse(raw);
    return parsed as T;
  } catch (error) {
    console.error(`读取 ${key} 失败:`, error);
    return fallback;
  }
}

export function readTimers(storage: Storage = localStorage): Timer[] {
  try {
    const raw = storage.getItem(STORAGE_KEYS.timers);
    return raw ? parseTimers(JSON.parse(raw)) : [];
  } catch (error) {
    console.error('读取计时器失败:', error);
    return [];
  }
}

export function writeTimers(timers: Timer[], storage: Storage = localStorage): void {
  try {
    storage.setItem(STORAGE_KEYS.timers, JSON.stringify(timers));
  } catch (error) {
    console.error('保存计时器失败:', error);
  }
}

export function readSyncPayload(value: unknown): SyncPayload | null {
  return parseSyncPayload(value);
}

export function readSettings<T extends BackgroundSettings | FullscreenSettings>(key: string, fallback: T, storage: Storage = localStorage): T {
  const value = readJson<unknown>(key, fallback, storage);
  if (typeof value !== 'object' || value === null) return fallback;
  return { ...fallback, ...(value as Partial<T>) };
}

export function createTimePulseDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('TimePulseDB', 1);
    request.onerror = () => reject(request.error ?? new Error('无法打开 TimePulseDB'));
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains('custom_backgrounds')) {
        const store = request.result.createObjectStore('custom_backgrounds', { keyPath: 'id' });
        store.createIndex('type', 'type', { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
  });
}
