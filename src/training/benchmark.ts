// The Luminary Benchmark: a monthly check on tasks you never train on.
// Pure, so it can be tested in Node. No imports.
//
// Why these rules:
// - Untrained tasks: in-game scores rise with practice of that game. Only tasks you do not practise
//   can show whether training carries over.
// - Two-session baseline: retaking any test raises scores through familiarity alone (practice effects),
//   so the baseline is the average of your first two Benchmarks once you have them.
// - Reliable change: a change only counts when it is larger than the normal variation within your own
//   sessions (a reliable change test in the spirit of Jacobson & Truax 1991).

export type MeasureId = 'simpleRt' | 'choiceRt' | 'span' | 'trailsA' | 'trailsB' | 'coding';

export type Measure = { value: number; /** Standard error from your own trials. Absent when the rule is fixed. */ se?: number };

export type BenchmarkRecord = {
  at: number;
  day: string;
  measures: Partial<Record<MeasureId, Measure>>;
};

export const MEASURES: Record<MeasureId, { label: string; unit: 'ms' | 's' | 'digits' | 'correct'; better: 'lower' | 'higher'; skill: string; explain: string }> = {
  simpleRt: { label: 'Simple reaction time', unit: 'ms', better: 'lower', skill: 'Speed', explain: 'How quickly you respond to a single light. Median of your taps.' },
  choiceRt: { label: 'Choice reaction time', unit: 'ms', better: 'lower', skill: 'Speed', explain: 'How quickly you respond when you must choose between four positions.' },
  span: { label: 'Digit span', unit: 'digits', better: 'higher', skill: 'Memory', explain: 'Longest list of digits repeated forwards plus longest repeated backwards.' },
  trailsA: { label: 'Trails A', unit: 's', better: 'lower', skill: 'Speed', explain: 'Time to connect 1 to 12 in order.' },
  trailsB: { label: 'Trails B', unit: 's', better: 'lower', skill: 'Flexibility', explain: 'Time to alternate numbers and letters: 1, A, 2, B and on to 6, F.' },
  coding: { label: 'Symbol coding', unit: 'correct', better: 'higher', skill: 'Speed', explain: 'Symbols matched to their numbers in 90 seconds.' },
};
export const MEASURE_ORDER: MeasureId[] = ['simpleRt', 'choiceRt', 'span', 'trailsA', 'trailsB', 'coding'];

/** Days between Benchmarks. Long enough for training to show, short enough to track. */
export const BENCHMARK_INTERVAL_DAYS = 28;
/** A total span change of this many digits counts as real. Span is too coarse for a standard error. */
export const SPAN_RELIABLE = 2;
/** Two-sided 95% threshold. */
const Z = 1.96;

