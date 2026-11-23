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
    return {
      skill,
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
