import assert from 'node:assert/strict';
import { test } from 'node:test';

import { balancedAccuracy, catchParams, clashParams, dailyGames, focusGames, gridParams, nbackParams, nbackSequence, nextLevel, speedParams, switchParams } from '../src/training/engine.ts';
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

test('focus track always starts with Catch the Light and has three different games', () => {
  const all = ['speed', 'grid', 'catch', 'nback', 'clash', 'switch'] as const;
  for (let d = 1; d <= 6; d++) {
    const g = focusGames(`2026-12-0${d}`, [...all]);
    assert.equal(g[0], 'catch');
    assert.equal(new Set(g).size, 3);
    assert.ok(!g.includes('speed'));
  }
});

import { roundPerformance, sharpnessHistory, sharpnessOf } from '../src/training/sharpness.ts';

test('sharpness rises with level and accuracy, and counts every skill', () => {
  assert.ok(roundPerformance({ level: 5, accuracy: 0.9 }) > roundPerformance({ level: 2, accuracy: 0.9 }));
  assert.equal(roundPerformance({ level: 40, accuracy: 1 }), 1);
  const skillOf = (g: string) => (g === 'speed' ? 'speed' : 'memory') as 'speed' | 'memory';
  const r = (game: string, level: number, day: string) => ({ game, level, accuracy: 1, score: 0, at: 0, day }) as any;
  const one = sharpnessOf([r('speed', 4, '2026-11-01')], skillOf as any, ['speed', 'memory']);
  const two = sharpnessOf([r('speed', 4, '2026-11-01'), r('grid', 4, '2026-11-01')], skillOf as any, ['speed', 'memory']);
  assert.ok(two.total > one.total);
  const hist = sharpnessHistory([r('speed', 2, '2026-11-01'), r('speed', 3, '2026-11-02'), r('speed', 4, '2026-11-03')], skillOf as any, ['speed', 'memory']);
  assert.equal(hist.length, 3);
  assert.ok(hist[2].value > hist[0].value);
});

import { challengeDone, dailyChallenge, forgivingStreak, gamesForMinutes, planWorkout, slotKinds, weekOf, weeklyQuest } from '../src/training/planner.ts';

const SK = { speed: 'speed', grid: 'memory', nback: 'memory', catch: 'attention', clash: 'attention', switch: 'flexibility' } as const;
const ALL = ['speed', 'grid', 'catch', 'nback', 'clash', 'switch'] as any[];
const NAMES = { speed: 'Processing speed', memory: 'Working memory', attention: 'Attention control', flexibility: 'Flexibility' } as const;
const skillOf = (g: string) => (SK as any)[g];
const SKILLS = ['speed', 'memory', 'attention', 'flexibility'] as any[];
const round = (game: string, level: number, accuracy: number, day: string, at = 0) => ({ game, level, accuracy, score: level * 10, at, day }) as any;

test('session length sets the number of games', () => {
  assert.deepEqual([3, 5, 10, 15].map(gamesForMinutes), [1, 2, 3, 4]);
});

test('slot mix is roughly 60/25/15 and always starts targeted', () => {
  let s = 1;
  const rand = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const counts = { targeted: 0, varied: 0, familiar: 0 } as any;
  for (let i = 0; i < 4000; i++) {
    const k = slotKinds(4, rand);
    assert.equal(k[0], 'targeted');
    k.slice(1).forEach((x) => counts[x]++);
  }
  const total = 4000 * 3;
  assert.ok(Math.abs(counts.targeted / total - 0.6) < 0.03);
  assert.ok(Math.abs(counts.varied / total - 0.25) < 0.03);
});

test('new players get untried games first, then targeted practice on the weakest skill', () => {
  const base = { available: ALL, skillOf, skills: SKILLS, skillNames: NAMES, minutes: 10, goal: 'mixed' as const };
  const fresh = planWorkout({ ...base, day: '2026-11-23', results: [] });
  assert.equal(fresh.length, 3);
  assert.ok(fresh.every((p) => p.kind === 'baseline'));
  const results = ALL.map((g, k) => round(g, g === 'grid' || g === 'nback' ? 1 : 8, 0.8, '2026-11-20', k));
  const plan = planWorkout({ ...base, day: '2026-11-23', results });
  assert.equal(plan[0].kind, 'targeted');
  assert.equal(skillOf(plan[0].game), 'memory');
  assert.equal(new Set(plan.map((p) => p.game)).size, plan.length);
  const goal = planWorkout({ ...base, day: '2026-11-23', results, goal: 'focus' });
  assert.equal(skillOf(goal[0].game), 'attention');
});

test('daily challenge is one level up and clears at 80%', () => {
  const c = dailyChallenge('2026-11-23', ALL, { [ALL[0]]: 3 } as any);
  assert.equal(c.level, (c.game === ALL[0] ? 3 : 1) + 1);
  assert.equal(challengeDone(c, '2026-11-23', [round(c.game, c.level, 0.8, '2026-11-23')]), true);
  assert.equal(challengeDone(c, '2026-11-23', [round(c.game, c.level - 1, 1, '2026-11-23')]), false);
});

test('weeks run Monday to Sunday and quests measure progress', () => {
  assert.deepEqual([weekOf('2026-11-23')[0], weekOf('2026-11-29')[6]], ['2026-11-23', '2026-11-29']);
  const q = weeklyQuest('2026-11-25', [], ['2026-11-23', '2026-11-24'], skillOf, SKILLS);
  assert.ok(q.target > 0 && q.progress >= 0);
});

test('streaks survive up to two rest days in a row', () => {
  const days = new Set(['2026-11-23', '2026-11-20', '2026-11-19', '2026-11-15']);
  assert.equal(forgivingStreak(days, '2026-11-23'), 3);
  assert.equal(forgivingStreak(days, '2026-11-25'), 3);
  assert.equal(forgivingStreak(days, '2026-11-26'), 0);
});

test('skill analytics compare recent rounds with your own baseline', () => {
  const skillOf = (g: string) => (g === 'speed' ? 'speed' : 'memory') as any;
  const rs = [1, 1, 1, 3, 4, 5].map((lv, k) => ({ game: 'speed', level: lv, accuracy: 0.8, score: 0, at: k, day: `2026-11-0${k + 1}`, rtMs: 900 - k * 50 })) as any;
  const [sp] = skillSummaries(rs, { speed: 5 }, skillOf, ['speed']);
  assert.ok(sp.vsBaseline! > 10);
  assert.equal(sp.direction, 'improving');
  assert.equal(sp.consistency, 'High');
  assert.ok(sp.rtNow! < sp.rtBaseline!);
  assert.ok(sp.skillScore > 0 && sp.skillScore <= 100);
});
