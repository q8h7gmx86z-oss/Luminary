import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { FactorRecord, recordFor, Status } from '@/content/rafi';
import { Challenge, GameId, GameResult, nextLevel } from '@/training/engine';
import type { Goal } from '@/training/planner';
import type { Heat } from '@/training/championships';
import type { BenchmarkRecord } from '@/training/benchmark';
import type { Experiment, LabEntry } from '@/lab/lab';

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
  /** Rafi Programme risk factors the person has marked as covered. */
  rafi?: string[];
  /** Rafi Programme: status and dated notes per risk factor. */
  rafiPlan?: Record<string, FactorRecord>;
  settings: Settings;
  /** Minutes of movement per day, keyed YYYY-MM-DD. */
  movement?: Record<string, number>;
  /** Personal Lab experiments, oldest first. The last one without endedAt is running. */
  lab?: Experiment[];
  /** The Neural Championships: heats, the logic event's level and order preference. */
  championships?: Championships;
  training: {
    levels: Partial<Record<GameId, number>>;
    results: GameResult[];
    /** Days on which the full daily workout was finished. */
    workouts: string[];
    /** Reasoning test attempts. */
    tests?: { at: number; percent: number; score?: number }[];
    /** The Luminary Benchmark: monthly checks on untrained tasks, oldest first. */
    benchmarks?: BenchmarkRecord[];
  };
};

export type Championships = {
  heats: Heat[];
  /** Level of the Logic event, which has no game of its own elsewhere. */
  logicLevel?: number;
  /** Off: the weakest event goes first. On: the standard order. */
  chooseOrder?: boolean;
};

export type Settings = {
  calmMode: boolean;
  /** Game sounds on or off. The quick mute in games flips this. */
  sound: boolean;
  volume: 'gentle' | 'standard';
  vibration: boolean;
  sessionMinutes: 3 | 5 | 10 | 15;
  /** Untimed mode removes answer deadlines and slows paced games. */
  timed: boolean;
  visuals: 'minimal' | 'standard';
  breaks: boolean;
  goal: Goal;
  challenge: Challenge;
  /** Shapes and a colour-blind-safe palette in colour-coded games. */
  colourAssist: boolean;
  /** Opt-in: compare training with sleep and mood check-ins, on this device. */
  insights: boolean;
  /** High contrast brightens secondary text and borders. */
  contrast: 'standard' | 'high';
};
export const DEFAULT_SETTINGS: Settings = {
  calmMode: false,
  sound: true,
  volume: 'gentle',
  vibration: true,
  sessionMinutes: 10,
  timed: true,
  visuals: 'standard',
  breaks: false,
  goal: 'mixed',
  challenge: 'balanced',
  colourAssist: false,
  insights: false,
  contrast: 'standard',
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
    settings: DEFAULT_SETTINGS,
    training: { levels: {}, results: [], workouts: [] },
  };
}

type Actions = {
  finishOnboarding: (ageGroup: AgeGroup, region: Region) => void;
  setRegion: (r: Region) => void;
  setAgeGroup: (a: AgeGroup) => void;
  setCalmMode: (on: boolean) => void;
  setSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  recordTest: (t: { at: number; percent: number; score: number }) => void;
  recordBenchmark: (b: BenchmarkRecord) => void;
  /** Adds (or with a negative number removes) minutes of movement for a day. Never below zero. */
  addMovement: (day: string, minutes: number) => void;
  startExperiment: (e: Experiment) => void;
  /** Saves today's check in the running experiment, replacing any earlier check that day. */
  recordLabEntry: (e: LabEntry) => void;
  endExperiment: () => void;
  saveMood: (e: Omit<MoodEntry, 'at'>) => void;
  saveSleep: (e: Omit<SleepEntry, 'at'>) => void;
  toggleHabit: (habitId: string) => void;
  toggleRafi: (id: string) => void;
  setRafiStatus: (id: string, status: Status) => void;
  addRafiNote: (id: string, text: string) => void;
  removeRafiNote: (id: string, at: number) => void;
  addTask: (title: string, steps: string[]) => void;
  toggleStep: (taskId: string, stepId: string) => void;
  removeTask: (taskId: string) => void;
  addPlan: (when: string, then: string) => void;
  removePlan: (id: string) => void;
  /** Saves a round and adjusts that game's level for next time. */
  /** Saves a round. A challenge round can raise the game's level but never lowers it. */
  recordResult: (r: GameResult, opts?: { challenge?: boolean; setLevel?: number }) => void;
  completeWorkout: (day: string) => void;
  /** Saves a Championships heat. A Logic heat also adjusts the Logic level. */
  recordHeat: (h: Heat) => void;
  setChooseOrder: (on: boolean) => void;
  deleteEverything: () => Promise<void>;
  /** Replaces everything on this device with a restored backup. */
  restoreAll: (saved: Partial<State>) => void;
};

type Ctx = { state: State; ready: boolean } & Actions;

