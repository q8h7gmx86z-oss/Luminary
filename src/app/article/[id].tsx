import * as Linking from 'expo-linking';
import { Stack, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Pressable, Text } from 'react-native';

import { Body, Card, Heading, Screen, Title } from '@/components/ui';
import { ARTICLES } from '@/content/content';
import { useTheme } from '@/lib/theme';

export default function Article() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const t = useTheme();
  const a = ARTICLES.find((x) => x.id === id);

  if (!a) {
    return (
      <Screen>
        <Body>Sorry, we could not find that article.</Body>
      </Screen>
    );
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Learn' }} />
      <Title>{a.title}</Title>
      {a.body.map((p, i) => (
        <Body key={i}>{p}</Body>
      ))}
      <Card>
        <Heading>Sources</Heading>
        {a.sources.map((s) => (
          <Pressable key={s.url} accessibilityRole="link" onPress={() => Linking.openURL(s.url)}>
            <Text style={{ color: t.primary, fontSize: 15, textDecorationLine: 'underline' }}>{s.label}</Text>
          </Pressable>
        ))}
      </Card>
      <Body muted>
        This is general information, not medical advice. Talk to your GP or another health professional about your own
        situation.
      </Body>
    </Screen>
  );
}
