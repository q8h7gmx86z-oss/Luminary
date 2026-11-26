import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  confirmedRecord,
  formatValue,
  type Heat,
  heatOrder,
  heldLevel,
  logicParams,
  makeStair,
  stairEstimate,
  stepStair,
  medalFor,
  seasonOf,
  sessionsThisWeek,
  standing,
  TARGET,
  thresholdFor,
} from '../src/training/championships.ts';

const heat = (over: Partial<Heat>): Heat => ({ event: 'sprint', level: 5, accuracy: 0.9, value: 500, untimed: false, at: 0, day: '2026-11-02', ...over });

test('held level is the level played when on target, else the one below', () => {
  assert.equal(heldLevel(6, 0.86, TARGET.balanced), 6);
  assert.equal(heldLevel(6, 0.7, TARGET.balanced), 5);
  assert.equal(heldLevel(1, 0, TARGET.balanced), 1);
});

test('thresholds are in real units', () => {
  assert.equal(thresholdFor('sprint', 10, 0.9, 0.85, false), 1400);
  assert.equal(thresholdFor('span', 4, 0.9, 0.85, false), 4);
  assert.equal(thresholdFor('logic', 7, 0.9, 0.85, false), 7);
  assert.equal(thresholdFor('sprint', 7, 0.5, 0.85, false), undefined, 'a heat below target measures nothing');
  assert.equal(thresholdFor('shift', 5, 0.9, 0.85, false, { switchCost: 186.4 }), 186);
  assert.equal(thresholdFor('shift', 5, 0.6, 0.85, false, { switchCost: 120 }), undefined);
  assert.equal(thresholdFor('sprint', 10, 0.9, 0.85, true), 10, 'untimed heats are measured in levels');
});

test('a record needs two heats to confirm it', () => {
  assert.equal(confirmedRecord([heat({ value: 400 })], 'lower'), undefined);
  assert.equal(confirmedRecord([heat({ value: 400 }), heat({ value: 450 }), heat({ value: 500 })], 'lower'), 450);
  assert.equal(confirmedRecord([heat({ value: 4 }), heat({ value: 6 }), heat({ value: 5 })], 'higher'), 5);
});

test('medals compare only with your own heats', () => {
  const prior = [heat({ value: 500 }), heat({ value: 480 })];
  assert.equal(medalFor(heat({ value: 470, day: '2026-11-05' }), prior, 0.85), 'gold');
  const many = [heat({ value: 400 }), heat({ value: 410 }), heat({ value: 520 }), heat({ value: 540 })];
  assert.equal(medalFor(heat({ value: 450, day: '2026-11-05' }), many, 0.85), 'silver');
  assert.equal(medalFor(heat({ value: 600, day: '2026-11-05' }), many, 0.85), 'bronze');
  assert.equal(medalFor(heat({ value: undefined, accuracy: 0.5, day: '2026-11-05' }), many, 0.85), 'none');
  assert.equal(medalFor(heat({ value: 300, untimed: true }), many, 0.85), 'bronze', 'timed and untimed records never mix');
});

test('seasons run four weeks: trials, training, finals', () => {
  const hs = [heat({ day: '2026-11-02' })];
  assert.deepEqual(
    [seasonOf(hs, '2026-11-02').phase, seasonOf(hs, '2026-11-10').phase, seasonOf(hs, '2026-11-24').phase],
    ['Trials', 'Training', 'Finals'],
  );
  const s = seasonOf(hs, '2026-12-01');
  assert.equal(s.number, 2);
  assert.equal(s.week, 1);
  const two = [heat({ day: '2026-11-02' }), heat({ day: '2026-12-03' })];
  assert.equal(seasonOf(two, '2026-12-10').number, 2);
  assert.equal(seasonOf(two, '2026-12-10').week, 2);
  assert.equal(seasonOf([], '2026-11-26').number, 1);
});

test('sessions this week count days, not heats', () => {
  const hs = [heat({ day: '2026-11-09' }), heat({ day: '2026-11-09' }), heat({ day: '2026-11-11' }), heat({ day: '2026-11-02' })];
  assert.equal(sessionsThisWeek(hs, seasonOf(hs, '2026-11-12')), 2);
});

test('standing compares the latest heats with week 1', () => {
  const hs = [heat({ day: '2026-11-02', value: 600 }), heat({ day: '2026-11-03', value: 600 }), heat({ day: '2026-11-12', value: 450 })];
  const st = standing(hs, 'sprint', false, seasonOf(hs, '2026-11-12'));
  assert.equal(st.baseline, 600);
  assert.equal(st.record, 600);
  assert.ok(st.change! > 0.08 && st.change! < 0.09);
});

test('weakest event goes first unless you choose the order', () => {
  const lv = { sprint: 8, span: 3, focus: 5, shift: 3, logic: 9 };
  assert.deepEqual(heatOrder(lv, false), ['span', 'shift', 'focus', 'sprint', 'logic']);
  assert.deepEqual(heatOrder(lv, true), ['sprint', 'span', 'focus', 'shift', 'logic']);
});

test('logic gets harder with level', () => {
  assert.equal(logicParams(1).rules, 1);
  assert.equal(logicParams(13).rules, 4);
  assert.ok(logicParams(20).itemMs < logicParams(1).itemMs);
  assert.equal(formatValue(412, 'ms'), '412 ms');
  assert.equal(formatValue(6.44, 'items'), '6.4 items');
});

test('the staircase holds the target accuracy trial by trial', () => {
  // A simulated player who is right 98% of the time at level 1, falling to chance-like 50% near level 19.
  let seed = 7;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const pCorrect = (lv: number) => 0.5 + 0.48 / (1 + Math.exp((lv - 10) / 1.5));
  for (const target of [0.75, 0.85, 0.9]) {
    let s = makeStair(5, target);
    let right = 0;
    const n = 4000;
    for (let i = 0; i < n; i++) {
      const ok = rand() < pCorrect(s.level);
      if (ok) right += 1;
      s = stepStair(s, ok);
    }
    assert.ok(Math.abs(right / n - target) < 0.03, `target ${target}, got ${(right / n).toFixed(3)}`);
    assert.ok(stairEstimate(s)! > 1 && stairEstimate(s)! < 20);
  }
});

test('a staircase heat measures its threshold from the reversals', () => {
  let s = makeStair(10, 0.85);
  for (const ok of [true, true, false, true, true, true, false, true, false]) s = stepStair(s, ok);
  assert.ok(s.reversals.length >= 3);
  const est = stairEstimate(s)!;
  assert.equal(thresholdFor('sprint', 10, 0.6, 0.85, false, { stairLevel: est }), Math.round(2200 - est * 80));
  assert.equal(stairEstimate(makeStair(4, 0.85)), undefined);
});
