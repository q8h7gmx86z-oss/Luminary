# Luminary

Everyday tools for focus, mood, sleep and long-term brain health, made for every kind of brain, including ADHD and other neurodivergent minds. Built with Expo for iOS, Android and web.

## What's in this version

- **Today:** quick check-ins, your next small task step, and daily brain-health habits. Progress is shown as "days you showed up this week", never as streaks that reset.
- **Focus:** a visual countdown timer, task breakdown into tiny steps, and "when... then..." plans.
- **Mood:** mood, energy and focus check-ins, a calming breath exercise, and a 7-day view. A very low mood brings up support lines.
- **Sleep:** a bedtime and wake log, a weekly average, and CBT-I sleep skills.
- **Learn:** short explainers on ADHD, brain health, sleep and brain games, each linked to its research source.
- **Get help now:** always in the header and reachable before onboarding. It is region-aware (UK, Ireland, US, Canada, Australia, New Zealand and a global fallback), and under-18s see youth lines like Childline first.

## Safety and privacy principles

1. **Not a medical device.** Luminary supports wellbeing habits. It never diagnoses, treats, scores "brain age" or advises on medication. Wording in `src/content/content.ts` must stay general and cite a source.
2. **Crisis help is never more than one tap away.** Every helpline number in `src/lib/crisis.ts` must be checked by a person before each public release.
3. **Local-first data.** Everything is stored on the device with AsyncStorage. There is no account, no server, no analytics and no advertising. Users can delete everything from Settings.
4. **Child-friendly by default.** High-privacy defaults with nothing shared and no nudges, in line with the UK Age Appropriate Design Code.
5. **Neuro-affirming design.** Low friction, no guilt, calm visuals, large touch targets and screen-reader labels.

## Develop

```bash
npm install
npm run web        # or: npm run ios / npm run android
npm test           # unit tests for crisis lines and logic
npm run typecheck
```

## Research behind the features

- Livingston et al. 2024, Lancet Commission on dementia prevention: https://doi.org/10.1016/S0140-6736(24)01296-0
- Ngandu et al. 2015, FINGER trial: https://doi.org/10.1016/S0140-6736(15)60461-5
- Faraone et al. 2021, World Federation of ADHD Consensus Statement: https://doi.org/10.1016/j.neubiorev.2021.01.022
- Ostinelli et al. 2025, adult ADHD treatments network meta-analysis: https://doi.org/10.1016/S2215-0366(24)00360-2
- Alimoradi et al. 2022, CBT-I meta-analysis: https://doi.org/10.1016/j.smrv.2022.101646
- Hill et al. 2017, computerised cognitive training meta-analysis: https://doi.org/10.1176/appi.ajp.2016.16030360
