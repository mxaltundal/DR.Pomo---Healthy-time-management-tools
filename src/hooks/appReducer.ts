import { AppState, AppAction, ScheduleBlock, LunchBreakConfig } from '../types';
import { buildSchedule } from '../utils/scheduleBuilder';
import { todayString } from '../utils/timeFormatter';

export const defaultLunchConfig: LunchBreakConfig = {
  enabled: false,
  afterWorkBlock: 3,
  duration: 60,
};

export const initialState: AppState = {
  screen: 'setup',
  tasks: [],
  schedule: [],
  currentBlockIndex: 0,
  timerState: 'idle',
  timeRemaining: 0,
  lunchBreakConfig: defaultLunchConfig,
  summaryDismissed: false,
  sessionDate: todayString(),
};

function clampIndex(schedule: ScheduleBlock[], idx: number): number {
  return Math.min(idx, schedule.length - 1);
}

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    // ── Setup actions ──────────────────────────────────────────────────────
    case 'ADD_TASK':
      return { ...state, tasks: [...state.tasks, action.task] };

    case 'REMOVE_TASK':
      return { ...state, tasks: state.tasks.filter(t => t.id !== action.taskId) };

    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(t => (t.id === action.task.id ? action.task : t)),
      };

    case 'SET_LUNCH_CONFIG':
      return { ...state, lunchBreakConfig: action.config };

    case 'START_PROGRAM': {
      if (state.tasks.length === 0) return state;
      const rawSchedule = buildSchedule(state.tasks, state.lunchBreakConfig);
      const firstBlock = rawSchedule[0];
      const schedule = rawSchedule.map((b, i) =>
        i === 0 ? { ...b, actualStartTime: Date.now() } : b,
      );
      return {
        ...state,
        screen: 'timer',
        schedule,
        currentBlockIndex: 0,
        timerState: 'running',
        timeRemaining: firstBlock.duration * 60,
        sessionDate: todayString(),
      };
    }

    case 'RETURN_TO_SETUP': {
      // Stop the timer and go back to setup (plan editing)
      const updatedSchedule = state.schedule.map((b, i) => {
        if (i === state.currentBlockIndex && state.timerState === 'paused' && state.currentPauseStart) {
          const now = Date.now();
          const pauses = [
            ...b.pauses.slice(0, -1),
            { ...b.pauses[b.pauses.length - 1], endTime: now, duration: Math.round((now - state.currentPauseStart) / 1000) },
          ];
          return { ...b, pauses };
        }
        return b;
      });
      return {
        ...state,
        screen: 'setup',
        timerState: 'idle',
        schedule: updatedSchedule,
        currentPauseStart: undefined,
      };
    }

    // ── Timer actions ──────────────────────────────────────────────────────
    case 'TICK': {
      if (state.timerState !== 'running') return state;
      if (state.timeRemaining > 1) {
        return { ...state, timeRemaining: state.timeRemaining - 1 };
      }
      // Block finished → mark complete and advance
      return advanceBlock(state);
    }

    case 'PAUSE': {
      if (state.timerState !== 'running') return state;
      const now = Date.now();
      const block = state.schedule[state.currentBlockIndex];
      const updatedBlock: ScheduleBlock = {
        ...block,
        pauses: [...block.pauses, { startTime: now }],
      };
      const updatedSchedule = state.schedule.map((b, i) =>
        i === state.currentBlockIndex ? updatedBlock : b,
      );
      return {
        ...state,
        timerState: 'paused',
        currentPauseStart: now,
        schedule: updatedSchedule,
      };
    }

    case 'RESUME': {
      if (state.timerState !== 'paused' || !state.currentPauseStart) return state;
      const now = Date.now();
      const pauseDuration = Math.round((now - state.currentPauseStart) / 1000);
      const block = state.schedule[state.currentBlockIndex];
      const pauses = block.pauses.map((p, i) =>
        i === block.pauses.length - 1
          ? { ...p, endTime: now, duration: pauseDuration }
          : p,
      );
      const updatedSchedule = state.schedule.map((b, i) =>
        i === state.currentBlockIndex ? { ...b, pauses } : b,
      );
      return {
        ...state,
        timerState: 'running',
        currentPauseStart: undefined,
        schedule: updatedSchedule,
      };
    }

    case 'SKIP_BLOCK':
      return advanceBlock(state, true);

    case 'SHOW_SUMMARY':
      return { ...state, screen: 'summary' };

    case 'DISMISS_SUMMARY':
      return { ...state, summaryDismissed: true, screen: 'timer' };

    default:
      return state;
  }
}

/** Mark the current block done and move to the next one (or finish). */
function advanceBlock(state: AppState, skipped = false): AppState {
  const now = Date.now();
  const idx = state.currentBlockIndex;
  const block = state.schedule[idx];

  // Finalise current block
  const finishedBlock: ScheduleBlock = {
    ...block,
    completed: !skipped,
    skipped,
    actualEndTime: now,
  };
  const updatedSchedule = state.schedule.map((b, i) =>
    i === idx ? finishedBlock : b,
  );

  const nextIdx = idx + 1;

  if (nextIdx >= updatedSchedule.length) {
    // All blocks done
    return {
      ...state,
      schedule: updatedSchedule,
      currentBlockIndex: clampIndex(updatedSchedule, nextIdx - 1),
      timerState: 'finished',
      timeRemaining: 0,
      screen: 'summary',
    };
  }

  const nextBlock = updatedSchedule[nextIdx];
  const startedNextBlock: ScheduleBlock = { ...nextBlock, actualStartTime: now };
  const finalSchedule = updatedSchedule.map((b, i) =>
    i === nextIdx ? startedNextBlock : b,
  );

  return {
    ...state,
    schedule: finalSchedule,
    currentBlockIndex: nextIdx,
    timerState: 'running',
    timeRemaining: nextBlock.duration * 60,
    currentPauseStart: undefined,
  };
}
