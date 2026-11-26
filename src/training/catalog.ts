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
  flexibility: { name: 'Flexibility', color: '#F2A65A', gradient: ['#F2A65A', '#D9822B'], description: 'Switching smoothly between rules and tasks.' },
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
};

/** Games that are playable in this version. */
export const AVAILABLE: GameId[] = ['speed', 'grid', 'catch', 'nback', 'clash', 'switch'];
