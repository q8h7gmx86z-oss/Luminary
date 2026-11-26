import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  baselineOf,

  codingKey,
  codingMeasure,
  compare,
  daysUntilDue,
  digitList,
  longestSpan,
  nextSpanLength,
  report,
  rtMeasure,
  summary,
  trailPositions,
  trailsLabels,
  trailsMeasure,
} from '../src/training/benchmark.ts';
import type { BenchmarkRecord } from '../src/training/benchmark.ts';

const rec = (at: number, m: BenchmarkRecord['measures']): BenchmarkRecord => ({ at, day: '2026-11-26', measures: m });

test('reaction time uses the median and a standard error from your own trials', () => {
  const m = rtMeasure([300, 310, 290, 305, 900])!;
  assert.equal(m.value, 305);
  assert.ok(m.se! > 0);
  assert.equal(rtMeasure([300, 310]), undefined);
});

test('trails and coding totals', () => {
  assert.equal(trailsMeasure([1000, 2000, 1500, 1500])!.value, 6);
  assert.equal(codingMeasure([8, 9, 7, 8, 8, 9])!.value, 49);
});

test('digit span: two tries per length, stop after two misses', () => {
  const r = [
    { length: 3, correct: true },
    { length: 3, correct: false },
    { length: 4, correct: false },
  ];
  assert.equal(nextSpanLength([], 3, 9), 3);
  assert.equal(nextSpanLength(r.slice(0, 1), 3, 9), 3);
  assert.equal(nextSpanLength(r.slice(0, 2), 3, 9), 4);
  assert.equal(nextSpanLength(r, 3, 9), 4);
  assert.equal(nextSpanLength([...r, { length: 4, correct: false }], 3, 9), null);
  assert.equal(longestSpan(r), 3);
  assert.equal(nextSpanLength([{ length: 9, correct: true }, { length: 9, correct: true }], 3, 9), null);
});

test('a change counts only when it beats normal variation', () => {
  assert.equal(compare('choiceRt', { value: 500, se: 10 }, { value: 480, se: 10 }).verdict, 'steady');
  assert.equal(compare('choiceRt', { value: 500, se: 10 }, { value: 460, se: 10 }).verdict, 'improved');
  assert.equal(compare('coding', { value: 50, se: 2 }, { value: 40, se: 2 }).verdict, 'declined');
  assert.equal(compare('span', { value: 11 }, { value: 12 }).verdict, 'steady');
  assert.equal(compare('span', { value: 11 }, { value: 13 }).verdict, 'improved');
});

test('baseline is the first session, then the average of the first two once there is a third', () => {
  const a = rec(0, { coding: { value: 40, se: 2 } });
  const b = rec(1, { coding: { value: 50, se: 2 } });
  const c = rec(2, { coding: { value: 60, se: 2 } });
  assert.equal(report([a]), undefined);
  assert.equal(baselineOf([a, b]).coding!.value, 40);
  assert.equal(baselineOf([a, b, c]).coding!.value, 45);
  assert.ok(baselineOf([a, b, c]).coding!.se! < 2, 'averaging shrinks the error');
  const r = report([a, b, c])!;
  assert.equal(r[0].verdict, 'improved');
  assert.match(summary(r), /1 untrained measure reliably improved/);
});

test('schedule: due at once, then every 28 days', () => {
  assert.equal(daysUntilDue([], 0), 0);
  assert.equal(daysUntilDue([rec(0, {})], 86_400_000), 27);
});

test('content: trails labels alternate, circles do not overlap, keys and digits are valid', () => {
  assert.deepEqual(trailsLabels('B').slice(0, 4), ['1', 'A', '2', 'B']);
  assert.equal(trailsLabels('B')[11], 'F');
  const pts = trailPositions(12);
  for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) assert.ok(Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y) >= 0.17 - 1e-9);
  assert.equal(new Set(codingKey()).size, 9);
  const d = digitList(8);
  assert.equal(d.length, 8);
  for (let i = 1; i < d.length; i++) assert.notEqual(d[i], d[i - 1]);
});
