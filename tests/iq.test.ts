import assert from 'node:assert/strict';
import { test } from 'node:test';

import { ATTRS, buildTest, makeMatrix, makeSeries, scoreTest, seeded } from '../src/iq/items.ts';

test('matrix items have one right answer among six distinct options', () => {
  const rand = seeded(7);
  for (let i = 0; i < 300; i++) {
    const m = makeMatrix(rand, 1 + (i % 4));
    assert.equal(m.options.length, 6);
    const keys = new Set(m.options.map((o) => ATTRS.map((k) => o[k]).join()));
    assert.equal(keys.size, 6);
    assert.deepEqual(m.options[m.answer], m.cells[8]);
  }
});

test('series items show five terms and include the right answer once', () => {
  const rand = seeded(11);
  for (let i = 0; i < 300; i++) {
    const s = makeSeries(rand, 1 + (i % 4));
    assert.equal(s.terms.length, 5);
    assert.equal(s.options.length, 5);
    assert.equal(new Set(s.options).size, 5);
    assert.ok(s.answer >= 0);
  }
});

test('reasoning score is the weighted share of points out of 100', () => {
  const test1 = buildTest(42);
  const all = test1.map((s) => s.items.map((it) => it.answer));
  const none = test1.map((s) => s.items.map(() => null));
  assert.equal(scoreTest(test1, all).score, 100);
  assert.equal(scoreTest(test1, none).score, 0);
  assert.equal(test1.reduce((a, s) => a + s.items.length, 0), 20);
});
