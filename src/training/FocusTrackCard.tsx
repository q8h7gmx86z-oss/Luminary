import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Body, Button, Card, Heading } from '@/components/ui';
import { dayKey } from '@/lib/logic';
import { useTheme } from '@/lib/theme';

import { AVAILABLE, GAMES, SKILLS } from './catalog';
import { focusGames } from './engine';

/** Focus session: three attention and memory drills, for warming up before focused work. */
export function FocusTrackCard() {
  const t = useTheme();
  const [more, setMore] = useState(false);
  const games = focusGames(dayKey(), AVAILABLE);
  return (
    <Card style={{ borderColor: SKILLS.attention.color, borderWidth: 2 }}>
      <Text style={{ color: SKILLS.attention.color, fontWeight: '800', letterSpacing: 0.6, fontSize: 13 }}>FOCUS SESSION</Text>
      <Heading>Warm up your attention</Heading>
      <Body muted>Three attention and memory drills before work that needs your full focus. Short rounds, and you can stop at any point.</Body>
      <View style={{ gap: 6 }}>
        {games.map((g) => (
          <Text key={g} style={{ color: t.text, fontSize: 15 }}>
            {GAMES[g].glyph}  {GAMES[g].name} · {SKILLS[GAMES[g].skill].name}
          </Text>
        ))}
      </View>
      <Button label="Start focus session" onPress={() => router.push('/workout?track=focus')} />
      <Pressable accessibilityRole="button" onPress={() => setMore(!more)} hitSlop={8}>
        <Text style={{ color: t.primary, fontWeight: '700' }}>{more ? 'Hide the research' : 'What does the research say?'}</Text>
      </Pressable>
      {more ? (
        <View style={{ gap: 8 }}>
          <Body muted>
            These drills train holding back, filtering out distractions and keeping track. You will get better at the drills. Studies, including
            ones with people who have ADHD, find smaller effects on everyday life when judged by people who do not know who trained. Use them as
            training for your attention, alongside whatever else works for you.
          </Body>
          <Body muted>
            Every brain has its own attention style. Many people with ADHD bring real strengths, such as creativity and deep focus on what
            interests them. If you want an ADHD assessment or support, your GP is the place to start.
          </Body>
          <Pressable accessibilityRole="link" onPress={() => Linking.openURL('https://doi.org/10.1016/j.jaac.2014.12.010')}>
            <Text style={{ color: t.primary, textDecorationLine: 'underline' }}>Cortese et al. 2015, J Am Acad Child Adolesc Psychiatry</Text>
          </Pressable>
        </View>
      ) : null}
    </Card>
  );
}
