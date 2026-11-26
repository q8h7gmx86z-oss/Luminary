// The Personal Lab: randomised experiments on yourself (n-of-1 trials, after Guyatt et al. 1986).
// Pure, so it can be tested in Node. No imports.
//
// Design:
// - Days come in pairs. Each pair holds one A day and one B day, in random order. Pairs cancel out slow drifts,
//   such as practice on the check itself, the season or a busy month.
// - The outcome is a short psychomotor vigilance test (PVT). Basner & Dinges (2011) found response speed (1/RT)
//   and lapses more sensitive than mean or median reaction time, so those are what we report.
// - The verdict comes from the pair differences: a 95% confidence interval that excludes zero, or nothing.

export type Arm = 'A' | 'B';

export type LabTemplate = {
  id: string;
  question: string;
  a: string;
  b: string;
  /** What to watch for, in one line. */
  note: string;
};

export const TEMPLATES: LabTemplate[] = [
  {
    id: 'walk',
    question: 'Does a brisk walk sharpen my alertness?',
    a: 'Walk briskly for 10 minutes in the hour before the check.',
    b: 'No exercise in the hour before the check.',
    note: 'Keep the time of day of the check similar on both kinds of day.',
  },
  {
    id: 'bedtime',
    question: 'Does going to bed earlier make me sharper the next day?',
    a: 'In bed 30 minutes earlier than usual the night before.',
    b: 'Your usual bedtime the night before.',
    note: 'Take the check at a similar time each morning.',
  },
  {
    id: 'screens',
    question: 'Does an hour without screens before bed help the next day?',
    a: 'No phone, tablet or television in the hour before bed.',
    b: 'Your usual evening.',
    note: 'The night before counts. Take the check the following day.',
  },
  {
    id: 'breathing',
    question: 'Does five minutes of slow breathing sharpen me?',
    a: 'Five minutes of slow breathing just before the check.',
    b: 'Five minutes of quiet rest just before the check.',
    note: 'Luminary’s breathing exercise on the Focus tab works well for the A days.',
  },
  {
    id: 'caffeine',
    question: 'Does my morning coffee or tea really sharpen me?',
    a: 'Your usual caffeinated drink before the check.',
    b: 'A decaffeinated drink instead.',
    note: 'If you drink a lot of caffeine, B days can bring withdrawal headaches. Stop if they do.',
  },
];

export type LabEntry = {
  day: string;
  arm: Arm;
  /** Whether you kept to the day's condition. Days you did not are left out of the result. */
  kept: boolean;
  /** Mean response speed, responses per second (1000 / RT in ms). Higher is sharper. */
  speed: number;
  lapses: number;
  at: number;
};

export type Experiment = {
  id: string;
  templateId: string;
  question: string;
  a: string;
  b: string;
  /** First day of the experiment, YYYY-MM-DD. */
  start: string;
  /** The arm for each day, index 0 = start. Always an even length: complete pairs. */
  schedule: Arm[];
  entries: LabEntry[];
  endedAt?: number;
};

export type Rand = () => number;

/** A random schedule of `pairs` pairs, each holding one A and one B day in random order. */
export function makeSchedule(pairs: number, rand: Rand = Math.random): Arm[] {
  const out: Arm[] = [];
  for (let i = 0; i < pairs; i++) out.push(...((rand() < 0.5 ? ['A', 'B'] : ['B', 'A']) as Arm[]));
  return out;
}

/** Whole days from `start` to `day` (both YYYY-MM-DD), using noon to avoid daylight-saving edges. */
export function dayIndex(start: string, day: string): number {
  return Math.round((Date.parse(day + 'T12:00:00Z') - Date.parse(start + 'T12:00:00Z')) / 86_400_000);
}

/** Today's arm, or null once the schedule has run out (or before it starts). */
export function armFor(exp: Experiment, day: string): Arm | null {
  const i = dayIndex(exp.start, day);
  return i >= 0 && i < exp.schedule.length ? exp.schedule[i] : null;
}

// --- The alertness check (a shortened PVT) -----------------------------------------------------

/** A response faster than this cannot be a reaction to the light: a false start. */
export const FALSE_START_MS = 100;
/** A response this slow or slower is a lapse of attention, the standard PVT definition. */
export const LAPSE_MS = 500;
export const CHECK_SECONDS = 120;

