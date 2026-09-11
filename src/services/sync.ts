import type { SyncPayload } from '../domain/timer';
import { parseSyncPayload } from '../domain/timer';

export const SYNC_API_URL = 'https://cache.ravelloh.top/api';

function assertOnline(): void {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    throw new Error('您当前处于离线状态，无法同步数据');
  }
}

export async function saveSyncPayload(uuid: string, password: string, data: SyncPayload, expiredTime = 30 * 24 * 60 * 60 * 1000): Promise<unknown> {
  assertOnline();
  const response = await fetch(`${SYNC_API_URL}?mode=set`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: JSON.stringify(data), password, safeIP: '*.*.*.*', expiredTime, uuid }),
  });
  if (!response.ok) throw new Error(`API响应错误: ${response.status}`);
  return response.json();
}

export async function loadSyncPayload(uuid: string, password: string, shouldDelete = false): Promise<SyncPayload> {
  assertOnline();
  const response = await fetch(`${SYNC_API_URL}?mode=get`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ uuid, password, shouldDelete }),
  });
  if (!response.ok) throw new Error(`API响应错误: ${response.status}`);
  const result = await response.json() as { status?: string; code?: number; data?: unknown; message?: string };
  if (!(result.status === 'success' || result.code === 200) || result.data === undefined || result.data === null) {
    throw new Error(result.message || '获取数据失败');
  }
  const data = typeof result.data === 'string' ? JSON.parse(result.data) : result.data;
  const payload = parseSyncPayload(data);
  if (!payload) throw new Error('数据格式错误，无法解析');
  return payload;
}

export const saveToRemoteCache = saveSyncPayload;
export const getFromRemoteCache = loadSyncPayload;
