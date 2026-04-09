// ─── Session / Task Types ────────────────────────────────────────────────────

export type SessionDuration = 'short' | 'long'; // 25 min or 45 min

export interface TaskInput {
  id: string;
  name: string;
  sessionCount: number;
  sessionType: SessionDuration;
}

// ─── Schedule Block Types ────────────────────────────────────────────────────

export type BlockType = 'work' | 'short-break' | 'long-break' | 'lunch';

export interface PauseLog {
  startTime: number; // Date.now() timestamp
  endTime?: number;
  duration?: number; // seconds
}

export interface ScheduleBlock {
  id: string;
  type: BlockType;
  taskId?: string;
  taskName?: string;
  sessionNumber?: number;  // 1-based
  totalSessions?: number;
  duration: number;        // minutes (planned)
  completed: boolean;
  skipped: boolean;
  pauses: PauseLog[];
  actualStartTime?: number;
  actualEndTime?: number;
}

// ─── Lunch Break Config ──────────────────────────────────────────────────────

export interface LunchBreakConfig {
  enabled: boolean;
  afterWorkBlock: number; // insert lunch after this many work blocks (1-based)
  duration: number;       // minutes
}

// ─── App State ───────────────────────────────────────────────────────────────

export type AppScreen = 'setup' | 'timer' | 'summary';
export type TimerState = 'idle' | 'running' | 'paused' | 'finished';

export interface AppState {
  screen: AppScreen;
  tasks: TaskInput[];
  schedule: ScheduleBlock[];
  currentBlockIndex: number;
  timerState: TimerState;
  timeRemaining: number;       // seconds
  currentPauseStart?: number;
  lunchBreakConfig: LunchBreakConfig;
  summaryDismissed: boolean;
  sessionDate: string;         // YYYY-MM-DD
}

// ─── App Actions ─────────────────────────────────────────────────────────────

export type AppAction =
  | { type: 'ADD_TASK'; task: TaskInput }
  | { type: 'REMOVE_TASK'; taskId: string }
  | { type: 'UPDATE_TASK'; task: TaskInput }
  | { type: 'REORDER_TASKS'; fromIndex: number; toIndex: number }
  | { type: 'SET_LUNCH_CONFIG'; config: LunchBreakConfig }
  | { type: 'START_PROGRAM' }
  | { type: 'RETURN_TO_SETUP' }
  | { type: 'TICK' }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'SKIP_BLOCK' }
  | { type: 'SHOW_SUMMARY' }
  | { type: 'DISMISS_SUMMARY' };
