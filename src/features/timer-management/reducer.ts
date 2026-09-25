import type { Timer } from '../../domain/timer';

export interface TimerState {
  timers: Timer[];
  activeTimerId: string | null;
}

export type TimerAction =
  | { type: 'replace'; timers: Timer[]; activeTimerId?: string | null }
  | { type: 'select'; id: string }
  | { type: 'reorder'; ids: string[] }
  | { type: 'upsert'; timer: Timer }
  | { type: 'update'; timer: Timer }
  | { type: 'remove'; id: string; replacement?: Timer };

export function timerReducer(state: TimerState, action: TimerAction): TimerState {
  switch (action.type) {
    case 'replace':
      return {
        timers: action.timers,
        activeTimerId: action.activeTimerId ?? action.timers[0]?.id ?? null,
      };
    case 'select':
      return state.timers.some((timer) => timer.id === action.id)
        ? { ...state, activeTimerId: action.id }
        : state;
    case 'reorder': {
      const timersById = new Map(state.timers.map((timer) => [timer.id, timer]));
      const seenIds = new Set<string>();
      const reorderedTimers = action.ids.flatMap((id) => {
        const timer = timersById.get(id);
        if (!timer || seenIds.has(id)) return [];
        seenIds.add(id);
        return [timer];
      });
      for (const timer of state.timers) {
        if (!seenIds.has(timer.id)) reorderedTimers.push(timer);
      }
      if (reorderedTimers.every((timer, index) => timer === state.timers[index])) return state;
      return { ...state, timers: reorderedTimers };
    }
    case 'upsert': {
      const found = state.timers.some((timer) => timer.id === action.timer.id);
      return {
        timers: found
          ? state.timers.map((timer) => timer.id === action.timer.id ? action.timer : timer)
          : [...state.timers, action.timer],
        activeTimerId: action.timer.id,
      };
    }
    case 'update':
      return state.timers.some((timer) => timer.id === action.timer.id)
        ? { ...state, timers: state.timers.map((timer) => timer.id === action.timer.id ? action.timer : timer) }
        : state;
    case 'remove': {
      const remaining = state.timers.filter((timer) => timer.id !== action.id);
      const timers = remaining.length > 0 ? remaining : action.replacement ? [action.replacement] : [];
      const activeTimerId = state.activeTimerId === action.id
        ? timers[0]?.id ?? null
        : state.activeTimerId;
      return { timers, activeTimerId };
    }
  }
}
