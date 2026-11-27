import { Link } from 'expo-router';
import React from 'react';
import { Text, View } from 'react-native';

import { ResearchLink } from '@/components/Research';
import { Body, Card, Checkbox, Heading, Screen } from '@/components/ui';
import { HABITS } from '@/content/content';
import { dayKey } from '@/lib/logic';
import { useStore } from '@/lib/store';
import { fonts, type, useTheme } from '@/lib/theme';

/** The daily habits outside the app, each linked to its research. Opened from Today's tools. */
export default function Habits() {
  const t = useTheme();
  const { state, toggleHabit } = useStore();
  const done = state.habits[dayKey()] ?? [];
  return (
    <Screen>
      <Card>
        <Heading>Daily brain habits</Heading>
        <Body muted>Your training outside the app. Each one is backed by the research linked beneath it.</Body>
        {HABITS.map((h) => (
          <View key={h.id}>
            <Checkbox checked={done.includes(h.id)} label={h.label} onPress={() => toggleHabit(h.id)} />
            <Text style={[type.caption, { color: t.muted, marginLeft: 36 }]}>{h.why}</Text>
            <View style={{ marginLeft: 36, marginTop: 4 }}>
              <ResearchLink id={h.id} />
            </View>
          </View>
        ))}
        <Link href="/rafi" style={{ color: t.lavender, fontFamily: fonts.medium, fontSize: 15 }}>
          Your full brain health plan: the Rafi Programme
        </Link>
      </Card>
    </Screen>
  );
}
