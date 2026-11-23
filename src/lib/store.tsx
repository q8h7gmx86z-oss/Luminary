import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { GameId, GameResult, nextLevel } from '@/training/engine';

import { Region, regionFromCode } from './crisis';
import { dayKey, uid } from './logic';

// Everything Luminary records lives here, on this device only.
// There is no account, no server and no analytics.

const STORAGE_KEY = 'luminary:v1';

export type Score = 1 | 2 | 3 | 4 | 5;

export type MoodEntry = { mood: Score; energy: Score; focus: Score; note?: string; at: number };
export type SleepEntry = { bed: string; wake: string; quality: Score; at: number };
export type Step = { id: string; text: string; done: boolean };
export type Task = { id: string; title: string; steps: Step[]; createdAt: number };
export type IfThenPlan = { id: string; when: string; then: string };

export type AgeGroup = 'under18' | 'adult';

export type State = {
  onboarded: boolean;
  ageGroup: AgeGroup | null;
  region: Region;
  moods: Record<string, MoodEntry>;
  sleeps: Record<string, SleepEntry>;
  habits: Record<string, string[]>;
  tasks: Task[];
  plans: IfThenPlan[];
  settings: { calmMode: boolean };
  training: {
    levels: Partial<Record<GameId, number>>;
    results: GameResult[];
    /** Days on which the full daily workout was finished. */
    workouts: string[];
  };
};

function defaultState(): State {
  let region: Region = 'OTHER';
  try {
    region = regionFromCode(getLocales()[0]?.regionCode);
  } catch {
    // Fall back to the generic list if the device does not say.
  }
  return {
    onboarded: false,
    ageGroup: null,
    region,
    moods: {},
    sleeps: {},
    habits: {},
    tasks: [],
    plans: [],
    settings: { calmMode: false },
    training: { levels: {}, results: [], workouts: [] },
  };
}

type Actions = {
  finishOnboarding: (ageGroup: AgeGroup, region: Region) => void;
  setRegion: (r: Region) => void;
  setAgeGroup: (a: AgeGroup) => void;
  setCalmMode: (on: boolean) => void;
  saveMood: (e: Omit<MoodEntry, 'at'>) => void;
  saveSleep: (e: Omit<SleepEntry, 'at'>) => void;
  toggleHabit: (habitId: string) => void;
  addTask: (title: string, steps: string[]) => void;
  toggleStep: (taskId: string, stepId: string) => void;
  removeTask: (taskId: string) => void;
  addPlan: (when: string, then: string) => void;
  removePlan: (id: string) => void;
  /** Saves a round and adjusts that game's level for next time. */
  recordResult: (r: GameResult) => void;
  completeWorkout: (day: string) => void;
  deleteEverything: () => Promise<void>;
};

type Ctx = { state: State; ready: boolean } & Actions;

const StoreContext = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>(defaultState);
  const [ready, setReady] = useState(false);
  const loaded = useRef(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) {
          const saved = JSON.parse(raw) as Partial<State>;
          setState((s) => ({
            ...s,
            ...saved,
            settings: { ...s.settings, ...saved.settings },
            training: { ...s.training, ...saved.training },
          }));
        }
      })
      .catch(() => {})
      .finally(() => {
        loaded.current = true;
        setReady(true);
      });
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
  }, [state]);

  const update = useCallback((fn: (s: State) => State) => setState(fn), []);

  const actions = useMemo<Actions>(
    () => ({
      finishOnboarding: (ageGroup, region) => update((s) => ({ ...s, onboarded: true, ageGroup, region })),
      setRegion: (region) => update((s) => ({ ...s, region })),
      setAgeGroup: (ageGroup) => update((s) => ({ ...s, ageGroup })),
      setCalmMode: (calmMode) => update((s) => ({ ...s, settings: { ...s.settings, calmMode } })),
      saveMood: (e) => update((s) => ({ ...s, moods: { ...s.moods, [dayKey()]: { ...e, at: Date.now() } } })),
      saveSleep: (e) => update((s) => ({ ...s, sleeps: { ...s.sleeps, [dayKey()]: { ...e, at: Date.now() } } })),
      toggleHabit: (habitId) =>
        update((s) => {
          const k = dayKey();
          const done = s.habits[k] ?? [];
          const next = done.includes(habitId) ? done.filter((h) => h !== habitId) : [...done, habitId];
          return { ...s, habits: { ...s.habits, [k]: next } };
        }),
      addTask: (title, steps) =>
        update((s) => ({
          ...s,
          tasks: [
            { id: uid(), title, createdAt: Date.now(), steps: steps.map((text) => ({ id: uid(), text, done: false })) },
            ...s.tasks,
          ],
        })),
      toggleStep: (taskId, stepId) =>
        update((s) => ({
          ...s,
          tasks: s.tasks.map((t) =>
            t.id !== taskId ? t : { ...t, steps: t.steps.map((st) => (st.id === stepId ? { ...st, done: !st.done } : st)) },
          ),
        })),
      removeTask: (taskId) => update((s) => ({ ...s, tasks: s.tasks.filter((t) => t.id !== taskId) })),
      addPlan: (when, then) => update((s) => ({ ...s, plans: [...s.plans, { id: uid(), when, then }] })),
      removePlan: (id) => update((s) => ({ ...s, plans: s.plans.filter((p) => p.id !== id) })),
      recordResult: (r) =>
        update((s) => ({
          ...s,
          training: {
            ...s.training,
            levels: { ...s.training.levels, [r.game]: nextLevel(r.level, r.accuracy) },
            // Keep the most recent 2,000 rounds, which is years of daily use.
            results: [...s.training.results, r].slice(-2000),
          },
        })),
      completeWorkout: (day) =>
        update((s) =>
          s.training.workouts.includes(day) ? s : { ...s, training: { ...s.training, workouts: [...s.training.workouts, day] } },
        ),
      deleteEverything: async () => {
        await AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
        setState(defaultState());
      },
    }),
    [update],
  );

  const value = useMemo(() => ({ state, ready, ...actions }), [state, ready, actions]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): Ctx {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}
