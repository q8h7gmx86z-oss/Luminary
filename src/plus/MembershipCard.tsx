import { router } from 'expo-router';
import React from 'react';
import { Linking, Platform, Text } from 'react-native';

import { Body, Button, Card, Heading } from '@/components/ui';
import { type, useTheme } from '@/lib/theme';

import { daysLeft, gbp, MANAGE_URLS, PRICES, trialReminderAt } from './plan';
import { useMembership } from './PlusGate';

const fmt = (ms: number) => new Date(ms).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });

/** Settings: membership status, what happens next and exactly how to cancel. */
export function MembershipCard() {
  const t = useTheme();
  const { membership: m } = useMembership();
  const left = daysLeft(m, Date.now());
  const price = m.plan === 'annual' ? `${gbp(PRICES.annual)} a year` : `${gbp(PRICES.monthly)} a month`;
  const manage = Platform.OS === 'android' ? MANAGE_URLS.android : MANAGE_URLS.ios;

  return (
    <Card>
      <Heading>Your membership</Heading>
      {m.status === 'trial' && m.periodEndsAt ? (
        <>
          <Body>
            Free trial: {left} {left === 1 ? 'day' : 'days'} left. {m.cancelled ? `Access ends on ${fmt(m.periodEndsAt)} and you will not be charged.` : `On ${fmt(m.periodEndsAt)} it becomes ${price}.`}
          </Body>
          {!m.cancelled ? <Body muted>We will remind you on {fmt(trialReminderAt(m.periodEndsAt))}, two days before the trial ends.</Body> : null}
        </>
      ) : m.status === 'active' && m.periodEndsAt ? (
        <Body>{m.cancelled ? `Luminary Plus, ending on ${fmt(m.periodEndsAt)}. It will not renew.` : `Luminary Plus, ${price}. Renews on ${fmt(m.periodEndsAt)}.`}</Body>
      ) : (
        <Body>{m.status === 'lapsed' ? 'Your Plus membership has ended. Everything you recorded is still here.' : 'You are using Luminary free.'}</Body>
      )}
      {m.status === 'trial' || m.status === 'active' ? (
        <>
          <Button kind="secondary" label={Platform.OS === 'android' ? 'Manage in Google Play' : 'Manage in the App Store'} onPress={() => Linking.openURL(manage)} />
          <Text style={[type.caption, { color: t.muted }]}>
            To cancel: open the link above, choose Luminary and select Cancel Subscription. You keep Plus until the end of the period you have paid for, and
            your data stays on this device.
          </Text>
        </>
      ) : (
        <Button kind="secondary" label="See Luminary Plus" onPress={() => router.push('/plus')} />
      )}
    </Card>
  );
}
