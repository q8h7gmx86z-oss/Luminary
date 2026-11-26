// Pure logic for the six games added in Phase 1: difficulty settings and puzzle generators.
// No imports, so plain Node can test it. Every round is generated fresh, so no two sessions repeat.

export type Rand = () => number;

const pick = <T,>(xs: readonly T[], rand: Rand): T => xs[Math.floor(rand() * xs.length)];

function shuffle<T>(xs: readonly T[], rand: Rand): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** A small seeded generator for tests and reproducible rounds. */
export function seeded(seed: number): Rand {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// --- Sequence Builder: letter-number sequencing -----------------------------------------

export function sequenceParams(level: number) {
  return {
    /** Items shown in each round. */
    length: Math.min(3 + Math.floor((level - 1) / 2), 10),
    showMs: Math.max(650, 1000 - level * 18),
    trials: 6,
  };
}

const SEQ_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'R', 'S', 'T'];
const SEQ_DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

/** A mixed run of unique letters and digits, with at least one of each when length allows. */
export function makeLetterNumber(length: number, rand: Rand = Math.random): string[] {
  const digits = shuffle(SEQ_DIGITS, rand);
  const letters = shuffle(SEQ_LETTERS, rand);
  const nDigits = length < 2 ? length : Math.max(1, Math.min(length - 1, Math.round(length / 2 + (rand() - 0.5))));
  return shuffle([...digits.slice(0, nDigits), ...letters.slice(0, length - nDigits)], rand);
}

/** The answer: numbers first, smallest to largest, then letters in alphabetical order. */
export function letterNumberAnswer(items: string[]): string[] {
  const d = items.filter((x) => /\d/.test(x)).sort((a, b) => Number(a) - Number(b));
  const l = items.filter((x) => !/\d/.test(x)).sort();
  return [...d, ...l];
}

// --- Echo: backward spatial span ---------------------------------------------------------

export function echoParams(level: number) {
  return {
    span: 2 + Math.ceil(level / 2),
    size: level >= 7 ? 4 : 3,
    flashMs: Math.max(400, 760 - level * 16),
    trials: 5,
  };
}

/** The order the player must tap: the shown sequence, backwards. */
export const echoAnswer = (seq: number[]) => [...seq].reverse();

// --- Hold It: stop-signal task ------------------------------------------------------------

export function holdParams(level: number) {
  return {
    trials: 40,
    /** Share of trials where the arrow turns red and you must stop. */
    stopRate: 0.25,
    /** First stop-signal delay. It then moves 50 ms per trial to hold you near 50% stops. */
    startSsdMs: Math.min(150 + level * 15, 400),
    deadlineMs: Math.max(800, 1300 - level * 25),
  };
}

export const SSD_STEP = 50;
export const SSD_MIN = 50;

/** Standard stop-signal staircase: a successful stop makes stopping harder next time. */
export function nextSsd(ssd: number, stopped: boolean, maxMs: number): number {
  return Math.max(SSD_MIN, Math.min(maxMs, ssd + (stopped ? SSD_STEP : -SSD_STEP)));
}

/**
 * Stop-signal reaction time by the mean method: median go time minus mean stop-signal delay.
 * Only meaningful when stops succeed roughly half the time, which the staircase aims for.
 */
export function ssrt(goRts: number[], ssds: number[]): number | undefined {
  if (goRts.length < 5 || ssds.length < 3) return undefined;
  const s = [...goRts].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  const med = s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  const meanSsd = ssds.reduce((a, b) => a + b, 0) / ssds.length;
  return Math.round(med - meanSsd);
}

// --- Double Take: visual search ----------------------------------------------------------

export type SearchShape = 'circle' | 'square' | 'triangle';
export type SearchItem = { shape: SearchShape; colour: 0 | 1 | 2; rotate: number };

export function searchParams(level: number) {
  return {
    /** Items on screen, including the odd one out. */
    setSize: Math.min(6 + level * 2, 36),
    /** From level 4 the target differs only in a combination of colour and shape. */
    conjunction: level >= 4,
    deadlineMs: Math.max(2500, 6000 - level * 150),
    trials: 14,
  };
}

