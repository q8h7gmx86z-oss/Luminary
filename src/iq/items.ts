// Item generators and scoring for the reasoning test. Pure, so it can be tested in Node.
// Every attempt draws fresh items from a seeded generator, which limits the boost from
// simply remembering answers.

export type Rand = () => number;

export function seeded(seed: number): Rand {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pick = <T,>(rand: Rand, xs: readonly T[]): T => xs[Math.floor(rand() * xs.length)];
export function shuffle<T>(rand: Rand, xs: readonly T[]): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---- Pattern matrices --------------------------------------------------------------------

export type Cell = { shape: number; count: number; fill: number; tone: number };
export const ATTRS = ['shape', 'count', 'fill', 'tone'] as const;
type Attr = (typeof ATTRS)[number];
/** Three possible values for each attribute. Shape picks 3 of 4 shapes per item. */
const VALUES = 3;

export type MatrixItem = {
  kind: 'matrix';
  difficulty: number;
  /** Nine cells, row by row; the last one is the missing answer. */
  cells: Cell[];
  shapes: number[];
  options: Cell[];
  answer: number;
};

type Rule = (r: number, c: number) => number;

function ruleFor(rand: Rand): Rule {
  const perm = shuffle(rand, [0, 1, 2]);
  const kind = pick(rand, ['column', 'row', 'latin1', 'latin2'] as const);
  if (kind === 'column') return (_r, c) => perm[c];
  if (kind === 'row') return (r) => perm[r];
  if (kind === 'latin1') return (r, c) => perm[(r + c) % 3];
  return (r, c) => perm[(2 * r + c) % 3];
}

const same = (a: Cell, b: Cell) => ATTRS.every((k) => a[k] === b[k]);

/**
 * A 3x3 matrix where `difficulty` attributes (1 to 4) follow a rule across rows and columns;
 * the rest stay fixed. Wrong options each break one rule, so guessing by elimination is hard.
 */
export function makeMatrix(rand: Rand, difficulty: number): MatrixItem {
  const varying = shuffle(rand, ATTRS).slice(0, Math.max(1, Math.min(4, difficulty)));
  const rules: Partial<Record<Attr, Rule>> = {};
  const fixed: Partial<Record<Attr, number>> = {};
  for (const a of ATTRS) {
    if (varying.includes(a)) rules[a] = ruleFor(rand);
    else fixed[a] = Math.floor(rand() * VALUES);
  }
  const cells: Cell[] = [];
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 3; c++) {
      const cell = {} as Cell;
      for (const a of ATTRS) cell[a] = rules[a] ? rules[a]!(r, c) : fixed[a]!;
      cells.push(cell);
    }
  const correct = cells[8];
  const options: Cell[] = [correct];
  // Distractors: change one attribute, favouring the ones that carry a rule.
  const order = [...varying, ...ATTRS.filter((a) => !varying.includes(a))];
  for (let tries = 0; options.length < 6 && tries < 200; tries++) {
    const d = { ...correct };
    const a = tries < 40 ? order[tries % order.length] : pick(rand, ATTRS);
    d[a] = (d[a] + 1 + Math.floor(rand() * 2)) % VALUES;
    if (tries >= 60) {
      const b = pick(rand, ATTRS);
      d[b] = (d[b] + 1) % VALUES;
    }
    if (!options.some((o) => same(o, d))) options.push(d);
  }
  const shuffled = shuffle(rand, options);
  return {
    kind: 'matrix',
    difficulty,
    cells,
    shapes: shuffle(rand, [0, 1, 2, 3]).slice(0, 3),
    options: shuffled,
    answer: shuffled.findIndex((o) => same(o, correct)),
  };
}

// ---- Number series -----------------------------------------------------------------------

export type SeriesItem = { kind: 'series'; difficulty: number; terms: number[]; options: number[]; answer: number };

function seriesTerms(rand: Rand, difficulty: number): number[] {
  const n = 6;
  const int = (lo: number, hi: number) => lo + Math.floor(rand() * (hi - lo + 1));
  const out: number[] = [];
  if (difficulty <= 1) {
    const a = int(2, 20);
    const d = pick(rand, [3, 4, 5, 6, 7, 9, 11, -3, -4]);
    for (let i = 0; i < n; i++) out.push(a + d * i + (d < 0 ? 40 : 0));
  } else if (difficulty === 2) {
    if (rand() < 0.5) {
      const a = int(1, 4);
      const k = pick(rand, [2, 3]);
      for (let i = 0; i < n; i++) out.push(a * k ** i);
    } else {
      const a = int(10, 30);
      const up = int(4, 9);
      const down = int(1, 3);
      let v = a;
      for (let i = 0; i < n; i++) {
        out.push(v);
        v += i % 2 === 0 ? up : -down;
      }
    }
  } else if (difficulty === 3) {
    if (rand() < 0.5) {
      // Differences grow by one each step.
      let v = int(1, 10);
      let d = int(1, 4);
      for (let i = 0; i < n; i++) {
        out.push(v);
        v += d;
        d += 1;
      }
    } else {
      const k = int(0, 5);
      const s = int(1, 3);
      for (let i = 0; i < n; i++) out.push((i + s) ** 2 + k);
    }
  } else {
    if (rand() < 0.5) {
      // Each term is the sum of the two before it.
      const a = int(1, 5);
      const b = int(a + 1, a + 6);
      out.push(a, b);
      while (out.length < n) out.push(out[out.length - 1] + out[out.length - 2]);
    } else {
      // Two series woven together.
      const a = int(1, 9);
      const da = int(2, 5);
      const b = int(20, 40);
      const db = -int(2, 4);
      for (let i = 0; i < n; i++) out.push(i % 2 === 0 ? a + da * (i / 2) : b + db * ((i - 1) / 2));
    }
  }
  return out;
}

