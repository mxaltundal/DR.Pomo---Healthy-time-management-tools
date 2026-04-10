import { useReducer, useEffect, useRef, useCallback, useState } from 'react';
import { appReducer, initialState } from './hooks/appReducer';
import SetupScreen from './components/SetupScreen';
import TimerScreen from './components/TimerScreen';
import SummaryScreen from './components/SummaryScreen';
import MiniTimer from './components/MiniTimer';
import { todayString } from './utils/timeFormatter';
import { unlockAudio, playBlockEndSound } from './utils/soundPlayer';
import './App.css';

const STORAGE_KEY = 'drpomo_state';

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialState;
    const parsed = JSON.parse(raw);
    // Ignore saved state from a previous day
    if (parsed.sessionDate !== todayString()) return initialState;
    return { ...initialState, ...parsed };
  } catch {
    return initialState;
  }
}

export default function App() {
  const [state, dispatch] = useReducer(appReducer, undefined, loadState);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const summaryFiredRef = useRef(false);
  const prevBlockIndexRef = useRef(state.currentBlockIndex);
  const [miniTimerVisible, setMiniTimerVisible] = useState(false);

  // Unlock AudioContext on first user interaction so sounds work later
  useEffect(() => {
    const unlock = () => unlockAudio();
    document.addEventListener('click', unlock, { once: true });
    document.addEventListener('keydown', unlock, { once: true });
    return () => {
      document.removeEventListener('click', unlock);
      document.removeEventListener('keydown', unlock);
    };
  }, []);

  // Persist state to localStorage on every change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore quota errors
    }
  }, [state]);

  // Timer tick
  useEffect(() => {
    if (state.timerState === 'running') {
      intervalRef.current = setInterval(() => {
        dispatch({ type: 'TICK' });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [state.timerState]);

  // Play notification sound when a block ends naturally (not skipped)
  useEffect(() => {
    const prevIdx = prevBlockIndexRef.current;
    if (state.currentBlockIndex !== prevIdx) {
      const prevBlock = state.schedule[prevIdx];
      if (prevBlock?.completed && !prevBlock.skipped) {
        playBlockEndSound(prevBlock.type);
      }
      prevBlockIndexRef.current = state.currentBlockIndex;
    }
  }, [state.currentBlockIndex, state.schedule]);

  // Show mini-timer floating overlay when the user switches away from this tab
  useEffect(() => {
    if (state.screen !== 'timer') return;
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setMiniTimerVisible(true);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [state.screen]);

  // 22:00 summary notification
  useEffect(() => {
    if (state.summaryDismissed || state.screen === 'summary') return;

    const check = () => {
      const now = new Date();
      const isAfter22 = now.getHours() >= 22;
      if (isAfter22 && !summaryFiredRef.current && state.screen === 'timer') {
        summaryFiredRef.current = true;
        dispatch({ type: 'SHOW_SUMMARY' });
      }
    };

    check();
    const id = setInterval(check, 30_000);
    return () => clearInterval(id);
  }, [state.summaryDismissed, state.screen]);

  const handleNewDay = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  }, []);

  return (
    <div className="app">
      {state.screen === 'setup' && (
        <SetupScreen
          tasks={state.tasks}
          lunchConfig={state.lunchBreakConfig}
          onAddTask={task => dispatch({ type: 'ADD_TASK', task })}
          onRemoveTask={id => dispatch({ type: 'REMOVE_TASK', taskId: id })}
          onUpdateTask={task => dispatch({ type: 'UPDATE_TASK', task })}
          onReorderTasks={(fromIndex, toIndex) => dispatch({ type: 'REORDER_TASKS', fromIndex, toIndex })}
          onSetLunchConfig={config => dispatch({ type: 'SET_LUNCH_CONFIG', config })}
          onStart={() => dispatch({ type: 'START_PROGRAM' })}
        />
      )}
      {state.screen === 'timer' && (
        <TimerScreen state={state} dispatch={dispatch} />
      )}
      {state.screen === 'summary' && (
        <SummaryScreen
          schedule={state.schedule}
          sessionDate={state.sessionDate}
          onDismiss={() => dispatch({ type: 'DISMISS_SUMMARY' })}
          onNewDay={handleNewDay}
        />
      )}
      {state.screen === 'timer' && miniTimerVisible && (
        <MiniTimer
          state={state}
          dispatch={dispatch}
          onClose={() => setMiniTimerVisible(false)}
        />
      )}
    </div>
  );
}
