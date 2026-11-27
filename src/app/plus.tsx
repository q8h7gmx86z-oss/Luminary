import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { NavyGlow } from '@/components/GameBadge';
import { Button, Overline, Screen } from '@/components/ui';
import { fonts, radii, type, useTheme } from '@/lib/theme';
import { BILLING_AVAILABLE, restorePurchases, startTrial, UNAVAILABLE } from '@/plus/billing';
import { annualPerMonth, annualSaving, FEATURES, FREE_FEATURES, gbp, PLUS_FEATURES, PRICES, PROMISES } from '@/plus/plan';
import { useMembership } from '@/plus/PlusGate';

function PlanOption({ on, title, price, note, badge, onPress }: { on: boolean; title: string; price: string; note: string; badge?: string; onPress: () => void }) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected: on }}
      accessibilityLabel={`${title}, ${price}. ${note}`}
      onPress={onPress}
      style={{ flex: 1, borderRadius: radii.panel, borderWidth: on ? 1.5 : 1, borderColor: on ? t.gold : t.border, backgroundColor: t.surface, padding: 14, gap: 4 }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={[type.overline, { color: on ? t.gold : t.muted }]}>{title}</Text>
        {badge ? <Text style={{ color: t.bg, backgroundColor: t.gold, fontFamily: fonts.semibold, fontSize: 11, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8, overflow: 'hidden' }}>{badge}</Text> : null}
      </View>
      <Text style={[type.metric, { color: t.text, fontSize: 26 }]}>{price}</Text>
      <Text style={[type.caption, { color: t.muted }]}>{note}</Text>
    </Pressable>
  );
}

/** Luminary Plus: one tier, two ways to pay, and plain promises about billing. */
export default function Plus() {
  const t = useTheme();
  const { membership } = useMembership();
  const [plan, setPlan] = useState<'annual' | 'monthly'>('annual');
  const [note, setNote] = useState('');
  const member = membership.status === 'trial' || membership.status === 'active';

  const begin = async () => {
    const r = await startTrial(plan);
    setNote(r.ok ? '' : r.reason);
  };
  const restore = async () => {
    const r = await restorePurchases();
    setNote(r.ok ? 'Your membership has been restored.' : r.reason);
  };

  return (
    <Screen>
      <View style={{ borderRadius: radii.panel, overflow: 'hidden', backgroundColor: t.surface, borderWidth: 1, borderColor: t.gold + '55', padding: 20, gap: 8 }}>
        <NavyGlow height={200} color={t.gold} />
        <Overline color={t.gold}>Luminary Plus</Overline>
        <Text accessibilityRole="header" style={[type.title, { color: t.text }]}>
          The complete cognitive studio.
        </Text>
        <Text style={[type.body, { color: t.muted }]}>
          Every task at any hour, the Championships, the Personal Lab, the memory courses and four-week programmes. Built on published science, measured
          honestly.
        </Text>
      </View>

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <PlanOption
          on={plan === 'annual'}
          title="Annual"
          price={gbp(PRICES.annual)}
          note={`${gbp(annualPerMonth())} a month, billed yearly`}
          badge={`Save ${annualSaving()}%`}
          onPress={() => setPlan('annual')}
        />
        <PlanOption on={plan === 'monthly'} title="Monthly" price={gbp(PRICES.monthly)} note="Billed monthly" onPress={() => setPlan('monthly')} />
      </View>

      <View style={{ gap: 8 }}>
        <Button label={member ? 'You are a member' : `Begin your ${PRICES.trialDays}-day free trial`} disabled={member || !BILLING_AVAILABLE} onPress={begin} />
        <Text style={[type.caption, { color: t.muted, textAlign: 'center' }]}>
          {BILLING_AVAILABLE
            ? `Free for ${PRICES.trialDays} days, then ${plan === 'annual' ? `${gbp(PRICES.annual)} a year` : `${gbp(PRICES.monthly)} a month`}. Cancel any time before the trial ends and you pay nothing.`
            : UNAVAILABLE}
        </Text>
        {note ? <Text style={[type.caption, { color: t.help, textAlign: 'center' }]}>{note}</Text> : null}
      </View>

      <View style={{ backgroundColor: t.surface, borderRadius: radii.panel, borderWidth: 1, borderColor: t.border, padding: 16, gap: 10 }}>
        <Overline color={t.gold}>Plus adds</Overline>
        {PLUS_FEATURES.map((f) => (
          <View key={f} style={{ flexDirection: 'row', gap: 10 }}>
            <Icon name="check" size={16} color={t.gold} strokeWidth={2.4} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: t.text, fontFamily: fonts.semibold }}>{FEATURES[f].name}</Text>
              <Text style={[type.caption, { color: t.muted }]}>{FEATURES[f].detail}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={{ backgroundColor: t.surface, borderRadius: radii.panel, borderWidth: 1, borderColor: t.border, padding: 16, gap: 10 }}>
        <Overline>Always free</Overline>
        {FREE_FEATURES.map((f) => (
          <View key={f} style={{ flexDirection: 'row', gap: 10 }}>
            <Icon name="check" size={16} color={t.teal} strokeWidth={2.4} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: t.text, fontFamily: fonts.semibold }}>{FEATURES[f].name}</Text>
              <Text style={[type.caption, { color: t.muted }]}>{FEATURES[f].detail}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={{ backgroundColor: t.surface, borderRadius: radii.panel, borderWidth: 1, borderColor: t.border, padding: 16, gap: 10 }}>
        <Overline>Our billing promises</Overline>
        {PROMISES.map((p, i) => (
          <Text key={i} style={[type.caption, { color: t.text }]}>
            {i + 1}. {p}
          </Text>
        ))}
      </View>

      <Pressable accessibilityRole="button" onPress={restore} hitSlop={8}>
        <Text style={{ color: t.lavender, fontFamily: fonts.semibold, textAlign: 'center' }}>Restore a previous purchase</Text>
      </Pressable>
      <Text style={[type.caption, { color: t.muted, textAlign: 'center' }]}>
        Payment is taken by Apple or Google. Subscriptions renew automatically until cancelled in your store account settings. Prices include VAT.
      </Text>
    </Screen>
  );
}
