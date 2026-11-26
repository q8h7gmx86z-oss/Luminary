// The Neural Championships: one event per thinking skill, each trained at your own threshold.
// Pure logic, so plain Node can test it. Records and medals compare you only with yourself.
import { catchParams, dayIndex, gridParams, MAX_LEVEL, speedParams } from './engine.ts';
import type { Challenge, GameId } from './engine.ts';

export type EventId = 'sprint' | 'span' | 'focus' | 'shift' | 'logic';
export type Unit = 'ms' | 'items' | 'level';

export type ChampEvent = {
  id: EventId;
  name: string;
  skill: string;
  /** The task the event is played as. Logic has its own task. */
  game: GameId | 'logic';
  task: string;
  /** Evidence entry for the research card. */
  research: string;
  accent: string;
  unit: Unit;
  better: 'lower' | 'higher';
  /** What the threshold measures, in one sentence. */
  measure: string;
  /** How the event adapts, in plain terms. */
  adapts: string;
};

export const EVENT_ORDER: EventId[] = ['sprint', 'span', 'focus', 'shift', 'logic'];

/**
 * Events whose difficulty adjusts after every answer, as in classic threshold tests. Span and Logic
 * have too few items per heat for a staircase, and Shift measures a switch cost, so those adjust between heats.
 */
export const STAIRCASE: EventId[] = ['sprint', 'focus'];

export const EVENTS: Record<EventId, ChampEvent> = {
  sprint: {
    id: 'sprint',
    name: 'Sprint',
    skill: 'Processing speed',
    game: 'speed',
    task: 'Speed Match',
    research: 'speed',
    accent: '#4F8CFF',
    unit: 'ms',
    better: 'lower',
    measure: 'The shortest response window in which you still reach your target accuracy. Lower is better.',
    adapts: 'Each level shortens the response window by 80 ms.',
  },
  span: {
    id: 'span',
    name: 'Span',
    skill: 'Working memory',
    game: 'grid',
    task: 'Memory Grid',
    research: 'grid',
    accent: '#9B7BFF',
    unit: 'items',
    better: 'higher',
    measure: 'The longest sequence you can reproduce at your target accuracy. Higher is better.',
    adapts: 'Every second level adds one item to the sequence, and the grid widens from level 8.',
  },
  focus: {
    id: 'focus',
    name: 'Focus',
    skill: 'Attention control',
    game: 'catch',
    task: 'Catch the Light',
    research: 'catch',
    accent: '#2DB6A3',
    unit: 'ms',
    better: 'lower',
    measure: 'The shortest display time at which you still respond and withhold accurately. Lower is better.',
    adapts: 'Each level shortens the display time and raises the share of stop signals.',
  },
  shift: {
    id: 'shift',
    name: 'Shift',
    skill: 'Flexibility',
    game: 'switch',
    task: 'Switch It',
    research: 'switch',
    accent: '#F2A65A',
    unit: 'ms',
    better: 'lower',
    measure: 'Switch cost: the extra time a change of rule costs you, measured when you are on target. Lower is better.',
    adapts: 'Each level makes rule changes more frequent and shortens the response window.',
  },
  logic: {
    id: 'logic',
    name: 'Logic',
    skill: 'Reasoning',
    game: 'logic',
    task: 'Pattern matrices',
    research: 'reasoning',
    accent: '#E2E0F5',
    unit: 'level',
    better: 'higher',
    measure: 'The most demanding matrix level you solve at your target accuracy. Higher is better.',
    adapts: 'Higher levels add rules that vary at once and allow less time for each matrix.',
  },
};

/** Target accuracy for each training intensity. 85% is associated with the fastest learning. */
export const TARGET: Record<Challenge, number> = { steady: 0.9, balanced: 0.85, push: 0.75 };

export type Heat = {
  event: EventId;
  level: number;
  accuracy: number;
  /** Threshold in the event's unit. Missing when the heat could not measure it. */
  value?: number;
  untimed: boolean;
  at: number;
  day: string;
};

/** Logic matrices: how many rules vary at once, matrices per heat, time per matrix. */
export function logicParams(level: number) {
  return {
    rules: Math.min(4, 1 + Math.floor((level - 1) / 4)),
    items: 8,
    itemMs: Math.max(15_000, 40_000 - level * 1_200),
  };
}

/** The level you have shown you can hold: this one if you met the target, else the one below. */
export function heldLevel(level: number, accuracy: number, target: number): number {
  return accuracy >= target ? level : Math.max(1, level - 1);
}

export function unitOf(event: EventId, untimed: boolean): Unit {
  return untimed ? 'level' : EVENTS[event].unit;
}

