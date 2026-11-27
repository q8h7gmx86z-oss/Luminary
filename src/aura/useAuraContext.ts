import { useMemo } from 'react';

import { dayKey } from '@/lib/logic';
import { useStore } from '@/lib/store';
import { GAMES, SKILLS } from '@/training/catalog';
import { GameId, Skill } from '@/training/engine';
import { forgivingStreak, GOAL_NAMES, weekOf } from '@/training/planner';
import { MAX_SHARPNESS } from '@/training/sharpness';
import { useSharpness } from '@/training/SharpnessCard';

import { trainingContext } from './chat';

/** The training summary Aura sees. Built on the device; nothing identifying. */
export function useAuraContext(): string {
  const { state } = useStore();
  const { now, history, first } = useSharpness();
  return useMemo(() => {
    const { results, workouts, levels } = state.training;
    const today = dayKey();
    const week = new Set(weekOf(today));
    const played = [...new Set(results.map((r) => r.game))] as GameId[];
    return trainingContext({
      sessionMinutes: state.settings.sessionMinutes,
      goal: GOAL_NAMES[state.settings.goal],
      score: results.length ? now.total : null,
      baselineGain: first !== undefined && history.length > 1 ? now.total - first : null,
      skills: (Object.keys(SKILLS) as Skill[]).map((s) => ({ name: SKILLS[s].name, points: now.bySkill[s] ?? 0, max: MAX_SHARPNESS / 4 })),
      games: played.map((g) => {
        const last = [...results].reverse().find((r) => r.game === g);
        return { name: GAMES[g].name, level: levels[g] ?? 1, lastAccuracy: last ? last.accuracy : null };
      }),
      sessionsThisWeek: workouts.filter((w) => week.has(w)).length,
      streakDays: forgivingStreak(new Set([...workouts, ...results.map((r) => r.day)]), today),
      untimed: !state.settings.timed,
    });
  }, [state.training, state.settings, now, history, first]);
}
