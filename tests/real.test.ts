import assert from 'node:assert/strict';
import { test } from 'node:test';

import { COURSES, lessonById } from '../src/content/courses.ts';
import { makePalace, PALACE_SIZE, PALACE_WORDS, scorePalace } from '../src/real/palace.ts';
import { PROGRAMMES, programmeById, weekOf, weekProgress, weeksMet } from '../src/real/programmes.ts';
import { addDays, dueCards, learned, newCard, review, TOP_BOX } from '../src/real/recall.ts';

test('recall cards widen their gaps when right and restart when missed', () => {
  let c = newCard('1', ' Capital of Peru ', ' Lima ', '2026-12-30', 1);
  assert.equal(c.q, 'Capital of Peru');
  assert.equal(c.due, '2026-12-31');
  c = review(c, true, '2026-12-31');
  assert.deepEqual([c.box, c.due], [1, '2027-01-02']);
  c = review(c, true, '2027-01-02');
  assert.deepEqual([c.box, c.due], [2, '2027-01-06']);
  c = review(c, false, '2027-01-06');
  assert.deepEqual([c.box, c.due], [0, '2027-01-07']);
  for (let i = 0; i < 10; i++) c = review(c, true, '2027-02-01');
  assert.equal(c.box, TOP_BOX);
  assert.equal(learned([c]), 1);
  assert.equal(addDays('2027-03-27', 2), '2027-03-29');
});

test('only due cards are shown, oldest due first', () => {
  const a = { ...newCard('a', 'q', 'a', '2026-12-01', 2), due: '2026-12-03' };
  const b = { ...newCard('b', 'q', 'a', '2026-12-01', 1), due: '2026-12-02' };
  const later = { ...newCard('c', 'q', 'a', '2026-12-01', 3), due: '2026-12-09' };
  assert.deepEqual(dueCards([a, later, b], '2026-12-05').map((c) => c.id), ['b', 'a']);
});

test('palace: ten distinct words, a board of twenty, scored by position', () => {
  assert.equal(new Set(PALACE_WORDS).size, PALACE_WORDS.length);
  const { list, board } = makePalace();
  assert.equal(list.length, PALACE_SIZE);
  assert.equal(new Set(board).size, PALACE_SIZE * 2);
  for (const w of list) assert.ok(board.includes(w));
  const swapped = [...list];
  [swapped[0], swapped[1]] = [swapped[1], swapped[0]];
  assert.equal(scorePalace(list, swapped), PALACE_SIZE - 2);
});

test('courses have four lessons each and every target lesson exists', () => {
  for (const c of COURSES) {
    assert.equal(c.lessons.length, 4);
    for (const l of c.lessons) assert.equal(lessonById(l.id)?.course.id, c.id);
  }
  for (const p of PROGRAMMES) {
    assert.equal(p.weeks.length, 4);
    for (const w of p.weeks) for (const t of w) if (t.kind === 'lessons') assert.ok(COURSES.find((c) => c.id === t.course)!.lessons.length >= t.n);
  }
});

test('programme progress counts each week on its own', () => {
  const p = programmeById('whole')!;
  const start = '2026-12-01';
  assert.equal(weekOf(start, '2026-12-07'), 0);
  assert.equal(weekOf(start, '2026-12-08'), 1);
  const a = {
    workouts: ['2026-12-01', '2026-12-03', '2026-12-05', '2026-12-09'],
    movement: { '2026-12-02': 100, '2026-12-06': 60, '2026-12-08': 30 },
    sleeps: { '2026-12-01': {}, '2026-12-02': {}, '2026-12-03': {}, '2026-12-04': {} },
  };
  const w0 = weekProgress(p, start, 0, a);
  assert.deepEqual(w0.map((t) => [t.kind, t.done, t.met]), [['workouts', 3, true], ['movement', 160, true], ['sleep', 4, true]]);
  const w1 = weekProgress(p, start, 1, a);
  assert.deepEqual(w1.map((t) => t.done), [1, 30, 0]);
  assert.deepEqual(weeksMet(p, start, '2026-12-15', a), { met: 1, finished: 2 });
});

test('lessons and the Benchmark count from the start of the programme', () => {
  const m = programmeById('memory')!;
  const a = { workouts: [], sleeps: {}, lessons: { 'palace-1': 1, 'palace-2': 2, 'retrieval-1': 3 }, reviews: { '2026-12-09': 4 } };
  assert.deepEqual(weekProgress(m, '2026-12-01', 1, a).map((t) => t.done), [0, 2, 1]);
  const s = programmeById('speed')!;
  const startMs = Date.parse('2026-12-01T00:00:00');
  assert.equal(weekProgress(s, '2026-12-01', 3, { workouts: [], sleeps: {}, benchmarks: [startMs - 1000, startMs + 1000] }).at(-1)!.done, 1);
});
