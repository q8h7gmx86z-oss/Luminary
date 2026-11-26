// Memory courses: short lessons on techniques with strong evidence, each with practice in the app.
// No imports, so plain Node can test it.

export type Lesson = { id: string; title: string; minutes: number; body: string[]; practise: string };

export type Course = {
  id: string;
  title: string;
  subtitle: string;
  /** Where the course's practice lives. */
  practice: { label: string; href: string };
  /** The research card that holds the papers. */
  evidence: string;
  lessons: Lesson[];
};

export const COURSES: Course[] = [
  {
    id: 'palace',
    title: 'The Memory Palace',
    subtitle: 'The technique behind every memory champion, in four lessons.',
    practice: { label: 'Practise with ten words', href: '/courses/palace-practice' },
    evidence: 'palace',
    lessons: [
      {
        id: 'palace-1',
        title: 'Why places work',
        minutes: 3,
        body: [
          'Your memory for places is remarkable. You can walk through your home in your mind and see every room in order, without ever having tried to learn it. The method of loci, or Memory Palace, borrows that strength: you remember new things by placing them along a route you already know.',
          'The technique is ancient. Roman orators used it to deliver long speeches without notes. Today it is the method most competitors in memory championships rely on.',
          'It is not a trick reserved for the gifted. In a study published in Neuron, ordinary people who trained in the method for six weeks began to show brain network patterns resembling those of memory champions, and their memory gains were still there four months later.',
        ],
        practise: 'Close your eyes and walk from your front door to your bed. Notice how many distinct places you pass without effort.',
      },
      {
        id: 'palace-2',
        title: 'Build your first palace',
        minutes: 4,
        body: [
          'Choose a route you know intimately: your home, your street, the walk to a favourite café. Pick ten stops along it, in an order that never changes. For example: the front door, the hall mirror, the coat stand, the kitchen table, the sink, and so on.',
          'Distinct stops work best. Avoid two places that look alike, such as two identical chairs, because images placed there will blur together.',
          'Walk the route in your mind twice, stop by stop, until the order is automatic. This is your palace. You will reuse it many times.',
        ],
        practise: 'Write down your ten stops in order, then recite them backwards. If you can, the palace is ready.',
      },
      {
        id: 'palace-3',
        title: 'Make the images unforgettable',
        minutes: 4,
        body: [
          'To store a word, turn it into a vivid picture and make it interact with a stop. To remember "kettle" at the front door, do not simply picture a kettle near the door. Picture a giant kettle wedged in the doorway, whistling furiously and steaming up the glass.',
          'Four things make an image stick: size (make it enormous or tiny), movement (make it act), senses (hear it, smell it, feel its heat) and the unexpected (the stranger, the better).',
          'Spend about five seconds on each image. Speed comes with practice; vividness matters more than pace at the start.',
        ],
        practise: 'Place "elephant" at your first stop and "feather" at your second. Make each one move, make a sound and touch the place.',
      },
      {
        id: 'palace-4',
        title: 'Recall, reuse and real life',
        minutes: 3,
        body: [
          'To recall, walk the route slowly and look at each stop. The image you left there will be waiting. If one has faded, move on and return to it; the next stop often brings it back.',
          'You can reuse a palace once the old images have faded, usually after a day or two. Many people keep several palaces for different purposes.',
          'Use it for what matters to you: a shopping list, the points of a talk, the steps of a recipe, or the names of people you will meet. Practise for a few minutes a few times a week, and recall becomes fast and reliable.',
        ],
        practise: 'Take the ten-word practice. Then, tomorrow, walk the palace again and see how many images are still there.',
      },
    ],
  },
  {
    id: 'retrieval',
    title: 'Remember for Good',
    subtitle: 'Retrieval and spacing: the two habits that make learning last.',
    practice: { label: 'Open your recall deck', href: '/recall' },
    evidence: 'recall',
    lessons: [
      {
        id: 'retrieval-1',
        title: 'Testing beats rereading',
        minutes: 3,
        body: [
          'Most people learn by rereading: notes, books, slides. It feels productive because the material becomes familiar. But familiarity is not memory.',
          'In a study published in Science, students learned foreign vocabulary. Once they knew a word, some kept studying it and some kept being tested on it. Extra study after learning had no effect a week later. Extra testing had a large one. The students themselves could not predict which method served them better.',
          'The act of pulling a memory out strengthens it. Every time you test yourself, you are not merely checking what you know; you are making it last.',
        ],
        practise: 'Think of something you read this week. Without looking, write down three things it said. Then check.',
      },
      {
        id: 'retrieval-2',
        title: 'Space it out',
        minutes: 3,
        body: [
          'When you review matters as much as how. Reviewing the same material three times in one evening is less effective than reviewing it once on three separate days.',
          'A review of more than 300 experiments, published in Psychological Bulletin, found that spreading practice out beats cramming, and that the longer you want to remember something, the wider the gaps between reviews should be.',
          'The ideal moment to review is just as a memory is starting to fade. Retrieval is then a little effortful, and that effort is what strengthens it.',
        ],
        practise: 'Pick one thing you want to remember for a year. Decide now when you will review it: tomorrow, in a few days, next week and next month.',
      },
      {
        id: 'retrieval-3',
        title: 'Your recall deck',
        minutes: 3,
        body: [
          'Luminary’s recall deck does the scheduling for you. Write a question on the front and the answer on the back: a name, a word in another language, a fact for work, a number you keep forgetting.',
          'Each day, the deck shows only the cards that are due. Answer in your head first, then reveal the answer and mark yourself honestly. Each card you get right waits longer before it returns: one day, then two, four, eight, sixteen and thirty-two. A card you miss starts again tomorrow.',
          'Honest marking is everything. Marking a near-miss as correct only pushes the card away before it is secure.',
        ],
        practise: 'Add five cards to your deck now. Tomorrow, review them.',
      },
      {
        id: 'retrieval-4',
        title: 'Make it part of life',
        minutes: 3,
        body: [
          'Retrieval works everywhere, not only on cards. After a meeting, recall the three decisions before you check your notes. After a chapter, explain it aloud as if to a friend. After meeting someone, use their name once in the conversation and again when you leave.',
          'Mix topics when you review. Switching between subjects feels harder than practising one at a time, but the extra effort tends to produce more durable learning.',
          'A few minutes of retrieval each day outperforms an hour of rereading each week.',
        ],
        practise: 'This evening, recall three things you learned today before you go to sleep.',
      },
    ],
  },
];

export const courseById = (id: string) => COURSES.find((c) => c.id === id);
export const lessonById = (id: string) => {
  for (const c of COURSES) {
    const l = c.lessons.find((x) => x.id === id);
    if (l) return { course: c, lesson: l };
  }
  return undefined;
};