const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
function sdOf(xs: number[]): number {
  if (xs.length < 2) return 0;
  const m = avg(xs);
  return Math.sqrt(xs.reduce((a, x) => a + (x - m) ** 2, 0) / (xs.length - 1));
}
function medianOf(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

/** Reaction time: median, with the standard error of a median (about 1.25 times that of a mean). */
export function rtMeasure(rts: number[]): Measure | undefined {
  if (rts.length < 3) return undefined;
  return { value: Math.round(medianOf(rts)), se: Math.round((1.2533 * sdOf(rts)) / Math.sqrt(rts.length)) };
}

/** Trails: total time in seconds from the time of each link; error from how much the links vary. */
export function trailsMeasure(segmentMs: number[]): Measure | undefined {
  if (segmentMs.length < 3) return undefined;
  const total = segmentMs.reduce((a, b) => a + b, 0) / 1000;
  const se = (sdOf(segmentMs) * Math.sqrt(segmentMs.length)) / 1000;
  return { value: Math.round(total * 10) / 10, se: Math.round(se * 10) / 10 };
}

/** Coding: correct answers in the whole test; error from how much the 15-second blocks vary. */
export function codingMeasure(correctPerBlock: number[]): Measure | undefined {
  if (correctPerBlock.length < 3) return undefined;
  const total = correctPerBlock.reduce((a, b) => a + b, 0);
  return { value: total, se: Math.round(sdOf(correctPerBlock) * Math.sqrt(correctPerBlock.length) * 10) / 10 };
}

/**
 * Digit span with two tries per length: the longest length passed at least once.
 * `results` lists, in order, the length tried and whether it was right. Stops are the caller's job.
 */
export function longestSpan(results: { length: number; correct: boolean }[]): number {
  return results.filter((r) => r.correct).reduce((m, r) => Math.max(m, r.length), 0);
}

/** Digit span procedure: two tries at each length; stop when both fail. Returns the next length, or null to stop. */
export function nextSpanLength(results: { length: number; correct: boolean }[], start: number, max: number): number | null {
  if (!results.length) return start;
  const last = results[results.length - 1].length;
  const atLast = results.filter((r) => r.length === last);
  if (atLast.length < 2) return last;
  if (atLast.every((r) => !r.correct)) return null;
  return last + 1 > max ? null : last + 1;
}

/** The baseline: the first Benchmark, or the average of the first two once a third exists to compare. */
export function baselineOf(records: BenchmarkRecord[]): Partial<Record<MeasureId, Measure>> {
  const first = records.slice(0, records.length >= 3 ? 2 : 1);
  const out: Partial<Record<MeasureId, Measure>> = {};
  for (const id of MEASURE_ORDER) {
    const ms = first.map((r) => r.measures[id]).filter((m): m is Measure => !!m);
    if (!ms.length) continue;
    const value = avg(ms.map((m) => m.value));
    const ses = ms.map((m) => m.se).filter((x): x is number => x !== undefined);
    // Averaging two sessions shrinks the error by the square root of two.
    const se = ses.length === ms.length ? Math.sqrt(ses.reduce((a, s) => a + s * s, 0)) / ms.length : undefined;
    out[id] = { value: Math.round(value * 10) / 10, se };
  }
  return out;
}

export type Verdict = 'improved' | 'declined' | 'steady';
export type Change = { id: MeasureId; base: number; now: number; diff: number; /** Change in the better direction, as a share of baseline. */ pct: number; verdict: Verdict; threshold: number };

/** Compare one measure with its baseline. `improved` and `declined` only when the change beats normal variation. */
export function compare(id: MeasureId, base: Measure, now: Measure): Change {
  const diff = now.value - base.value;
  const gain = MEASURES[id].better === 'lower' ? -diff : diff;
  const threshold = id === 'span' ? SPAN_RELIABLE : Z * Math.sqrt((base.se ?? 0) ** 2 + (now.se ?? 0) ** 2);
  const verdict: Verdict = threshold > 0 && Math.abs(diff) >= threshold ? (gain > 0 ? 'improved' : 'declined') : 'steady';
  return { id, base: base.value, now: now.value, diff: Math.round(diff * 10) / 10, pct: base.value ? Math.round((gain / base.value) * 1000) / 10 : 0, verdict, threshold: Math.round(threshold * 10) / 10 };
}

/** Latest Benchmark against the baseline. Needs a Benchmark after the baseline sessions. */
export function report(records: BenchmarkRecord[]): Change[] | undefined {
  if (records.length < 2) return undefined;
  const base = baselineOf(records);
  const latest = records[records.length - 1].measures;
  const out: Change[] = [];
  for (const id of MEASURE_ORDER) {
    const b = base[id];
    const n = latest[id];
    if (b && n) out.push(compare(id, b, n));
  }
  return out;
}

/** When the next Benchmark is due, as days from `now`. Zero or less means it is due. */
export function daysUntilDue(records: BenchmarkRecord[], now: number): number {
  if (!records.length) return 0;
  const last = records[records.length - 1].at;
  return Math.ceil((last + BENCHMARK_INTERVAL_DAYS * 86_400_000 - now) / 86_400_000);
}

/** One-line summary for the report header. */
export function summary(changes: Change[]): string {
  const up = changes.filter((c) => c.verdict === 'improved').length;
  const down = changes.filter((c) => c.verdict === 'declined').length;
  if (!up && !down) return 'No change beyond normal variation on any untrained task.';
  const parts = [up ? `${up} untrained ${up === 1 ? 'measure' : 'measures'} reliably improved` : '', down ? `${down} reliably declined` : ''].filter(Boolean);
  return `${parts.join(', ')}. The rest are within normal variation.`;
}

// --- Test content generators --------------------------------------------------------------------

export type Rand = () => number;

/** Positions for Trails circles, in a unit square, never closer than `minGap`. */
export function trailPositions(n: number, rand: Rand = Math.random, minGap = 0.17): { x: number; y: number }[] {
  for (let attempt = 0; attempt < 200; attempt++) {
    const pts: { x: number; y: number }[] = [];
    for (let tries = 0; pts.length < n && tries < 4000; tries++) {
      const p = { x: 0.08 + rand() * 0.84, y: 0.08 + rand() * 0.84 };
      if (pts.every((q) => (q.x - p.x) ** 2 + (q.y - p.y) ** 2 >= minGap ** 2)) pts.push(p);
    }
    if (pts.length === n) return pts;
  }
  throw new Error('Could not place trail circles');
}

export const trailsLabels = (kind: 'A' | 'B'): string[] =>
  kind === 'A' ? Array.from({ length: 12 }, (_, i) => String(i + 1)) : Array.from({ length: 12 }, (_, i) => (i % 2 === 0 ? String(i / 2 + 1) : 'ABCDEF'[(i - 1) / 2]));

/** Nine symbols for coding, drawn fresh each session and paired with 1 to 9. */
export const CODING_SYMBOLS = ['◆', '▲', '●', '■', '★', '✚', '◐', '⬟', '✦', '▼', '◑', '⬢', '✖', '◒', '▶'];
export function codingKey(rand: Rand = Math.random): string[] {
  const a = [...CODING_SYMBOLS];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, 9);
}

/** A digit string of the given length with no digit twice in a row. */
export function digitList(length: number, rand: Rand = Math.random): string {
  let s = '';
  while (s.length < length) {
    const d = String(1 + Math.floor(rand() * 9));
    if (d !== s[s.length - 1]) s += d;
  }
  return s;
}
