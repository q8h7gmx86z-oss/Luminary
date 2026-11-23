import { Link, router } from 'expo-router';
import React from 'react';
import { Text, View } from 'react-native';

import { Body, Button, Card, Checkbox, Heading, Screen, Title } from '@/components/ui';
import { HABITS } from '@/content/content';
import { dayKey, daysShownUp } from '@/lib/logic';
import { useStore } from '@/lib/store';
import { useTheme } from '@/lib/theme';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function Today() {
  const { state, toggleHabit } = useStore();
  const t = useTheme();
  const today = dayKey();
  const done = state.habits[today] ?? [];
  const mood = state.moods[today];
  const sleep = state.sleeps[today];

  const activeDays = new Set<string>([
    ...Object.keys(state.moods),
    ...Object.keys(state.sleeps),
    ...Object.entries(state.habits)
      .filter(([, v]) => v.length > 0)
      .map(([k]) => k),
  ]);
  const shownUp = daysShownUp(activeDays);
  const openSteps = state.tasks.flatMap((task) => task.steps.filter((s) => !s.done).map((s) => ({ task, s })));
  const next = openSteps[0];

  return (
    <Screen>
      <Title>{greeting()}</Title>

      <Card>
        <Heading>This week</Heading>
        <Body>
          You checked in on {shownUp} of the last 7 days.
          {shownUp === 0 ? ' Any small step today counts.' : ' Every day you show up counts, and missed days never undo your progress.'}
        </Body>
      </Card>

      <Card>
        <Heading>Quick check-ins</Heading>
        <View style={{ gap: 8 }}>
          <Button
            kind={mood ? 'secondary' : 'primary'}
            label={mood ? 'Mood logged today ✓' : 'How are you feeling?'}
            onPress={() => router.push('/mood')}
          />
          <Button
            kind={sleep ? 'secondary' : 'primary'}
            label={sleep ? 'Sleep logged today ✓' : 'How did you sleep?'}
            onPress={() => router.push('/sleep')}
          />
        </View>
      </Card>

      {next ? (
        <Card>
          <Heading>Your next small step</Heading>
          <Body muted>{next.task.title}</Body>
          <Body>{next.s.text}</Body>
          <Button kind="secondary" label="Open Focus" onPress={() => router.push('/focus')} />
        </Card>
      ) : null}

      <Card>
        <Heading>Brain-health habits</Heading>
        <Body muted>Pick any you like. Doing one is better than none.</Body>
        {HABITS.map((h) => (
          <View key={h.id}>
            <Checkbox checked={done.includes(h.id)} label={h.label} onPress={() => toggleHabit(h.id)} />
            <Text style={{ color: t.muted, fontSize: 13, marginLeft: 38 }}>{h.why}</Text>
          </View>
        ))}
        <Link href="/article/brain-health" style={{ color: t.primary, fontWeight: '600', fontSize: 15 }}>
          Why these habits?
        </Link>
      </Card>

      <Link href="/settings" style={{ color: t.primary, fontWeight: '600', fontSize: 15, textAlign: 'center' }}>
        Settings and privacy
      </Link>
    </Screen>
  );
}
