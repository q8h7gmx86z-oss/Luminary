// Progress summaries built from saved rounds. Pure, so it can be tested in Node.
import type { GameId, GameResult, Skill } from './engine';

export type SkillSummary = {
  skill: Skill;
  rounds: number;
  /** Highest level reached across this skill's games. */
  level: number;
  /** Average accuracy over the last 5 rounds, 0 to 1. */
  recentAccuracy?: number;
  /** Mean score per day for the last 14 days with play, oldest first. */
  trend: { day: string; value: number }[];
  /** Skill score from 0 to 100: level and accuracy over recent rounds. */
  skillScore: number;
  /** How steady recent accuracy is. Needs at least 4 rounds. */
  consistency?: 'High' | 'Medium' | 'Variable';
  /** Skill score now minus skill score over your first three rounds, in points out of 100. Needs 6 rounds. */
  vsBaseline?: number;
  direction?: 'improving' | 'steady' | 'dipping';
  /** Average response time, recent rounds and first rounds, where the games measure it. */
  rtNow?: number;
  rtBaseline?: number;
};

const perf = (r: GameResult) => Math.max(0, Math.min(1, (r.level - 1 + r.accuracy) / 16));
const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const sd = (xs: number[]) => {
  const m = avg(xs);
  return Math.sqrt(avg(xs.map((x) => (x - m) ** 2)));
};

export function skillSummaries(
  results: GameResult[],
  levels: Partial<Record<GameId, number>>,
  skillOf: (g: GameId) => Skill,
  skills: Skill[],
): SkillSummary[] {
  return skills.map((skill) => {
    const rs = results.filter((r) => skillOf(r.game) === skill);
    const gameLevels = (Object.keys(levels) as GameId[]).filter((g) => skillOf(g) === skill).map((g) => levels[g] ?? 1);
    const recent = rs.slice(-5);
    const byDay = new Map<string, number[]>();
    for (const r of rs) {
      // Normalise by level so a harder round counts for more.
      const v = r.accuracy * 100 * (1 + (r.level - 1) / 10);
      byDay.set(r.day, [...(byDay.get(r.day) ?? []), v]);
    }
    const trend = [...byDay.entries()]
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .slice(-14)
      .map(([day, vs]) => ({ day, value: Math.round(vs.reduce((a, b) => a + b, 0) / vs.length) }));
    const recentPerf = rs.slice(-3).map(perf);
    const skillScore = recentPerf.length ? Math.round(avg(recentPerf) * 100) : 0;
    const last8 = rs.slice(-8).map((r) => r.accuracy);
    const spread = last8.length >= 4 ? sd(last8) : undefined;
    const consistency = spread === undefined ? undefined : spread < 0.08 ? 'High' : spread < 0.15 ? 'Medium' : 'Variable';
    let vsBaseline: number | undefined;
    let direction: SkillSummary['direction'];
    if (rs.length >= 6) {
      const base = avg(rs.slice(0, 3).map(perf));
      const now = avg(recentPerf);
      vsBaseline = Math.round((now - base) * 100);
      const prev = avg(rs.slice(-6, -3).map(perf));
      direction = now - prev > 0.01 ? 'improving' : now - prev < -0.01 ? 'dipping' : 'steady';
    }
    const timed = rs.filter((r) => r.rtMs);
    const rtNow = timed.length ? Math.round(avg(timed.slice(-3).map((r) => r.rtMs!))) : undefined;
    const rtBaseline = timed.length >= 6 ? Math.round(avg(timed.slice(0, 3).map((r) => r.rtMs!))) : undefined;
    return {
      skill,
      skillScore,
      consistency,
      vsBaseline,
      direction,
      rtNow,
      rtBaseline,
      rounds: rs.length,
      level: gameLevels.length ? Math.max(...gameLevels) : 1,
      recentAccuracy: recent.length ? recent.reduce((a, r) => a + r.accuracy, 0) / recent.length : undefined,
      trend,
    };
  });
}

/** Workouts finished in the 7 days ending today. */
export function workoutsThisWeek(workouts: string[], last7: string[]): number {
  const set = new Set(workouts);
  return last7.filter((d) => set.has(d)).length;
}

// --- Per-game analytics -------------------------------------------------------------

export type MetricDef = {
  key: string;
  label: string;
  /** How to show the number. */
  unit: 'ms' | 'pct' | 'count' | 'n';
  better: 'lower' | 'higher' | 'neither';
  explain: string;
};

