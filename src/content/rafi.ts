// The Rafi Programme: the 14 modifiable risk factors from the 2024 Lancet Commission on dementia,
// each turned into a plan. Shares are the Commission's population attributable fractions (Livingston et al. 2024).

export type Link = { label: string; url: string };
export type Stage = 'early' | 'midlife' | 'later';

export type Factor = {
  id: string;
  /** The risk factor as the Commission names it. */
  factor: string;
  /** What to do about it, as an action. */
  action: string;
  stage: Stage;
  /** Share of dementia cases worldwide linked to this factor, in percent. A population estimate. */
  share: number;
  what: string;
  why: string;
  research: string;
  steps: string[];
  sources: Link[];
  resources: Link[];
};

export const STAGES: Record<Stage, { name: string; note: string }> = {
  early: { name: 'Early life', note: 'Where the effect starts, though building on it helps at any age.' },
  midlife: { name: 'Midlife, about 45 to 65', note: 'Where most of the risk sits, and where checks pay off most.' },
  later: { name: 'Later life', note: 'Still worth acting on, whatever your age.' },
};

const LANCET: Link = {
  label: 'Livingston et al. 2024, Lancet Commission on dementia',
  url: 'https://doi.org/10.1016/S0140-6736(24)01296-0',
};
const FINGER: Link = { label: 'Ngandu et al. 2015, FINGER trial, The Lancet', url: 'https://doi.org/10.1016/S0140-6736(15)60461-5' };
const ACHIEVE: Link = { label: 'Lin et al. 2023, ACHIEVE trial, The Lancet', url: 'https://pubmed.ncbi.nlm.nih.gov/37478886/' };
const SPRINT: Link = { label: 'SPRINT MIND investigators 2019, JAMA', url: 'https://pubmed.ncbi.nlm.nih.gov/30688979/' };
const CATARACT: Link = { label: 'Lee et al. 2022, JAMA Internal Medicine', url: 'https://pubmed.ncbi.nlm.nih.gov/34870676/' };
const ACTIVE: Link = { label: 'Edwards et al. 2017, ACTIVE trial 10-year follow-up', url: 'https://doi.org/10.1016/j.trci.2017.09.002' };

const HEALTH_CHECK: Link = {
  label: 'NHS Health Check (ages 40 to 74, every 5 years)',
  url: 'https://www.nhs.uk/conditions/nhs-health-check/',
};

