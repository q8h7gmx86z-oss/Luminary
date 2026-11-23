// App content. Health statements must stay general, cite a source,
// and never tell someone they have, or do not have, a condition.

export type Source = { label: string; url: string };

export type Habit = { id: string; label: string; why: string };

// Daily brain-health habits drawn from modifiable risk factors in the
// 2024 Lancet Commission and the FINGER multidomain trial.
export const HABITS: Habit[] = [
  {
    id: 'move',
    label: '20 minutes that raise your heart rate',
    why: 'Aerobic work pumps more blood to the brain and raises BDNF, a protein brain cells need to grow and connect. Inactivity is one of the 14 dementia risk factors in the 2024 Lancet Commission.',
  },
  {
    id: 'connect',
    label: 'One real conversation',
    why: 'Conversation is a live workout: you hold what was said, read the other person and plan your reply at speed. Social isolation is on the Lancet risk list.',
  },
  {
    id: 'learn',
    label: '15 minutes on something hard',
    why: 'Your brain adapts to difficulty, not repetition. A new language, instrument or skill forces it to build new connections. Easy and familiar does not.',
  },
  {
    id: 'outside',
    label: 'Daylight within an hour of waking',
    why: 'Morning light sets your body clock, so you get sleepy on time tonight. Better sleep tonight means faster, more accurate thinking tomorrow.',
  },
  {
    id: 'eat',
    label: 'Plants or whole grains at every meal',
    why: 'Your brain uses about a fifth of your oxygen, so what protects your blood vessels protects your brain. Diet was one of the four parts of the FINGER trial.',
  },
  {
    id: 'winddown',
    label: 'Screens off 30 minutes before bed',
    why: 'Sleep is when today’s training gets locked in. A wind-down routine gets you to sleep faster, and that is when the gains stick.',
  },
];

export type Article = {
  id: string;
  title: string;
  summary: string;
  body: string[];
  sources: Source[];
};

const LAMPIT = { label: 'Lampit et al. 2014, PLoS Medicine meta-analysis', url: 'https://doi.org/10.1371/journal.pmed.1001756' };
const EDWARDS = { label: 'Edwards et al. 2017, ACTIVE trial 10-year follow-up', url: 'https://doi.org/10.1016/j.trci.2017.09.002' };

