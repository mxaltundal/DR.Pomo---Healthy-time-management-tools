
import { ScheduleBlock } from '../types';
import { formatTime, formatTimestamp, totalPauseSeconds } from '../utils/timeFormatter';
import './SummaryScreen.css';

interface Props {
  schedule: ScheduleBlock[];
  sessionDate: string;
  onDismiss: () => void;
  onNewDay: () => void;
}

export default function SummaryScreen({ schedule, sessionDate, onDismiss, onNewDay }: Props) {
  const workBlocks = schedule.filter(b => b.type === 'work');
  const completedWork = workBlocks.filter(b => b.completed);
  const skippedWork = workBlocks.filter(b => b.skipped);

  const totalWorkSeconds = completedWork.reduce(
    (s, b) => s + (b.actualEndTime && b.actualStartTime ? Math.round((b.actualEndTime - b.actualStartTime) / 1000) : b.duration * 60),
    0,
  );

  const totalPauseSecondsAll = schedule.reduce(
    (s, b) => s + totalPauseSeconds(b.pauses),
    0,
  );

  // Group completed work blocks by task
  const taskMap: Map<string, { name: string; sessions: number; workSeconds: number; pauseSeconds: number }> =
    new Map();

  completedWork.forEach(b => {
    const key = b.taskId ?? b.taskName ?? 'bilinmiyor';
    const existing = taskMap.get(key) ?? { name: b.taskName ?? 'bilinmiyor', sessions: 0, workSeconds: 0, pauseSeconds: 0 };
    const blockWork = b.actualEndTime && b.actualStartTime
      ? Math.round((b.actualEndTime - b.actualStartTime) / 1000)
      : b.duration * 60;
    taskMap.set(key, {
      ...existing,
      sessions: existing.sessions + 1,
      workSeconds: existing.workSeconds + blockWork,
      pauseSeconds: existing.pauseSeconds + totalPauseSeconds(b.pauses),
    });
  });

  return (
    <div className="summary-screen">
      <div className="summary-card">
        <div className="summary-header">
          <span className="summary-icon">📊</span>
          <h1>Günlük Özet</h1>
          <p className="summary-date">{sessionDate}</p>
        </div>

        {/* Stats row */}
        <div className="stats-grid">
          <div className="stat-box">
            <span className="stat-val">{formatTime(totalWorkSeconds)}</span>
            <span className="stat-label">Toplam Çalışma</span>
          </div>
          <div className="stat-box">
            <span className="stat-val">{formatTime(totalPauseSecondsAll)}</span>
            <span className="stat-label">Duraklatma</span>
          </div>
          <div className="stat-box">
            <span className="stat-val">{completedWork.length}</span>
            <span className="stat-label">Tamamlanan Oturum</span>
          </div>
          <div className="stat-box">
            <span className="stat-val">{skippedWork.length}</span>
            <span className="stat-label">Atlanan Oturum</span>
          </div>
        </div>

        {/* Task breakdown */}
        {taskMap.size > 0 && (
          <div className="task-breakdown">
            <h2>Görev Bazında</h2>
            <ul>
              {[...taskMap.values()].map(task => (
                <li key={task.name} className="task-row">
                  <span className="task-row-name">💼 {task.name}</span>
                  <span className="task-row-detail">
                    {task.sessions} oturum · {formatTime(task.workSeconds)} çalışma
                    {task.pauseSeconds > 0 && ` · ${formatTime(task.pauseSeconds)} duraklatma`}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Pause log */}
        {schedule.some(b => b.pauses.length > 0) && (
          <div className="pause-log">
            <h2>Duraklatma Kaydı</h2>
            <ul>
              {schedule.flatMap(b =>
                b.pauses.map((p, pi) => (
                  <li key={`${b.id}-${pi}`}>
                    <span className="log-block">
                      {b.type === 'work' ? `${b.taskName} (${b.sessionNumber}/${b.totalSessions})` : b.type}
                    </span>
                    <span className="log-time">
                      {formatTimestamp(p.startTime)}
                      {p.endTime ? ` → ${formatTimestamp(p.endTime)}` : ' (devam ediyor)'}
                      {p.duration ? ` — ${formatTime(p.duration)}` : ''}
                    </span>
                  </li>
                )),
              )}
            </ul>
          </div>
        )}

        <div className="summary-actions">
          <button className="btn-summary-primary" onClick={onDismiss}>
            ← Zamanlayıcıya Dön
          </button>
          <button className="btn-summary-secondary" onClick={onNewDay}>
            🔄 Yeni Gün Başlat
          </button>
        </div>
      </div>
    </div>
  );
}
