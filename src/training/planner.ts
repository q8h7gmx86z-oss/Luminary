// Personalised workout planner, challenges, quests and streaks. Pure, so it can be tested in Node.
import { dailyGames, dayIndex } from './engine.ts';
import type { GameId, GameResult, Skill } from './engine.ts';
import { roundPerformance, sharpnessOf } from './sharpness.ts';

export type Goal = 'mixed' | 'focus' | 'memory' | 'flexibility' | 'speed' | 'reasoning';
export type SlotKind = 'targeted' | 'varied' | 'familiar' | 'baseline';
export type PlanPick = { game: GameId; kind: SlotKind; reason: string };

export const GOAL_NAMES: Record<Goal, string> = {
  mixed: 'Mixed workout',
  focus: 'Focus and attention',
  memory: 'Memory',
  flexibility: 'Mental flexibility',
  speed: 'Processing speed',
  reasoning: 'Reasoning',
};

/** Games per session for each length, plus the breathing warm-up. */
export function gamesForMinutes(minutes: number): number {
  if (minutes <= 3) return 1;
  if (minutes <= 5) return 2;
  if (minutes <= 10) return 3;
  return 4;
}

function seededRand(seed: number) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Slot types for a session. The mix is a product-design starting point, not a scientific
 * prescription: about 60% targeted practice, 25% variety and 15% familiar confidence-builders.
 * The first slot is always targeted.
 */
export function slotKinds(n: number, rand: () => number): SlotKind[] {
  const kinds: SlotKind[] = [];
  for (let i = 0; i < n; i++) {
    if (i === 0) {
      kinds.push('targeted');
      continue;
    }
    const r = rand();
    kinds.push(r < 0.6 ? 'targeted' : r < 0.85 ? 'varied' : 'familiar');
  }
  return kinds;
}

type Inputs = {
  day: string;
  results: GameResult[];
  available: GameId[];
  skillOf: (g: GameId) => Skill;
  skills: Skill[];
  skillNames: Record<Skill, string>;
  minutes: number;
  goal: Goal;
};

/** Skill to target today: the goal's skill, or the weakest skill, nudged towards ones that have stalled. */
export function targetSkill(i: Inputs, played: GameResult[]): Skill {
  if (i.goal === 'focus') return 'attention';
  if (i.goal === 'memory') return 'memory';
  if (i.goal === 'flexibility') return 'flexibility';
  if (i.goal === 'speed') return 'speed';
  if (i.goal === 'reasoning') return dayIndex(i.day) % 2 === 0 ? 'memory' : 'flexibility';
  const sharp = sharpnessOf(played, i.skillOf, i.skills);
  const ranked = [...i.skills].sort((a, b) => sharp.bySkill[a] - (isStalled(played, i.skillOf, a) ? 0.03 : 0) - (sharp.bySkill[b] - (isStalled(played, i.skillOf, b) ? 0.03 : 0)));
  return ranked[0];
}

/** True when the last three rounds of a skill are no better than the three before. */
export function isStalled(results: GameResult[], skillOf: (g: GameId) => Skill, skill: Skill): boolean {
  const rs = results.filter((r) => skillOf(r.game) === skill);
  if (rs.length < 6) return false;
  const avg = (xs: GameResult[]) => xs.reduce((a, r) => a + roundPerformance(r), 0) / xs.length;
  return avg(rs.slice(-3)) - avg(rs.slice(-6, -3)) < 0.01;
}

function gamePerf(results: GameResult[], g: GameId): number | undefined {
  const rs = results.filter((r) => r.game === g).slice(-3);
  return rs.length ? rs.reduce((a, r) => a + roundPerformance(r), 0) / rs.length : undefined;
}

function lastPlayed(results: GameResult[], g: GameId): number {
  for (let k = results.length - 1; k >= 0; k--) if (results[k].game === g) return results[k].at;
  return 0;
}

/**
 * Today's personalised workout. New players get a baseline round of untried games first.
 * After that, each slot is targeted, varied or familiar, and every pick says why it was chosen.
 * The plan is stable for the day: results from today do not reshuffle it.
 */
