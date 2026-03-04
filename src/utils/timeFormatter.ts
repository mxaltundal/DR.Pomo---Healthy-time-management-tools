/** Format seconds as MM:SS */
export function formatTime(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  const secs = s % 60;
  return `${String(m).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/** Format a timestamp as HH:MM */
export function formatTimestamp(ts: number): string {
  const d = new Date(ts);
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

/** Returns "YYYY-MM-DD" for today */
export function todayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Total pause seconds for a block */
export function totalPauseSeconds(pauses: { duration?: number }[]): number {
  return pauses.reduce((acc, p) => acc + (p.duration ?? 0), 0);
}