/**
 * One search screen. Feature search: the target is the only item of its colour.
 * Conjunction search: every distractor shares either the target's colour or its shape.
 */
export function makeSearch(setSize: number, conjunction: boolean, rand: Rand = Math.random): { items: SearchItem[]; target: number } {
  const shapes: SearchShape[] = shuffle(['circle', 'square', 'triangle'] as SearchShape[], rand);
  const colours = shuffle([0, 1, 2] as const, rand);
  const target: SearchItem = { shape: shapes[0], colour: colours[0], rotate: 0 };
  const items: SearchItem[] = [];
  for (let i = 0; i < setSize - 1; i++) {
    if (conjunction) {
      items.push(rand() < 0.5 ? { shape: shapes[0], colour: colours[1], rotate: 0 } : { shape: shapes[1], colour: colours[0], rotate: 0 });
    } else {
      items.push({ shape: pick(shapes, rand), colour: colours[1], rotate: 0 });
    }
  }
  const at = Math.floor(rand() * setSize);
  items.splice(at, 0, target);
  return { items, target: at };
}

// --- Next Move: Tower of London planning ---------------------------------------------------

/** Three pegs holding up to 3, 2 and 1 balls. Each peg lists ball colours, bottom first. */
export type Tower = [number[], number[], number[]];
export const PEG_CAP = [3, 2, 1] as const;

export function towerParams(level: number) {
  return {
    /** Fewest moves the puzzle needs. */
    minMoves: Math.min(2 + Math.floor((level - 1) / 3), 7),
    puzzles: 5,
    /** Untimed by default: planning, not speed, is the skill. Bonus points for planning before the first move. */
    timeLimitMs: 90_000,
  };
}

export const towerKey = (t: Tower) => t.map((p) => p.join('')).join('|');

export function towerMoves(t: Tower): { from: number; to: number; next: Tower }[] {
  const out: { from: number; to: number; next: Tower }[] = [];
  for (let from = 0; from < 3; from++) {
    if (!t[from].length) continue;
    for (let to = 0; to < 3; to++) {
      if (to === from || t[to].length >= PEG_CAP[to]) continue;
      const next = t.map((p) => [...p]) as Tower;
      next[to].push(next[from].pop()!);
      out.push({ from, to, next });
    }
  }
  return out;
}

/** Fewest moves from one arrangement to another, by breadth-first search. */
export function towerDistance(a: Tower, b: Tower): number {
  const goal = towerKey(b);
  let frontier = [a];
  const seen = new Set([towerKey(a)]);
  for (let d = 0; frontier.length; d++) {
    const nextF: Tower[] = [];
    for (const t of frontier) {
      if (towerKey(t) === goal) return d;
      for (const m of towerMoves(t)) {
        const k = towerKey(m.next);
        if (!seen.has(k)) {
          seen.add(k);
          nextF.push(m.next);
        }
      }
    }
    frontier = nextF;
  }
  return Infinity;
}

/** Every legal arrangement of the three balls (36 in all). */
export function allTowers(): Tower[] {
  const out: Tower[] = [];
  const perms = [
    [0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0],
  ];
  for (const order of perms) {
    for (let a = 0; a <= 3; a++) {
      for (let b = 0; b <= 2 && a + b <= 3; b++) {
        const c = 3 - a - b;
        if (c > 1) continue;
        out.push([order.slice(0, a), order.slice(a, a + b), order.slice(a + b)]);
      }
    }
  }
  return out;
}

/** A start and goal exactly `minMoves` apart. */
export function makeTowerPuzzle(minMoves: number, rand: Rand = Math.random): { start: Tower; goal: Tower; minMoves: number } {
  const all = allTowers();
  for (let tries = 0; tries < 400; tries++) {
    const start = pick(all, rand);
    const goals = all.filter((g) => towerDistance(start, g) === minMoves);
    if (goals.length) return { start, goal: pick(goals, rand), minMoves };
  }
  // The largest distance in this tower is 8, so any request up to 7 is always met above.
  throw new Error(`No Tower of London puzzle at ${minMoves} moves`);
}

