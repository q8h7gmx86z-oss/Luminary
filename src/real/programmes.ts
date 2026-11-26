// Four-week programmes: a goal, a training focus and weekly targets that Luminary tracks for you.
// Pure, so it can be tested in Node.

import type { Goal } from '../training/planner.ts';

export type TargetKind = 'workouts' | 'movement' | 'lessons' | 'recall' | 'focus' | 'dump' | 'sleep' | 'benchmark';

export type Target = { kind: TargetKind; n: number; label: string; course?: string; href: string };

export type Programme = {
  id: string;
  name: string;
  goal: Goal;
  summary: string;
  why: string;
  weeks: Target[][];
};

const workouts = (n = 3): Target => ({ kind: 'workouts', n, label: `${n} training sessions`, href: '/workout' });
const move = (n = 150): Target => ({ kind: 'movement', n, label: `${n} minutes of movement`, href: '/movement' });
const benchmark: Target = { kind: 'benchmark', n: 1, label: 'Take the Luminary Benchmark', href: '/benchmark' };
const lessons = (course: string, n: number, name: string): Target => ({ kind: 'lessons', n, course, label: `${name}: lessons 1 to ${n}`, href: `/courses/${course}` });
const recall = (n: number): Target => ({ kind: 'recall', n, label: `Recall deck on ${n} days`, href: '/recall' });
const focus = (n: number): Target => ({ kind: 'focus', n, label: `${n} focus blocks`, href: '/focus' });
const dump = (n: number): Target => ({ kind: 'dump', n, label: `Bedtime brain dump on ${n} nights`, href: '/dump' });
const sleep = (n: number): Target => ({ kind: 'sleep', n, label: `Sleep logged on ${n} nights`, href: '/sleep' });

export const PROGRAMMES: Programme[] = [
  {
    id: 'speed',
    name: 'Faster Thinking',
    goal: 'speed',
    summary: 'Four weeks centred on processing speed, the skill with the strongest long-term evidence of any brain training.',
    why: 'Speed training was the arm of the ACTIVE trial linked to lower dementia risk ten years later. Aerobic exercise supports the same systems, so movement is part of every week.',
    weeks: [
      [workouts(), move()],
      [workouts(), move()],
      [workouts(), move()],
      [workouts(), move(), benchmark],
    ],
  },
  {
    id: 'memory',
    name: 'Memory Foundations',
    goal: 'memory',
    summary: 'Working memory training, the Memory Palace and a personal recall deck: memory trained, taught and used.',
    why: 'Training improves the memory tasks you practise. Techniques such as the Memory Palace and retrieval practice improve how well you remember real things, which is where the strongest evidence for everyday benefit lies.',
    weeks: [
      [workouts(), lessons('palace', 2, 'The Memory Palace')],
      [workouts(), lessons('palace', 4, 'The Memory Palace'), recall(2)],
      [workouts(), lessons('retrieval', 2, 'Remember for Good'), recall(3)],
      [workouts(), lessons('retrieval', 4, 'Remember for Good'), recall(4)],
    ],
  },
  {
    id: 'focus',
    name: 'Steady Focus',
    goal: 'focus',
    summary: 'Attention training with the tools that make focus easier in daily life: focus blocks, a bedtime brain dump and steady sleep.',
    why: 'Attention depends on sleep as much as practice. A five-minute to-do list at bedtime helped people fall asleep faster in a sleep-laboratory study, and focus blocks make time visible, which many people with ADHD find helps them start and stop.',
    weeks: [
      [workouts(), focus(3), sleep(4)],
      [workouts(), focus(4), dump(3), sleep(5)],
      [workouts(), focus(5), dump(4), sleep(5)],
      [workouts(), focus(5), dump(4), sleep(5)],
    ],
  },
  {
    id: 'whole',
    name: 'The Whole Brain',
    goal: 'mixed',
    summary: 'Balanced training across all four skills, with movement and sleep: the pattern behind the FINGER trial.',
    why: 'In the FINGER trial, combining brain training with exercise, diet and heart-health checks protected thinking better than standard advice. No single habit carries the whole load.',
    weeks: [
      [workouts(), move(), sleep(4)],
      [workouts(), move(), sleep(5)],
      [workouts(), move(), sleep(5)],
      [workouts(), move(), sleep(5), benchmark],
    ],
  },
];

export const programmeById = (id: string) => PROGRAMMES.find((p) => p.id === id);

export type Activity = {
  workouts: string[];
  movement?: Record<string, number>;
  sleeps: Record<string, unknown>;
  /** Lesson id to when it was completed. */
  lessons?: Record<string, number>;
  /** Day to number of recall cards reviewed. */
  reviews?: Record<string, number>;
  /** Day to number of focus blocks finished. */
  focusBlocks?: Record<string, number>;
  /** Days with a bedtime brain dump. */
  dumps?: Record<string, unknown>;
  /** When each Benchmark was taken. */
  benchmarks?: number[];
};

const DAY = 86_400_000;
const addDays = (day: string, n: number) => new Date(Date.parse(day + 'T12:00:00Z') + n * DAY).toISOString().slice(0, 10);
export const PROGRAMME_DAYS = 28;

/** Which week of the programme `today` falls in, from 0. 4 or more means the programme has finished. */
export function weekOf(start: string, today: string): number {
  return Math.floor(Math.round((Date.parse(today + 'T12:00:00Z') - Date.parse(start + 'T12:00:00Z')) / DAY) / 7);
}

export type TargetProgress = Target & { done: number; met: boolean };

/** Progress on each target of one week. Lessons and the Benchmark count from the programme's start; the rest count within the week. */
export function weekProgress(p: Programme, start: string, week: number, a: Activity): TargetProgress[] {
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, week * 7 + i));
  const inWeek = (rec: Record<string, unknown> | undefined) => days.filter((d) => rec?.[d] !== undefined).length;
  const startMs = Date.parse(start + 'T00:00:00');
  return (p.weeks[week] ?? []).map((t) => {
    let done = 0;
    if (t.kind === 'workouts') done = days.filter((d) => a.workouts.includes(d)).length;
    else if (t.kind === 'movement') done = days.reduce((s, d) => s + (a.movement?.[d] ?? 0), 0);
    else if (t.kind === 'lessons') done = Object.keys(a.lessons ?? {}).filter((id) => id.startsWith(t.course + '-')).length;
    else if (t.kind === 'recall') done = days.filter((d) => (a.reviews?.[d] ?? 0) > 0).length;
    else if (t.kind === 'focus') done = days.reduce((s, d) => s + (a.focusBlocks?.[d] ?? 0), 0);
    else if (t.kind === 'dump') done = inWeek(a.dumps);
    else if (t.kind === 'sleep') done = inWeek(a.sleeps);
    else if (t.kind === 'benchmark') done = (a.benchmarks ?? []).filter((at) => at >= startMs).length;
    return { ...t, done, met: done >= t.n };
  });
}

/** Weeks in which every target was met, out of the weeks finished so far. */
export function weeksMet(p: Programme, start: string, today: string, a: Activity): { met: number; finished: number } {
  const finished = Math.min(4, weekOf(start, today));
  let met = 0;
  for (let w = 0; w < finished; w++) if (weekProgress(p, start, w, a).every((t) => t.met)) met += 1;
  return { met, finished };
}
