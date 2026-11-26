import { router, Stack } from 'expo-router';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { QuoteCard, VERDICT_COLOR, VerdictChip } from '@/components/Research';
import { Overline, Screen } from '@/components/ui';
import { EVIDENCE, Evidence, PAPERS, Verdict, VERDICTS } from '@/content/research';
import { radii, type, useTheme } from '@/lib/theme';

const GROUPS: { kind: Evidence['kind']; title: string }[] = [
  { kind: 'game', title: 'Games' },
  { kind: 'task', title: 'Tools and tasks' },
  { kind: 'habit', title: 'Daily habits' },
];

function Row({ e, last }: { e: Evidence; last: boolean }) {
  const t = useTheme();
  return (
    <Pressable accessibilityRole="link" accessibilityLabel={`${e.name}. ${VERDICTS[e.verdict].label}.`} onPress={() => router.push(`/research/${e.id}`)}>
      {({ pressed }) => (
        <View style={{ paddingVertical: 14, gap: 6, borderBottomWidth: last ? 0 : 1, borderBottomColor: t.border, opacity: pressed ? 0.8 : 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={[type.label, { color: t.text, flex: 1 }]}>{e.name}</Text>
            <Icon name="arrow" size={16} color={t.muted} />
          </View>
          <VerdictChip verdict={e.verdict} />
          <Text style={[type.caption, { color: t.muted }]}>{e.why}</Text>
        </View>
      )}
    </Pressable>
  );
}

/** Every game and task, linked to the peer-reviewed papers behind it. */
export default function ResearchHub() {
  const t = useTheme();
  const paperCount = Object.keys(PAPERS).length;
  return (
    <Screen>
      <Stack.Screen options={{ title: 'The evidence' }} />
      <View style={{ gap: 6 }}>
        <Overline color={t.lavender}>The evidence</Overline>
        <Text accessibilityRole="header" style={[type.title, { color: t.text }]}>
          Don’t take our word for it.
        </Text>
        <Text style={[type.body, { color: t.muted }]}>
          Every game and tool in Luminary is linked to the peer-reviewed research behind it: {paperCount} papers, each checked against PubMed or
          the publisher. Where the evidence is mixed, we say so.
        </Text>
      </View>

      <QuoteCard id="cajal" />

      <View style={{ backgroundColor: t.surface, borderRadius: radii.panel, borderWidth: 1, borderColor: t.border, padding: 16, gap: 10 }}>
        <Overline>How to read the ratings</Overline>
        {(Object.keys(VERDICTS) as Verdict[]).map((v) => (
          <View key={v} style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: VERDICT_COLOR[v], marginTop: 5 }} />
            <Text style={[type.caption, { color: t.text, flex: 1 }]}>
              <Text style={{ color: VERDICT_COLOR[v] }}>{VERDICTS[v].label}.</Text> {VERDICTS[v].explain}
            </Text>
          </View>
        ))}
      </View>

      <View style={{ backgroundColor: t.surface, borderRadius: radii.panel, borderWidth: 1, borderColor: t.border, padding: 16, gap: 10 }}>
        <Overline>How science earns trust</Overline>
        {[
          ['Peer review', 'Before a paper is published, independent experts in the field check its methods and conclusions. Every paper here passed that test.'],
          ['Randomised controlled trial', 'People are assigned to train or not by chance, like a coin toss. It is the fairest way to show that something causes a change, rather than just going with it.'],
          ['Meta-analysis', 'The results of many studies pooled into one answer, so no single lucky study can mislead. It sits at the top of the evidence ladder.'],
          ['The journals', 'Some names carry special weight. The Lancet, published in London since 1823, and JAMA, since 1883, are among the most respected medical journals in the world. Each paper card tells you who published it and why that counts.'],
        ].map(([h, b]) => (
          <Text key={h} style={[type.caption, { color: t.text }]}>
            <Text style={{ color: t.lavender }}>{h}.</Text> {b}
          </Text>
        ))}
      </View>

      {GROUPS.map((g) => {
        const items = EVIDENCE.filter((e) => e.kind === g.kind);
        return (
          <View key={g.kind} style={{ backgroundColor: t.surface, borderRadius: radii.panel, borderWidth: 1, borderColor: t.border, paddingHorizontal: 16, paddingTop: 14 }}>
            <Overline>{g.title}</Overline>
            {items.map((e, i) => (
              <Row key={e.id} e={e} last={i === items.length - 1} />
            ))}
          </View>
        );
      })}

      <Text style={[type.caption, { color: t.muted }]}>
        Luminary is a training app, not a medical device. Nothing here diagnoses or treats a condition. Talk to your GP about your own health.
      </Text>
    </Screen>
  );
}