/** Credit for one puzzle: full in the fewest moves, part credit within two extra, none after. */
export function towerCredit(moves: number, minMoves: number, solved: boolean): number {
  if (!solved) return 0;
  const extra = moves - minMoves;
  return extra <= 0 ? 1 : extra <= 2 ? 0.5 : 0.25;
}

// --- Word Flow: category switching ------------------------------------------------------------

export type WordRule = { kind: 'category'; name: string; question: string } | { kind: 'letter'; letter: string; question: string };

export const CATEGORIES: Record<string, string[]> = {
  Animals: ['otter', 'falcon', 'badger', 'lynx', 'heron', 'beetle', 'salmon', 'camel', 'gecko', 'walrus', 'moth', 'hare', 'bison', 'raven', 'trout', 'panda'],
  Food: ['lentil', 'mango', 'bread', 'walnut', 'cheese', 'pepper', 'rice', 'plum', 'barley', 'olive', 'carrot', 'honey', 'bean', 'melon', 'pasta', 'radish'],
  Tools: ['hammer', 'chisel', 'wrench', 'saw', 'drill', 'ladder', 'trowel', 'pliers', 'spanner', 'axe', 'sander', 'rake', 'shovel', 'vice', 'clamp', 'mallet'],
  Music: ['violin', 'drum', 'harp', 'cello', 'flute', 'tuba', 'piano', 'banjo', 'oboe', 'lute', 'lyre', 'bugle', 'sitar', 'cymbal', 'tabla', 'viola'],
  Body: ['elbow', 'knee', 'wrist', 'spine', 'ankle', 'lung', 'heart', 'thumb', 'brow', 'liver', 'skull', 'palm', 'heel', 'jaw', 'nerve', 'rib'],
  Places: ['harbour', 'meadow', 'canyon', 'island', 'market', 'temple', 'valley', 'forest', 'castle', 'desert', 'bridge', 'museum', 'glacier', 'library', 'station', 'orchard'],
};
const LETTERS = ['B', 'C', 'H', 'L', 'M', 'P', 'R', 'S', 'T'];
const ALL_WORDS = Object.values(CATEGORIES).flat();

export function wordParams(level: number) {
  return {
    /** Share of trials where the question changes. */
    switchRate: Math.min(0.2 + level * 0.02, 0.5),
    /** From level 5, some questions ask about the first letter instead of the meaning. */
    letterRules: level >= 5,
    deadlineMs: Math.max(1500, 3800 - level * 110),
    trials: 30,
  };
}

export function makeRule(letterRules: boolean, rand: Rand = Math.random, not?: WordRule): WordRule {
  for (;;) {
    const r: WordRule =
      letterRules && rand() < 0.4
        ? ((l) => ({ kind: 'letter', letter: l, question: `Starts with ${l}?` }))(pick(LETTERS, rand))
        : ((name) => ({ kind: 'category', name, question: `${name}?` }))(pick(Object.keys(CATEGORIES), rand));
    if (!not || r.question !== not.question) return r;
  }
}

export function fitsRule(word: string, rule: WordRule): boolean {
  return rule.kind === 'category' ? CATEGORIES[rule.name].includes(word) : word[0].toUpperCase() === rule.letter;
}

/** A word that fits the rule about half the time, so guessing earns nothing. */
export function makeWord(rule: WordRule, rand: Rand = Math.random, not?: string): string {
  const fits = ALL_WORDS.filter((w) => fitsRule(w, rule) && w !== not);
  const misses = ALL_WORDS.filter((w) => !fitsRule(w, rule) && w !== not);
  const pool = fits.length && (rand() < 0.5 || !misses.length) ? fits : misses;
  return pick(pool, rand);
}
