// Aura's scripted guidance. Pure functions so every line can be tested.
//
// Voice: a composed, expert coach. Short, precise sentences that say what is happening and why.
// No praise for its own sake, no exclamation marks, no wellness filler. Aura speaks in the first
// person only to introduce itself; after that it talks about the training, not about itself.

import type { AuraState } from './AuraOrb';

export type AuraLine = { text: string; state: AuraState };

/** Accuracy band the adaptive engine aims for, as whole percentages. */
export type TargetBand = { down: number; up: number };

const pct = (x: number) => `${Math.round(x * 100)}%`;
const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

// ---- Today ------------------------------------------------------------------------------------

export type BriefInput = {
  /** No results at all yet. */
  firstVisit: boolean;
  /** A workout was completed today. */
  workedOut: boolean;
  /** Whole days since the last training day, or null if never trained. */
  daysAway: number | null;
  /** Number of tasks in today's plan and the session length. */
  tasks: number;
  minutes: number;
  /** The plan's targeted slot, if there is one. */
  targeted?: { skill: string; stalled: boolean; goal: boolean };
  /** Sessions completed this week and the weekly target. */
  thisWeek: number;
  weeklyTarget: number;
};

export function todayBrief(i: BriefInput): AuraLine {
  if (i.firstVisit) {
    return {
      state: 'explaining',
      text:
        `I'm Aura. I'll guide each session and explain what your results mean. ` +
        `Your first workout sets the baseline: ${i.tasks} short tasks, each starting easy and adjusting to you as you play.`,
    };
  }
  if (i.workedOut) {
    const left = Math.max(0, i.weeklyTarget - i.thisWeek);
    return {
      state: 'idle',
      text:
        `Today's session is banked. Skill consolidates between sessions, during rest and sleep, so the next gain comes from the next session, not a longer one today.` +
        (left > 0 ? ` ${left} more this week keeps you on the three-a-week schedule the research supports.` : ` This week's three sessions are done.`),
    };
  }
  const plan = `${i.tasks} tasks, ${i.minutes} minutes, after a one-minute breathing warm-up.`;
  if (i.daysAway !== null && i.daysAway > 3) {
    return {
      state: 'explaining',
      text: `Welcome back. Levels hold through a break, so the first task may feel a step harder than you remember. That passes within a round. ${plan}`,
    };
  }
  if (i.targeted && !i.targeted.goal) {
    const s = lower(i.targeted.skill);
    return {
      state: 'explaining',
      text: i.targeted.stalled
        ? `${i.targeted.skill} has levelled off, so today changes the stimulus rather than repeating it. A plateau usually breaks when the task changes. ${plan}`
        : `Today leans on ${s}, the skill with the most room to grow. Training where you are weakest gives the largest return. ${plan}`,
    };
  }
  if (i.targeted?.goal) {
    return { state: 'explaining', text: `Today follows your goal: ${lower(i.targeted.skill)} first, then variety so the gains are not tied to one task. ${plan}` };
  }
  return { state: 'explaining', text: `A balanced session today: different skills, so each one gets fresh demand. ${plan}` };
}

// ---- Game intro -------------------------------------------------------------------------------

export type IntroInput = {
  game: string;
  level: number;
  /** Never played this game before. */
  firstTime: boolean;
  challenge: boolean;
  untimed: boolean;
  band: TargetBand;
};

export function introLine(i: IntroInput): AuraLine {
  if (i.challenge) {
    return { state: 'explaining', text: `One level above yours. Clear 80% accuracy and today's challenge is complete. Precision first: rushing costs more than it saves.` };
  }
  if (i.firstTime) {
    return {
      state: 'explaining',
      text: `First run of ${i.game}. It starts easy and adjusts after every round, so the level finds you. Aim for accuracy first; speed follows with practice.`,
    };
  }
  const pace = i.untimed ? ' Untimed today, so take the time you need.' : '';
  return {
    state: 'explaining',
    text: `Level ${i.level}. The target is ${i.band.down} to ${i.band.up}% accuracy: hard enough to force adaptation, not so hard that you stall.${pace}`,
  };
}

// ---- Result -----------------------------------------------------------------------------------

