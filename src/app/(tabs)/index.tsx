import { Link, router } from 'expo-router';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { Body, Button, Card, Checkbox, Heading, Screen, Title } from '@/components/ui';
import { HABITS } from '@/content/content';
import { dayKey, daysShownUp } from '@/lib/logic';
import { useStore } from '@/lib/store';
import { GOLD, NAVY, NAVY_TILE, ON_NAVY, ON_NAVY_FAINT, ON_NAVY_MUTED } from '@/lib/brand';
import { useTheme } from '@/lib/theme';
import { SharpnessCard } from '@/training/SharpnessCard';
import { GAMES, SKILLS } from '@/training/catalog';
import { ChallengesCard } from '@/training/ChallengesCard';
import { GOAL_NAMES } from '@/training/planner';
import { useTodayPlan } from '@/training/usePlan';
import { GameBadge, NavyGlow } from '@/components/GameBadge';
import { Icon } from '@/components/Icon';

function dateLine(): string {
  return new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
}

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

  const plan = useTodayPlan();
  const prefs = state.settings;
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
      <View style={{ gap: 2 }}>
        <Text style={{ color: t.muted, fontSize: 14, fontWeight: '700', letterSpacing: 0.4 }}>{dateLine().toUpperCase()}</Text>
        <Title>{greeting()}</Title>
      </View>

      <View style={{ backgroundColor: NAVY, borderRadius: 24, padding: 22, gap: 16, overflow: 'hidden' }}>
        <NavyGlow />
        <Text style={{ color: GOLD, fontWeight: '800', letterSpacing: 0.6, fontSize: 13 }}>
          {workedOut ? 'DONE FOR TODAY' : `YOUR PLAN · ${prefs.sessionMinutes} MIN · ${GOAL_NAMES[prefs.goal].toUpperCase()}`}
        </Text>
        <Text style={{ color: ON_NAVY, fontSize: 24, fontWeight: '800' }}>
          {workedOut ? 'Session banked. Come back tomorrow, or go again.' : `Built from your last sessions`}
        </Text>
        <View style={{ gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 40, height: 40, borderRadius: 11, backgroundColor: NAVY_TILE, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="wind" size={20} color={ON_NAVY_MUTED} />
            </View>
            <Text style={{ color: ON_NAVY, fontSize: 15, fontWeight: '600' }}>1-minute breathing warm-up</Text>
          </View>
          {plan.map((p) => (
            <View key={p.game} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <GameBadge game={p.game} size={40} />
              <View style={{ flex: 1, gap: 1 }}>
                <Text style={{ color: ON_NAVY, fontSize: 16, fontWeight: '700' }}>
                  {GAMES[p.game].name} <Text style={{ color: ON_NAVY_FAINT, fontWeight: '600' }}>· {SKILLS[GAMES[p.game].skill].name}</Text>
                </Text>
                <Text style={{ color: ON_NAVY_MUTED, fontSize: 13 }}>{p.reason}</Text>
              </View>
            </View>
          ))}
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/workout')}
          style={({ pressed }) => ({
            backgroundColor: '#4B5FD6',
            borderRadius: 16,
            minHeight: 54,
            flexDirection: 'row',
            gap: 8,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.9 : 1,
          })}
        >
          <Text style={{ color: '#FFFFFF', fontSize: 17, fontWeight: '800' }}>{workedOut ? 'Train again' : 'Start workout'}</Text>
          <Icon name="arrow" size={20} color="#FFFFFF" strokeWidth={2.4} />
        </Pressable>
        <Pressable accessibilityRole="link" onPress={() => router.push('/preferences')} hitSlop={8}>
          <Text style={{ color: ON_NAVY, fontWeight: '700', textAlign: 'center', textDecorationLine: 'underline' }}>Change length, goal or pace</Text>
        </Pressable>
      </View>

      <ChallengesCard />

      <SharpnessCard compact />

      <Card>
        <Heading>This week</Heading>
        <Body>
          Active on {shownUp} of the last 7 days.
          {shownUp === 0 ? ' Start today: one workout gets the week going.' : ' A missed day never wipes your gains. Consistency over weeks is what moves the score.'}
        </Body>
      </Card>

      <Card>
        <Heading>Quick check-ins</Heading>
        <View style={{ gap: 8 }}>
          <Button
            kind={mood ? 'secondary' : 'primary'}
            label={mood ? 'Mood logged today ✓' : 'Log mood, energy and focus'}
            onPress={() => router.push('/mood')}
          />
          <Button
            kind={sleep ? 'secondary' : 'primary'}
            label={sleep ? 'Sleep logged today ✓' : 'Log last night’s sleep'}
            onPress={() => router.push('/sleep')}
          />
        </View>
      </Card>

      {next ? (
        <Card>
          <Heading>Your next step</Heading>
          <Body muted>{next.task.title}</Body>
          <Body>{next.s.text}</Body>
          <Button kind="secondary" label="Open Focus" onPress={() => router.push('/focus')} />
        </Card>
      ) : null}

      <Card>
        <Heading>Daily brain habits</Heading>
        <Body muted>Your training outside the app. Each one is backed by the research below.</Body>
        {HABITS.map((h) => (
          <View key={h.id}>
            <Checkbox checked={done.includes(h.id)} label={h.label} onPress={() => toggleHabit(h.id)} />
            <Text style={{ color: t.muted, fontSize: 13, marginLeft: 38 }}>{h.why}</Text>
          </View>
        ))}
        <Link href="/rafi" style={{ color: t.primary, fontWeight: '600', fontSize: 15 }}>
          Your full brain health plan: the Rafi Programme
        </Link>
      </Card>

      <Link href="/settings" style={{ color: t.primary, fontWeight: '600', fontSize: 15, textAlign: 'center' }}>
        Settings and privacy
      </Link>
    </Screen>
  );
}
