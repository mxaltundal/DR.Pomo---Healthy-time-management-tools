
import { ScheduleBlock } from '../types';
import './SchedulePanel.css';

interface Props {
  schedule: ScheduleBlock[];
  currentIndex: number;
}

const BLOCK_LABELS: Record<string, string> = {
  work: '💼',
  'short-break': '☕',
  'long-break': '🌿',
  lunch: '🍽️',
};

const BLOCK_TYPE_LABELS: Record<string, string> = {
  work: 'Çalışma',
  'short-break': 'Kısa Ara',
  'long-break': 'Uzun Ara',
  lunch: 'Öğle Arası',
};

export default function SchedulePanel({ schedule, currentIndex }: Props) {
  return (
    <aside className="schedule-panel">
      <h3 className="panel-title">Günlük Program</h3>
      <ul className="schedule-list">
        {schedule.map((block, idx) => {
          const isCurrent = idx === currentIndex;
          const isPast = block.completed || block.skipped;
          const label =
            block.type === 'work'
              ? `${block.taskName} (${block.sessionNumber}/${block.totalSessions})`
              : BLOCK_TYPE_LABELS[block.type];

          return (
            <li
              key={block.id}
              className={[
                'schedule-item',
                isCurrent ? 'current' : '',
                isPast ? 'past' : '',
                block.skipped ? 'skipped' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <span className="item-icon">{BLOCK_LABELS[block.type]}</span>
              <span className="item-label">{label}</span>
              <span className="item-duration">{block.duration}dk</span>
              {block.skipped && <span className="item-tag">atlandı</span>}
              {block.completed && !block.skipped && (
                <span className="item-check">✓</span>
              )}
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
