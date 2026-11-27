import { Stack, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Text, View } from 'react-native';

import { AuraNote } from '@/aura/Aura';
import { researchLine } from '@/aura/script';
import { EvidenceDetail, VerdictChip } from '@/components/Research';
import { Body, Overline, Screen } from '@/components/ui';
import { evidenceFor } from '@/content/research';
import { type, useTheme } from '@/lib/theme';

const KIND = { game: 'Game', task: 'Tool', habit: 'Daily habit' };

export default function ResearchDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const t = useTheme();
  const e = evidenceFor(id);
  if (!e) {
    return (
      <Screen>
        <Body>Sorry, we could not find that research.</Body>
      </Screen>
    );
  }
  return (
    <Screen>
      <Stack.Screen options={{ title: 'The evidence' }} />
      <View style={{ gap: 8 }}>
        <Overline color={t.lavender}>{KIND[e.kind]} · The research</Overline>
        <Text accessibilityRole="header" style={[type.title, { color: t.text }]}>
          {e.name}
        </Text>
        <VerdictChip verdict={e.verdict} />
        <Text style={[type.body, { color: t.muted }]}>{e.why}</Text>
      </View>
      <AuraNote line={researchLine(e.verdict, e.papers.length)} ask={`the research on ${e.name}`} />
      <EvidenceDetail evidence={e} />
    </Screen>
  );
}
