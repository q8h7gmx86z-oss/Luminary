// The Luminary game standard and evidence dossier, from the approved product blueprint (27 November 2026).
// Pure data, so it can be tested in Node. No game, new or existing, ships until it meets every item.

import type { GameId } from './engine';

export type StandardId =
  | 'task'
  | 'world'
  | 'seconds'
  | 'adaptive'
  | 'stages'
  | 'stopRules'
  | 'feedback'
  | 'finish'
  | 'score'
  | 'dossier'
  | 'belongs'
  | 'accessible'
  | 'tested';

export const GAME_STANDARD: { id: StandardId; title: string; rule: string }[] = [
  { id: 'task', title: 'A named task', rule: 'The laboratory task it is built on, and the one skill it trains.' },
  { id: 'world', title: 'A memorable visual world', rule: 'Its own designed play surface, sound and motion within the studio style.' },
  { id: 'seconds', title: 'Understood in seconds', rule: 'A one-line objective and a short playable tutorial; the first real interaction within 10 seconds.' },
  { id: 'adaptive', title: 'Adaptive', rule: 'Difficulty moves in real units (ms, items, speed) by a staircase aiming at about 85% correct.' },
  { id: 'stages', title: 'Levels that change the challenge', rule: 'New stages change the nature of the challenge, each justified by the skill trained. Complexity alone is not cognitive value.' },
  { id: 'stopRules', title: 'Stop rules', rule: 'After repeated errors it eases off, offers practice, a break, a different game, or a calm end.' },
  { id: 'feedback', title: 'Explaining feedback', rule: 'Speed, accuracy and consistency, compared with your own history.' },
  { id: 'finish', title: 'A satisfying finish', rule: 'A clear completion moment and Aura’s reaction.' },
  { id: 'score', title: 'A defined score', rule: 'Its scoring method and adaptation rules written down.' },
  { id: 'dossier', title: 'An evidence dossier', rule: 'A complete, dated dossier (below).' },
  { id: 'belongs', title: 'A reason to belong', rule: 'Not a harder level or reskin of another game. A variant must play genuinely differently, not just look or sound different, and name its parent task.' },
  { id: 'accessible', title: 'Accessible', rule: 'Untimed where the science allows, no colour-only cues, no flashing, left-handed layout, reduced motion.' },
  { id: 'tested', title: 'Tested with real players', rule: 'Played by the tester for enjoyment and clarity before it joins the core library.' },
];

/** How far a finding reaches. Kept separate so a measure is never presented as proof of training. */
export type EvidenceLevel = 'shown' | 'mixed' | 'not shown' | 'not studied';

/** The structured scientific record behind every research card. */
export type Dossier = {
  /** The laboratory task or established construct, e.g. "Useful Field of View". */
  originalTask: string;
  /** Exactly what the game is meant to train. */
  construct: string;
  /** Does the task reliably measure that construct? */
  measurement: EvidenceLevel;
  /** Does practice improve the task itself? */
  trainingEffect: EvidenceLevel;
  nearTransfer: EvidenceLevel;
  farTransfer: EvidenceLevel;
  everydayOutcomes: EvidenceLevel;
  /** Sample sizes, ages, duration, study quality, shared authors, conflicts. */
  limits: string;
  /** How closely Luminary's game follows the researched task, and where it differs. */
  implementation: string;
  /** Paper ids in src/content/research.ts PAPERS, each checked on PubMed or the publisher. */
  papers: string[];
  /** ISO date the evidence was last checked. Reviewed at least yearly. */
  reviewed: string;
  /** For a variant: the game whose task and evidence it shares. */
  variantOf?: string;
};

/** Days after which a dossier is overdue for review. */
export const REVIEW_EVERY_DAYS = 365;

export function reviewOverdue(d: Pick<Dossier, 'reviewed'>, today: string): boolean {
  return (Date.parse(today) - Date.parse(d.reviewed)) / 86_400_000 > REVIEW_EVERY_DAYS;
}

// --- Protecting the Benchmark ---------------------------------------------------------------------
// The Benchmark only shows transfer if its tasks are never trained. So no game in the training
// library, variant or reskin included, may use a Benchmark paradigm. tests/blueprint.test.ts enforces it.
// Changing a Benchmark task needs a written reason, a new version and a fresh baseline.

/** Paradigms used by the untrained Benchmark (src/training/benchmark.ts MEASURES). */
export const BENCHMARK_PARADIGMS = ['simple reaction time', 'choice reaction time', 'digit span', 'trail making', 'digit symbol coding'] as const;

/** The laboratory paradigm behind each live training game. Every new game and variant is added here. */
export const LIBRARY_PARADIGMS: Record<GameId, string> = {
  speed: 'one-back symbol matching',
  grid: 'Corsi block tapping, forward',
  catch: 'go/no-go',
  nback: 'n-back',
  clash: 'Stroop',
  switch: 'task switching',
  sequence: 'letter-number sequencing',
  echo: 'Corsi block tapping, backward',
  hold: 'stop-signal',
  search: 'visual search',
  tower: 'Tower of London',
  words: 'verbal fluency',
};

/** Library games whose paradigm is a Benchmark paradigm. Must always be empty. */
export function benchmarkLeaks(library: Record<string, string> = LIBRARY_PARADIGMS): string[] {
  const bench = new Set<string>(BENCHMARK_PARADIGMS);
  return Object.entries(library).filter(([, p]) => bench.has(p.toLowerCase())).map(([id]) => id);
}
