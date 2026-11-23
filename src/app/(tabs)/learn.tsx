import { router } from 'expo-router';
import React from 'react';
import { Pressable, Text } from 'react-native';

import { Body, Card, Screen } from '@/components/ui';
import { ARTICLES } from '@/content/content';
import { useTheme } from '@/lib/theme';

export default function Learn() {
  const t = useTheme();
  return (
    <Screen>
      <Body muted>The science behind your training. Short reads, every one sourced.</Body>
      {ARTICLES.map((a) => (
        <Pressable key={a.id} accessibilityRole="link" onPress={() => router.push(`/article/${a.id}`)}>
          {({ pressed }) => (
            <Card style={{ opacity: pressed ? 0.85 : 1 }}>
              <Text style={{ color: t.text, fontSize: 18, fontWeight: '700' }}>{a.title}</Text>
              <Body muted>{a.summary}</Body>
            </Card>
          )}
        </Pressable>
      ))}
    </Screen>
  );
}