export function planWorkout(i: Inputs): PlanPick[] {
  const n = gamesForMinutes(i.minutes);
  const history = i.results.filter((r) => r.day < i.day);
  const tried = new Set(history.map((r) => r.game));
  const picks: PlanPick[] = [];
  const taken = (g: GameId) => picks.some((p) => p.game === g);

  // Baseline: until every game has been tried once, fill slots with untried games.
  const untried = dailyGames(i.day, i.available)
    .concat(i.available)
    .filter((g, k, all) => all.indexOf(g) === k && !tried.has(g));
  if (untried.length > 0 && i.goal === 'mixed') {
    for (const g of untried) {
      if (picks.length >= n) break;
      picks.push({ game: g, kind: 'baseline', reason: 'First try: sets your baseline' });
    }
  }

  const rand = seededRand(dayIndex(i.day) * 7919 + i.minutes);
  const kinds = slotKinds(n, rand);
  const target = targetSkill(i, history);
  const stalled = isStalled(history, i.skillOf, target);

  for (const kind of kinds.slice(picks.length)) {
    if (picks.length >= n) break;
    const free = i.available.filter((g) => !taken(g));
    if (free.length === 0) break;
    let game: GameId | undefined;
    let reason = '';
    if (kind === 'targeted') {
      const inSkill = free.filter((g) => i.skillOf(g) === target).sort((a, b) => (gamePerf(history, a) ?? 0) - (gamePerf(history, b) ?? 0));
      game = inSkill[0];
      reason =
        i.goal !== 'mixed'
          ? `Your goal: ${GOAL_NAMES[i.goal].toLowerCase()}`
          : stalled
            ? `Targeted: ${i.skillNames[target].toLowerCase()} has levelled off`
            : `Targeted: ${i.skillNames[target].toLowerCase()} has the most room to grow`;
    }
    if (!game && kind !== 'familiar') {
      const planned = new Set(picks.map((p) => i.skillOf(p.game)));
      const varied = free.sort((a, b) => lastPlayed(history, a) - lastPlayed(history, b));
      game = varied.find((g) => !planned.has(i.skillOf(g))) ?? varied[0];
      reason = 'Variety: a game you have not played lately';
    }
    if (!game) {
      game = [...free].sort((a, b) => (gamePerf(history, b) ?? 0) - (gamePerf(history, a) ?? 0))[0];
      reason = 'Confidence builder: one of your strongest games';
    }
    picks.push({ game, kind: reason.startsWith('Variety') ? 'varied' : reason.startsWith('Confidence') ? 'familiar' : 'targeted', reason });
  }
  return picks;
}

// ---- Daily challenge, weekly quest and streak ---------------------------------------------

export type DailyChallenge = { game: GameId; level: number; accuracy: number };

/** One game a day, played one level above your current level. Hit 80% to clear it. */
export function dailyChallenge(day: string, available: GameId[], levels: Partial<Record<GameId, number>>): DailyChallenge {
  const game = available[(dayIndex(day) * 5 + 3) % available.length];
  return { game, level: Math.min(20, (levels[game] ?? 1) + 1), accuracy: 0.8 };
}

export function challengeDone(c: DailyChallenge, day: string, results: GameResult[]): boolean {
  return results.some((r) => r.day === day && r.game === c.game && r.level >= c.level && r.accuracy >= c.accuracy);
}

/** Monday to Sunday of the week containing `day`, as YYYY-MM-DD keys. */
export function weekOf(day: string): string[] {
  const [y, m, d] = day.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const monday = new Date(date);
  monday.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, k) => {
    const x = new Date(monday);
    x.setUTCDate(monday.getUTCDate() + k);
    return x.toISOString().slice(0, 10);
  });
}

export type Quest = { title: string; detail: string; progress: number; target: number };

/** A different multi-day goal each week, measured from what you already do. */
export function weeklyQuest(day: string, results: GameResult[], workouts: string[], skillOf: (g: GameId) => Skill, skills: Skill[]): Quest {
  const week = new Set(weekOf(day));
  const inWeek = results.filter((r) => week.has(r.day));
  const kind = Math.floor(dayIndex(weekOf(day)[0]) / 7) % 4;
  if (kind === 0) {
    return { title: 'Three-session week', detail: 'Finish 3 workouts this week.', progress: workouts.filter((w) => week.has(w)).length, target: 3 };
  }
  if (kind === 1) {
    const per = skills.map((s) => Math.min(2, inWeek.filter((r) => skillOf(r.game) === s).length));
    return { title: 'All-rounder', detail: 'Train every skill at least twice this week.', progress: per.reduce((a, b) => a + b, 0), target: skills.length * 2 };
  }
  if (kind === 2) {
    let bests = 0;
    const before = results.filter((r) => !week.has(r.day) && r.day < weekOf(day)[0]);
    const best = new Map<GameId, number>();
    for (const r of before) best.set(r.game, Math.max(best.get(r.game) ?? 0, r.score));
    for (const r of inWeek) {
      if (r.score > (best.get(r.game) ?? 0)) bests += 1;
      best.set(r.game, Math.max(best.get(r.game) ?? 0, r.score));
    }
    return { title: 'Record breaker', detail: 'Set 2 personal bests this week.', progress: bests, target: 2 };
  }
  return { title: 'Explorer', detail: 'Play 5 different games this week.', progress: new Set(inWeek.map((r) => r.game)).size, target: 5 };
}

/**
 * Forgiving streak: active days in a row, where up to two rest days in a row never break it.
 * Returns how many active days the current streak holds.
 */
export function forgivingStreak(activeDays: Set<string>, today: string, maxRest = 2): number {
  const [y, m, d] = today.split('-').map(Number);
  const cursor = new Date(Date.UTC(y, m - 1, d));
  let count = 0;
  let rest = 0;
  for (let k = 0; k < 400; k++) {
    const key = cursor.toISOString().slice(0, 10);
    if (activeDays.has(key)) {
      count += 1;
      rest = 0;
    } else {
      rest += 1;
      if (rest > maxRest) break;
    }
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return count;
}
