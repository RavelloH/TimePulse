import { describe, expect, it } from 'vitest';
import type { Timer } from '@/domain/timer';
import { timerReducer, type TimerState } from './reducer';

function countdown(id: string): Timer {
  return {
    id,
    name: id,
    targetDate: '2030-01-01T00:00:00.000Z',
    timezone: 'UTC',
  };
}

describe('timerReducer reorder', () => {
  it('reorders timers while preserving the active timer', () => {
    const state: TimerState = {
      timers: [countdown('one'), countdown('two'), countdown('three')],
      activeTimerId: 'two',
    };

    const next = timerReducer(state, { type: 'reorder', ids: ['three', 'one', 'two'] });

    expect(next.timers.map((timer) => timer.id)).toEqual(['three', 'one', 'two']);
    expect(next.activeTimerId).toBe('two');
  });

  it('ignores unknown and duplicate ids, appending any omitted timers in their current order', () => {
    const state: TimerState = {
      timers: [countdown('one'), countdown('two'), countdown('three')],
      activeTimerId: 'one',
    };

    const next = timerReducer(state, { type: 'reorder', ids: ['three', 'missing', 'three'] });

    expect(next.timers.map((timer) => timer.id)).toEqual(['three', 'one', 'two']);
  });

  it('returns the same state if the requested order is unchanged', () => {
    const state: TimerState = {
      timers: [countdown('one'), countdown('two')],
      activeTimerId: 'one',
    };

    expect(timerReducer(state, { type: 'reorder', ids: ['one', 'two'] })).toBe(state);
  });
});