/** Summarise one check: mean response speed (1/RT) and lapses. False starts are counted, not scored. */
export function pvtSummary(rts: number[]): { speed: number; lapses: number; falseStarts: number; n: number } | undefined {
  const valid = rts.filter((r) => r >= FALSE_START_MS);
  if (valid.length < 5) return undefined;
  const speed = valid.reduce((a, r) => a + 1000 / r, 0) / valid.length;
  return {
    speed: Math.round(speed * 1000) / 1000,
    lapses: valid.filter((r) => r >= LAPSE_MS).length,
    falseStarts: rts.length - valid.length,
    n: valid.length,
  };
}

// --- The result -----------------------------------------------------------------------------------

/** Two-sided 95% t values for 1 to 30 degrees of freedom. */
const T95 = [12.706, 4.303, 3.182, 2.776, 2.571, 2.447, 2.365, 2.306, 2.262, 2.228, 2.201, 2.179, 2.16, 2.145, 2.131, 2.12, 2.11, 2.101, 2.093, 2.086, 2.08, 2.074, 2.069, 2.064, 2.06, 2.056, 2.052, 2.048, 2.045, 2.042];
export const tCrit = (df: number) => (df < 1 ? Infinity : df <= 30 ? T95[df - 1] : 1.96);

/** Pairs needed before Luminary will give a verdict. */
export const MIN_PAIRS = 4;

export type LabResult = {
  /** Complete pairs: both days checked and both conditions kept. */
  pairs: number;
  meanA?: number;
  meanB?: number;
  lapsesA?: number;
  lapsesB?: number;
  /** A minus B in response speed, with its 95% interval. */
  diff?: number;
  low?: number;
  high?: number;
  /** The difference as a share of B, in percent. */
  pct?: number;
  verdict: 'collecting' | 'a' | 'b' | 'none';
};

const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const r3 = (x: number) => Math.round(x * 1000) / 1000;

export function analyse(exp: Experiment): LabResult {
  const byDay = new Map(exp.entries.map((e) => [e.day, e]));
  const startMs = Date.parse(exp.start + 'T12:00:00Z');
  const keyAt = (i: number) => new Date(startMs + i * 86_400_000).toISOString().slice(0, 10);
  const a: LabEntry[] = [];
  const b: LabEntry[] = [];
  const diffs: number[] = [];
  for (let p = 0; p * 2 < exp.schedule.length; p++) {
    const d1 = byDay.get(keyAt(p * 2));
    const d2 = byDay.get(keyAt(p * 2 + 1));
    if (!d1 || !d2 || !d1.kept || !d2.kept || d1.arm === d2.arm) continue;
    const ea = d1.arm === 'A' ? d1 : d2;
    const eb = d1.arm === 'A' ? d2 : d1;
    a.push(ea);
    b.push(eb);
    diffs.push(ea.speed - eb.speed);
  }
  const n = diffs.length;
  if (!n) return { pairs: 0, verdict: 'collecting' };
  const meanA = avg(a.map((e) => e.speed));
  const meanB = avg(b.map((e) => e.speed));
  const base = { pairs: n, meanA: r3(meanA), meanB: r3(meanB), lapsesA: Math.round(avg(a.map((e) => e.lapses)) * 10) / 10, lapsesB: Math.round(avg(b.map((e) => e.lapses)) * 10) / 10 };
  if (n < MIN_PAIRS) return { ...base, verdict: 'collecting' };
  const d = avg(diffs);
  const sd = Math.sqrt(diffs.reduce((s, x) => s + (x - d) ** 2, 0) / (n - 1));
  const half = tCrit(n - 1) * (sd / Math.sqrt(n));
  const low = d - half;
  const high = d + half;
  const verdict = low > 0 ? 'a' : high < 0 ? 'b' : 'none';
  return { ...base, diff: r3(d), low: r3(low), high: r3(high), pct: meanB ? Math.round((d / meanB) * 1000) / 10 : 0, verdict };
}

/** Plain-English verdict for the result card. */
export function verdictText(r: LabResult): string {
  if (r.verdict === 'collecting')
    return r.pairs ? `${r.pairs} of at least ${MIN_PAIRS} complete pairs. Keep going: a verdict needs more days.` : 'No complete pairs yet. A pair is two days in a row, one of each condition.';
  const size = `${Math.abs(r.pct ?? 0)}%`;
  if (r.verdict === 'a') return `Clear result: you were ${size} faster on A days. The difference is larger than your day-to-day variation.`;
  if (r.verdict === 'b') return `Clear result: you were ${size} faster on B days. The difference is larger than your day-to-day variation.`;
  return 'No clear difference. Any gap is within your normal day-to-day variation, so this change does not reliably affect your alertness. That is a real result too.';
}
