// Sharpness: one number for how well someone performs across the four skills.
// Pure, so it can be tested in Node.
import type { GameId, GameResult, Skill } from './engine';

export const MAX_SHARPNESS = 1000;
/** Level at which a skill counts as fully trained for the score. */
const TOP_LEVEL = 16;
/** Rounds per game that count towards the score, so one lucky or bad round does not swing it. */
const WINDOW = 3;

export type Sharpness = { total: number; bySkill: Record<Skill, number> };

/** Performance on one round, 0 to 1: the level reached plus how accurately it was played. */
export function roundPerformance(r: Pick<GameResult, 'level' | 'accuracy'>): number {
  return Math.max(0, Math.min(1, (r.level - 1 + r.accuracy) / TOP_LEVEL));
}

/** Score from a set of rounds: each skill is worth a quarter, from the average of its games. */
export function sharpnessOf(results: GameResult[], skillOf: (g: GameId) => Skill, skills: Skill[]): Sharpness {
  const byGame = new Map<GameId, GameResult[]>();
  for (const r of results) byGame.set(r.game, [...(byGame.get(r.game) ?? []), r]);
  const bySkill = {} as Record<Skill, number>;
  let total = 0;
  for (const skill of skills) {
    const perfs: number[] = [];
    for (const [g, rs] of byGame) {
      if (skillOf(g) !== skill) continue;
      const recent = rs.slice(-WINDOW);
      perfs.push(recent.reduce((a, r) => a + roundPerformance(r), 0) / recent.length);
    }
    const index = perfs.length ? perfs.reduce((a, b) => a + b, 0) / perfs.length : 0;
    bySkill[skill] = index;
    total += (index * MAX_SHARPNESS) / skills.length;
  }
  return { total: Math.round(total), bySkill };
}

/** Score at the end of each day with play, oldest first, for the most recent days. */
export function sharpnessHistory(results: GameResult[], skillOf: (g: GameId) => Skill, skills: Skill[], maxDays = 30) {
  const days = [...new Set(results.map((r) => r.day))].sort().slice(-maxDays);
  return days.map((day) => ({ day, value: sharpnessOf(results.filter((r) => r.day <= day), skillOf, skills).total }));
}
