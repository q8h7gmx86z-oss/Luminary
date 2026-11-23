// Personal insights: does training go differently on days after more sleep, or on better-mood days?
// Pure and on-device. Associations only: these numbers cannot show cause.
import type { GameResult } from './engine';

/** Level plus accuracy on one scale, where one level is worth 100 accuracy points. */
const perf = (r: GameResult) => (r.level - 1) * 100 + r.accuracy * 100;
const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

/**
 * How each training day went compared with your own recent form, in accuracy points
 * (with level changes taken into account: one level up counts as 100).
 * Each round is compared with the average of your previous five rounds of the same game,
 * so steady improvement over time does not masquerade as a sleep or mood effect.
 */
export function dayForm(results: GameResult[]): Record<string, number> {
  const history = new Map<string, number[]>();
  const byDay = new Map<string, number[]>();
  for (const r of [...results].sort((a, b) => a.at - b.at)) {
    const prev = history.get(r.game) ?? [];
    const p = perf(r);
    if (prev.length >= 2) {
      const base = avg(prev.slice(-5));
      byDay.set(r.day, [...(byDay.get(r.day) ?? []), p - base]);
    }
    history.set(r.game, [...prev, p]);
  }
  const out: Record<string, number> = {};
  byDay.forEach((v, d) => (out[d] = avg(v)));
  return out;
}

export type Insight = {
  id: 'sleepHours' | 'sleepQuality' | 'mood' | 'energy';
  /** Labels for the two groups compared, "better" group first. */
  groups: [string, string];
  /** Days in each group. */
  n: [number, number];
  /** Average form in each group, in points. */
  form?: [number, number];
  /** First group minus second, in points. Undefined until both groups have enough days. */
  diff?: number;
  daysNeeded: number;
};

export const MIN_DAYS_PER_GROUP = 4;
/** Differences smaller than this, in points, are reported as no clear difference. */
export const CLEAR_DIFF = 3;

export function compare(
  id: Insight['id'],
  groups: [string, string],
  form: Record<string, number>,
  values: Record<string, number | undefined>,
  isFirst: (v: number) => boolean,
): Insight {
  const a: number[] = [];
  const b: number[] = [];
  for (const [day, v] of Object.entries(values)) {
    if (v === undefined || form[day] === undefined) continue;
    (isFirst(v) ? a : b).push(form[day]);
  }
  const daysNeeded = Math.max(0, MIN_DAYS_PER_GROUP - a.length) + Math.max(0, MIN_DAYS_PER_GROUP - b.length);
  const ready = daysNeeded === 0;
  return {
    id,
    groups,
    n: [a.length, b.length],
    form: ready ? [avg(a), avg(b)] : undefined,
    diff: ready ? avg(a) - avg(b) : undefined,
    daysNeeded,
  };
}

export function buildInsights(input: {
  results: GameResult[];
  sleepHours: Record<string, number | undefined>;
  sleepQuality: Record<string, number | undefined>;
  mood: Record<string, number | undefined>;
  energy: Record<string, number | undefined>;
}): Insight[] {
  const form = dayForm(input.results);
  return [
    compare('sleepHours', ['after 7 hours or more of sleep', 'after shorter nights'], form, input.sleepHours, (h) => h >= 7),
    compare(
      'sleepQuality',
      ['after nights you rated good', 'after nights you rated average or poor'],
      form,
      input.sleepQuality,
      (q) => q >= 4,
    ),
    compare('mood', ['on days you rated your mood good', 'on other days'], form, input.mood, (m) => m >= 4),
    compare('energy', ['on high-energy days', 'on other days'], form, input.energy, (e) => e >= 4),
  ];
}

/** Plain-English reading of one insight, always as an association. */
export function describeInsight(i: Insight): string {
  if (i.diff === undefined) return '';
  const size = Math.round(Math.abs(i.diff));
  if (Math.abs(i.diff) < CLEAR_DIFF) return `No clear difference so far between days ${i.groups[0]} and days ${i.groups[1]}.`;
  return i.diff > 0
    ? `Your training tended to go better ${i.groups[0]}: about ${size} accuracy points higher, against your own recent form, than ${i.groups[1]}.`
    : `Your training tended to go slightly better ${i.groups[1]}: about ${size} accuracy points, than ${i.groups[0]}.`;
}
