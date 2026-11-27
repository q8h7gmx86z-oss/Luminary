// Aura's conversation: what the app sends to the luminary-aura server function.
// Pure functions, so the request can be tested without a network.

import { aboutSource, EVIDENCE, PAPERS, VERDICTS } from '../content/research.ts';

export type ChatTurn = { role: 'user' | 'assistant'; content: string };

/** Luminary's research cards as plain text. Stable between requests, so the server can cache it. */
export function researchLibrary(): string {
  return EVIDENCE.map((e) => {
    const papers = e.papers
      .map((id) => PAPERS[id])
      .filter(Boolean)
      .map((p) => {
        const about = aboutSource(p).join(' ');
        return `  - ${p.short}, "${p.title}", ${p.journal} ${p.year}. ${p.design}. Finding: ${p.finding}${about ? ` About the source: ${about}` : ''}`;
      })
      .join('\n');
    return [
      `## ${e.name} (${e.kind}; ${VERDICTS[e.verdict].label})`,
      `Why: ${e.why}`,
      `Highlights: ${e.highlights.join(' ')}`,
      `The honest part: ${e.limits}`,
      `Papers:\n${papers}`,
    ].join('\n');
  }).join('\n\n');
}

export type ContextInput = {
  sessionMinutes: number;
  goal: string;
  score: number | null;
  baselineGain: number | null;
  skills: { name: string; points: number; max: number }[];
  games: { name: string; level: number; lastAccuracy: number | null }[];
  sessionsThisWeek: number;
  streakDays: number;
  untimed: boolean;
};

/** A short, factual summary of the person's training. Nothing identifying is included. */
export function trainingContext(c: ContextInput): string {
  if (c.score === null) return `No training yet. Preferred session: ${c.sessionMinutes} minutes, goal: ${c.goal}.`;
  const lines = [
    `Performance score ${c.score} of 1000${c.baselineGain !== null ? ` (${c.baselineGain >= 0 ? '+' : ''}${c.baselineGain} since baseline)` : ''}.`,
    `Skills: ${c.skills.map((s) => `${s.name} ${s.points}/${s.max}`).join(', ')}.`,
    `Games played: ${c.games
      .map((g) => `${g.name} level ${g.level}${g.lastAccuracy !== null ? ` (last ${Math.round(g.lastAccuracy * 100)}%)` : ''}`)
      .join(', ')}.`,
    `Sessions this week: ${c.sessionsThisWeek} of 3. Streak: ${c.streakDays} days.`,
    `Preferences: ${c.sessionMinutes}-minute sessions, goal ${c.goal}${c.untimed ? ', untimed mode' : ''}.`,
  ];
  return lines.join('\n');
}

/** Keeps the last turns that fit, always starting with the person. */
export function trimTurns(turns: ChatTurn[], max = 16): ChatTurn[] {
  const t = turns.filter((x) => x.content.trim()).slice(-max);
  while (t.length && t[0].role !== 'user') t.shift();
  return t;
}

export type AskResult = { ok: true; text: string } | { ok: false; reason: 'offline' | 'busy' | 'unavailable' | 'not-configured' };

/** Sends the conversation to Aura. */
export async function askAura(
  endpoint: string | undefined,
  key: string | undefined,
  body: { messages: ChatTurn[]; context: string; topic?: string; library: string; ageGroup: string | null },
  fetcher: typeof fetch = fetch,
): Promise<AskResult> {
  if (!endpoint) return { ok: false, reason: 'not-configured' };
  try {
    const res = await fetcher(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(key ? { apikey: key, Authorization: `Bearer ${key}` } : {}) },
      body: JSON.stringify({ ...body, messages: trimTurns(body.messages) }),
    });
    if (res.status === 429) return { ok: false, reason: 'busy' };
    if (!res.ok) return { ok: false, reason: 'unavailable' };
    const data = (await res.json()) as { answer_text?: string };
    const text = (data.answer_text ?? '').trim();
    return text ? { ok: true, text } : { ok: false, reason: 'unavailable' };
  } catch {
    return { ok: false, reason: 'offline' };
  }
}
