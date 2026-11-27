// "Compared with your usual": feedback on speed, accuracy and consistency against your own history.
// Pure, so it can be tested in Node.

export type RoundStats = { level: number; accuracy: number; rtMedian?: number; rtMs?: number; rtSd?: number };

export type Comparison = { label: 'Accuracy' | 'Speed' | 'Consistency'; now: string; usual: string; verdict: 'better' | 'usual' | 'lower' };

/** Rounds needed before Luminary knows your usual. */
export const USUAL_AFTER = 3;

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const rtOf = (r: RoundStats) => r.rtMedian ?? r.rtMs;
/** Coefficient of variation: response time spread relative to speed. Lower is steadier. */
const cvOf = (r: RoundStats) => {
  const rt = rtOf(r);
  return rt && r.rtSd !== undefined ? r.rtSd / rt : undefined;
};

/**
 * Compare a round with your usual on the same game: the median of up to your last 10 rounds,
 * using rounds within two levels when there are enough, so a harder level is judged fairly.
 * Returns null until there are enough rounds to know your usual.
 */
export function compareToUsual(current: RoundStats, past: RoundStats[]): Comparison[] | null {
  const near = past.filter((r) => Math.abs(r.level - current.level) <= 2);
  const pool = (near.length >= USUAL_AFTER ? near : past).slice(-10);
  if (pool.length < USUAL_AFTER) return null;
  const out: Comparison[] = [];

  const acc = median(pool.map((r) => r.accuracy));
  const dAcc = current.accuracy - acc;
  out.push({
    label: 'Accuracy',
    now: `${Math.round(current.accuracy * 100)}%`,
    usual: `${Math.round(acc * 100)}%`,
    verdict: dAcc >= 0.05 ? 'better' : dAcc <= -0.05 ? 'lower' : 'usual',
  });

  const rts = pool.map(rtOf).filter((x): x is number => x !== undefined);
  const rt = rtOf(current);
  if (rt !== undefined && rts.length >= USUAL_AFTER) {
    const usual = median(rts);
    const change = (rt - usual) / usual;
    out.push({ label: 'Speed', now: `${Math.round(rt)} ms`, usual: `${Math.round(usual)} ms`, verdict: change <= -0.05 ? 'better' : change >= 0.05 ? 'lower' : 'usual' });
  }

  const cvs = pool.map(cvOf).filter((x): x is number => x !== undefined);
  const cv = cvOf(current);
  if (cv !== undefined && cvs.length >= USUAL_AFTER) {
    const usual = median(cvs);
    const steadiness = (c: number) => `${Math.max(0, Math.round((1 - c) * 100))}`;
    out.push({ label: 'Consistency', now: steadiness(cv), usual: steadiness(usual), verdict: cv <= usual - 0.03 ? 'better' : cv >= usual + 0.03 ? 'lower' : 'usual' });
  }
  return out;
}