export const FACTORS: Factor[] = [
  {
    id: 'learn',
    factor: 'Less education',
    action: 'Keep learning hard things',
    stage: 'early',
    share: 5,
    what: 'Fewer years of education early in life. The Commission counts it as an early-life factor, but the mechanism behind it keeps working for life.',
    why: 'Demanding mental work builds cognitive reserve: more and better-connected networks that let the brain keep working when disease starts to damage it. People with more reserve tend to show symptoms later.',
    research:
      'Education is linked to 5% of cases worldwide. Adult learning is harder to test, but in the ACTIVE trial ten sessions of speed training were linked to lower dementia risk ten years on. One trial, so treat it as promising.',
    steps: [
      'Pick one thing that is genuinely hard for you: a language, an instrument, a new skill at work.',
      'Practise it weekly, and step up the difficulty when it gets easy. Comfort is not training.',
      'Keep your Luminary workouts going. Speed training has the strongest long-term evidence of any brain training.',
    ],
    sources: [LANCET, ACTIVE],
    resources: [
      { label: 'u3a: learning groups for people no longer in full-time work', url: 'https://www.u3a.org.uk/' },
      { label: 'FutureLearn: free short courses from universities', url: 'https://www.futurelearn.com/' },
    ],
  },
  {
    id: 'hearing',
    factor: 'Hearing loss',
    action: 'Get your hearing checked',
    stage: 'midlife',
    share: 7,
    what: 'Untreated hearing loss, which often creeps up so slowly that people do not notice it.',
    why: 'When hearing fades, the brain gets less input and has to work harder to decode speech, leaving less capacity for memory and thinking. People also tend to withdraw from conversation, which cuts social contact.',
    research:
      'Joint largest single factor, linked to 7% of cases. The Commission found hearing aid use is linked to lower risk. In the ACHIEVE trial, a hearing intervention slowed thinking decline by about half over three years in a higher-risk group of older adults, but made no clear difference in the healthier group.',
    steps: [
      'Get a hearing test. NHS GPs can refer you, and many high-street opticians and pharmacies test for free.',
      'If you are offered hearing aids, wear them every day. They only help if they are in.',
      'Protect what you have: turn headphones down and use ear protection at concerts and with loud tools.',
    ],
    sources: [LANCET, ACHIEVE],
    resources: [
      { label: 'NHS: hearing loss', url: 'https://www.nhs.uk/conditions/hearing-loss/' },
      { label: 'RNID: free online hearing check and advice', url: 'https://rnid.org.uk/' },
    ],
  },
  {
    id: 'chol',
    factor: 'High LDL cholesterol',
    action: 'Know your cholesterol',
    stage: 'midlife',
    share: 7,
    what: 'High levels of LDL, the "bad" cholesterol, from midlife. New to the list in 2024.',
    why: 'Excess LDL damages blood vessels, including the small ones that feed the brain, and raises the risk of stroke. It may also be involved in the build-up of the proteins seen in Alzheimer’s disease.',
    research:
      'Joint largest single factor, linked to 7% of cases. The Commission recommends detecting and treating high LDL from about age 40. Studies of statin users suggest lower dementia risk, though that evidence is observational.',
    steps: [
      'Find out your number. It is part of the free NHS Health Check from 40, or ask your GP or pharmacist.',
      'If it is high, talk to your GP about whether treatment suits you.',
      'Shift your diet towards oily fish, nuts, beans, oats and olive oil, and away from fatty meat and processed food.',
    ],
    sources: [LANCET],
    resources: [{ label: 'NHS: high cholesterol', url: 'https://www.nhs.uk/conditions/high-cholesterol/' }, HEALTH_CHECK],
  },
  {
    id: 'mood',
    factor: 'Depression',
    action: 'Get support for low mood',
    stage: 'midlife',
    share: 3,
    what: 'Depression in midlife.',
    why: 'Depression affects sleep, activity, stress hormones and social contact, all of which matter for the brain. It can also be an early sign of brain change, so the link runs both ways.',
    research:
      'Linked to 3% of cases. The Commission recommends treating depression effectively, and notes some evidence that treatment is linked to lower risk.',
    steps: [
      'If low mood has lasted more than two weeks, talk to your GP. In England you can also refer yourself to NHS Talking Therapies.',
      'Keep moving and keep seeing people, even in small doses. Both help mood and the brain at the same time.',
      'Use Luminary’s mood check-in to spot patterns you can bring to a professional.',
    ],
    sources: [LANCET],
    resources: [{ label: 'NHS: Every Mind Matters', url: 'https://www.nhs.uk/every-mind-matters/' }],
  },
  {
    id: 'head',
    factor: 'Head injury',
    action: 'Protect your head',
    stage: 'midlife',
    share: 3,
    what: 'Traumatic brain injury, from falls, road accidents, sport or violence.',
    why: 'A blow to the head can damage nerve fibres and trigger long-lasting inflammation. Repeated knocks, as in some contact sports, add up.',
    research: 'Linked to 3% of cases. Risk rises with the number and severity of injuries.',
    steps: [
      'Wear a helmet for cycling, horse riding, skiing and similar sports.',
      'Wear a seatbelt every journey.',
      'At home, fix loose rugs and poor lighting, and use rails on stairs. Falls are the most common cause of head injury in older adults.',
    ],
    sources: [LANCET],
    resources: [
      { label: 'NHS: head injury and concussion', url: 'https://www.nhs.uk/conditions/head-injury-and-concussion/' },
      { label: 'NHS: falls', url: 'https://www.nhs.uk/conditions/falls/' },
    ],
  },
  {
    id: 'move',
    factor: 'Physical inactivity',
    action: 'Move most days',
    stage: 'midlife',
    share: 2,
    what: 'Doing little physical activity in midlife.',
    why: 'Exercise raises blood flow to the brain and the release of BDNF, a protein brain cells need to grow and form connections. It also lowers blood pressure, blood sugar and weight, three other factors on this list.',
    research:
      'Linked to 2% of cases directly, and more through its effect on other factors. In the FINGER trial, a programme combining exercise, diet, brain training and heart checks protected thinking skills over two years.',
    steps: [
      'Aim for 150 minutes of moderate activity a week, the UK guideline. Brisk walking counts.',
      'Add strength work twice a week.',
      'Pair it with something you already do: walk to the shop, take calls on foot.',
    ],
    sources: [LANCET, FINGER],
    resources: [{ label: 'NHS: exercise guidelines', url: 'https://www.nhs.uk/live-well/exercise/' }],
  },
  {
    id: 'bp',
    factor: 'High blood pressure',
    action: 'Know your blood pressure',
    stage: 'midlife',
    share: 2,
    what: 'Hypertension: a top (systolic) reading consistently above healthy levels, often with no symptoms at all.',
    why: 'High pressure damages the small vessels deep in the brain, causing tiny areas of injury that build up over years and raise the risk of stroke.',
    research:
      'Linked to 2% of cases. The Commission suggests aiming for a systolic of 130 or below from about age 40. In the SPRINT MIND trial, tighter blood pressure control lowered the risk of mild cognitive impairment.',
    steps: [
      'Get it measured. Many pharmacies do it free, and it is part of the NHS Health Check.',
      'If it is high, follow your GP’s treatment plan and recheck as advised.',
      'Cut salt, move more and keep alcohol down. Each lowers pressure on its own.',
    ],
    sources: [LANCET, SPRINT],
    resources: [{ label: 'NHS: high blood pressure', url: 'https://www.nhs.uk/conditions/high-blood-pressure/' }, HEALTH_CHECK],
  },
  {
    id: 'sugar',
    factor: 'Diabetes',
    action: 'Keep blood sugar in range',
    stage: 'midlife',
    share: 2,
    what: 'Type 2 diabetes, and blood sugar that stays high.',
    why: 'High blood sugar damages blood vessels and is linked to inflammation and to changes in how the brain uses energy.',
    research: 'Linked to 2% of cases. Risk is higher the longer diabetes lasts and the less well it is controlled.',
    steps: [
      'Know your risk. The NHS Health Check includes it, and Diabetes UK has a quick online risk tool.',
      'If you have diabetes, keep up regular reviews and take treatment as prescribed.',
      'Regular activity and less sugar and refined carbohydrate help keep levels steady.',
    ],
    sources: [LANCET],
    resources: [{ label: 'NHS: type 2 diabetes', url: 'https://www.nhs.uk/conditions/type-2-diabetes/' }, HEALTH_CHECK],
  },
  {
    id: 'smoke',
    factor: 'Smoking',
    action: 'Stay smoke-free',
    stage: 'midlife',
    share: 2,
    what: 'Smoking tobacco.',
    why: 'Smoking damages blood vessels, raises the risk of stroke and causes oxidative stress in brain tissue.',
    research: 'Linked to 2% of cases. Stopping lowers risk, even later in life.',
    steps: [
      'If you smoke, use stop-smoking support. People who use it are far more likely to quit than those who go it alone.',
      'Vaping is much less harmful than smoking if it helps you stop, though not harmless.',
      'If you do not smoke, you already have this one in place. Mark it below.',
    ],
    sources: [LANCET],
    resources: [{ label: 'NHS Better Health: quit smoking', url: 'https://www.nhs.uk/better-health/quit-smoking/' }],
  },
  {
    id: 'weight',
    factor: 'Obesity',
    action: 'Keep a healthy weight',
    stage: 'midlife',
    share: 1,
    what: 'Obesity in midlife.',
    why: 'Excess weight raises blood pressure and the risk of diabetes, and is linked to inflammation. Much of its effect on the brain runs through those routes.',
    research:
      'Linked to 1% of cases directly. Losing weight in midlife lowers blood pressure and diabetes risk, which are factors here too.',
    steps: [
      'Check where you are with a BMI or waist measurement.',
      'Small sustained changes beat crash diets: smaller portions, fewer sugary drinks, more vegetables.',
      'Ask your GP about weight management support if you need it.',
    ],
    sources: [LANCET],
    resources: [{ label: 'NHS: healthy weight', url: 'https://www.nhs.uk/live-well/healthy-weight/' }],
  },
  {
    id: 'alcohol',
    factor: 'Excessive alcohol',
    action: 'Keep alcohol within 14 units a week',
    stage: 'midlife',
    share: 1,
    what: 'Drinking more than about 21 units a week. The UK guideline is 14 units, spread over three or more days.',
    why: 'Heavy drinking is toxic to brain cells, shrinks brain volume and raises blood pressure.',
    research: 'Linked to 1% of cases. Risk rises steeply with heavy drinking.',
    steps: [
      'Count your units for one normal week. Most people underestimate.',
      'Have several drink-free days each week.',
      'Swap some drinks for low or no-alcohol versions.',
    ],
    sources: [LANCET],
    resources: [{ label: 'NHS: calculating alcohol units', url: 'https://www.nhs.uk/live-well/alcohol-advice/calculating-alcohol-units/' }],
  },
  {
    id: 'connect',
    factor: 'Social isolation',
    action: 'Stay connected',
    stage: 'later',
    share: 5,
    what: 'Having little regular contact with other people in later life.',
    why: 'Conversation is a full brain workout: language, memory, attention and reading other people, all at speed. Isolation also raises the risk of depression and inactivity.',
    research: 'Linked to 5% of cases. The Commission recommends supportive community environments and housing that make contact easy.',
    steps: [
      'Book contact in like an appointment: a weekly call, a regular coffee.',
      'Join something that meets on a schedule: a choir, a walking group, a class or volunteering.',
      'If hearing makes conversation hard, deal with that first. See the hearing factor.',
    ],
    sources: [LANCET],
    resources: [
      { label: 'Age UK: loneliness advice and local services', url: 'https://www.ageuk.org.uk/' },
      { label: 'u3a: local interest groups', url: 'https://www.u3a.org.uk/' },
    ],
  },
  {
    id: 'air',
    factor: 'Air pollution',
    action: 'Cut exposure to air pollution',
    stage: 'later',
    share: 3,
    what: 'Breathing polluted air, especially fine particles (PM2.5) from traffic and burning.',
    why: 'Fine particles can reach the bloodstream and the brain, causing inflammation and damaging blood vessels.',
    research: 'Linked to 3% of cases. Much of this needs action by governments, but personal exposure can be cut.',
    steps: [
      'Walk and cycle on quieter back streets rather than main roads. Pollution drops sharply a street away.',
      'Check the air quality forecast and skip hard exercise beside traffic on high-pollution days.',
      'Avoid burning wood indoors, and ventilate when cooking.',
    ],
    sources: [LANCET],
    resources: [{ label: 'UK air quality forecast (Defra)', url: 'https://uk-air.defra.gov.uk/' }],
  },
  {
    id: 'eyes',
    factor: 'Untreated vision loss',
    action: 'Get your eyes tested',
    stage: 'later',
    share: 2,
    what: 'Vision problems that have not been treated, such as cataracts. New to the list in 2024.',
    why: 'Like hearing loss, poor vision cuts the information reaching the brain and makes people less active and less social.',
    research:
      'Linked to 2% of cases. In a large US study, people who had cataract surgery had a lower risk of dementia than those who did not. That study was observational, so it cannot prove cause.',
    steps: [
      'Have an eye test every two years, or as your optician advises. It is free on the NHS for over-60s.',
      'If you are told you have cataracts, ask about surgery. It is quick and very effective.',
      'Keep glasses prescriptions up to date.',
    ],
    sources: [LANCET, CATARACT],
    resources: [{ label: 'NHS: cataracts', url: 'https://www.nhs.uk/conditions/cataracts/' }],
  },
];

export const STATUS = {
  todo: { label: 'Not started', short: 'To do' },
  working: { label: 'Working on it', short: 'Working on it' },
  done: { label: 'In place', short: 'In place' },
} as const;
export type Status = keyof typeof STATUS;

export type FactorRecord = { status: Status; log: { at: number; text: string }[] };

/** A factor's record, treating older "ticked" ids as in place. */
export function recordFor(id: string, plan: Record<string, FactorRecord> | undefined, legacy: string[] | undefined): FactorRecord {
  return plan?.[id] ?? { status: legacy?.includes(id) ? 'done' : 'todo', log: [] };
}
