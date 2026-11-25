import { router } from 'expo-router';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { Body, Screen, Title } from '@/components/ui';
import { useStore } from '@/lib/store';
import { GOLD } from '@/lib/brand';
import { useTheme } from '@/lib/theme';
import { AVAILABLE, GAMES, SKILLS } from '@/training/catalog';
import { savedScore } from '@/iq/items';
import { GameId, Skill } from '@/training/engine';
import { GameBadge, NavyGlow } from '@/components/GameBadge';

export default function Train() {
  const t = useTheme();
  const { state } = useStore();
  const all = Object.keys(GAMES) as GameId[];

  return (
    <Screen>
      <Title>Brain games</Title>
      <Body muted>Play any game on its own. Each one adapts to you, getting harder as you improve.</Body>
      <Pressable
        accessibilityRole="button"
        onPress={() => router.push('/iq')}
        style={({ pressed }) => ({ backgroundColor: '#0B1640', borderRadius: 22, padding: 20, gap: 6, overflow: 'hidden', opacity: pressed ? 0.92 : 1 })}
      >
        <NavyGlow height={170} />
        <Text style={{ color: GOLD, fontWeight: '800', letterSpacing: 1, fontSize: 12 }}>REASONING ASSESSMENT</Text>
        <Text style={{ color: '#FFFFFF', fontSize: 22, fontWeight: '900' }}>Put your reasoning to the test</Text>
        <Text style={{ color: '#D7DCF5', fontSize: 15 }}>
          20 timed questions on patterns, numbers and words.{' '}
          {state.training.tests?.length ? `Last score ${savedScore(state.training.tests[state.training.tests.length - 1])} / 100.` : 'About 13 minutes.'}
        </Text>
      </Pressable>
      <Pressable accessibilityRole="link" onPress={() => router.push('/preferences')} hitSlop={8}>
        <Text style={{ color: t.primary, fontWeight: '700' }}>Set your goal, pace, untimed mode and more →</Text>
      </Pressable>
      {(Object.keys(SKILLS) as Skill[]).map((skill) => {
        const games = all.filter((g) => GAMES[g].skill === skill);
        return (
          <View key={skill} style={{ gap: 10 }}>
            <Text style={{ color: SKILLS[skill].color, fontWeight: '800', letterSpacing: 0.6, fontSize: 13 }}>{SKILLS[skill].name.toUpperCase()}</Text>
            {games.map((g) => {
              const info = GAMES[g];
              const playable = AVAILABLE.includes(g);
              const best = Math.max(0, ...state.training.results.filter((r) => r.game === g).map((r) => r.score));
              return (
                <Pressable
                  key={g}
                  accessibilityRole="button"
                  disabled={!playable}
                  onPress={() => router.push(`/play/${g}`)}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 14,
                    padding: 14,
                    borderRadius: 18,
                    backgroundColor: t.surface,
                    borderWidth: 1,
                    borderColor: t.border,
                    boxShadow: t.shadow,
                    opacity: playable ? (pressed ? 0.85 : 1) : 0.55,
                  })}
                >
                  <GameBadge game={g} size={52} />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={{ color: t.text, fontWeight: '700', fontSize: 17 }}>{info.name}</Text>
                    <Text style={{ color: t.muted, fontSize: 14 }}>{playable ? info.tagline : 'Coming in the next update'}</Text>
                  </View>
                  {playable ? (
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ color: t.text, fontWeight: '700' }}>Lv {state.training.levels[g] ?? 1}</Text>
                      {best > 0 ? <Text style={{ color: t.muted, fontSize: 12 }}>Best {best}</Text> : null}
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        );
      })}
    </Screen>
  );
}
