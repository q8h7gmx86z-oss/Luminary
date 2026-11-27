// Luminary Plus: one tier, priced and described in one place.
// Pure, so it can be tested in Node. No imports.
//
// Decided by Sandra on 26 November 2026: one tier, £12.99 a month or £89.99 a year, a 7-day free trial,
// no family or shared plans at launch, no weekly plans.

/**
 * Master switch. While false, everything is free and nothing is locked, because payments are not yet
 * connected to the App Store and Google Play. Turn it on only in the same release that connects billing.
 */
export const PLUS_ENABLED = false;

export const PRICES = {
  currency: 'GBP',
  monthly: 12.99,
  annual: 89.99,
  trialDays: 7,
  /** Days before the trial ends that Luminary reminds you, in the app and by notification. */
  reminderDays: 2,
} as const;

export const gbp = (x: number) => `£${x.toFixed(2)}`;

/** The annual plan as a monthly figure, rounded down to the penny so it never overstates. */
export const annualPerMonth = () => Math.floor((PRICES.annual / 12) * 100) / 100;

/** How much the annual plan saves against twelve monthly payments, in whole percent, rounded down. */
export const annualSaving = () => Math.floor((1 - PRICES.annual / (PRICES.monthly * 12)) * 100);

export type Feature =
  | 'allGames'
  | 'championships'
  | 'lab'
  | 'programmes'
  | 'courses'
  | 'recall'
  | 'analytics'
  | 'workout'
  | 'benchmark'
  | 'rafi'
  | 'focus'
  | 'wellbeing'
  | 'research';

/**
 * What each feature is and whether it needs Plus. To move a feature between free and Plus, change `plus` here.
 * Health and safety stay free on principle: the Rafi Programme, focus tools, sleep, mood and movement,
 * the research library and the Benchmark that tells you honestly whether training works.
 */
export const FEATURES: Record<Feature, { name: string; detail: string; plus: boolean }> = {
  workout: { name: 'The daily workout', detail: 'A personal session every day, adapted to your level.', plus: false },
  benchmark: { name: 'The Luminary Benchmark', detail: 'The monthly check on untrained tasks.', plus: false },
  rafi: { name: 'The Rafi Programme', detail: 'The 14 changeable dementia risk factors, as a plan.', plus: false },
  focus: { name: 'Focus tools', detail: 'Focus blocks, task breakdown, plans and the bedtime brain dump.', plus: false },
  wellbeing: { name: 'Sleep, mood and movement', detail: 'Logs and the whole-brain week.', plus: false },
  research: { name: 'The research library', detail: 'Every paper behind every task.', plus: false },
  allGames: { name: 'All twelve tasks, any time', detail: 'Free play of every task, not only the three of the day.', plus: true },
  championships: { name: 'The Neural Championships', detail: 'Adaptive events, seasons and records.', plus: true },
  programmes: { name: 'Four-week programmes', detail: 'A goal, weekly targets and tracking.', plus: true },
  courses: { name: 'Memory courses', detail: 'The Memory Palace and Remember for Good.', plus: true },
  recall: { name: 'The recall deck', detail: 'Your own cards on a widening schedule.', plus: true },
  lab: { name: 'The Personal Lab', detail: 'Randomised experiments on yourself.', plus: true },
  analytics: { name: 'Full analytics', detail: 'Detailed statistics for every task.', plus: true },
};

export const PLUS_FEATURES = (Object.keys(FEATURES) as Feature[]).filter((f) => FEATURES[f].plus);
export const FREE_FEATURES = (Object.keys(FEATURES) as Feature[]).filter((f) => !FEATURES[f].plus);

export type Membership = {
  status: 'free' | 'trial' | 'active' | 'lapsed';
  plan?: 'monthly' | 'annual';
  /** Trial end or next renewal, ms epoch. */
  periodEndsAt?: number;
  /** True when the person has turned off renewal; access continues to periodEndsAt. */
  cancelled?: boolean;
};

/** Whether a feature is open. With the master switch off, everything is. */
export function hasAccess(feature: Feature, m: Membership, enabled: boolean = PLUS_ENABLED): boolean {
  if (!enabled || !FEATURES[feature].plus) return true;
  return m.status === 'trial' || m.status === 'active';
}

/** When to remind someone that their trial is ending: `reminderDays` before it does. */
export function trialReminderAt(trialEndsAt: number): number {
  return trialEndsAt - PRICES.reminderDays * 86_400_000;
}

/** Whole days left in the current period, never negative. */
export function daysLeft(m: Membership, now: number): number {
  return m.periodEndsAt ? Math.max(0, Math.ceil((m.periodEndsAt - now) / 86_400_000)) : 0;
}

/** Where each store lets you manage or cancel a subscription. */
export const MANAGE_URLS = {
  ios: 'https://apps.apple.com/account/subscriptions',
  android: 'https://play.google.com/store/account/subscriptions',
} as const;

/** The fair-billing promises, shown on the Plus page and in Settings. */
export const PROMISES = [
  'One plan, two ways to pay. No weekly plans and no hidden tiers.',
  `A ${PRICES.trialDays}-day free trial. We remind you ${PRICES.reminderDays} days before it ends, so it never turns into a charge you did not expect.`,
  'Cancel in a few taps from your App Store or Google Play account. We show you exactly where.',
  'If you leave, your history, scores and notes stay on your device. Nothing is deleted.',
  'The Rafi Programme, focus tools, sleep, mood and movement, and the research library are always free.',
];
