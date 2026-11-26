// The whole-brain week: training, movement, sleep and mood side by side.
// Pure, so it can be tested in Node.

import { lastNDays, mean, sleepMinutes } from './logic.ts';

/** WHO 2020: adults should do 150 to 300 minutes of moderate activity a week (Bull et al. 2020). */
export const MOVE_TARGET = 150;

/** Minutes of movement in the last seven days, ending `today`. */
export function movementWeek(log: Record<string, number> | undefined, today: Date = new Date()): { days: { day: string; minutes: number }[]; total: number } {
  const days = lastNDays(7, today).map((day) => ({ day, minutes: log?.[day] ?? 0 }));
  return { days, total: days.reduce((a, d) => a + d.minutes, 0) };
}

export type WeekInput = {
  workouts: string[];
  movement?: Record<string, number>;
  sleeps: Record<string, { bed: string; wake: string }>;
  moods: Record<string, { mood: number; focus: number }>;
  /** Rafi Programme factors marked as in place, out of the total. */
  rafiDone: number;
  rafiTotal: number;
};

export type WeekSummary = {
  trainingDays: number;
  movementMinutes: number;
  /** Average logged sleep window in minutes, or null when nothing was logged. */
  sleepAvg: number | null;
  sleepNights: number;
  focusAvg: number | null;
  rafiDone: number;
  rafiTotal: number;
};

export function weekSummary(w: WeekInput, today: Date = new Date()): WeekSummary {
  const days = lastNDays(7, today);
  const set = new Set(w.workouts);
  const sleeps = days.map((d) => w.sleeps[d]).filter(Boolean).map((s) => sleepMinutes(s.bed, s.wake)).filter((m): m is number => m !== null);
  const focus = days.map((d) => w.moods[d]?.focus).filter((f): f is number => typeof f === 'number');
  const sleepAvg = mean(sleeps);
  const focusAvg = mean(focus);
  return {
    trainingDays: days.filter((d) => set.has(d)).length,
    movementMinutes: movementWeek(w.movement, today).total,
    sleepAvg: sleepAvg === null ? null : Math.round(sleepAvg),
    sleepNights: sleeps.length,
    focusAvg: focusAvg === null ? null : Math.round(focusAvg * 10) / 10,
    rafiDone: w.rafiDone,
    rafiTotal: w.rafiTotal,
  };
}
