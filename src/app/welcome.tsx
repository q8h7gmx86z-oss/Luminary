import { router } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { LogoMark } from '@/components/Logo';
import { Body, Button, Card, Heading, Screen, Title } from '@/components/ui';
import { AgeGroup, useStore } from '@/lib/store';
import { useTheme } from '@/lib/theme';

function Choice({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: on }}
      onPress={onPress}
      style={{
        minHeight: 46,
        paddingHorizontal: 14,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: on ? t.primary : t.border,
        backgroundColor: on ? t.soft : t.surface,
        justifyContent: 'center',
      }}
    >
      <Text style={{ color: t.text, fontSize: 16, fontWeight: on ? '700' : '500' }}>{label}</Text>
    </Pressable>
  );
}

export default function Welcome() {
  const { state, finishOnboarding } = useStore();
  const [age, setAge] = useState<AgeGroup | null>(null);

  return (
    <Screen>
      <View style={{ height: 24 }} />
      <LogoMark size={96} />
      <Title>Welcome to Luminary</Title>
      <Body>
        Your brain trainer. Daily workouts that adapt to you, a Sharpness score that shows your progress, and tactics built for every
        kind of brain, including ADHD.
      </Body>

      <Card>
        <Heading>Before you start</Heading>
        <Body>
          Luminary is a training tool, not a medical device. It does not diagnose or treat any condition, or replace your GP or
          prescriber.
        </Body>
        <Body>
          Your information stays on this device. There is no account, no advertising and no tracking. You can delete
          everything at any time in Settings.
        </Body>
      </Card>

      <Card>
        <Heading>How old are you?</Heading>
        <Body muted>Under-18s get extra privacy protections by default. Your answer never leaves your device.</Body>
        <View accessibilityRole="radiogroup" style={{ gap: 8 }}>
          <Choice label="Under 18" on={age === 'under18'} onPress={() => setAge('under18')} />
          <Choice label="18 or over" on={age === 'adult'} onPress={() => setAge('adult')} />
        </View>
      </Card>

      <Button
        label="I understand, let's begin"
        disabled={!age}
        onPress={() => {
          if (!age) return;
          finishOnboarding(age, state.region);
          router.replace('/');
        }}
      />
    </Screen>
  );
}
