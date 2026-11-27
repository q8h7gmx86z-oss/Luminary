import assert from 'node:assert/strict';
import { test } from 'node:test';

import { introLine, researchLine, resultLine, summaryLine, todayBrief } from '../src/aura/script.ts';

const base = { firstVisit: false, workedOut: false, daysAway: 1, tasks: 3, minutes: 10, thisWeek: 1, weeklyTarget: 3 };
const band = { down: 60, up: 85 };

// The voice rules: professional, never chummy, no exclamation marks.
const allLines = () => [
  todayBrief({ ...base, firstVisit: true }),
  todayBrief({ ...base, workedOut: true }),
  todayBrief({ ...base, workedOut: true, thisWeek: 3 }),
  todayBrief({ ...base, daysAway: 9 }),
  todayBrief({ ...base, targeted: { skill: 'Working memory', stalled: false, goal: false } }),
  todayBrief({ ...base, targeted: { skill: 'Working memory', stalled: true, goal: false } }),
  todayBrief({ ...base, targeted: { skill: 'Flexibility', stalled: false, goal: true } }),
  todayBrief(base),
  introLine({ game: 'Speed Match', level: 4, firstTime: true, challenge: false, untimed: false, band }),
  introLine({ game: 'Speed Match', level: 4, firstTime: false, challenge: true, untimed: false, band }),
  introLine({ game: 'Speed Match', level: 4, firstTime: false, challenge: false, untimed: true, band }),
  resultLine({ accuracy: 0.9, level: 3, newLevel: 4, personalBest: true }),
  resultLine({ accuracy: 0.5, level: 3, newLevel: 2, personalBest: false }),
  resultLine({ accuracy: 0.7, level: 3, newLevel: 3, personalBest: false }),
  resultLine({ accuracy: 0.85, level: 5, newLevel: 5, personalBest: false, cleared: true }),
  summaryLine({ firstTime: false, diff: 12, focus: false, results: [{ game: 'Memory Grid', accuracy: 0.8, levelledUp: true }] }),
  researchLine('mixed', 3),
];

test('Aura never uses exclamation marks or filler', () => {
  for (const l of allLines()) {
    assert.ok(!l.text.includes('!'), l.text);
    assert.ok(!/great job|awesome|amazing|well done|you've got this/i.test(l.text), l.text);
    assert.ok(l.text.length > 20 && l.text.length < 320, l.text);
  }
});

test('Today: introduces Aura on a first visit, then targets the weakest skill', () => {
  assert.match(todayBrief({ ...base, firstVisit: true }).text, /^I'm Aura\./);
  const t = todayBrief({ ...base, targeted: { skill: 'Working memory', stalled: false, goal: false } });
  assert.match(t.text, /working memory/);
  assert.match(t.text, /3 tasks, 10 minutes/);
  assert.match(todayBrief({ ...base, targeted: { skill: 'Speed', stalled: true, goal: false } }).text, /levelled off/);
  assert.match(todayBrief({ ...base, daysAway: 6 }).text, /^Welcome back/);
  assert.equal(todayBrief({ ...base, workedOut: true }).state, 'idle');
});

test('Intro states the accuracy band the engine aims for', () => {
  assert.match(introLine({ game: 'X', level: 4, firstTime: false, challenge: false, untimed: false, band }).text, /60 to 85%/);
  assert.match(introLine({ game: 'X', level: 4, firstTime: false, challenge: true, untimed: false, band }).text, /80%/);
});

test('Result: success only for real wins', () => {
  assert.equal(resultLine({ accuracy: 0.9, level: 3, newLevel: 4, personalBest: false }).state, 'success');
  assert.equal(resultLine({ accuracy: 0.7, level: 3, newLevel: 3, personalBest: true }).state, 'success');
  assert.equal(resultLine({ accuracy: 0.85, level: 3, newLevel: 3, personalBest: false, cleared: true }).state, 'success');
  assert.equal(resultLine({ accuracy: 0.7, level: 3, newLevel: 3, personalBest: false }).state, 'idle');
  assert.equal(resultLine({ accuracy: 0.5, level: 3, newLevel: 2, personalBest: false }).state, 'idle');
  assert.match(resultLine({ accuracy: 0.5, level: 3, newLevel: 2, personalBest: false }).text, /Level 2 next/);
  const drop = resultLine({ accuracy: 0.5, level: 4, newLevel: 3, personalBest: true });
  assert.equal(drop.state, 'idle');
  assert.match(drop.text, /Level 3 next.*personal record/);
  assert.equal(resultLine({ accuracy: 0.6, level: 3, newLevel: 3, personalBest: false, cleared: false }).state, 'idle');
});

test('Summary names level-ups, score change and spacing', () => {
  const s = summaryLine({
    firstTime: false,
    diff: -4,
    focus: false,
    results: [
      { game: 'Memory Grid', accuracy: 0.8, levelledUp: false },
      { game: 'Speed Match', accuracy: 0.9, levelledUp: false },
    ],
  });
  assert.match(s.text, /Strongest result: Speed Match, at 90%/);
  assert.match(s.text, /dipped by 4/);
  assert.equal(s.state, 'idle');
  assert.match(summaryLine({ firstTime: true, diff: 0, focus: false, results: [] }).text, /^Baseline set/);
});

test('Research line explains every verdict', () => {
  for (const v of ['strong', 'moderate', 'mixed', 'early', 'measure']) {
    assert.match(researchLine(v, 2).text, /^How to read this: [A-Z]/);
  }
  assert.match(researchLine('strong', 1).text, /The paper is linked below/);
  assert.match(researchLine('strong', 3).text, /All 3 papers/);
});
