import type { IconName } from '@/components/Icon';

import { GameId, Skill } from './engine';

export type GameInfo = {
  id: GameId;
  name: string;
  skill: Skill;
  tagline: string;
  howTo: string[];
  // The research behind each game lives in src/content/research.ts, keyed by the game id.
  icon: IconName;
  /** The task's own accent colour, used on its icon, bars and glow. */
  accent: string;
};

export const SKILLS: Record<Skill, { name: string; color: string; gradient: [string, string]; description: string }> = {
  speed: { name: 'Processing speed', color: '#4F8CFF', gradient: ['#4F8CFF', '#3B6FE0'], description: 'How quickly you take in and respond to information.' },
  memory: { name: 'Working memory', color: '#9B7BFF', gradient: ['#9B7BFF', '#7561E8'], description: 'Holding and using information in mind for a short time.' },
  attention: { name: 'Attention control', color: '#2DB6A3', gradient: ['#2DB6A3', '#1E8F80'], description: 'Staying on target and holding back automatic responses.' },
  flexibility: { name: 'Flexibility', color: '#F2A65A', gradient: ['#F2A65A', '#D9822B'], description: 'Switching smoothly between rules and tasks, and planning ahead.' },
};

export const GAMES: Record<GameId, GameInfo> = {
  speed: {
    id: 'speed',
    name: 'Speed Match',
    skill: 'speed',
    icon: 'bolt',
    accent: '#4F8CFF',
    tagline: 'Is it the same as the last one?',
    howTo: [
      'A symbol appears. Decide if it matches the one just before it.',
      'Tap Same or Different as fast as you can while staying accurate.',
      'The time limit shrinks as you improve.',
    ],
  },
  grid: {
    id: 'grid',
    name: 'Memory Grid',
    skill: 'memory',
    icon: 'grid',
    accent: '#9B7BFF',
    tagline: 'Watch the lights, then repeat the pattern.',
    howTo: [
      'Tiles light up one at a time. Watch the order.',
      'Then tap the same tiles in the same order.',
      'Get it right and the sequence grows.',
    ],
  },
  catch: {
    id: 'catch',
    name: 'Catch the Light',
    skill: 'attention',
    icon: 'bulb',
    accent: '#2DB6A3',
    tagline: 'Tap the blue lights. Hold back on red.',
    howTo: [
      'Lights flash in the centre of the screen.',
      'Tap quickly when you see a blue light.',
      'Do not tap when you see a red light. Holding back is the real skill.',
    ],
  },
  nback: {
    id: 'nback',
    name: 'Star Tracker',
    skill: 'memory',
    icon: 'star',
    accent: '#6672FF',
    tagline: 'Was the star here before?',
    howTo: [
      'A star appears in one of eight squares, one at a time.',
      'Tap Match when it lands where it was one step back. Later levels go two or three steps back.',
      'Only tap for a match. Holding back counts too.',
    ],
  },
  clash: {
    id: 'clash',
    name: 'Colour Clash',
    skill: 'attention',
    icon: 'palette',
    accent: '#FF7D6B',
    tagline: 'Name the ink, not the word.',
    howTo: [
      'A colour word appears, written in a coloured ink.',
      'Tap the colour of the ink as fast as you can. Ignore what the word says.',
      'More words clash as you level up. If you have colour vision differences, this game may not suit you.',
    ],
  },
  switch: {
    id: 'switch',
    name: 'Switch It',
    skill: 'flexibility',
    icon: 'swap',
    accent: '#F2A65A',
    tagline: 'Odd or even? More or less? Follow the colour.',
    howTo: [
      'A number appears on a coloured card.',
      'Green card: is it odd or even? Orange card: is it less or more than 5?',
      'The rule can switch at any moment. Switching more often comes with higher levels.',
    ],
  },
  sequence: {
    id: 'sequence',
    name: 'Sequence Builder',
    skill: 'memory',
    icon: 'sort',
    accent: '#B48CFF',
    tagline: 'Hold it, then put it in order.',
    howTo: [
      'A mix of numbers and letters appears, one at a time.',
      'Rebuild it in order: numbers first, smallest to largest, then letters from A to Z.',
      'Holding and rearranging at once is the skill. The list grows as you improve.',
    ],
  },
  echo: {
    id: 'echo',
    name: 'Echo',
    skill: 'memory',
    icon: 'rewind',
    accent: '#8F86FF',
    tagline: 'Watch the pattern, then play it back in reverse.',
    howTo: [
      'Tiles light up one at a time. Watch the order.',
      'Tap them back in reverse: last tile first.',
      'Get it right and the sequence grows.',
    ],
  },
  hold: {
    id: 'hold',
    name: 'Hold It',
    skill: 'attention',
    icon: 'stop',
    accent: '#E2607A',
    tagline: 'Go with the arrow. Stop if it turns red.',
    howTo: [
      'An arrow points left or right. Tap that side as fast as you can.',
      'Sometimes the arrow turns red just after it appears. Then stop: tap nothing.',
      'The red signal comes later each time you stop in time, so stopping stays hard. Missing about half of them is normal.',
    ],
  },
  search: {
    id: 'search',
    name: 'Double Take',
    skill: 'speed',
    icon: 'search',
    accent: '#5DA8FF',
    tagline: 'Find the odd one out, fast.',
    howTo: [
      'A field of shapes appears. One of them is different.',
      'Tap the odd one out as quickly as you can.',
      'At higher levels it differs only in its mix of colour and shape, so you have to look properly.',
    ],
  },
  tower: {
    id: 'tower',
    name: 'Next Move',
    skill: 'flexibility',
    icon: 'tower',
    accent: '#E9B45C',
    tagline: 'Plan the moves before you make them.',
    howTo: [
      'Move the balls on the left to match the target on the right.',
      'Tap a peg to lift its top ball, then tap another peg to place it. The pegs hold three, two and one ball.',
      'Aim to match it in the fewest moves shown. Planning first scores best.',
    ],
  },
  words: {
    id: 'words',
    name: 'Word Flow',
    skill: 'flexibility',
    icon: 'words',
    accent: '#F28C5A',
    tagline: 'Does the word fit? The question keeps changing.',
    howTo: [
      'A question and a word appear, such as “Animals?” and “otter”.',
      'Tap Yes if the word fits the question, No if it does not.',
      'The question changes without warning. From level 5 some ask about the first letter instead.',
    ],
  },
};

/** Games that are playable in this version. */
export const AVAILABLE: GameId[] = ['speed', 'grid', 'catch', 'nback', 'clash', 'switch', 'sequence', 'echo', 'hold', 'search', 'tower', 'words'];
