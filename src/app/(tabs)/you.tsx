import React from 'react';
import { Text, View } from 'react-native';

import { Overline, Screen } from '@/components/ui';
import { useStore } from '@/lib/store';
import { type, useTheme } from '@/lib/theme';
import { MembershipCard } from '@/plus/MembershipCard';
import { EntryCard } from '@/real/ui';

/** Everything personal in one place: your lab, your log, your settings. */
export default function You() {
  const t = useTheme();
  const { state } = useStore();
  const experiments = state.lab?.length ?? 0;
  return (
    <Screen>
      <View style={{ gap: 6 }}>
        <Overline>Your training, your way</Overline>
        <Text accessibilityRole="header" style={[type.title, { color: t.text }]}>
          Set Luminary to you.
        </Text>
        <Text style={[type.body, { color: t.muted }]}>Your experiments, your daily log, and how Luminary trains you.</Text>
      </View>

      <EntryCard
        overline="Training and accessibility"
        title="Pace, length and comfort"
        detail="Session length, goal, challenge level, untimed mode, minimal stimulation, contrast, sound, breaks and Aura."
        href="/preferences"
        icon="sliders"
        colour={t.lavender}
        cta="Open preferences"
      />

      <EntryCard
        overline="Personal Lab"
        title="Test what works for you"
        detail={
          experiments > 0
            ? `${experiments} experiment${experiments === 1 ? '' : 's'} so far. Paired days and an honest verdict.`
            : 'Does coffee, a walk or an early night sharpen you? Run a fair test on yourself.'
        }
        href="/lab"
        icon="bulb"
        colour={t.teal}
        cta="Open the Lab"
      />

      <EntryCard
        overline="Daily log"
        title="Sleep, mood and movement"
        detail="Quick check-ins that Luminary can compare with your training, on this device only."
        href="/movement"
        icon="moon"
        colour={t.gold}
        cta="Log movement"
      />

      <MembershipCard />

      <EntryCard
        overline="Settings and privacy"
        title="Your data stays yours"
        detail="Backup and restore, age, privacy, support services, and deleting your data."
        href="/settings"
        icon="info"
        colour={t.muted}
        cta="Open settings"
      />

      <View style={{ alignItems: 'center', gap: 4, paddingVertical: 8 }}>
        <Text style={{ color: t.text, fontSize: 15, fontStyle: 'italic' }}>In loving memory of Rafi</Text>
        <Text style={[type.caption, { color: t.muted }]}>Rafaela, 1947–2025</Text>
      </View>
    </Screen>
  );
}
