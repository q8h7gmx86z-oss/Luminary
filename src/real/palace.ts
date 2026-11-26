// Memory Palace practice: ten concrete words, placed along your own route, recalled in order.
// Pure, so it can be tested in Node. No imports.

/** Concrete, easily pictured nouns. Abstract words are much harder to turn into images. */
export const PALACE_WORDS = [
  'anchor', 'balloon', 'candle', 'drum', 'elephant', 'feather', 'guitar', 'hammer', 'igloo', 'jellyfish',
  'kettle', 'lemon', 'mirror', 'necklace', 'owl', 'piano', 'quilt', 'rocket', 'saddle', 'tiger',
  'umbrella', 'violin', 'whistle', 'yacht', 'zebra', 'bucket', 'cactus', 'dragon', 'envelope', 'fountain',
  'glove', 'helmet', 'iceberg', 'jigsaw', 'ladder', 'magnet', 'nest', 'orange', 'parrot', 'rose',
  'scissors', 'trumpet', 'volcano', 'wheel', 'crown', 'diamond', 'lantern', 'pumpkin', 'snowman', 'teapot',
];

export const PALACE_SIZE = 10;

function shuffle<T>(xs: T[], rand: () => number): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** The ten words to place, and a shuffled board of those ten plus ten others to recall from. */
export function makePalace(rand: () => number = Math.random): { list: string[]; board: string[] } {
  const pool = shuffle(PALACE_WORDS, rand);
  const list = pool.slice(0, PALACE_SIZE);
  const board = shuffle([...list, ...pool.slice(PALACE_SIZE, PALACE_SIZE * 2)], rand);
  return { list, board };
}

/** Words recalled in the right position. */
export function scorePalace(list: string[], answer: string[]): number {
  return list.filter((w, i) => answer[i] === w).length;
}
