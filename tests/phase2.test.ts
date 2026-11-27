import { test } from 'node:test';
import assert from 'node:assert/strict';

import { DOSSIERS } from '../src/training/dossiers.ts';
import { PAPERS } from '../src/content/research.ts';
import { reviewOverdue } from '../src/training/standard.ts';
import { stopAdvice, FULL_DAY_ROUNDS } from '../src/training/stopRules.ts';
import { compareToUsual } from '../src/training/compare.ts';
import { rtStats } from '../src/training/engine.ts';

const GAMES = ['speed', 'grid', 'catch', 'nback', 'clash', 'switch', 'sequence', 'echo', 'hold', 'search', 'tower', 'words'];

test('every live game has a complete, current dossier with verified papers', () => {
  for (const g of GAMES) {
    const d = DOSSIERS[g as keyof typeof DOSSIERS];
    assert.ok(d, g);
    assert.ok(d.originalTask && d.construct && d.limits && d.implementation, g);
    assert.ok(d.papers.length > 0, g);
    for (const p of d.papers) assert.ok(PAPERS[p], `${g}: unknown paper ${p}`);
    assert.equal(reviewOverdue(d, '2026-11-28'), false);
    if (d.variantOf) assert.ok(GAMES.includes(d.variantOf));
  }
});

test('no dossier claims far transfer or everyday benefit as shown', () => {
  for (const g of GAMES) {
    const d = DOSSIERS[g as keyof typeof DOSSIERS];
    assert.notEqual(d.farTransfer, 'shown', g);
    assert.notEqual(d.everydayOutcomes, 'shown', g);
  }
});

const r = (game: string, accuracy: number, at: number, day = '2026-11-27') => ({ game, accuracy, at, day });

test('stop rules: carry on when things are fine', () => {
  const rs = [r('grid', 0.8, 1), r('grid', 0.9, 2)];
  assert.equal(stopAdvice(rs, rs[1], 0.6), null);
});

test('stop rules: two tough rounds of the same game eases off', () => {
  const rs = [r('grid', 0.5, 1), r('grid', 0.4, 2)];
  assert.equal(stopAdvice(rs, rs[1], 0.6)?.kind, 'ease');
});

test('stop rules: yesterday does not count', () => {
  const rs = [r('grid', 0.5, 1, '2026-11-26'), r('grid', 0.4, 2)];
  assert.equal(stopAdvice(rs, rs[1], 0.6), null);
});

test('stop rules: three tough rounds in a row suggests a pause', () => {
  const rs = [r('grid', 0.5, 1), r('clash', 0.4, 2), r('speed', 0.3, 3)];
  assert.equal(stopAdvice(rs, rs[2], 0.6)?.kind, 'break');
});

test('stop rules: a full day says enough', () => {
  const rs = Array.from({ length: FULL_DAY_ROUNDS }, (_, i) => r('grid', 0.8, i));
  assert.equal(stopAdvice(rs, rs[rs.length - 1], 0.6)?.kind, 'enough');
});

test('compare: needs three rounds before knowing your usual', () => {
  assert.equal(compareToUsual({ level: 3, accuracy: 0.8 }, [{ level: 3, accuracy: 0.7 }]), null);
});

test('compare: accuracy, speed and consistency against your usual', () => {
  const past = [0, 1, 2, 3].map(() => ({ level: 4, accuracy: 0.75, rtMedian: 800, rtSd: 200 }));
  const rows = compareToUsual({ level: 4, accuracy: 0.9, rtMedian: 700, rtSd: 100 }, past)!;
  assert.deepEqual(rows.map((x) => [x.label, x.verdict]), [['Accuracy', 'better'], ['Speed', 'better'], ['Consistency', 'better']]);
  assert.equal(rows[0].usual, '75%');
  assert.equal(rows[1].usual, '800 ms');
});

test('compare: judges against nearby levels when there are enough', () => {
  const past = [
    ...[0, 1, 2].map(() => ({ level: 1, accuracy: 0.95 })),
    ...[0, 1, 2].map(() => ({ level: 9, accuracy: 0.7 })),
  ];
  const rows = compareToUsual({ level: 10, accuracy: 0.72 }, past)!;
  assert.equal(rows[0].verdict, 'usual');
});

test('anticipations under 150 ms are left out of speed scores', () => {
  assert.deepEqual(rtStats([30, 60, 400, 500, 600]), { rtMs: 500, rtMedian: 500, rtSd: 100 });
  assert.deepEqual(rtStats([20, 40]), { rtMs: undefined, rtMedian: undefined, rtSd: undefined });
});