export function betterOf(event: EventId, untimed: boolean): 'lower' | 'higher' {
  return untimed ? 'higher' : EVENTS[event].better;
}

/** Threshold for a finished heat, in the event's own unit, or nothing when below target. Untimed heats are measured in levels. */
export function thresholdFor(
  event: EventId,
  level: number,
  accuracy: number,
  target: number,
  untimed: boolean,
  metrics?: Record<string, number>,
): number | undefined {
  // A staircase heat measures the threshold directly. Otherwise only a heat at or above target does.
  const stair = metrics?.stairLevel;
  if (stair === undefined && accuracy < target) return undefined;
  const held = stair ?? heldLevel(level, accuracy, target);
  if (untimed) return held;
  switch (event) {
    case 'sprint':
      return Math.round(speedParams(held).deadlineMs);
    case 'span':
      return gridParams(held).span;
    case 'focus':
      return Math.round(catchParams(held).showMs);
    case 'shift': {
      const cost = metrics?.switchCost;
      return cost !== undefined ? Math.max(0, Math.round(cost)) : undefined;
    }
    case 'logic':
      return held;
  }
}

// --- Trial-by-trial staircase ------------------------------------------------------

/**
 * Weighted up-down staircase (Kaernbach 1991). Each correct answer makes the next trial a small
 * step harder; each error makes it easier by step × p / (1 − p). It settles where you answer
 * correctly a share p of the time, so the target accuracy is held trial by trial.
 */
export type Stair = { level: number; up: number; down: number; min: number; max: number; dir: 0 | 1 | -1; reversals: number[]; trials: number };

export function makeStair(start: number, target: number, step = 0.5, min = 1, max = MAX_LEVEL): Stair {
  return { level: Math.min(max, Math.max(min, start)), up: step, down: (step * target) / (1 - target), min, max, dir: 0, reversals: [], trials: 0 };
}

export function stepStair(s: Stair, correct: boolean): Stair {
  const dir: 1 | -1 = correct ? 1 : -1;
  const level = Math.min(s.max, Math.max(s.min, s.level + (correct ? s.up : -s.down)));
  const reversals = s.dir !== 0 && dir !== s.dir ? [...s.reversals, s.level] : s.reversals;
  return { ...s, level, dir, reversals, trials: s.trials + 1 };
}

/** Threshold estimate: the mean level at the last six reversals. Needs at least three. */
export function stairEstimate(s: Stair): number | undefined {
  if (s.reversals.length < 3) return undefined;
  const last = s.reversals.slice(-6);
  return last.reduce((a, b) => a + b, 0) / last.length;
}

export function formatValue(value: number | undefined, unit: Unit): string {
  if (value === undefined) return 'Not yet measured';
  const v = unit === 'items' ? Math.round(value * 10) / 10 : Math.round(value);
  if (unit === 'ms') return `${v} ms`;
  if (unit === 'items') return `${v} ${v === 1 ? 'item' : 'items'}`;
  return `Level ${v}`;
}

const isBetter = (a: number, b: number, dir: 'lower' | 'higher') => (dir === 'lower' ? a < b : a > b);

/** Heats for one event and one mode (timed or untimed), oldest first. Records never mix the two. */
export function heatsFor(heats: Heat[], event: EventId, untimed: boolean): Heat[] {
  return heats.filter((h) => h.event === event && h.untimed === untimed);
}

/**
 * Personal record, confirmed across two heats: the best value you have reached at least twice.
 * One lucky heat cannot set it.
 */
export function confirmedRecord(heats: Heat[], dir: 'lower' | 'higher'): number | undefined {
  const vs = heats.map((h) => h.value).filter((v): v is number => v !== undefined);
  if (vs.length < 2) return undefined;
  vs.sort((a, b) => (dir === 'lower' ? a - b : b - a));
  return vs[1];
}

export type Medal = 'gold' | 'silver' | 'bronze' | 'none';

export const MEDALS: Record<Medal, { label: string; meaning: string; color: string }> = {
  gold: { label: 'Gold', meaning: 'New personal record', color: '#E8BD72' },
  silver: { label: 'Silver', meaning: 'Above your four-week average', color: '#C9CEDD' },
  bronze: { label: 'Bronze', meaning: 'Held at threshold', color: '#D99A6C' },
  none: { label: 'Completed', meaning: 'Below target this time', color: '#9298B3' },
};

