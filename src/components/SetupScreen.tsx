import { useState } from 'react';
import { TaskInput, LunchBreakConfig, SessionDuration } from '../types';
import './SetupScreen.css';

interface Props {
  tasks: TaskInput[];
  lunchConfig: LunchBreakConfig;
  onAddTask: (task: TaskInput) => void;
  onRemoveTask: (id: string) => void;
  onUpdateTask: (task: TaskInput) => void;
  onSetLunchConfig: (cfg: LunchBreakConfig) => void;
  onStart: () => void;
}

function uuid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export default function SetupScreen({
  tasks,
  lunchConfig,
  onAddTask,
  onRemoveTask,
  onUpdateTask,
  onSetLunchConfig,
  onStart,
}: Props) {
  const [name, setName] = useState('');
  const [sessionCount, setSessionCount] = useState(1);
  const [sessionType, setSessionType] = useState<SessionDuration>('short');
  const [editingId, setEditingId] = useState<string | null>(null);

  function handleAdd() {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (editingId) {
      onUpdateTask({ id: editingId, name: trimmed, sessionCount, sessionType });
      setEditingId(null);
    } else {
      onAddTask({ id: uuid(), name: trimmed, sessionCount, sessionType });
    }
    setName('');
    setSessionCount(1);
    setSessionType('short');
  }

  function handleEdit(task: TaskInput) {
    setEditingId(task.id);
    setName(task.name);
    setSessionCount(task.sessionCount);
    setSessionType(task.sessionType);
  }

  function handleCancel() {
    setEditingId(null);
    setName('');
    setSessionCount(1);
    setSessionType('short');
  }

  const totalWorkBlocks = tasks.reduce((s, t) => s + t.sessionCount, 0);

  return (
    <div className="setup-screen">
      <header className="setup-header">
        <span className="logo">🍅</span>
        <h1>DR.Pomo</h1>
        <p className="subtitle">Sağlıklı Zaman Yönetimi</p>
      </header>

      {/* ── Task form ── */}
      <section className="card task-form">
        <h2>{editingId ? 'Görevi Düzenle' : 'Görev Ekle'}</h2>

        <label className="field-label">Görev Adı</label>
        <input
          className="text-input"
          type="text"
          placeholder="örn. Proje Analizi"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
        />

        <div className="field-row">
          <div className="field-col">
            <label className="field-label">Oturum Sayısı</label>
            <div className="counter">
              <button
                className="counter-btn"
                onClick={() => setSessionCount(Math.max(1, sessionCount - 1))}
              >−</button>
              <span className="counter-val">{sessionCount}</span>
              <button
                className="counter-btn"
                onClick={() => setSessionCount(Math.min(20, sessionCount + 1))}
              >+</button>
            </div>
          </div>

          <div className="field-col">
            <label className="field-label">Oturum Süresi</label>
            <div className="toggle-group">
              <button
                className={`toggle-btn ${sessionType === 'short' ? 'active' : ''}`}
                onClick={() => setSessionType('short')}
              >
                25 dk
              </button>
              <button
                className={`toggle-btn ${sessionType === 'long' ? 'active' : ''}`}
                onClick={() => setSessionType('long')}
              >
                45 dk
              </button>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button className="btn btn-primary" onClick={handleAdd} disabled={!name.trim()}>
            {editingId ? '✓ Güncelle' : '+ Ekle'}
          </button>
          {editingId && (
            <button className="btn btn-ghost" onClick={handleCancel}>İptal</button>
          )}
        </div>
      </section>

      {/* ── Lunch break config ── */}
      <section className="card lunch-config">
        <div className="lunch-header">
          <h2>Öğle Arası</h2>
          <label className="switch">
            <input
              type="checkbox"
              checked={lunchConfig.enabled}
              onChange={e =>
                onSetLunchConfig({ ...lunchConfig, enabled: e.target.checked })
              }
            />
            <span className="slider" />
          </label>
        </div>

        {lunchConfig.enabled && (
          <div className="lunch-fields">
            <div className="field-row">
              <div className="field-col">
                <label className="field-label">Süre (dakika)</label>
                <input
                  className="text-input number-input"
                  type="number"
                  min={10}
                  max={120}
                  value={lunchConfig.duration}
                  onChange={e =>
                    onSetLunchConfig({
                      ...lunchConfig,
                      duration: Math.max(10, Math.min(120, Number(e.target.value))),
                    })
                  }
                />
              </div>
              <div className="field-col">
                <label className="field-label">
                  Kaçıncı çalışma bloğundan sonra? ({totalWorkBlocks} blok var)
                </label>
                <input
                  className="text-input number-input"
                  type="number"
                  min={1}
                  max={Math.max(1, totalWorkBlocks)}
                  value={lunchConfig.afterWorkBlock}
                  onChange={e =>
                    onSetLunchConfig({
                      ...lunchConfig,
                      afterWorkBlock: Math.max(
                        1,
                        Math.min(totalWorkBlocks || 1, Number(e.target.value)),
                      ),
                    })
                  }
                />
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ── Task list ── */}
      {tasks.length > 0 && (
        <section className="card task-list">
          <h2>Görev Listesi</h2>
          <ul>
            {tasks.map((task, idx) => (
              <li key={task.id} className="task-item">
                <span className="task-num">{idx + 1}.</span>
                <div className="task-info">
                  <span className="task-name">{task.name}</span>
                  <span className="task-meta">
                    {task.sessionCount} oturum × {task.sessionType === 'short' ? '25' : '45'} dk
                  </span>
                </div>
                <div className="task-actions">
                  <button className="icon-btn" onClick={() => handleEdit(task)} title="Düzenle">✏️</button>
                  <button className="icon-btn" onClick={() => onRemoveTask(task.id)} title="Sil">🗑️</button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── Start button ── */}
      <button
        className="btn btn-start"
        onClick={onStart}
        disabled={tasks.length === 0}
      >
        ▶ Programı Başlat
      </button>
    </div>
  );
}
