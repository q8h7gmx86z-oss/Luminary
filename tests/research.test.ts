import assert from 'node:assert/strict';
import { test } from 'node:test';

import { EVIDENCE, PAPERS, paperUrl, QUOTES } from '../src/content/research.ts';

const GAME_IDS = ['speed', 'grid', 'catch', 'nback', 'clash', 'switch', 'sequence', 'echo', 'hold', 'search', 'tower', 'words'];
const HABIT_IDS = ['move', 'connect', 'learn', 'eat', 'winddown'];

test('every game and linked habit has its research', () => {
  for (const id of [...GAME_IDS, ...HABIT_IDS, 'workout', 'breathing', 'focus-timer', 'when-then', 'break-down', 'reasoning', 'sleep', 'mood']) {
    assert.ok(EVIDENCE.find((e) => e.id === id), `missing evidence for ${id}`);
  }
});

test('every cited paper exists and links to a DOI or PubMed record', () => {
  for (const e of EVIDENCE) {
    assert.ok(e.papers.length > 0, `${e.id} cites no papers`);
    assert.ok(e.limits.length > 20, `${e.id} needs an honest limits note`);
    assert.ok(e.highlights.length >= 2, `${e.id} needs highlights`);
    for (const id of e.papers) assert.ok(PAPERS[id], `${e.id} cites unknown paper ${id}`);
    if (e.quote) assert.ok(QUOTES[e.quote], `${e.id} uses unknown quote ${e.quote}`);
  }
  for (const p of Object.values(PAPERS)) {
    assert.ok(p.doi || p.pmid, `${p.id} has no DOI or PMID`);
    assert.match(paperUrl(p), /^https:\/\/(doi\.org\/10\.|pubmed\.ncbi\.nlm\.nih\.gov\/\d+\/$)/);
  }
});

test('ids are unique', () => {
  const ids = EVIDENCE.map((e) => e.id);
  assert.equal(new Set(ids).size, ids.length);
});