export const ARTICLES: Article[] = [
  {
    id: 'three-a-week',
    title: 'Why three sessions a week beats every day',
    summary: 'The training schedule the research backs.',
    body: [
      'A meta-analysis of 52 trials found that brain training worked better with no more than three sessions a week. Training more often than that gave weaker results.',
      'Rest days are not lost days. Like muscle, your brain consolidates new skill between sessions, much of it during sleep.',
      'Your target: three workouts a week. The Progress tab tracks it.',
    ],
    sources: [LAMPIT],
  },
  {
    id: 'speed-first',
    title: 'Why every workout starts with speed',
    summary: 'The exercise with the longest-running evidence.',
    body: [
      'In the ACTIVE trial, 2,800 adults trained either speed, memory or reasoning. Ten years on, the speed-training group had a 29% lower risk of dementia than the group who did no training. Memory and reasoning training did not show the same effect.',
      'That is one trial, and the training was supervised in person, so it is strong evidence, not proof. It is still the best result of its kind, which is why Speed Match is in every daily workout.',
      'The rule that drives gains: the time limit shrinks as you improve. Always train at the edge of what you can do.',
    ],
    sources: [EDWARDS],
  },
  {
    id: 'brain-games',
    title: 'What your training does, and does not, do',
    summary: 'Straight facts, so you train with the right goal.',
    body: [
      'Brain training reliably improves the skills you practise, with a small to moderate effect on thinking overall. People with mild memory problems see measurable gains.',
      'The biggest gains are on tasks close to the ones you train. Do not expect n-back practice to raise your IQ: large reviews found it does not.',
      'Your Sharpness score tracks your level and accuracy across all four skills. It shows how your training is going, not your brain age.',
      'Training works best alongside the other big levers: movement, sleep and time with people.',
    ],
    sources: [
      { label: 'Hill et al. 2017, American Journal of Psychiatry meta-analysis', url: 'https://doi.org/10.1176/appi.ajp.2016.16030360' },
      { label: 'Melby-Lervåg et al. 2016, Perspectives on Psychological Science', url: 'https://doi.org/10.1177/1745691616635612' },
    ],
  },
  {
    id: 'adhd-basics',
    title: 'ADHD: know the brain you are training',
    summary: 'What 208 evidence-based conclusions say.',
    body: [
      'ADHD is a difference in how the brain regulates attention, activity and impulses. It is common, strongly genetic and lasts into adulthood for many people.',
      'An international expert panel reviewed the large studies and agreed 208 evidence-based conclusions. ADHD is not caused by bad parenting or laziness, and trained clinicians can identify it reliably.',
      'Training angle: holding back (Catch the Light), ignoring distraction (Colour Clash) and keeping track (Star Tracker) are the skills ADHD makes harder, so that is what the focus track trains.',
      'Only a qualified professional can assess ADHD. If you think you or your child has it, start with your GP.',
    ],
    sources: [{ label: 'Faraone et al. 2021, World Federation of ADHD Consensus Statement', url: 'https://doi.org/10.1016/j.neubiorev.2021.01.022' }],
  },
  {
    id: 'adhd-skills',
    title: 'ADHD tactics that actually work',
    summary: 'Change the setup, not your willpower.',
    body: [
      'Medication has the most consistent evidence for adult ADHD. CBT skills and learning about ADHD also reduce symptoms in trials. These tactics work alongside your prescriber’s advice, never instead of it.',
      'Shrink the first step. "Write the essay" stalls. "Open the document and write one sentence" starts. Getting started is the hard part, so make it tiny.',
      'Make time visible. ADHD makes time feel abstract; a timer you can see turns it into something concrete. Use the visual timer in Focus.',
      'Use "when X, then Y" plans. Tying an action to a cue moves it from memory to habit, which takes the load off working memory.',
    ],
    sources: [{ label: 'Ostinelli et al. 2025, Lancet Psychiatry network meta-analysis', url: 'https://doi.org/10.1016/S2215-0366(24)00360-2' }],
  },
  {
    id: 'brain-health',
    title: '45% of dementia risk is in your hands',
    summary: 'The 14 risk factors you can train against.',
    body: [
      'The 2024 Lancet Commission estimated that about 45% of dementia cases are linked to 14 risk factors that can be changed over a lifetime.',
      'The list: less education in childhood, hearing loss, high LDL cholesterol, depression, head injury, physical inactivity, diabetes, smoking, high blood pressure, obesity, heavy drinking, social isolation, air pollution and untreated vision loss.',
      'Your levers: move, keep learning hard things, stay connected, protect your hearing and eyesight, and look after your heart. Luminary’s daily habits are built from this list.',
    ],
    sources: [{ label: 'Livingston et al. 2024, Lancet Commission on dementia', url: 'https://doi.org/10.1016/S0140-6736(24)01296-0' }],
  },
  {
    id: 'habits-together',
    title: 'Why you train more than one thing',
    summary: 'The FINGER trial ran the full programme.',
    body: [
      'In the FINGER trial, 1,260 older adults at higher risk followed two years of diet, exercise, brain training and heart-health checks together.',
      'Their thinking held up better than a group who got general health advice. The effect was modest, and it came from the combination.',
      'That is the Luminary model: brain workouts plus daily habits, not one big change.',
    ],
    sources: [{ label: 'Ngandu et al. 2015, FINGER trial, The Lancet', url: 'https://doi.org/10.1016/S0140-6736(15)60461-5' }],
  },
  {
    id: 'sleep',
    title: 'Sleep is when training sticks',
    summary: 'The CBT-I playbook, no pills needed.',
    body: [
      'CBT for insomnia (CBT-I) is the first-choice treatment for long-term sleep problems, and it works when delivered digitally.',
      'Fix your wake-up time, weekends included. A steady anchor sets your body clock faster than anything else.',
      'Bed is for sleep. Awake for about 20 minutes? Get up, do something calm in dim light, and go back when sleepy. This retrains your brain to link bed with sleep.',
      'No caffeine after early afternoon. It blocks the brain chemical that builds sleep pressure for hours.',
      'If poor sleep lasts more than a few weeks, or you snore loudly or stop breathing in your sleep, see your GP.',
    ],
    sources: [{ label: 'Alimoradi et al. 2022, CBT-I meta-analysis, Sleep Medicine Reviews', url: 'https://doi.org/10.1016/j.smrv.2022.101646' }],
  },
];
