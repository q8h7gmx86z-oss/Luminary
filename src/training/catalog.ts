import type { IconName } from '@/components/Icon';

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

const LAMPIT = { label: 'Lampit et al. 2014, PLoS Medicine', url: 'https://doi.org/10.1371/journal.pmed.1001756' };
const EDWARDS = { label: 'Edwards et al. 2017, ACTIVE trial 10-year follow-up', url: 'https://doi.org/10.1016/j.trci.2017.09.002' };
const MELBY = { label: 'Melby-Lervåg et al. 2016, Perspectives on Psychological Science', url: 'https://doi.org/10.1177/1745691616635612' };
const JAEGGI = { label: 'Jaeggi et al. 2008, PNAS', url: 'https://pubmed.ncbi.nlm.nih.gov/18443283/' };
const AU = { label: 'Au et al. 2015, Psychonomic Bulletin & Review (meta-analysis)', url: 'https://pubmed.ncbi.nlm.nih.gov/25102926/' };
const SCARPINA = { label: 'Scarpina & Tagini 2017, Frontiers in Psychology', url: 'https://pubmed.ncbi.nlm.nih.gov/28446889/' };
const KARBACH = { label: 'Karbach & Kray 2009, Developmental Science', url: 'https://pubmed.ncbi.nlm.nih.gov/19840052/' };
const CORTESE = { label: 'Cortese et al. 2015, J Am Acad Child Adolesc Psychiatry', url: 'https://doi.org/10.1016/j.jaac.2014.12.010' };

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
    science:
      'Speed-of-processing training has the strongest long-term evidence of any brain training. In the ACTIVE trial, older adults who did about ten sessions had a 29% lower risk of dementia ten years later than a group with no training. That was one large trial, and the training was supervised, so treat it as promising rather than proven for everyone.',
    sources: [EDWARDS, LAMPIT],
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
    science:
      'This is based on the Corsi block task, a standard test of visual working memory. Practice reliably improves working memory tasks like this one. Reviews find little evidence that it boosts intelligence or school grades on its own, so we treat it as one part of a balanced routine.',
    sources: [MELBY, LAMPIT],
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
    science:
      'This is a go/no-go task, used in research to measure response inhibition: the brake that stops an automatic response. Training improves performance on tasks like this. In ADHD, effects on everyday symptoms are small when rated by people who do not know who trained, so this is practice, not treatment.',
    sources: [CORTESE],
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
    science:
      'This is the n-back task, the most studied working memory exercise. An early study suggested it could raise reasoning scores, but larger reviews found the gains mostly stay with the task itself and similar memory tasks. It is a good, demanding memory workout, not a way to raise IQ.',
    sources: [JAEGGI, AU, MELBY],
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
    science:
      'This is the Stroop task, used for nearly a century to measure how well we override an automatic habit, here reading. It is a reliable measure of attention control. Practice makes you better at this task, but there is no good evidence that Stroop practice alone changes everyday attention.',
    sources: [SCARPINA, LAMPIT],
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
    science:
      'Task switching is a core part of executive function, the mental skills that help with planning and changing course. In a controlled study, switching practice reduced the cost of switching and showed some transfer to related tasks, with bigger gains in children and older adults. Effects on daily life are not yet proven.',
    sources: [KARBACH, LAMPIT],
  },
};

/** Games that are playable in this version. */
export const AVAILABLE: GameId[] = ['speed', 'grid', 'catch', 'nback', 'clash', 'switch'];
