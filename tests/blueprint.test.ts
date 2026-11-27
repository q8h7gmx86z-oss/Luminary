import { test } from 'node:test';
import assert from 'node:assert/strict';

import { GAME_STANDARD, reviewOverdue } from '../src/training/standard.ts';
import { todayInsight } from '../src/training/todayInsight.ts';

const name = (s: string) => ({ speed: 'Processing speed', memory: 'Working memory', attention: 'Attention control', flexibility: 'Flexibility' })[s]!;
const base = (skill: string, extra: object = {}) => ({ skill, rounds: 0, level: 1, trend: [], skillScore: 0, ...extra }) as never;

test('game standard has 13 unique items', () => {
  assert.equal(GAME_STANDARD.length, 13);
  assert.equal(new Set(GAME_STANDARD.map((s) => s.id)).size, 13);
});

test('dossier review is due after a year', () => {
  assert.equal(reviewOverdue({ reviewed: '2026-01-01' }, '2026-11-27'), false);
  assert.equal(reviewOverdue({ reviewed: '2025-11-01' }, '2026-11-27'), true);
});

test('insight before any training sets expectations', () => {
  const i = todayInsight(['speed', 'memory', 'attention', 'flexibility'].map((s) => base(s)), name as never);
  assert.match(i.text, /first workout/);
  assert.equal(i.skill, undefined);
});

test('insight names the largest gain against baseline', () => {
  const sums = [
    base('speed', { rounds: 8, vsBaseline: 3 }),
    base('memory', { rounds: 8, vsBaseline: 7 }),
    base('attention', { rounds: 8, vsBaseline: -1 }),
    base('flexibility', { rounds: 8, vsBaseline: 0 }),
  ];
  const i = todayInsight(sums, name as never);
  assert.equal(i.skill, 'memory');
  assert.match(i.text, /Working memory is up 7 points/);
});

test('insight points at an untrained skill when nothing has improved yet', () => {
  const sums = [base('speed', { rounds: 3 }), base('memory'), base('attention', { rounds: 2 }), base('flexibility', { rounds: 1 })];
  const i = todayInsight(sums, name as never);
  assert.equal(i.skill, 'memory');
  assert.match(i.text, /not trained working memory/);
});

test('insight counts rounds to a baseline', () => {
  const sums = ['speed', 'memory', 'attention', 'flexibility'].map((s, k) => base(s, { rounds: 2 + k }));
  const i = todayInsight(sums, name as never);
  assert.equal(i.skill, 'flexibility');
  assert.match(i.text, /^1 more round of flexibility/);
});
