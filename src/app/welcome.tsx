import { router } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Body, Button, Card, Heading, Screen, Title } from '@/components/ui';
import { REGION_NAMES, Region } from '@/lib/crisis';
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
  const [region, setRegion] = useState<Region>(state.region);

  return (
    <Screen>
      <View style={{ height: 24 }} />
      <Title>Welcome to Luminary</Title>
      <Body>
        Everyday tools for focus, mood, sleep and long-term brain health. Made for every kind of brain, including ADHD and
        other neurodivergent minds.
      </Body>

      <Card>
        <Heading>Before you start</Heading>
        <Body>
          Luminary helps you build healthy habits. It is not a medical device and cannot diagnose or treat any condition. It
          does not replace your GP, therapist or prescriber.
        </Body>
        <Body>
          Your information stays on this device. There is no account, no advertising and no tracking. You can delete
          everything at any time in Settings.
        </Body>
        <Button kind="help" label="I need help right now" onPress={() => router.push('/help')} />
      </Card>

      <Card>
        <Heading>How old are you?</Heading>
        <Body muted>This only changes which support lines we show you. It never leaves your device.</Body>
        <View accessibilityRole="radiogroup" style={{ gap: 8 }}>
          <Choice label="Under 18" on={age === 'under18'} onPress={() => setAge('under18')} />
          <Choice label="18 or over" on={age === 'adult'} onPress={() => setAge('adult')} />
        </View>
      </Card>

      <Card>
        <Heading>Where are you?</Heading>
        <Body muted>So we can show the right helplines.</Body>
        <View accessibilityRole="radiogroup" style={{ gap: 8 }}>
          {(Object.keys(REGION_NAMES) as Region[]).map((r) => (
            <Choice key={r} label={REGION_NAMES[r]} on={region === r} onPress={() => setRegion(r)} />
          ))}
        </View>
      </Card>

      <Button
        label="I understand, let's begin"
        disabled={!age}
        onPress={() => {
          if (!age) return;
          finishOnboarding(age, region);
          router.replace('/');
        }}
      />
    </Screen>
  );
}
