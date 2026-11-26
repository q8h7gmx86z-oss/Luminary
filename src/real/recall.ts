// The recall deck: retrieval practice on a widening schedule (a Leitner system).
// Pure, so it can be tested in Node. No imports.
//
// Why: testing yourself strengthens memory far more than rereading (Karpicke & Roediger 2008), and
// reviews spread over widening gaps outlast reviews crammed together (Cepeda et al. 2006).

export type RecallCard = { id: string; q: string; a: string; box: number; due: string; created: number };

/** Days until the next review, by box. A correct answer moves a card up one box; a miss sends it back to the start. */
export const INTERVALS = [1, 2, 4, 8, 16, 32];
export const TOP_BOX = INTERVALS.length - 1;

/** The day `n` days after `day` (YYYY-MM-DD), computed at noon UTC so daylight saving cannot shift it. */
export function addDays(day: string, n: number): string {
  return new Date(Date.parse(day + 'T12:00:00Z') + n * 86_400_000).toISOString().slice(0, 10);
}

export function newCard(id: string, q: string, a: string, today: string, now: number): RecallCard {
  // A new card is first tested the next day: a short gap before the first test helps it last.
  return { id, q: q.trim(), a: a.trim(), box: 0, due: addDays(today, 1), created: now };
}

export function review(card: RecallCard, correct: boolean, today: string): RecallCard {
  const box = correct ? Math.min(card.box + 1, TOP_BOX) : 0;
  return { ...card, box, due: addDays(today, correct ? INTERVALS[box] : 1) };
}

export function dueCards(cards: RecallCard[], today: string): RecallCard[] {
  return cards.filter((c) => c.due <= today).sort((x, y) => (x.due < y.due ? -1 : x.due > y.due ? 1 : x.created - y.created));
}

/** Cards in the top box are, for practical purposes, learned. */
export const learned = (cards: RecallCard[]) => cards.filter((c) => c.box === TOP_BOX).length;
