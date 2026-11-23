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
