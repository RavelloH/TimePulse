import { describe, expect, it } from 'vitest';
import type { Timer } from '@/domain/timer';
import { getCompactTimerItems } from './timerTabsLayout';

const timers = Array.from({ length: 12 }, (_, index) => ({
  id: String(index),
  name: String.fromCharCode(65 + index).repeat(3),
  targetDate: '2027-01-01',
  timezone: 'UTC',
})) as Timer[];

const labels = (activeId: string, solo = false) =>
  getCompactTimerItems(timers, activeId, solo).map((item) =>
    item.kind === 'timer' ? item.timer.name : '···',
  );

describe('compact timer layout', () => {
  it('centers the active timer between neighbors and two more triggers', () => {
    expect(labels('4')).toEqual(['···', 'DDD', 'EEE', 'FFF', '···']);
    expect(getCompactTimerItems(timers, '4', false).filter((item) => item.kind === 'overflow').map((item) => item.count)).toEqual([3, 6]);
  });

  it('only shows available neighbors at an edge', () => {
    expect(labels('0')).toEqual(['AAA', 'BBB', 'CCC', 'DDD', '···']);
    expect(labels('1')).toEqual(['AAA', 'BBB', 'CCC', 'DDD', '···']);
    expect(labels('11')).toEqual(['···', 'III', 'JJJ', 'KKK', 'LLL']);
    expect(getCompactTimerItems(timers.slice(0, 5), '0', false)).toHaveLength(5);
  });

  it('collapses to the selected timer when idle', () => {
    expect(labels('4', true)).toEqual(['EEE']);
  });
});
