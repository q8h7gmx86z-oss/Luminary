// The single progress insight shown on Today. Pure, so it can be tested in Node.
// Rules from the product blueprint: one honest sentence, about your own record, never a comparison with others.
import type { Skill } from './engine';
import type { SkillSummary } from './stats';

export type TodayInsight = { skill?: Skill; text: string };

/** Rounds of a skill needed before it has a baseline to compare with (see skillSummaries). */
export const BASELINE_ROUNDS = 6;

export function todayInsight(summaries: SkillSummary[], nameOf: (s: Skill) => string): TodayInsight {
  const played = summaries.filter((s) => s.rounds > 0);
  if (played.length === 0) {
    return { text: 'Your first workout sets a baseline for each of the four skills. Every session after is measured against it.' };
  }
  const withBaseline = summaries.filter((s) => s.vsBaseline !== undefined);
  const best = [...withBaseline].sort((a, b) => (b.vsBaseline ?? 0) - (a.vsBaseline ?? 0))[0];
  if (best && (best.vsBaseline ?? 0) > 0) {
    const others = withBaseline.length > 1 ? `, the largest gain of your ${withBaseline.length} measured skills` : '';
    return { skill: best.skill, text: `${nameOf(best.skill)} is up ${best.vsBaseline} points on your baseline${others}.` };
  }
  const untrained = summaries.find((s) => s.rounds === 0);
  if (untrained) {
    return { skill: untrained.skill, text: `You have not trained ${nameOf(untrained.skill).toLowerCase()} yet. A round or two will give it a starting point.` };
  }
  const pending = summaries.filter((s) => s.vsBaseline === undefined).sort((a, b) => b.rounds - a.rounds)[0];
  if (pending) {
    const left = Math.max(1, BASELINE_ROUNDS - pending.rounds);
    return { skill: pending.skill, text: `${left} more round${left === 1 ? '' : 's'} of ${nameOf(pending.skill).toLowerCase()} and Luminary can compare it with your start.` };
  }
  const dipping = summaries.find((s) => s.direction === 'dipping');
  if (dipping) {
    return { skill: dipping.skill, text: `${nameOf(dipping.skill)} has dipped in recent rounds. Single sessions vary; the trend over weeks is what counts.` };
  }
  return { text: 'All four skills are holding steady against your baseline. Steady is normal between gains.' };
}
