import { router } from 'expo-router';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { Body, Button, Card, Heading } from '@/components/ui';
import { sleepMinutes } from '@/lib/logic';
import { useStore } from '@/lib/store';
import { useTheme } from '@/lib/theme';

import { buildInsights, CLEAR_DIFF, describeInsight, Insight } from './insights';

const TITLES: Record<Insight['id'], string> = {
  sleepHours: 'Sleep length',
  sleepQuality: 'Sleep quality',
  mood: 'Mood',
  energy: 'Energy',
};

/** Opt-in patterns between check-ins and training. Worded as associations, never causes. */
export function InsightsCard() {
  const t = useTheme();
  const { state, setSetting } = useStore();

  if (!state.settings.insights) {
    return (
      <Card>
        <Heading>Sleep, mood and your training</Heading>
        <Body>
          Turn this on and Luminary will look for patterns between your sleep and mood check-ins and how your workouts go. Everything is
          worked out on this device and nothing is sent anywhere.
        </Body>
        <Button kind="secondary" label="Turn on personal insights" onPress={() => setSetting('insights', true)} />
      </Card>
    );
  }

  const map = <T,>(rec: Record<string, T>, f: (v: T) => number | undefined) =>
    Object.fromEntries(Object.entries(rec).map(([d, v]) => [d, f(v)])) as Record<string, number | undefined>;
  const insights = buildInsights({
    results: state.training.results,
    sleepHours: map(state.sleeps, (s) => {
      const m = sleepMinutes(s.bed, s.wake);
      return m === null ? undefined : m / 60;
    }),
    sleepQuality: map(state.sleeps, (s) => s.quality),
    mood: map(state.moods, (m) => m.mood),
    energy: map(state.moods, (m) => m.energy),
  });
  const ready = insights.filter((i) => i.diff !== undefined);
  const closest = [...insights].sort((a, b) => a.daysNeeded - b.daysNeeded)[0];

  return (
    <Card>
      <Heading>Sleep, mood and your training</Heading>
      {ready.length === 0 ? (
        <Body>
          Not enough data yet. Insights appear once you have at least four days on each side of a comparison, with a check-in and a workout
          on the same day. {closest ? `About ${closest.daysNeeded} more matching days to go.` : ''}
        </Body>
      ) : (
        ready.map((i) => (
          <View key={i.id} style={{ gap: 4, paddingVertical: 6, borderTopWidth: 1, borderTopColor: t.border }}>
            <Text style={{ color: t.text, fontWeight: '800', fontSize: 16 }}>{TITLES[i.id]}</Text>
            <Text style={{ color: t.text, fontSize: 15, lineHeight: 22 }}>{describeInsight(i)}</Text>
            <Text style={{ color: t.muted, fontSize: 12 }}>
              Based on {i.n[0]} and {i.n[1]} days.
              {Math.abs(i.diff!) >= CLEAR_DIFF && Math.min(...i.n) < 10 ? ' Still a small sample, so this may change.' : ''}
            </Text>
          </View>
        ))
      )}
      <Body muted>
        These are patterns in your own data, not proof of cause. A good night and a good round can both come from a quieter day, for
        example. Form is measured against your own recent rounds of each game, so steady improvement over time is not counted as a sleep or
        mood effect.
      </Body>
      <View style={{ flexDirection: 'row', gap: 16, flexWrap: 'wrap' }}>
        <Pressable accessibilityRole="link" onPress={() => router.push('/sleep')} hitSlop={6}>
          <Text style={{ color: t.primary, fontWeight: '700' }}>Log sleep</Text>
        </Pressable>
        <Pressable accessibilityRole="link" onPress={() => router.push('/mood')} hitSlop={6}>
          <Text style={{ color: t.primary, fontWeight: '700' }}>Mood check-in</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => setSetting('insights', false)} hitSlop={6}>
          <Text style={{ color: t.muted, textDecorationLine: 'underline' }}>Turn off</Text>
        </Pressable>
      </View>
    </Card>
  );
}
