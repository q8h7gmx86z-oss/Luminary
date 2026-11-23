import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { Body, Card, Heading, Screen } from '@/components/ui';
import { FACTORS, recordFor, Stage, STAGES, Status, STATUS } from '@/content/rafi';
import { useStore } from '@/lib/store';
import { useTheme } from '@/lib/theme';

const NAVY = '#0B1640';
const GOLD = '#F2C14E';

const READS: { id: string; title: string }[] = [
  { id: 'brain-health', title: '45% of dementia risk: what that figure means' },
  { id: 'habits-together', title: 'Why you train more than one thing' },
  { id: 'speed-first', title: 'Why every workout starts with speed' },
];

export function StatusPill({ status }: { status: Status }) {
  const t = useTheme();
  const bg = status === 'done' ? t.good : status === 'working' ? GOLD : t.soft;
  const fg = status === 'todo' ? t.text : status === 'working' ? NAVY : '#FFFFFF';
  return (
    <View style={{ backgroundColor: bg, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}>
      <Text style={{ color: fg, fontWeight: '800', fontSize: 12 }}>{STATUS[status].short}</Text>
    </View>
  );
}

/** Brain health and dementia prevention, named for Rafi. */
export default function RafiProgramme() {
  const t = useTheme();
  const { state } = useStore();
  const records = FACTORS.map((f) => recordFor(f.id, state.rafiPlan, state.rafi));
  const count = (s: Status) => records.filter((r) => r.status === s).length;
  const done = count('done');
  const working = count('working');

  return (
    <Screen>
      <View style={{ backgroundColor: NAVY, borderRadius: 22, padding: 22, gap: 10 }}>
        <Text style={{ color: GOLD, fontWeight: '800', letterSpacing: 1, fontSize: 12 }}>THE RAFI PROGRAMME</Text>
        <Text style={{ color: '#FFFFFF', fontSize: 28, fontWeight: '900' }}>Protect your brain for life</Text>
        <Text style={{ color: '#D7DCF5', fontSize: 16, lineHeight: 23 }}>
          The 2024 Lancet Commission found 14 things that can be changed, linked between them to about 45% of dementia cases worldwide. This
          is your action plan for every one.
        </Text>
        <Text style={{ color: GOLD, fontStyle: 'italic', fontSize: 14 }}>Named for Rafi, 1947–2025</Text>
      </View>

      <Card>
        <Heading>Read this first</Heading>
        <Body>
          The 45% is a population estimate. It means that if all 14 factors disappeared worldwide, about 45% of cases might be prevented or
          delayed. It is not your personal risk, and it does not mean any one person can cut their own risk by 45%.
        </Body>
        <Body>
          This plan is a record of what you are doing, not a risk score. Marking something as in place does not change a number about you,
          because nobody can measure individual risk that way. What the evidence does say is that acting on these factors lowers risk across
          large groups of people, and it is never too early or too late to start.
        </Body>
      </Card>

      <Card>
        <Heading>Your plan</Heading>
        <Body muted>
          {done} in place · {working} in progress · {FACTORS.length - done - working} not started
        </Body>
        <View style={{ height: 10, borderRadius: 5, backgroundColor: t.soft, flexDirection: 'row', overflow: 'hidden' }}>
          <View style={{ backgroundColor: t.good, width: `${(done / FACTORS.length) * 100}%` }} />
          <View style={{ backgroundColor: GOLD, width: `${(working / FACTORS.length) * 100}%` }} />
        </View>
      </Card>

      {(Object.keys(STAGES) as Stage[]).map((stage) => (
        <Card key={stage}>
          <Heading>{STAGES[stage].name}</Heading>
          <Body muted>{STAGES[stage].note}</Body>
          {FACTORS.filter((f) => f.stage === stage).map((f) => {
            const r = recordFor(f.id, state.rafiPlan, state.rafi);
            return (
              <Pressable
                key={f.id}
                accessibilityRole="button"
                accessibilityLabel={`${f.action}. ${STATUS[r.status].label}. Linked to ${f.share}% of cases worldwide.`}
                onPress={() => router.push(`/rafi/${f.id}`)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 14, backgroundColor: t.bg }}
              >
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={{ color: t.text, fontWeight: '800', fontSize: 16 }}>{f.action}</Text>
                  <Text style={{ color: t.muted, fontSize: 13 }}>
                    {f.factor} · {f.share}% of cases worldwide
                    {r.log.length ? ` · ${r.log.length} note${r.log.length === 1 ? '' : 's'}` : ''}
                  </Text>
                </View>
                <StatusPill status={r.status} />
                <Text style={{ color: t.primary, fontWeight: '800', fontSize: 18 }}>›</Text>
              </Pressable>
            );
          })}
        </Card>
      ))}

      <Card>
        <Heading>Where your training fits</Heading>
        <Body>
          Brain training is one lever, not the whole plan. In the ACTIVE trial, people who did speed training had a 29% lower dementia risk
          ten years later. In the FINGER trial, combining exercise, diet, brain training and heart checks protected thinking skills over two
          years.
        </Body>
        <Body>Your daily workout covers the training. The plan above covers the rest. Do both.</Body>
      </Card>

      <Card>
        <Heading>The science</Heading>
        {READS.map((r) => (
          <Pressable key={r.id} accessibilityRole="link" onPress={() => router.push(`/article/${r.id}`)} hitSlop={6}>
            <Text style={{ color: t.primary, fontWeight: '700', fontSize: 16, paddingVertical: 4 }}>{r.title} →</Text>
          </Pressable>
        ))}
        <Pressable accessibilityRole="link" onPress={() => Linking.openURL('https://doi.org/10.1016/S0140-6736(24)01296-0')}>
          <Text style={{ color: t.muted, textDecorationLine: 'underline', fontSize: 14 }}>
            Livingston et al. 2024, Lancet Commission on dementia
          </Text>
        </Pressable>
      </Card>
    </Screen>
  );
}
