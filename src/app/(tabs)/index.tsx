import { Link, router } from 'expo-router';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { Body, Button, Card, Checkbox, Heading, Screen, Title } from '@/components/ui';
import { HABITS } from '@/content/content';
import { dayKey, daysShownUp } from '@/lib/logic';
import { useStore } from '@/lib/store';
import { useTheme } from '@/lib/theme';
import { AVAILABLE, GAMES, SKILLS } from '@/training/catalog';
import { dailyGames } from '@/training/engine';

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

  const plan = dailyGames(today, AVAILABLE);
  const workedOut = state.training.workouts.includes(today);

  const activeDays = new Set<string>([
    ...state.training.workouts,
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

      <View style={{ backgroundColor: t.primary, borderRadius: 20, padding: 20, gap: 14 }}>
        <Text style={{ color: t.primaryText, opacity: 0.85, fontWeight: '700', letterSpacing: 0.6, fontSize: 13 }}>
          {workedOut ? 'DONE FOR TODAY' : "TODAY'S BRAIN WORKOUT"}
        </Text>
        <Text style={{ color: t.primaryText, fontSize: 24, fontWeight: '800' }}>
          {workedOut ? 'Great work. Your brain thanks you.' : 'About 10 minutes, three games'}
        </Text>
        <View style={{ gap: 8 }}>
          <Text style={{ color: t.primaryText, fontSize: 15 }}>◌  1 minute of calm breathing</Text>
          {plan.map((g) => (
            <Text key={g} style={{ color: t.primaryText, fontSize: 15 }}>
              {GAMES[g].glyph}  {GAMES[g].name} · {SKILLS[GAMES[g].skill].name}
            </Text>
          ))}
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/workout')}
          style={({ pressed }) => ({
            backgroundColor: t.primaryText,
            borderRadius: 14,
            minHeight: 52,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.9 : 1,
          })}
        >
          <Text style={{ color: t.primary, fontSize: 17, fontWeight: '800' }}>{workedOut ? 'Train again' : 'Start workout'}</Text>
        </Pressable>
      </View>

      <Card>
        <Heading>This week</Heading>
        <Body>
          You showed up on {shownUp} of the last 7 days.
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
