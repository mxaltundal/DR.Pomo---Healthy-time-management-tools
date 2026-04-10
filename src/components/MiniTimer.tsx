import { useRef, useCallback, useEffect, useState } from 'react';
import { AppState, AppAction } from '../types';
import { formatTime } from '../utils/timeFormatter';
import './MiniTimer.css';

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

interface Props {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  onClose: () => void;
}

export default function MiniTimer({ state, dispatch, onClose }: Props) {
  const { schedule, currentBlockIndex, timerState, timeRemaining } = state;
  const block = schedule[currentBlockIndex];

  // Initial position: bottom-right corner with some margin
  const [pos, setPos] = useState(() => ({
    x: Math.max(0, window.innerWidth - 268),
    y: Math.max(0, window.innerHeight - 240),
  }));

  const dragState = useRef({ active: false, offsetX: 0, offsetY: 0 });

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button')) return;
    dragState.current.active = true;
    dragState.current.offsetX = e.clientX - pos.x;
    dragState.current.offsetY = e.clientY - pos.y;
    e.preventDefault();
  }, [pos]);

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button')) return;
    const touch = e.touches[0];
    dragState.current.active = true;
    dragState.current.offsetX = touch.clientX - pos.x;
    dragState.current.offsetY = touch.clientY - pos.y;
  }, [pos]);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!dragState.current.active) return;
      const newX = Math.max(0, Math.min(window.innerWidth - 260, e.clientX - dragState.current.offsetX));
      const newY = Math.max(0, Math.min(window.innerHeight - 200, e.clientY - dragState.current.offsetY));
      setPos({ x: newX, y: newY });
    };
    const onMouseUp = () => { dragState.current.active = false; };

    const onTouchMove = (e: TouchEvent) => {
      if (!dragState.current.active) return;
      const touch = e.touches[0];
      const newX = Math.max(0, Math.min(window.innerWidth - 260, touch.clientX - dragState.current.offsetX));
      const newY = Math.max(0, Math.min(window.innerHeight - 200, touch.clientY - dragState.current.offsetY));
      setPos({ x: newX, y: newY });
    };
    const onTouchEnd = () => { dragState.current.active = false; };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    document.addEventListener('touchmove', onTouchMove, { passive: true });
    document.addEventListener('touchend', onTouchEnd);

    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
    };
  }, []);

  if (!block) return null;

  const isPaused = timerState === 'paused';
  const isRunning = timerState === 'running';
  const color = BLOCK_COLORS[block.type] ?? 'var(--accent)';

  const subLabel =
    block.type === 'work'
      ? `Oturum ${block.sessionNumber}/${block.totalSessions} · ${block.taskName}`
      : null;

  return (
    <div
      className="mini-timer"
      style={{ left: pos.x, top: pos.y }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      {/* Header */}
      <div className="mini-timer-header">
        <span className="mini-logo">🍅 DR.Pomo</span>
        <button className="mini-close-btn" onClick={onClose} title="Kapat">✕</button>
      </div>

      {/* Session badge + label */}
      <div className="mini-badge" style={{ background: color }}>
        {BLOCK_TYPE_LABELS[block.type]}
      </div>
      {subLabel && <div className="mini-sublabel">{subLabel}</div>}

      {/* Time */}
      <div className="mini-time" style={{ color }}>{formatTime(timeRemaining)}</div>

      {isPaused && <div className="mini-pause-label">⏸ Duraklatıldı</div>}

      {/* Controls */}
      <div className="mini-controls">
        {isRunning && (
          <button
            className="mini-btn mini-pause-btn"
            onClick={() => dispatch({ type: 'PAUSE' })}
          >
            ⏸ Duraklat
          </button>
        )}
        {isPaused && (
          <button
            className="mini-btn mini-resume-btn"
            onClick={() => dispatch({ type: 'RESUME' })}
          >
            ▶ Devam Et
          </button>
        )}
      </div>
    </div>
  );
}
