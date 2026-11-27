import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { Button, Overline, Screen } from '@/components/ui';
import { type, useTheme } from '@/lib/theme';

import { currentMembership } from './billing';
import { Feature, FEATURES, hasAccess, Membership } from './plan';

/** The person's membership and a check for each feature. */
export function useMembership() {
  const [membership, setMembership] = useState<Membership>({ status: 'free' });
  useEffect(() => {
    let live = true;
    currentMembership().then((m) => live && setMembership(m));
    return () => {
      live = false;
    };
  }, []);
  return { membership, can: (f: Feature) => hasAccess(f, membership) };
}

/** Shows its children when the feature is open; otherwise a calm invitation to Plus, never a nag. */
export function PlusGate({ feature, children }: { feature: Feature; children: React.ReactNode }) {
  const { can } = useMembership();
  if (can(feature)) return <>{children}</>;
  return <PlusLocked feature={feature} />;
}

export function PlusLocked({ feature }: { feature: Feature }) {
  const t = useTheme();
  const f = FEATURES[feature];
  return (
    <Screen>
      <View style={{ gap: 10 }}>
        <Overline color={t.gold}>Luminary Plus</Overline>
        <Text accessibilityRole="header" style={[type.title, { color: t.text }]}>
          {f.name}
        </Text>
        <Text style={[type.body, { color: t.muted }]}>{f.detail} It is part of Luminary Plus, with a 7-day free trial.</Text>
        <Button label="See Luminary Plus" onPress={() => router.push('/plus')} />
        <Text style={[type.caption, { color: t.muted }]}>Your daily workout, the Benchmark, the Rafi Programme and the focus tools remain free.</Text>
      </View>
    </Screen>
  );
}
