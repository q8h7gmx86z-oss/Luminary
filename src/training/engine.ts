// Pure training logic: levels, scoring and the daily plan. No imports, so plain Node can test it.

export type GameId = 'speed' | 'grid' | 'catch' | 'nback' | 'clash' | 'switch';
export type Skill = 'speed' | 'memory' | 'attention' | 'flexibility';

export type GameResult = {
  game: GameId;
  level: number;
  /** Points for this round, comparable only within the same game. */
  score: number;
  /** 0 to 1. Drives difficulty changes. */
  accuracy: number;
  /** Mean correct response time in ms, when the game measures it. */
  rtMs?: number;
  at: number;
  day: string;
};

export const MIN_LEVEL = 1;
export const MAX_LEVEL = 20;

/**
 * Adaptive difficulty. Aim for roughly 75 to 85% accuracy, the zone where
 * practice is challenging but not discouraging.
 */
export function nextLevel(level: number, accuracy: number): number {
  let next = level;
  if (accuracy >= 0.85) next = level + 1;
  else if (accuracy < 0.6) next = level - 1;
  return Math.min(MAX_LEVEL, Math.max(MIN_LEVEL, next));
}

/** Points scale with level so progress shows even at steady accuracy. */
export function scoreFor(correct: number, level: number, speedBonus = 0): number {
  return Math.round(correct * (10 + level * 2) + speedBonus);
}

/** Days since 1970 for a YYYY-MM-DD key, used to rotate games across days. */
export function dayIndex(day: string): number {
  const [y, m, d] = day.split('-').map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / 86_400_000);
}

/**
 * Three games a day. Processing speed is included every day because it has the
 * strongest long-term evidence; the other two rotate so every skill gets time.
 */
export function dailyGames(day: string, available: GameId[]): GameId[] {
  const others = available.filter((g) => g !== 'speed');
  const i = dayIndex(day);
  const picks: GameId[] = [];
  if (available.includes('speed')) picks.push('speed');
  for (let k = 0; picks.length < 3 && k < others.length; k++) {
    picks.push(others[(i * 2 + k) % others.length]);
  }
  return picks;
}

// --- Per-game difficulty settings -------------------------------------------------

/** Speed Match: response deadline in ms and how many symbols are in play. */
export function speedParams(level: number) {
  return {
    deadlineMs: Math.max(650, 2200 - level * 80),
    symbolCount: Math.min(4 + Math.floor(level / 3), 10),
    durationMs: 45_000,
  };
}

/** Memory Grid: sequence length, grid size and how fast tiles flash. */
export function gridParams(level: number) {
  return {
    span: 2 + Math.ceil(level / 2),
    size: level >= 8 ? 4 : 3,
    flashMs: Math.max(380, 720 - level * 15),
    trials: 5,
  };
}

/** Catch the Light: how long each light shows, share of no-go lights, trial count. */
export function catchParams(level: number) {
  return {
    showMs: Math.max(420, 1150 - level * 36),
    gapMs: Math.max(250, 600 - level * 12),
    noGoRate: Math.min(0.2 + level * 0.008, 0.35),
    trials: 36,
    /** From level 8 the no-go light looks more like the go light. */
    lookalike: level >= 8,
  };
}

/** Accuracy for go/no-go: hits plus correct holds over all trials. */
export function goNoGoAccuracy(hits: number, correctRejections: number, trials: number): number {
  return trials === 0 ? 0 : (hits + correctRejections) / trials;
}

export function mean(xs: number[]): number | undefined {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : undefined;
}

/** Star Tracker (spatial n-back): how far back to compare, timing and trial count. */
export function nbackParams(level: number) {
  const n = level <= 4 ? 1 : level <= 10 ? 2 : 3;
  return {
    n,
    showMs: 600,
    isiMs: Math.max(1600, 2600 - level * 50),
    trials: 20 + n * 2,
    targetRate: 0.3,
  };
}

/** Colour Clash (Stroop): share of clashing words, answer deadline, trial count. */
export function clashParams(level: number) {
  return {
    clashRate: Math.min(0.3 + level * 0.03, 0.75),
    deadlineMs: Math.max(1200, 3000 - level * 90),
    trials: 30,
    /** From level 6 there is a fifth colour, so the choice is harder. */
    colours: level >= 6 ? 5 : 4,
  };
}

/** Switch It (task switching): how often the rule changes, deadline, trial count. */
export function switchParams(level: number) {
  return {
    switchRate: Math.min(0.25 + level * 0.02, 0.5),
    deadlineMs: Math.max(1300, 3600 - level * 100),
    trials: 32,
  };
}

/** Balanced accuracy for detection tasks: hit rate and correct-rejection rate weighted equally. */
export function balancedAccuracy(hits: number, targets: number, correctRejections: number, nonTargets: number): number {
  const h = targets ? hits / targets : 1;
  const c = nonTargets ? correctRejections / nonTargets : 1;
  return (h + c) / 2;
}

/** Spatial n-back sequence of grid positions with roughly the given share of targets. */
export function nbackSequence(length: number, n: number, positions: number, targetRate: number, rand: () => number = Math.random): number[] {
  const seq: number[] = [];
  for (let i = 0; i < length; i++) {
    if (i >= n && rand() < targetRate) seq.push(seq[i - n]);
    else {
      let p = Math.floor(rand() * positions);
      if (i >= n) while (p === seq[i - n]) p = Math.floor(rand() * positions);
      seq.push(p);
    }
  }
  return seq;
}
