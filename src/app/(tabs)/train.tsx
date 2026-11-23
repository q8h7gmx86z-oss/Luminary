import { router } from 'expo-router';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { Body, Screen, Title } from '@/components/ui';
import { useStore } from '@/lib/store';
import { useTheme } from '@/lib/theme';
import { AVAILABLE, GAMES, SKILLS } from '@/training/catalog';
import { FocusTrackCard } from '@/training/FocusTrackCard';
import { GameId, Skill } from '@/training/engine';

export default function Train() {
  const t = useTheme();
  const { state } = useStore();
  const all = Object.keys(GAMES) as GameId[];

  return (
    <Screen>
      <Title>Brain games</Title>
      <Body muted>Play any game on its own. Each one adapts to you, getting harder as you improve.</Body>
      <FocusTrackCard />
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
                    borderRadius: 16,
                    backgroundColor: t.surface,
                    borderWidth: 1,
                    borderColor: t.border,
                    opacity: playable ? (pressed ? 0.85 : 1) : 0.55,
                  })}
                >
                  <View style={{ width: 52, height: 52, borderRadius: 14, backgroundColor: SKILLS[skill].color, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: '#fff', fontSize: 26 }}>{info.glyph}</Text>
                  </View>
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
