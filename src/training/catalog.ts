import { GameId, Skill } from './engine';

export type Source = { label: string; url: string };

export type GameInfo = {
  id: GameId;
  name: string;
  skill: Skill;
  tagline: string;
  howTo: string[];
  /** Honest summary of what the research does and does not show. */
  science: string;
  sources: Source[];
  glyph: string;
};

export const SKILLS: Record<Skill, { name: string; color: string; description: string }> = {
  speed: { name: 'Processing speed', color: '#4B5FD6', description: 'How quickly you take in and respond to information.' },
  memory: { name: 'Working memory', color: '#7A5AE0', description: 'Holding and using information in mind for a short time.' },
  attention: { name: 'Attention control', color: '#1F9D8B', description: 'Staying on target and holding back automatic responses.' },
  flexibility: { name: 'Flexibility', color: '#D9822B', description: 'Switching smoothly between rules and tasks.' },
};

const LAMPIT = { label: 'Lampit et al. 2014, PLoS Medicine', url: 'https://doi.org/10.1371/journal.pmed.1001756' };
const EDWARDS = { label: 'Edwards et al. 2017, ACTIVE trial 10-year follow-up', url: 'https://doi.org/10.1016/j.trci.2017.09.002' };
const MELBY = { label: 'Melby-Lervåg et al. 2016, Perspectives on Psychological Science', url: 'https://doi.org/10.1177/1745691616635612' };
const CORTESE = { label: 'Cortese et al. 2015, J Am Acad Child Adolesc Psychiatry', url: 'https://doi.org/10.1016/j.jaac.2014.12.010' };

export const GAMES: Record<GameId, GameInfo> = {
  speed: {
    id: 'speed',
    name: 'Speed Match',
    skill: 'speed',
    glyph: '⚡',
    tagline: 'Is it the same as the last one?',
    howTo: [
      'A symbol appears. Decide if it matches the one just before it.',
      'Tap Same or Different as fast as you can while staying accurate.',
      'The time limit shrinks as you improve.',
    ],
    science:
      'Speed-of-processing training has the strongest long-term evidence of any brain training. In the ACTIVE trial, older adults who did about ten sessions had a 29% lower risk of dementia ten years later than a group with no training. That was one large trial, and the training was supervised, so treat it as promising rather than proven for everyone.',
    sources: [EDWARDS, LAMPIT],
  },
  grid: {
    id: 'grid',
    name: 'Memory Grid',
    skill: 'memory',
    glyph: '▦',
    tagline: 'Watch the lights, then repeat the pattern.',
    howTo: [
      'Tiles light up one at a time. Watch the order.',
      'Then tap the same tiles in the same order.',
      'Get it right and the sequence grows.',
    ],
    science:
      'This is based on the Corsi block task, a standard test of visual working memory. Practice reliably improves working memory tasks like this one. Reviews find little evidence that it boosts intelligence or school grades on its own, so we treat it as one part of a balanced routine.',
    sources: [MELBY, LAMPIT],
  },
  catch: {
    id: 'catch',
    name: 'Catch the Light',
    skill: 'attention',
    glyph: '◉',
    tagline: 'Tap the blue lights. Hold back on red.',
    howTo: [
      'Lights flash in the centre of the screen.',
      'Tap quickly when you see a blue light.',
      'Do not tap when you see a red light. Holding back is the real skill.',
    ],
    science:
      'This is a go/no-go task, used in research to measure response inhibition, which is often harder for people with ADHD. Training improves performance on tasks like this. In ADHD, effects on everyday symptoms are small when rated by people who do not know who trained, so this is practice, not treatment.',
    sources: [CORTESE],
  },
  nback: {
    id: 'nback',
    name: 'Star Tracker',
    skill: 'memory',
    glyph: '✦',
    tagline: 'Coming soon',
    howTo: [],
    science: '',
    sources: [MELBY],
  },
  clash: {
    id: 'clash',
    name: 'Colour Clash',
    skill: 'attention',
    glyph: '◐',
    tagline: 'Coming soon',
    howTo: [],
    science: '',
    sources: [],
  },
  switch: {
    id: 'switch',
    name: 'Switch It',
    skill: 'flexibility',
    glyph: '⇄',
    tagline: 'Coming soon',
    howTo: [],
    science: '',
    sources: [],
  },
};

/** Games that are playable in this version. */
export const AVAILABLE: GameId[] = ['speed', 'grid', 'catch'];
