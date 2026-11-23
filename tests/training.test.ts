import assert from 'node:assert/strict';
import { test } from 'node:test';

import { catchParams, dailyGames, gridParams, nextLevel, speedParams } from '../src/training/engine.ts';
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
