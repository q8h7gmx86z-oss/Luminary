import { router } from 'expo-router';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { NavyGlow } from '@/components/GameBadge';
import { Icon } from '@/components/Icon';
import { Body, Card, Screen } from '@/components/ui';
import { ARTICLES } from '@/content/content';
import { GOLD } from '@/lib/brand';
import { useTheme } from '@/lib/theme';

export default function Learn() {
  const t = useTheme();
  return (
    <Screen>
      <Pressable accessibilityRole="button" onPress={() => router.push('/rafi')}>
        {({ pressed }) => (
          <View style={{ backgroundColor: '#0B1640', borderRadius: 22, padding: 20, gap: 6, overflow: 'hidden', opacity: pressed ? 0.92 : 1 }}>
            <NavyGlow height={150} />
            <Text style={{ color: GOLD, fontWeight: '800', letterSpacing: 1, fontSize: 12 }}>THE RAFI PROGRAMME</Text>
            <Text style={{ color: '#FFFFFF', fontSize: 22, fontWeight: '900' }}>Protect your brain for life</Text>
            <Text style={{ color: '#D7DCF5', fontSize: 15 }}>The 14 changeable dementia risk factors, turned into your personal plan.</Text>
          </View>
        )}
      </Pressable>
      <Body muted>The science behind your training. Short reads, every one sourced.</Body>
      {ARTICLES.map((a) => (
        <Pressable key={a.id} accessibilityRole="link" onPress={() => router.push(`/article/${a.id}`)}>
          {({ pressed }) => (
            <Card style={{ opacity: pressed ? 0.85 : 1, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ flex: 1, gap: 6 }}>
                <Text style={{ color: t.text, fontSize: 18, fontWeight: '800', letterSpacing: -0.2 }}>{a.title}</Text>
                <Body muted>{a.summary}</Body>
              </View>
              <Icon name="arrow" size={20} color={t.muted} />
            </Card>
          )}
        </Pressable>
      ))}
    </Screen>
  );
}
