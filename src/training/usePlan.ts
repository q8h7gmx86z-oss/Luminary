import { dayKey } from '@/lib/logic';
import { useStore } from '@/lib/store';

import { AVAILABLE, GAMES, SKILLS } from './catalog';
import { GameId, Skill } from './engine';
import { planWorkout } from './planner';

const SKILL_LIST = Object.keys(SKILLS) as Skill[];
const NAMES = Object.fromEntries(SKILL_LIST.map((s) => [s, SKILLS[s].name])) as Record<Skill, string>;
export const skillOf = (g: GameId) => GAMES[g].skill;

/** Today's personalised plan, from the person's history and training preferences. */
export function useTodayPlan(goalOverride?: Parameters<typeof planWorkout>[0]['goal']) {
  const { state } = useStore();
  const s = state.settings;
  return planWorkout({
    day: dayKey(),
    results: state.training.results,
    available: AVAILABLE,
    skillOf,
    skills: SKILL_LIST,
    skillNames: NAMES,
    minutes: s.sessionMinutes,
    goal: goalOverride ?? s.goal,
  });
}
