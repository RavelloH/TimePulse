import { afterEach, describe, expect, it, vi } from 'vitest';
import { decodeSharePayload, encodeSharePayload } from './sharing';

afterEach(() => vi.restoreAllMocks());

describe('share compatibility format', () => {
  it('round-trips the legacy Base64/URI payload shape', () => {
    const encoded = encodeSharePayload([{
      id: 'timer-1',
      name: '春节',
      targetDate: '2026-02-17T00:00:00.000Z',
      timezone: 'Asia/Shanghai',
      color: '#ff0000',
    }]);
    expect(decodeSharePayload(encoded)?.timers[0]).toMatchObject({
      id: 'timer-1',
      name: '春节',
      targetDate: '2026-02-17T00:00:00.000Z',
    });
  });

  it('returns null for invalid data', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(decodeSharePayload('invalid')).toBeNull();
  });
});
