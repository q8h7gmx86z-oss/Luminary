// Pure helpers with no imports, so plain Node can test them.

/** Local calendar day as YYYY-MM-DD. */
export function dayKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** The last n day keys, oldest first, ending today. */
export function lastNDays(n: number, today: Date = new Date()): string[] {
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
    out.push(dayKey(d));
  }
  return out;
}

/** Parse "HH:MM" into minutes after midnight, or null if invalid. */
export function parseTime(t: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(t.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

/** Minutes asleep window between bedtime and wake time, crossing midnight if needed. */
export function sleepMinutes(bed: string, wake: string): number | null {
  const b = parseTime(bed);
  const w = parseTime(wake);
  if (b === null || w === null) return null;
  const diff = w - b;
  return diff > 0 ? diff : diff + 24 * 60;
}

export function formatDuration(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

/** Mean of numbers, or null for an empty list. */
export function mean(xs: number[]): number | null {
  if (xs.length === 0) return null;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

/**
 * How many of the last 7 days have any entry. We show "days you showed up"
 * instead of streaks, so a missed day never resets progress to zero.
 */
export function daysShownUp(keys: Iterable<string>, today: Date = new Date()): number {
  const set = new Set(keys);
  return lastNDays(7, today).filter((k) => set.has(k)).length;
}

/** Seconds left on a timer that ends at endAt (ms epoch). */
export function secondsLeft(endAt: number, now: number = Date.now()): number {
  return Math.max(0, Math.ceil((endAt - now) / 1000));
}

export function formatClock(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** Simple unique id without extra dependencies. */
export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
