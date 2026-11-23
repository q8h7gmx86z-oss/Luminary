import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { Body, Card, Checkbox, Heading, Screen } from '@/components/ui';
import { useStore } from '@/lib/store';
import { useTheme } from '@/lib/theme';

const NAVY = '#0B1640';
const GOLD = '#F2C14E';

/** The 14 modifiable risk factors from the 2024 Lancet Commission, each turned into an action. */
const FACTORS: { id: string; action: string; why: string }[] = [
  { id: 'move', action: 'Move most days', why: 'Physical inactivity is a risk factor. Exercise raises blood flow and BDNF, which brain cells need to grow and connect.' },
  { id: 'learn', action: 'Keep learning hard things', why: 'Less education early in life raises risk. Demanding mental work at any age builds cognitive reserve: a buffer that helps the brain cope with damage.' },
  { id: 'hearing', action: 'Get your hearing checked', why: 'Hearing loss is one of the biggest single risk factors. Hearing aids, if you need them, are linked to lower risk.' },
  { id: 'eyes', action: 'Get your eyes tested', why: 'Untreated vision loss was added to the list in 2024. Treating it, for example cataract surgery, is simple and effective.' },
  { id: 'bp', action: 'Know your blood pressure', why: 'High blood pressure damages the small vessels that feed the brain. The Commission suggests aiming for a systolic of 130 or below from about age 40.' },
  { id: 'chol', action: 'Know your cholesterol', why: 'High LDL cholesterol from midlife is linked to higher risk, probably through its effect on blood vessels.' },
  { id: 'sugar', action: 'Keep blood sugar in range', why: 'Diabetes raises risk. Checking and managing blood sugar protects both heart and brain.' },
  { id: 'weight', action: 'Keep a healthy weight', why: 'Obesity in midlife is linked to higher risk, partly through blood pressure and diabetes.' },
  { id: 'smoke', action: 'Stay smoke-free', why: 'Smoking damages blood vessels. Stopping at any age lowers risk.' },
  { id: 'alcohol', action: 'Keep alcohol within 14 units a week', why: 'Heavy drinking raises risk. The UK guideline of 14 units a week, spread over several days, keeps you well below that level.' },
  { id: 'mood', action: 'Get support for low mood', why: 'Depression is linked to higher risk. Treating it matters for your brain as well as your wellbeing.' },
  { id: 'connect', action: 'Stay connected', why: 'Social isolation raises risk. Regular contact keeps your brain working on language, memory and attention.' },
  { id: 'head', action: 'Protect your head', why: 'Head injury raises risk. Wear a helmet for cycling and contact sports, and reduce fall risks at home.' },
  { id: 'air', action: 'Cut exposure to air pollution', why: 'Polluted air is linked to higher risk. Choose quieter routes away from heavy traffic when you can.' },
];

const READS: { id: string; title: string }[] = [
  { id: 'brain-health', title: '45% of dementia risk is in your hands' },
  { id: 'habits-together', title: 'Why you train more than one thing' },
  { id: 'speed-first', title: 'Why every workout starts with speed' },
  { id: 'three-a-week', title: 'Why three sessions a week beats every day' },
];

/** Brain health and dementia prevention, named for Rafi. */
export default function RafiProgramme() {
  const t = useTheme();
  const { state, toggleRafi } = useStore();
  const covered = state.rafi ?? [];

  return (
    <Screen>
      <View style={{ backgroundColor: NAVY, borderRadius: 22, padding: 22, gap: 10 }}>
        <Text style={{ color: GOLD, fontWeight: '800', letterSpacing: 1, fontSize: 12 }}>THE RAFI PROGRAMME</Text>
        <Text style={{ color: '#FFFFFF', fontSize: 28, fontWeight: '900' }}>Protect your brain for life</Text>
        <Text style={{ color: '#D7DCF5', fontSize: 16, lineHeight: 23 }}>
          About 45% of dementia cases worldwide are linked to 14 things that can be changed. This is your plan to work on every one of them.
        </Text>
        <Text style={{ color: GOLD, fontStyle: 'italic', fontSize: 14 }}>Named for Rafi, 1947–2025</Text>
      </View>

      <Card>
        <Heading>Your protection plan</Heading>
        <Body muted>Tick each one you have covered. {covered.length} of {FACTORS.length} done.</Body>
        <View style={{ height: 8, borderRadius: 4, backgroundColor: t.soft }}>
          <View style={{ height: 8, borderRadius: 4, backgroundColor: t.good, width: `${(covered.length / FACTORS.length) * 100}%` }} />
        </View>
        {FACTORS.map((f) => (
          <View key={f.id}>
            <Checkbox checked={covered.includes(f.id)} label={f.action} onPress={() => toggleRafi(f.id)} />
            <Text style={{ color: t.muted, fontSize: 13, marginLeft: 38, lineHeight: 19 }}>{f.why}</Text>
          </View>
        ))}
      </Card>

      <Card>
        <Heading>Where your training fits</Heading>
        <Body>
          Brain training is one lever, not the whole plan. In the ACTIVE trial, people who did speed training had a 29% lower dementia risk ten
          years later. In the FINGER trial, combining exercise, diet, brain training and heart checks protected thinking skills over two years.
        </Body>
        <Body>Your daily workout covers the training. The plan above covers the rest. Do both.</Body>
        <Body muted>
          No plan can guarantee that someone will not develop dementia. Acting on these factors lowers risk across large groups of people, and it
          is never too early or too late to start.
        </Body>
      </Card>

      <Card>
        <Heading>The science</Heading>
        {READS.map((r) => (
          <Pressable key={r.id} accessibilityRole="link" onPress={() => router.push(`/article/${r.id}`)} hitSlop={6}>
            <Text style={{ color: t.primary, fontWeight: '700', fontSize: 16, paddingVertical: 4 }}>{r.title} →</Text>
          </Pressable>
        ))}
        <Pressable accessibilityRole="link" onPress={() => Linking.openURL('https://doi.org/10.1016/S0140-6736(24)01296-0')}>
          <Text style={{ color: t.muted, textDecorationLine: 'underline', fontSize: 14 }}>Livingston et al. 2024, Lancet Commission on dementia</Text>
        </Pressable>
      </Card>
    </Screen>
  );
}
