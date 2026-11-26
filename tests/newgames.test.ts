import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  allTowers,
  CATEGORIES,
  echoAnswer,
  echoParams,
  fitsRule,
  holdParams,
  letterNumberAnswer,
  makeLetterNumber,
  makeRule,
  makeSearch,
  makeTowerPuzzle,
  makeWord,
  nextSsd,
  PEG_CAP,
  searchParams,
  seeded,
  sequenceParams,
  ssrt,
  towerCredit,
  towerDistance,
  towerMoves,
  towerParams,
  wordParams,
} from '../src/training/newgames.ts';

test('letter-number sequencing: numbers ascending, then letters A to Z', () => {
  assert.deepEqual(letterNumberAnswer(['K', '7', 'B', '2']), ['2', '7', 'B', 'K']);
  const r = seeded(3);
  for (let len = 2; len <= 10; len++) {
    const items = makeLetterNumber(len, r);
    assert.equal(items.length, len);
    assert.equal(new Set(items).size, len, 'no repeats');
    assert.ok(items.some((x) => /\d/.test(x)) && items.some((x) => /[A-Z]/.test(x)), 'mixes letters and numbers');
  }
});

test('echo is the sequence backwards, and both span games grow with level', () => {
  assert.deepEqual(echoAnswer([1, 5, 3]), [3, 5, 1]);
  assert.ok(echoParams(10).span > echoParams(1).span);
  assert.ok(sequenceParams(10).length > sequenceParams(1).length);
});

test('stop-signal staircase moves 50 ms and stays in range; SSRT is median go minus mean delay', () => {
  assert.equal(nextSsd(200, true, 600), 250);
  assert.equal(nextSsd(200, false, 600), 150);
  assert.equal(nextSsd(50, false, 600), 50);
  assert.equal(nextSsd(600, true, 600), 600);
  assert.equal(ssrt([400, 420, 450, 500, 480], [200, 250, 300]), 450 - 250);
  assert.equal(ssrt([400], [200]), undefined);
  assert.ok(holdParams(20).deadlineMs >= 800);
});

test('visual search: exactly one target, and conjunction distractors share one feature with it', () => {
  const r = seeded(11);
  for (const conj of [false, true]) {
    const { items, target } = makeSearch(searchParams(8).setSize, conj, r);
    const t = items[target];
    const same = items.filter((x) => x.shape === t.shape && x.colour === t.colour);
    assert.equal(same.length, 1, 'only one item looks like the target');
    if (conj) for (const x of items) assert.ok(x.shape === t.shape || x.colour === t.colour);
    else assert.equal(items.filter((x) => x.colour === t.colour).length, 1, 'feature target is the only one of its colour');
  }
});

test('tower of London: 36 legal states, moves respect peg sizes, puzzles have the asked distance', () => {
  const all = allTowers();
  assert.equal(all.length, 36);
  for (const s of all) for (const m of towerMoves(s)) m.next.forEach((p, i) => assert.ok(p.length <= PEG_CAP[i]));
  const r = seeded(5);
  for (let d = 2; d <= 7; d++) {
    const p = makeTowerPuzzle(d, r);
    assert.equal(towerDistance(p.start, p.goal), d);
  }
  assert.ok(towerParams(20).minMoves <= 7);
  assert.equal(towerCredit(4, 4, true), 1);
  assert.equal(towerCredit(6, 4, true), 0.5);
  assert.equal(towerCredit(9, 4, true), 0.25);
  assert.equal(towerCredit(4, 4, false), 0);
});

test('word flow: no word sits in two categories, words fit about half the time, rules switch', () => {
  const seen = new Map<string, string>();
  for (const [cat, words] of Object.entries(CATEGORIES)) for (const w of words) {
    assert.ok(!seen.has(w), `${w} is in ${seen.get(w)} and ${cat}`);
    seen.set(w, cat);
  }
  const r = seeded(9);
  let fits = 0;
  const N = 400;
  for (let i = 0; i < N; i++) {
    const rule = makeRule(true, r);
    if (fitsRule(makeWord(rule, r), rule)) fits++;
  }
  assert.ok(fits > N * 0.35 && fits < N * 0.65, `fit rate ${fits / N}`);
  const a = makeRule(true, r);
  assert.notEqual(makeRule(true, r, a).question, a.question);
  assert.ok(wordParams(10).deadlineMs < wordParams(1).deadlineMs);
});