/** The medal a new heat earns against your own earlier heats in the same event and mode. */
export function medalFor(heat: Heat, earlier: Heat[], target: number): Medal {
  const dir = betterOf(heat.event, heat.untimed);
  const prior = heatsFor(earlier, heat.event, heat.untimed);
  const before = confirmedRecord(prior, dir);
  const after = confirmedRecord([...prior, heat], dir);
  if (heat.value !== undefined && before !== undefined && after !== undefined && isBetter(after, before, dir)) return 'gold';
  const cutoff = dayIndex(heat.day) - 28;
  const recent = prior.filter((h) => h.value !== undefined && dayIndex(h.day) > cutoff).map((h) => h.value!);
  if (heat.value !== undefined && recent.length >= 2) {
    const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
    if (isBetter(heat.value, avg, dir)) return 'silver';
  }
  return heat.value !== undefined || heat.accuracy >= target ? 'bronze' : 'none';
}

// --- Seasons ---------------------------------------------------------------------

export type Phase = 'Trials' | 'Training' | 'Finals';
export type Season = { number: number; startDay: number; week: 1 | 2 | 3 | 4; phase: Phase; daysLeft: number };

/** Seasons last 28 days from your first heat. A new one starts with your next heat after that. */
export function seasonOf(heats: Heat[], today: string): Season {
  const t = dayIndex(today);
  const days = [...new Set(heats.map((h) => dayIndex(h.day)))].sort((a, b) => a - b);
  let start = days[0] ?? t;
  let number = 1;
  for (;;) {
    const next = days.find((d) => d >= start + 28);
    if (next === undefined || next > t) break;
    start = next;
    number += 1;
  }
  if (t >= start + 28) {
    // The last season has ended and today's heat will open the next one.
    return { number: number + 1, startDay: t, week: 1, phase: 'Trials', daysLeft: 28 };
  }
  const week = (Math.floor((t - start) / 7) + 1) as Season['week'];
  const phase: Phase = week === 1 ? 'Trials' : week === 4 ? 'Finals' : 'Training';
  return { number, startDay: start, week, phase, daysLeft: start + 28 - t };
}

/** Four sessions make a full week. Missed days carry no penalty. */
export const FULL_WEEK = 4;

/** Days with at least one heat in the current season week. */
export function sessionsThisWeek(heats: Heat[], season: Season): number {
  const from = season.startDay + (season.week - 1) * 7;
  return new Set(heats.map((h) => dayIndex(h.day)).filter((d) => d >= from && d < from + 7)).size;
}

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : undefined);

export type EventStanding = {
  event: EventId;
  unit: Unit;
  better: 'lower' | 'higher';
  /** Mean of your last three measured heats. */
  current?: number;
  record?: number;
  /** Mean of this season's week 1 heats. */
  baseline?: number;
  /** Improvement on baseline as a share, positive is better. */
  change?: number;
  /** Your level as a share of the top level, for the chart. */
  levelNow: number;
  levelBaseline?: number;
  heats: number;
  /** Measured values, oldest first, for the trend line. */
  trend: number[];
};

export function standing(heats: Heat[], event: EventId, untimed: boolean, season: Season, maxLevel = MAX_LEVEL): EventStanding {
  const hs = heatsFor(heats, event, untimed);
  const unit = unitOf(event, untimed);
  const better = betterOf(event, untimed);
  const measured = hs.filter((h) => h.value !== undefined);
  const current = mean(measured.slice(-3).map((h) => h.value!));
  const inSeason = hs.filter((h) => dayIndex(h.day) >= season.startDay);
  const week1 = inSeason.filter((h) => dayIndex(h.day) < season.startDay + 7);
  const baseline = mean(week1.filter((h) => h.value !== undefined).map((h) => h.value!));
  let change: number | undefined;
  if (current !== undefined && baseline !== undefined && baseline !== 0 && season.week > 1) {
    change = better === 'lower' ? (baseline - current) / baseline : (current - baseline) / baseline;
  }
  const lv = mean(hs.slice(-3).map((h) => h.level));
  const lb = mean(week1.map((h) => h.level));
  return {
    event,
    unit,
    better,
    current,
    record: confirmedRecord(hs, better),
    baseline,
    change,
    levelNow: lv === undefined ? 0 : Math.min(1, lv / maxLevel),
    levelBaseline: lb === undefined ? undefined : Math.min(1, lb / maxLevel),
    heats: hs.length,
    trend: measured.slice(-12).map((h) => h.value!),
  };
}

/** Heat order. Unless you choose it yourself, the weakest event goes first, while attention is highest. */
export function heatOrder(levels: Record<EventId, number>, chooseOrder: boolean): EventId[] {
  if (chooseOrder) return [...EVENT_ORDER];
  return [...EVENT_ORDER].sort((a, b) => levels[a] - levels[b] || EVENT_ORDER.indexOf(a) - EVENT_ORDER.indexOf(b));
}
