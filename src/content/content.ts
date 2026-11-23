// App content. Health statements must stay general, cite a source,
// and never tell someone they have, or do not have, a condition.

export type Source = { label: string; url: string };

export type Habit = { id: string; label: string; why: string };

// Daily brain-health habits drawn from modifiable risk factors in the
// 2024 Lancet Commission and the FINGER multidomain trial.
export const HABITS: Habit[] = [
  { id: 'move', label: 'Move for 20 minutes', why: 'Physical activity is one of the strongest lifestyle links to brain health.' },
  { id: 'connect', label: 'Talk with someone you like', why: 'Social contact protects thinking skills and mood.' },
  { id: 'learn', label: 'Learn or practise something', why: 'New challenges keep the brain engaged.' },
  { id: 'outside', label: 'Get daylight in the morning', why: 'Morning light helps set your body clock for better sleep.' },
  { id: 'eat', label: 'Eat vegetables, fruit or whole grains', why: 'Heart-healthy eating supports blood flow to the brain.' },
  { id: 'winddown', label: 'Wind down without screens before bed', why: 'A calm routine makes it easier to fall asleep.' },
];

export type Article = {
  id: string;
  title: string;
  summary: string;
  body: string[];
  sources: Source[];
};

export const ARTICLES: Article[] = [
  {
    id: 'adhd-basics',
    title: 'ADHD is a real difference in how brains work',
    summary: 'What the research consensus says, in plain words.',
    body: [
      'ADHD affects attention, activity and impulse control. It is common in children and adults, and it often runs in families.',
      'An international group of experts reviewed large studies and agreed on 208 evidence-based conclusions. ADHD is not caused by bad parenting or laziness, and it can be identified reliably by trained clinicians.',
      'Many people with ADHD also have real strengths, such as creativity, energy and deep focus on things that interest them.',
      'Only a qualified professional can assess ADHD. If you think you or your child might have it, your GP is a good place to start.',
    ],
    sources: [
      { label: 'Faraone et al. 2021, World Federation of ADHD Consensus Statement', url: 'https://doi.org/10.1016/j.neubiorev.2021.01.022' },
    ],
  },
  {
    id: 'adhd-skills',
    title: 'Skills that help with ADHD',
    summary: 'Ways of working with your brain, not against it.',
    body: [
      'Reviews of adult ADHD treatments found that CBT skills, learning about ADHD and mindfulness can reduce symptoms, although results vary. Medication has the most consistent evidence. These skills can work alongside medication, never instead of advice from your prescriber.',
      'Break big tasks into the smallest next step. "Write the essay" is hard to start. "Open the document and write one sentence" is easy.',
      'Make time visible. A timer you can see helps with time blindness.',
      'Use "when X, I will Y" plans. Linking a task to a cue, like "when I finish breakfast, I will take my tablets", means you rely less on memory.',
      'Change your space, not just your willpower. Put things where you will see them and remove distractions before you start.',
    ],
    sources: [
      { label: 'Ostinelli et al. 2025, Lancet Psychiatry network meta-analysis', url: 'https://doi.org/10.1016/S2215-0366(24)00360-2' },
    ],
  },
  {
    id: 'brain-health',
    title: 'Protecting your brain for life',
    summary: 'Nearly half of dementia cases are linked to things we can change.',
    body: [
      'The 2024 Lancet Commission estimated that about 45% of dementia cases are linked to 14 risk factors that can be changed over a lifetime.',
      'These include less education in childhood, hearing loss, high LDL cholesterol, depression, head injury, physical inactivity, diabetes, smoking, high blood pressure, obesity, heavy drinking, social isolation, air pollution and untreated vision loss.',
      'It is never too early or too late to act. Using hearing aids if you need them, staying active, staying connected and looking after your heart all help.',
    ],
    sources: [
      { label: 'Livingston et al. 2024, Lancet Commission on dementia', url: 'https://doi.org/10.1016/S0140-6736(24)01296-0' },
    ],
  },
  {
    id: 'habits-together',
    title: 'Why habits work better together',
    summary: 'The FINGER trial combined several habits at once.',
    body: [
      'In the FINGER trial, older adults at higher risk of memory decline followed a two-year programme of healthy eating, exercise, brain training and heart-health checks.',
      'Their thinking skills held up better than those of a group who received general health advice. The difference was modest, but it showed that a combined approach can help.',
      'That is why Luminary suggests a few small habits each day, rather than one big change.',
    ],
    sources: [
      { label: 'Ngandu et al. 2015, FINGER trial, The Lancet', url: 'https://doi.org/10.1016/S0140-6736(15)60461-5' },
    ],
  },
  {
    id: 'sleep',
    title: 'Better sleep without pills',
    summary: 'The techniques from CBT for insomnia.',
    body: [
      'Cognitive behavioural therapy for insomnia (CBT-I) is the recommended first treatment for long-term sleep problems, and it works when delivered digitally too.',
      'Keep the same wake-up time every day, including weekends.',
      'Use your bed for sleep only. If you cannot sleep after about 20 minutes, get up, do something calm in dim light, and go back when you feel sleepy.',
      'Avoid caffeine after early afternoon, and give yourself 30 to 60 minutes to wind down.',
      'If poor sleep lasts more than a few weeks, or you snore loudly or stop breathing in your sleep, talk to your GP.',
    ],
    sources: [
      { label: 'Alimoradi et al. 2022, CBT-I meta-analysis, Sleep Medicine Reviews', url: 'https://doi.org/10.1016/j.smrv.2022.101646' },
    ],
  },
  {
    id: 'brain-games',
    title: 'What brain games can and cannot do',
    summary: 'Honest expectations.',
    body: [
      'Computer-based brain training gives small to moderate improvements in thinking skills for people with mild memory problems, and the effects are strongest on the skills you practise.',
      'It is not proven to prevent dementia, and no app can tell you your "brain age". Luminary will never give you a score like that.',
      'Brain games are best as one part of a full routine with movement, sleep and social time.',
    ],
    sources: [
      { label: 'Hill et al. 2017, American Journal of Psychiatry meta-analysis', url: 'https://doi.org/10.1176/appi.ajp.2016.16030360' },
    ],
  },
];