const StoreContext = createContext<Ctx | null>(null);

function mergeSaved(base: State, saved: Partial<State>): State {
  return { ...base, ...saved, settings: { ...base.settings, ...saved.settings }, training: { ...base.training, ...saved.training } };
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>(defaultState);
  const [ready, setReady] = useState(false);
  const loaded = useRef(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) {
          setState((s) => mergeSaved(s, JSON.parse(raw) as Partial<State>));
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
      recordBenchmark: (b) => update((s) => ({ ...s, training: { ...s.training, benchmarks: [...(s.training.benchmarks ?? []), b].slice(-60) } })),
      addMovement: (day, minutes) =>
        update((s) => ({ ...s, movement: { ...s.movement, [day]: Math.max(0, Math.min(600, (s.movement?.[day] ?? 0) + minutes)) } })),
      startExperiment: (e) => update((s) => ({ ...s, lab: [...(s.lab ?? []).map((x) => (x.endedAt ? x : { ...x, endedAt: Date.now() })), e].slice(-20) })),
      recordLabEntry: (entry) =>
        update((s) => {
          const lab = [...(s.lab ?? [])];
          const i = lab.length - 1;
          if (i < 0 || lab[i].endedAt) return s;
          lab[i] = { ...lab[i], entries: [...lab[i].entries.filter((x) => x.day !== entry.day), entry] };
          return { ...s, lab };
        }),
      endExperiment: () => update((s) => ({ ...s, lab: (s.lab ?? []).map((x) => (x.endedAt ? x : { ...x, endedAt: Date.now() })) })),
      recordTest: (rec) => update((s) => ({ ...s, training: { ...s.training, tests: [...(s.training.tests ?? []), rec].slice(-50) } })),
      setSetting: (key, value) => update((s) => ({ ...s, settings: { ...s.settings, [key]: value } })),
      saveMood: (e) => update((s) => ({ ...s, moods: { ...s.moods, [dayKey()]: { ...e, at: Date.now() } } })),
      saveSleep: (e) => update((s) => ({ ...s, sleeps: { ...s.sleeps, [dayKey()]: { ...e, at: Date.now() } } })),
      toggleRafi: (id) =>
        update((s) => {
          const cur = s.rafi ?? [];
          return { ...s, rafi: cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id] };
        }),
      setRafiStatus: (id, status) =>
        update((s) => {
          const cur = recordFor(id, s.rafiPlan, s.rafi);
          return { ...s, rafiPlan: { ...s.rafiPlan, [id]: { ...cur, status } } };
        }),
      addRafiNote: (id, text) =>
        update((s) => {
          const cur = recordFor(id, s.rafiPlan, s.rafi);
          return { ...s, rafiPlan: { ...s.rafiPlan, [id]: { ...cur, log: [{ at: Date.now(), text }, ...cur.log].slice(0, 50) } } };
        }),
      removeRafiNote: (id, at) =>
        update((s) => {
          const cur = recordFor(id, s.rafiPlan, s.rafi);
          return { ...s, rafiPlan: { ...s.rafiPlan, [id]: { ...cur, log: cur.log.filter((l) => l.at !== at) } } };
        }),
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
          tasks: [{ id: uid(), title, createdAt: Date.now(), steps: steps.map((text) => ({ id: uid(), text, done: false })) }, ...s.tasks],
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
      recordResult: (r, opts) =>
        update((s) => {
          const current = s.training.levels[r.game] ?? 1;
          const next = nextLevel(r.level, r.accuracy, s.settings.challenge);
          const level = opts?.setLevel !== undefined ? Math.round(opts.setLevel) : opts?.challenge ? Math.max(current, next > r.level ? next : current) : next;
          return {
            ...s,
            training: {
              ...s.training,
              levels: { ...s.training.levels, [r.game]: level },
              // Keep the most recent 2,000 rounds, which is years of daily use.
              results: [...s.training.results, r].slice(-2000),
            },
          };
        }),
      completeWorkout: (day) =>
        update((s) =>
          s.training.workouts.includes(day) ? s : { ...s, training: { ...s.training, workouts: [...s.training.workouts, day] } },
        ),
      recordHeat: (h) =>
        update((s) => {
          const c = s.championships ?? { heats: [] };
          const logicLevel = h.event === 'logic' ? nextLevel(h.level, h.accuracy, s.settings.challenge) : c.logicLevel;
          return { ...s, championships: { ...c, logicLevel, heats: [...c.heats, h].slice(-3000) } };
        }),
      setChooseOrder: (chooseOrder) => update((s) => ({ ...s, championships: { heats: [], ...s.championships, chooseOrder } })),
      restoreAll: (saved) => update(() => mergeSaved(defaultState(), saved)),
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

/** Settings when inside the provider, otherwise undefined. Lets the theme read them without throwing. */
export function useOptionalSettings(): Settings | undefined {
  return useContext(StoreContext)?.state.settings;
}

export function useStore(): Ctx {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}
