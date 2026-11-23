import assert from 'node:assert/strict';
import { test } from 'node:test';

import { balancedAccuracy, catchParams, clashParams, dailyGames, gridParams, nbackParams, nbackSequence, nextLevel, speedParams, switchParams } from '../src/training/engine.ts';
import { skillSummaries, workoutsThisWeek } from '../src/training/stats.ts';

test('levels go up on strong rounds, down on weak ones, and stay in range', () => {
  assert.equal(nextLevel(3, 0.9), 4);
  assert.equal(nextLevel(3, 0.7), 3);
  assert.equal(nextLevel(3, 0.4), 2);
  assert.equal(nextLevel(1, 0), 1);
  assert.equal(nextLevel(20, 1), 20);
});

test('daily plan always has speed plus two different games', () => {
  const avail = ['speed', 'grid', 'catch'] as const;
  for (const day of ['2026-11-23', '2026-11-24', '2026-12-01']) {
    const g = dailyGames(day, [...avail]);
    assert.equal(g.length, 3);
    assert.ok(g.includes('speed'));
    assert.equal(new Set(g).size, 3);
  }
});

test('harder levels make games harder', () => {
  assert.ok(speedParams(10).deadlineMs < speedParams(1).deadlineMs);
  assert.ok(gridParams(10).span > gridParams(1).span);
  assert.ok(catchParams(10).showMs < catchParams(1).showMs);
  assert.ok(speedParams(20).deadlineMs >= 650);
});

test('skill summaries group rounds by skill and day', () => {
  const results = [
    { game: 'speed', level: 1, score: 50, accuracy: 0.8, at: 1, day: '2026-11-20' },
    { game: 'speed', level: 1, score: 60, accuracy: 1, at: 2, day: '2026-11-20' },
    { game: 'grid', level: 3, score: 40, accuracy: 0.6, at: 3, day: '2026-11-21' },
  ] as const;
  const skillOf = (g: string) => (g === 'speed' ? 'speed' : 'memory') as 'speed' | 'memory';
  const s = skillSummaries([...results] as any, { speed: 2, grid: 3 }, skillOf as any, ['speed', 'memory']);
  assert.equal(s[0].rounds, 2);
  assert.equal(s[0].level, 2);
  assert.equal(s[0].trend.length, 1);
  assert.equal(s[0].trend[0].value, 90);
  assert.equal(s[1].rounds, 1);
  assert.equal(s[1].trend[0].value, 72);
});

test('workouts this week counts only days in the window', () => {
  assert.equal(workoutsThisWeek(['2026-11-01', '2026-11-22', '2026-11-23'], ['2026-11-22', '2026-11-23']), 2);
});

test('n-back sequences put targets n steps apart and never fake a near-miss', () => {
  const seq = nbackSequence(400, 2, 8, 0.3);
  const targets = seq.filter((p, i) => i >= 2 && p === seq[i - 2]).length;
  assert.ok(targets > 80 && targets < 160, String(targets));
  assert.ok(seq.every((p) => p >= 0 && p < 8));
});

test('balanced accuracy does not reward never pressing', () => {
  assert.equal(balancedAccuracy(0, 6, 14, 14), 0.5);
  assert.equal(balancedAccuracy(6, 6, 14, 14), 1);
});

test('new games get harder with level', () => {
  assert.ok(nbackParams(12).n > nbackParams(1).n);
  assert.ok(clashParams(10).clashRate > clashParams(1).clashRate);
  assert.ok(switchParams(10).switchRate > switchParams(1).switchRate);
  assert.ok(switchParams(20).deadlineMs >= 1300);
});

test('daily plan works with all six games', () => {
  const all = ['speed', 'grid', 'catch', 'nback', 'clash', 'switch'] as const;
  const seen = new Set<string>();
  for (let d = 1; d <= 10; d++) {
    const g = dailyGames(`2026-12-${String(d).padStart(2, '0')}`, [...all]);
    assert.equal(new Set(g).size, 3);
    g.forEach((x) => seen.add(x));
  }
  assert.equal(seen.size, 6);
});
