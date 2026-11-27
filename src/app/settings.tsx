import { router } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Body, Button, Card, Checkbox, Heading, Screen } from '@/components/ui';
import { useStore } from '@/lib/store';
import { useTheme } from '@/lib/theme';
import { MembershipCard } from '@/plus/MembershipCard';

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
  const { state, setAgeGroup, setSetting, deleteEverything } = useStore();
  const t = useTheme();
  const [confirming, setConfirming] = useState(false);

  return (
    <Screen>
      <MembershipCard />

      <Card>
        <Heading>Your privacy</Heading>
        <Body>
          Everything you enter stays on this device. Luminary has no account, no server, no advertising and no analytics, so
          nobody else can see your check-ins, not even us.
        </Body>
        <Body muted>
          If you delete the app or clear your browser data, your entries are deleted too, unless you have made a backup.
        </Body>
      </Card>

      <Card>
        <Heading>Backup and move to a new device</Heading>
        <Body muted>Make an encrypted copy of your data that only your passphrase can open. Use it to restore, or to move to a new phone. No account needed.</Body>
        <Button kind="secondary" label="Backup and restore" onPress={() => router.push('/backup')} />
      </Card>

      <Card>
        <Heading>Age</Heading>
        <View accessibilityRole="radiogroup" style={{ gap: 8 }}>
          <Option label="Under 18" on={state.ageGroup === 'under18'} onPress={() => setAgeGroup('under18')} />
          <Option label="18 or over" on={state.ageGroup === 'adult'} onPress={() => setAgeGroup('adult')} />
        </View>
      </Card>

      <Card>
        <Heading>Training preferences</Heading>
        <Body muted>Session length, goal, challenge level, untimed mode, visuals, sound and breaks.</Body>
        <Button kind="secondary" label="Open training preferences" onPress={() => router.push('/preferences')} />
      </Card>

      <Card>
        <Heading>About Luminary</Heading>
        <View style={{ gap: 6, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: t.border }}>
          <Text style={{ color: t.text, fontSize: 17, fontWeight: '700', fontStyle: 'italic' }}>In loving memory of Rafi</Text>
          <Body muted>
            Created in memory of a life touched by dementia, and inspired by the belief that understanding, protecting and nurturing brain health
            matters at every age.
          </Body>
        </View>
        <Body>
          Luminary is a wellbeing tool. It is not a medical device and does not diagnose, treat or prevent any condition. Always
          follow advice from your own health professionals.
        </Body>
        <Pressable accessibilityRole="link" onPress={() => router.push('/help')} hitSlop={8}>
          <Text style={{ color: t.muted, fontSize: 14, textDecorationLine: 'underline' }}>Need support? Find services near you</Text>
        </Pressable>
      </Card>

      <Card>
        <Heading>Delete all my data</Heading>
        {confirming ? (
          <>
            <Body>
              This permanently removes your training history, levels, check-ins, tasks and plans from this device. It cannot be undone, and
              Luminary has no copy to recover.
            </Body>
            <Button kind="secondary" label="Make a backup first" onPress={() => router.push('/backup')} />
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