export type ResultInput = {
  accuracy: number;
  level: number;
  newLevel: number;
  personalBest: boolean;
  /** Daily challenge: true if cleared, false if not, undefined if this was not a challenge. */
  cleared?: boolean;
};

export function resultLine(i: ResultInput): AuraLine {
  const acc = pct(i.accuracy);
  if (i.cleared === true) return { state: 'success', text: `Challenge cleared at ${acc}. You held accuracy one level above your own, which is exactly the stretch that builds capacity.` };
  if (i.cleared === false) return { state: 'idle', text: `${acc} this time, short of 80%. The challenge resets tomorrow at the same stretch. Your own level is unaffected.` };
  if (i.newLevel > i.level) {
    return {
      state: 'success',
      text: `${acc}, above your target range. The next round moves to level ${i.newLevel}.${i.personalBest ? ' That is also a personal record.' : ''}`,
    };
  }
  if (i.newLevel < i.level) {
    return {
      state: 'idle',
      text:
        `${acc}, below your target range. Level ${i.newLevel} next. Training at the right difficulty is what drives gains, so easing off one step is the correct move.` +
        (i.personalBest ? ' The score itself was still a personal record.' : ''),
    };
  }
  if (i.personalBest) return { state: 'success', text: `A personal record, at ${acc} accuracy. The level holds: the record shows the skill is consolidating at this difficulty.` };
  if (i.accuracy < 0.6) return { state: 'idle', text: `${acc}. The level holds. Consistent practice at this level builds capacity; the step up follows.` };
  return { state: 'idle', text: `${acc}, within your target range. The level holds, which is where adaptation happens.` };
}

// ---- Session summary --------------------------------------------------------------------------

export type SummaryInput = {
  firstTime: boolean;
  diff: number;
  focus: boolean;
  results: { game: string; accuracy: number; levelledUp: boolean }[];
};

export function summaryLine(i: SummaryInput): AuraLine {
  if (i.firstTime) {
    return {
      state: 'success',
      text: `Baseline set. From here, every session is compared with this one, so the score tracks your change, not anyone else's.`,
    };
  }
  const ups = i.results.filter((r) => r.levelledUp).map((r) => r.game);
  const best = [...i.results].sort((a, b) => b.accuracy - a.accuracy)[0];
  const lead =
    ups.length > 1
      ? `${ups.length} tasks moved up a level: ${ups.join(' and ')}.`
      : ups.length === 1
        ? `${ups[0]} moved up a level.`
        : best
          ? `Strongest result: ${best.game}, at ${pct(best.accuracy)}.`
          : '';
  const score = i.diff > 0 ? ` The score rose by ${i.diff}.` : i.diff < 0 ? ` The score dipped by ${-i.diff}, which is normal as levels get harder.` : '';
  const next = i.focus
    ? ' Attention training works best in short, regular blocks, so the next one can be tomorrow.'
    : ' Spaced sessions, about three a week, build skill faster than cramming.';
  return { state: ups.length > 0 || i.diff > 0 ? 'success' : 'idle', text: `${lead}${score}${next}`.trim() };
}

// ---- Research ---------------------------------------------------------------------------------

const VERDICT_GUIDE: Record<string, string> = {
  strong: 'Large trials or meta-analyses agree. A meta-analysis pools many studies, so one lucky result cannot carry it.',
  moderate: 'Solid studies support it, with limits on how far the result reaches. Read the honest part before drawing conclusions.',
  mixed: 'Practice reliably improves the trained skill. Whether that spreads to everyday life is still argued over, and the honest part says where.',
  early: 'Promising, but the studies are small or indirect. Treat it as a reasoned bet, not a settled fact.',
  measure: 'This is a standard research task. The evidence is for what it measures, which is why Luminary uses it to track you.',
};

export function researchLine(verdict: string, papers: number): AuraLine {
  const guide = VERDICT_GUIDE[verdict] ?? '';
  return {
    state: 'explaining',
    text: `How to read this: ${guide} ${papers === 1 ? 'The paper is linked below' : `All ${papers} papers are linked below`}, so you can check the claims yourself.`,
  };
}