/** The extra measures each game records, and how to read them. */
export const GAME_METRICS: Record<GameId, MetricDef[]> = {
  speed: [],
  grid: [
    { key: 'span', label: 'Sequence length', unit: 'n', better: 'higher', explain: 'How many tiles you were asked to remember.' },
    { key: 'perfect', label: 'Perfect sequences', unit: 'count', better: 'higher', explain: 'Sequences you repeated without a slip.' },
  ],
  catch: [
    {
      key: 'falseStarts',
      label: 'False starts',
      unit: 'count',
      better: 'lower',
      explain: 'Taps on a stop light. This is the inhibition measure: holding back an automatic response.',
    },
    { key: 'misses', label: 'Missed go lights', unit: 'count', better: 'lower', explain: 'Go lights that went out before you tapped.' },
    { key: 'stopRate', label: 'Stops held', unit: 'pct', better: 'higher', explain: 'Share of stop lights you let pass.' },
  ],
  nback: [
    {
      key: 'n',
      label: 'Stars back',
      unit: 'n',
      better: 'higher',
      explain: 'How far back you were comparing: the main difficulty setting.',
    },
    { key: 'hitRate', label: 'Matches caught', unit: 'pct', better: 'higher', explain: 'Share of real matches you tapped.' },
    { key: 'falseAlarms', label: 'False alarms', unit: 'count', better: 'lower', explain: 'Taps when there was no match.' },
  ],
  clash: [
    {
      key: 'interference',
      label: 'Interference cost',
      unit: 'ms',
      better: 'lower',
      explain: 'How much slower you are when the word and ink clash than when they match. This is the classic Stroop effect.',
    },
    {
      key: 'clashAccuracy',
      label: 'Clash accuracy',
      unit: 'pct',
      better: 'higher',
      explain: 'Accuracy on the hard cards, where the word and ink disagree.',
    },
    {
      key: 'wordSlips',
      label: 'Read the word',
      unit: 'count',
      better: 'lower',
      explain: 'Times you answered with the word instead of the ink.',
    },
  ],
  switch: [
    {
      key: 'switchCost',
      label: 'Switch cost',
      unit: 'ms',
      better: 'lower',
      explain: 'How much slower you are just after the rule changes than when it stays the same. Smaller means you shift gears faster.',
    },
    {
      key: 'switchAccuracy',
      label: 'Accuracy after a switch',
      unit: 'pct',
      better: 'higher',
      explain: 'Accuracy on cards where the rule had just changed.',
    },
    {
      key: 'repeatAccuracy',
      label: 'Accuracy, same rule',
      unit: 'pct',
      better: 'higher',
      explain: 'Accuracy on cards where the rule stayed the same.',
    },
  ],
};

export type MetricSummary = MetricDef & { now?: number; first?: number; best?: number };

export type GameAnalytics = {
  game: GameId;
  sessions: number;
  daysPlayed: number;
  level: number;
  topLevel: number;
  bestScore?: number;
  bestAccuracy?: number;
  recentAccuracy?: number;
  /** Median response time, averaged over the last 3 rounds and the first 3. Needs 6 rounds for a baseline. */
  rtNow?: number;
  rtFirst?: number;
  rtBest?: number;
  /** Spread of response times as a share of the median (coefficient of variation), recent rounds. Lower is steadier. */
  variability?: number;
  metrics: MetricSummary[];
  /** Level after each round, oldest first, up to 30. */
  levelTrend: number[];
  /** Median response time per round, oldest first, up to 30. */
  rtTrend: number[];
};

const rtOf = (r: GameResult) => r.rtMedian ?? r.rtMs;

export function gameAnalytics(results: GameResult[], game: GameId, currentLevel = 1): GameAnalytics {
  const rs = results.filter((r) => r.game === game);
  const avgOf = (xs: (number | undefined)[]) => {
    const v = xs.filter((x): x is number => x !== undefined);
    return v.length ? avg(v) : undefined;
  };
  const timed = rs.filter((r) => rtOf(r) !== undefined);
  const withSd = timed.filter((r) => r.rtSd !== undefined).slice(-3);
  const metrics = GAME_METRICS[game].map((def) => {
    const vals = rs.filter((r) => r.metrics?.[def.key] !== undefined);
    const xs = vals.map((r) => r.metrics![def.key]);
    const best = !xs.length || def.better === 'neither' ? undefined : def.better === 'lower' ? Math.min(...xs) : Math.max(...xs);
    return {
      ...def,
      now: avgOf(xs.slice(-3)),
      first: xs.length >= 6 ? avgOf(xs.slice(0, 3)) : undefined,
      best,
    };
  });
  return {
    game,
    sessions: rs.length,
    daysPlayed: new Set(rs.map((r) => r.day)).size,
    level: currentLevel,
    topLevel: rs.length ? Math.max(currentLevel, ...rs.map((r) => r.level)) : currentLevel,
    bestScore: rs.length ? Math.max(...rs.map((r) => r.score)) : undefined,
    bestAccuracy: rs.length ? Math.max(...rs.map((r) => r.accuracy)) : undefined,
    recentAccuracy: avgOf(rs.slice(-3).map((r) => r.accuracy)),
    rtNow: round(avgOf(timed.slice(-3).map(rtOf))),
    rtFirst: timed.length >= 6 ? round(avgOf(timed.slice(0, 3).map(rtOf))) : undefined,
    rtBest: timed.length ? Math.min(...timed.map((r) => rtOf(r)!)) : undefined,
    variability: withSd.length ? avg(withSd.map((r) => r.rtSd! / rtOf(r)!)) : undefined,
    metrics,
    levelTrend: rs.slice(-30).map((r) => r.level),
    rtTrend: timed.slice(-30).map((r) => rtOf(r)!),
  };
}

const round = (x: number | undefined) => (x === undefined ? undefined : Math.round(x));
