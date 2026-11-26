import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { Experiment, LabEntry } from '../src/lab/lab.ts';
import { analyse, armFor, dayIndex, makeSchedule, MIN_PAIRS, pvtSummary, tCrit, verdictText } from '../src/lab/lab.ts';
import { movementWeek, weekSummary } from '../src/lib/wholebrain.ts';

const seq = (xs: number[]) => {
  let i = 0;
  return () => xs[i++ % xs.length];
};

function day(start: string, i: number) {
  return new Date(Date.parse(start + 'T12:00:00Z') + i * 86_400_000).toISOString().slice(0, 10);
}

function exp(speeds: (s: 'A' | 'B', i: number) => number, pairs = 6, kept = () => true): Experiment {
  const schedule = makeSchedule(pairs, seq([0.2, 0.7, 0.4, 0.9]));
  const entries: LabEntry[] = schedule.map((arm, i) => ({ day: day('2026-12-01', i), arm, kept: kept(), speed: speeds(arm, i), lapses: arm === 'A' ? 1 : 2, at: i }));
  return { id: 'x', templateId: 'walk', question: 'q', a: 'a', b: 'b', start: '2026-12-01', schedule, entries };
}

test('schedule: every pair holds one A and one B', () => {
  const s = makeSchedule(10);
  assert.equal(s.length, 20);
  for (let p = 0; p < 10; p++) assert.notEqual(s[p * 2], s[p * 2 + 1]);
});

test('day index and arm lookup cross month ends', () => {
  assert.equal(dayIndex('2026-11-30', '2026-12-02'), 2);
  const e = exp(() => 3, 2);
  assert.equal(armFor(e, '2026-12-01'), e.schedule[0]);
  assert.equal(armFor(e, '2026-12-05'), null);
  assert.equal(armFor(e, '2026-11-30'), null);
});

test('pvt summary uses response speed and lapses, and drops false starts', () => {
  assert.equal(pvtSummary([300, 300]), undefined);
  const s = pvtSummary([50, 250, 250, 500, 500, 250])!;
  assert.equal(s.falseStarts, 1);
  assert.equal(s.lapses, 2);
  assert.equal(s.n, 5);
  assert.equal(s.speed, Math.round(((3 * 4 + 2 * 2) / 5) * 1000) / 1000);
});

test('a real effect is found; drift alone is not', () => {
  // A days 5% faster, plus a steady practice drift and some noise.
  const noise = [0.02, -0.03, 0.01, 0.0, -0.01, 0.03, -0.02, 0.01, 0.02, -0.01, 0.0, 0.01];
  const r = analyse(exp((arm, i) => 3 + i * 0.02 + noise[i] + (arm === 'A' ? 0.15 : 0)));
  assert.equal(r.verdict, 'a');
  assert.equal(r.pairs, 6);
  assert.ok(r.low! > 0);
  const none = analyse(exp((_arm, i) => 3 + i * 0.02 + noise[i] * 4));
  assert.equal(none.verdict, 'none');
  assert.match(verdictText(none), /No clear difference/);
});

test('days not kept are left out, and few pairs give no verdict', () => {
  const r = analyse(exp(() => 3, 6, () => false));
  assert.equal(r.pairs, 0);
  assert.equal(r.verdict, 'collecting');
  const few = analyse(exp((arm) => (arm === 'A' ? 4 : 3), MIN_PAIRS - 1));
  assert.equal(few.verdict, 'collecting');
  assert.equal(tCrit(5), 2.571);
});

test('whole-brain week sums the last seven days', () => {
  const today = new Date(2026, 11, 7);
  const mv = movementWeek({ '2026-12-07': 30, '2026-12-01': 20, '2026-11-30': 99 }, today);
  assert.equal(mv.total, 50);
  const w = weekSummary(
    { workouts: ['2026-12-06', '2026-11-01'], movement: { '2026-12-07': 30 }, sleeps: { '2026-12-06': { bed: '23:00', wake: '07:00' }, '2026-12-05': { bed: '22:00', wake: '07:00' } }, moods: { '2026-12-07': { mood: 4, focus: 3 } }, rafiDone: 5, rafiTotal: 14 },
    today,
  );
  assert.equal(w.trainingDays, 1);
  assert.equal(w.movementMinutes, 30);
  assert.equal(w.sleepAvg, 510);
  assert.equal(w.focusAvg, 3);
});