export function makeSeries(rand: Rand, difficulty: number): SeriesItem {
  const all = seriesTerms(rand, difficulty);
  const correct = all[5];
  const shown = all.slice(0, 5);
  const lastStep = all[4] - all[3];
  const candidates = [correct + 1, correct - 1, correct + 2, all[4] + lastStep, correct + lastStep, correct - lastStep, correct * 2, correct + 10];
  const options = [correct];
  for (const c of shuffle(rand, candidates)) {
    if (options.length >= 5) break;
    if (c !== correct && !options.includes(c)) options.push(c);
  }
  const shuffled = shuffle(rand, options);
  return { kind: 'series', difficulty, terms: shown, options: shuffled, answer: shuffled.indexOf(correct) };
}

// ---- Words -------------------------------------------------------------------------------

export type WordItem = { kind: 'word'; difficulty: number; prompt: string; options: string[]; answer: number };

/** Hand-written bank. The first option is always the right one; options are shuffled per attempt. */
const WORD_BANK: { d: number; prompt: string; options: string[] }[] = [
  { d: 1, prompt: 'Finger is to hand as toe is to…', options: ['foot', 'leg', 'shoe', 'nail'] },
  { d: 1, prompt: 'Which one does not belong?', options: ['carrot', 'apple', 'pear', 'grape', 'plum'] },
  { d: 1, prompt: 'Hot is to cold as tall is to…', options: ['short', 'big', 'wide', 'high'] },
  { d: 1, prompt: 'Pen is to write as knife is to…', options: ['cut', 'fork', 'sharp', 'kitchen'] },
  { d: 2, prompt: 'Book is to chapter as play is to…', options: ['act', 'actor', 'stage', 'audience'] },
  { d: 2, prompt: 'Which one does not belong?', options: ['flute', 'violin', 'cello', 'viola', 'double bass'] },
  { d: 2, prompt: 'Seed is to tree as egg is to…', options: ['bird', 'nest', 'shell', 'yolk'] },
  { d: 2, prompt: 'Which one does not belong?', options: ['cube', 'square', 'triangle', 'circle', 'hexagon'] },
  { d: 2, prompt: 'Mile is to distance as hour is to…', options: ['time', 'clock', 'minute', 'day'] },
  { d: 2, prompt: 'Which one does not belong?', options: ['Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter'] },
  { d: 3, prompt: 'Which one does not belong?', options: ['verbose', 'brief', 'concise', 'succinct', 'terse'] },
  { d: 3, prompt: 'Ample is to scarce as benevolent is to…', options: ['malevolent', 'kind', 'generous', 'wealthy'] },
  { d: 3, prompt: 'Which word means the same as "candid"?', options: ['frank', 'sweet', 'secretive', 'shy'] },
  { d: 3, prompt: 'Which one does not belong?', options: ['novel', 'sonnet', 'haiku', 'limerick', 'ode'] },
  { d: 3, prompt: 'Which word means the opposite of "frugal"?', options: ['extravagant', 'thrifty', 'careful', 'modest'] },
  { d: 3, prompt: 'Architect is to building as composer is to…', options: ['symphony', 'orchestra', 'piano', 'conductor'] },
];

export function makeWords(rand: Rand, count: number): WordItem[] {
  const per = Math.ceil(count / 3);
  const items: WordItem[] = [];
  for (const d of [1, 2, 3]) {
    for (const w of shuffle(rand, WORD_BANK.filter((x) => x.d === d)).slice(0, per)) {
      const options = shuffle(rand, w.options);
      items.push({ kind: 'word', difficulty: d, prompt: w.prompt, options, answer: options.indexOf(w.options[0]) });
    }
  }
  return items.slice(0, count);
}

// ---- The test ----------------------------------------------------------------------------

export type Item = MatrixItem | SeriesItem | WordItem;
export type Section = { id: 'patterns' | 'numbers' | 'words'; name: string; seconds: number; items: Item[] };

export function buildTest(seed: number): Section[] {
  const rand = seeded(seed);
  return [
    { id: 'patterns', name: 'Patterns', seconds: 360, items: [1, 1, 2, 2, 3, 3, 4, 4].map((d) => makeMatrix(rand, d)) },
    { id: 'numbers', name: 'Numbers', seconds: 240, items: [1, 2, 2, 3, 3, 4].map((d) => makeSeries(rand, d)) },
    { id: 'words', name: 'Words', seconds: 180, items: makeWords(rand, 6) },
  ];
}

/** Harder items are worth more. Words top out at 3, so they are scaled to match. */
export function itemWeight(item: Item): number {
  return item.kind === 'word' ? item.difficulty * (4 / 3) : item.difficulty;
}

export type TestScore = { score: number; percent: number; sections: Record<Section['id'], { right: number; total: number }> };

/**
 * Experimental reasoning score: the share of weighted points earned, from 0 to 100.
 * Harder questions are worth more. It is not an IQ score: it has not been validated
 * against established tests or compared with a large group of people.
 */
export function scoreTest(sections: Section[], answers: (number | null)[][]): TestScore {
  let earned = 0;
  let max = 0;
  const per = {} as TestScore['sections'];
  sections.forEach((s, si) => {
    let right = 0;
    s.items.forEach((item, ii) => {
      const w = itemWeight(item);
      max += w;
      if (answers[si]?.[ii] === item.answer) {
        earned += w;
        right += 1;
      }
    });
    per[s.id] = { right, total: s.items.length };
  });
  const percent = max ? earned / max : 0;
  return { score: Math.round(percent * 100), percent, sections: per };
}

/** Score from a saved attempt, including attempts saved before the score was renamed. */
export function savedScore(t: { percent: number; score?: number }): number {
  return t.score ?? Math.round(t.percent * 100);
}
