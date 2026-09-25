import type { Lap, Timer } from '../../domain/timer';

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
  | { type: 'renameStopwatchLap'; timerId: string; lapIndex: number; name: string }
  | { type: 'deleteStopwatchLap'; timerId: string; lapIndex: number }
  | { type: 'remove'; id: string; replacement?: Timer };

function updateStopwatchLaps(
  state: TimerState,
  timerId: string,
  updateLaps: (laps: Lap[]) => Lap[] | null,
): TimerState {
  const timer = state.timers.find((item) => item.id === timerId);
  if (!timer || timer.type !== 'stopwatch' || !Array.isArray(timer.laps)) return state;

  const laps = updateLaps(timer.laps);
  if (!laps) return state;

  const updatedTimer = { ...timer, laps };
  return {
    ...state,
    timers: state.timers.map((item) => item.id === timerId ? updatedTimer : item),
  };
}

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
    case 'renameStopwatchLap':
      return updateStopwatchLaps(state, action.timerId, (laps) => {
        if (!Number.isInteger(action.lapIndex) || action.lapIndex < 0 || action.lapIndex >= laps.length) return null;
        return laps.map((lap, index) => index === action.lapIndex ? { ...lap, name: action.name } : lap);
      });
    case 'deleteStopwatchLap':
      return updateStopwatchLaps(state, action.timerId, (laps) => {
        if (!Number.isInteger(action.lapIndex) || action.lapIndex < 0 || action.lapIndex >= laps.length) return null;
        return laps.filter((_, index) => index !== action.lapIndex);
      });
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
