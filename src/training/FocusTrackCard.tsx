import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Body, Button, Card, Heading } from '@/components/ui';
import { dayKey } from '@/lib/logic';
import { useTheme } from '@/lib/theme';

import { AVAILABLE, GAMES, SKILLS } from './catalog';
import { focusGames } from './engine';

/** Entry point for the focus track, a short set built around the skills ADHD makes harder. */
export function FocusTrackCard() {
  const t = useTheme();
  const [more, setMore] = useState(false);
  const games = focusGames(dayKey(), AVAILABLE);
  return (
    <Card style={{ borderColor: SKILLS.attention.color, borderWidth: 2 }}>
      <Text style={{ color: SKILLS.attention.color, fontWeight: '800', letterSpacing: 0.6, fontSize: 13 }}>FOCUS TRACK</Text>
      <Heading>Made for ADHD and busy brains</Heading>
      <Body muted>About 6 minutes. Short rounds, clear goals and you can stop at any point.</Body>
      <View style={{ gap: 6 }}>
        {games.map((g) => (
          <Text key={g} style={{ color: t.text, fontSize: 15 }}>
            {GAMES[g].glyph}  {GAMES[g].name} · {SKILLS[GAMES[g].skill].name}
          </Text>
        ))}
      </View>
      <Button label="Start focus track" onPress={() => router.push('/workout?track=focus')} />
      <Pressable accessibilityRole="button" onPress={() => setMore(!more)} hitSlop={8}>
        <Text style={{ color: t.primary, fontWeight: '700' }}>{more ? 'Hide the honest part' : 'Will this help my ADHD?'}</Text>
      </Pressable>
      {more ? (
        <View style={{ gap: 8 }}>
          <Body muted>
            These games practise holding back, ignoring distractions and keeping track, which ADHD often makes harder. You will get better at the
            games. In studies, effects on everyday ADHD symptoms are small when judged by people who do not know who trained, so this is practice,
            not treatment.
          </Body>
          <Body muted>
            Proven help for ADHD includes medication, coaching and practical changes at home, school or work. Talk to your GP if you think you
            may have ADHD or your support is not working.
          </Body>
          <Pressable accessibilityRole="link" onPress={() => Linking.openURL('https://doi.org/10.1016/j.jaac.2014.12.010')}>
            <Text style={{ color: t.primary, textDecorationLine: 'underline' }}>Cortese et al. 2015, J Am Acad Child Adolesc Psychiatry</Text>
          </Pressable>
        </View>
      ) : null}
    </Card>
  );
}
