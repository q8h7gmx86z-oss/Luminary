import { router } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Body, Button, Card, Checkbox, Heading, Screen } from '@/components/ui';
import { REGION_NAMES, Region } from '@/lib/crisis';
import { useStore } from '@/lib/store';
import { useTheme } from '@/lib/theme';

function Option({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: on }}
      onPress={onPress}
      style={{
        minHeight: 44,
        paddingHorizontal: 12,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: on ? t.primary : t.border,
        backgroundColor: on ? t.soft : t.surface,
        justifyContent: 'center',
      }}
    >
      <Text style={{ color: t.text, fontSize: 15, fontWeight: on ? '700' : '500' }}>{label}</Text>
    </Pressable>
  );
}

export default function Settings() {
  const { state, setRegion, setAgeGroup, setSetting, deleteEverything } = useStore();
  const [confirming, setConfirming] = useState(false);

  return (
    <Screen>
      <Card>
        <Heading>Your privacy</Heading>
        <Body>
          Everything you enter stays on this device. Luminary has no account, no server, no advertising and no analytics, so
          nobody else can see your check-ins, not even us.
        </Body>
        <Body muted>
          If you delete the app or clear your browser data, your entries are deleted too.
        </Body>
      </Card>

      <Card>
        <Heading>Region for helplines</Heading>
        <View accessibilityRole="radiogroup" style={{ gap: 8 }}>
          {(Object.keys(REGION_NAMES) as Region[]).map((r) => (
            <Option key={r} label={REGION_NAMES[r]} on={state.region === r} onPress={() => setRegion(r)} />
          ))}
        </View>
      </Card>

      <Card>
        <Heading>Age</Heading>
        <View accessibilityRole="radiogroup" style={{ gap: 8 }}>
          <Option label="Under 18" on={state.ageGroup === 'under18'} onPress={() => setAgeGroup('under18')} />
          <Option label="18 or over" on={state.ageGroup === 'adult'} onPress={() => setAgeGroup('adult')} />
        </View>
      </Card>

      <Card>
        <Heading>Sound and vibration</Heading>
        <Body muted>Gentle sounds and a light buzz tell you how you did in games. Turn either off if you find them distracting.</Body>
        <Checkbox checked={state.settings.sound} label="Game sounds" onPress={() => setSetting('sound', !state.settings.sound)} />
        <Checkbox checked={state.settings.vibration} label="Vibration (phones only)" onPress={() => setSetting('vibration', !state.settings.vibration)} />
      </Card>

      <Card>
        <Heading>About Luminary</Heading>
        <Body>
          Luminary is a wellbeing tool. It is not a medical device and does not diagnose, treat or prevent any condition. Always
          follow advice from your own health professionals.
        </Body>
      </Card>

      <Card>
        <Heading>Delete all my data</Heading>
        {confirming ? (
          <>
            <Body>This permanently removes every check-in, task and plan from this device. It cannot be undone.</Body>
            <Button
              kind="help"
              label="Yes, delete everything"
              onPress={async () => {
                await deleteEverything();
                router.replace('/welcome');
              }}
            />
            <Button kind="secondary" label="Cancel" onPress={() => setConfirming(false)} />
          </>
        ) : (
          <Button kind="secondary" label="Delete all my data" onPress={() => setConfirming(true)} />
        )}
      </Card>
    </Screen>
  );
}
