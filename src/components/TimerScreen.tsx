import { AppState, AppAction } from '../types';
import { formatTime } from '../utils/timeFormatter';
import SchedulePanel from './SchedulePanel';
import './TimerScreen.css';

interface Props {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

const BLOCK_TYPE_LABELS: Record<string, string> = {
  work: 'Çalışma',
  'short-break': 'Kısa Ara',
  'long-break': 'Uzun Ara',
  lunch: 'Öğle Arası',
};

const BLOCK_COLORS: Record<string, string> = {
  work: 'var(--accent)',
  'short-break': 'var(--teal)',
  'long-break': 'var(--green)',
  lunch: 'var(--orange)',
};

export default function TimerScreen({ state, dispatch }: Props) {
  const { schedule, currentBlockIndex, timerState, timeRemaining } = state;
  const block = schedule[currentBlockIndex];

  if (!block) return null;

  const totalSeconds = block.duration * 60;
  const progress = 1 - timeRemaining / totalSeconds;
  const circumference = 2 * Math.PI * 90; // radius 90
  const strokeDashoffset = circumference * (1 - progress);
  const color = BLOCK_COLORS[block.type] ?? 'var(--accent)';

  const isPaused = timerState === 'paused';
  const isRunning = timerState === 'running';

  const pauseSeconds = block.pauses.reduce(
    (sum, p) => sum + (p.duration ?? (isPaused && !p.endTime ? Math.round((Date.now() - p.startTime) / 1000) : 0)),
    0,
  );

  const subLabel =
    block.type === 'work'
      ? `${block.taskName} — ${block.sessionNumber}/${block.totalSessions}. oturum`
      : BLOCK_TYPE_LABELS[block.type];

  return (
    <div className="timer-screen">
      {/* ── Main area ── */}
      <div className="timer-main">
        {/* Top bar */}
        <div className="timer-topbar">
          <span className="logo-small">🍅 DR.Pomo</span>
          <button
            className="btn-outline"
            onClick={() => dispatch({ type: 'RETURN_TO_SETUP' })}
          >
            ✏️ Planı Düzenle
          </button>
        </div>

        {/* Block type label */}
        <div className="block-type-badge" style={{ background: color }}>
          {BLOCK_TYPE_LABELS[block.type]}
        </div>

        <p className="block-sublabel">{subLabel}</p>

        {/* Circular timer */}
        <div className="ring-container">
          <svg className="ring-svg" viewBox="0 0 200 200">
            <circle
              cx="100" cy="100" r="90"
              fill="none"
              stroke="var(--border)"
              strokeWidth="8"
            />
            <circle
              cx="100" cy="100" r="90"
              fill="none"
              stroke={color}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              style={{ transform: 'rotate(-90deg)', transformOrigin: 'center', transition: 'stroke-dashoffset 0.9s linear' }}
            />
          </svg>
          <div className="ring-center">
            <span className="timer-display">{formatTime(timeRemaining)}</span>
            {isPaused && <span className="pause-label">⏸ Duraklatıldı</span>}
          </div>
        </div>

        {/* Pause log */}
        {pauseSeconds > 0 && (
          <p className="pause-info">
            Toplam duraklatma: <strong>{formatTime(pauseSeconds)}</strong>
          </p>
        )}

        {/* Controls */}
        <div className="timer-controls">
          {isRunning && (
            <button
              className="ctrl-btn ctrl-pause"
              onClick={() => dispatch({ type: 'PAUSE' })}
            >
              ⏸ Duraklat
            </button>
          )}
          {isPaused && (
            <button
              className="ctrl-btn ctrl-resume"
              onClick={() => dispatch({ type: 'RESUME' })}
            >
              ▶ Devam Et
            </button>
          )}
          <button
            className="ctrl-btn ctrl-skip"
            onClick={() => dispatch({ type: 'SKIP_BLOCK' })}
          >
            ⏭ Atla
          </button>
          <button
            className="ctrl-btn ctrl-summary"
            onClick={() => dispatch({ type: 'SHOW_SUMMARY' })}
          >
            📊 Özet
          </button>
        </div>

        {/* Progress indicator */}
        <div className="progress-text">
          {currentBlockIndex + 1} / {schedule.length} blok
          &nbsp;·&nbsp;
          {schedule.filter(b => b.completed).length} tamamlandı
        </div>
      </div>

      {/* ── Schedule panel ── */}
      <SchedulePanel schedule={schedule} currentIndex={currentBlockIndex} />
    </div>
  );
}
