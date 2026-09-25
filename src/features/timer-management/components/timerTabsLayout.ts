import type { Timer } from '@/domain/timer';

export type CompactTimerItem =
  | { kind: 'timer'; timer: Timer }
  | { kind: 'overflow'; side: 'left' | 'right'; count: number };

export function getCompactTimerItems(
  timers: Timer[],
  activeTimerId: string | null,
  solo: boolean,
): CompactTimerItem[] {
  if (timers.length === 0) return [];

  const selectedIndex = timers.findIndex((timer) => timer.id === activeTimerId);
  const activeIndex = selectedIndex < 0 ? 0 : selectedIndex;
  if (solo) return [{ kind: 'timer', timer: timers[activeIndex] }];

  let first = Math.max(0, activeIndex - 1);
  let last = Math.min(timers.length - 1, activeIndex + 1);
  // When the active timer is near an edge, use the slots freed by a missing
  // overflow trigger for another timer instead of leaving the island short.
  while (last - first + 1 + Number(first > 0) + Number(last < timers.length - 1) < 5) {
    if (first === 0 && last < timers.length - 1) last += 1;
    else if (last === timers.length - 1 && first > 0) first -= 1;
    else break;
  }
  const items: CompactTimerItem[] = [];

  if (first > 0) items.push({ kind: 'overflow', side: 'left', count: first });
  for (let index = first; index <= last; index += 1) {
    items.push({ kind: 'timer', timer: timers[index] });
  }
  const hiddenOnRight = timers.length - last - 1;
  if (hiddenOnRight > 0) items.push({ kind: 'overflow', side: 'right', count: hiddenOnRight });

  return items;
}
