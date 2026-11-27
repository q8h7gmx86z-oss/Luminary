// Knowing when to stop. Pure, so it can be tested in Node. No imports at runtime.
//
// Why: the right level of challenge drives enjoyment, and repeated failure drives people away
// (Mantell 2025). Spaced practice beats massed practice (Cepeda 2006), so there is a point where
// more rounds today add little. Luminary eases off, suggests a change or a break, and says when
// a session is complete, rather than letting someone grind on.

export type RoundLike = { game: string; accuracy: number; day: string; at: number };

export type StopAdvice = {
  kind: 'ease' | 'break' | 'enough';
  title: string;
  body: string;
};

/** Rounds in one day after which Luminary suggests finishing. About 30 minutes of play. */
export const FULL_DAY_ROUNDS = 15;

/**
 * Advice after a round, or null to carry on as normal.
 * @param results every result so far, including the round just played
 * @param current the round just played
 * @param down accuracy below which the level eases (the person's challenge setting)
 */
export function stopAdvice(results: RoundLike[], current: RoundLike, down: number): StopAdvice | null {
  const today = results.filter((r) => r.day === current.day).sort((a, b) => a.at - b.at);
  if (today.length >= FULL_DAY_ROUNDS) {
    return {
      kind: 'enough',
      title: 'A full session',
      body: `That is ${today.length} rounds today. Spacing practice across days beats doing more in one sitting, so this is a good place to finish.`,
    };
  }
  const lastThree = today.slice(-3);
  if (lastThree.length === 3 && lastThree.every((r) => r.accuracy < down)) {
    return {
      kind: 'break',
      title: 'Time for a pause',
      body: 'Three tough rounds in a row. Tiredness lowers every score, so a short break or a calm finish will serve you better than pushing on.',
    };
  }
  const thisGame = today.filter((r) => r.game === current.game).slice(-2);
  if (thisGame.length === 2 && thisGame.every((r) => r.accuracy < down)) {
    return {
      kind: 'ease',
      title: 'This one is hard today',
      body: 'Two rounds below your range, so the level has eased. Try a different game, or come back to this one tomorrow.',
    };
  }
  return null;
}
