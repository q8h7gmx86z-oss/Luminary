import React from 'react';
import { Text, View } from 'react-native';

import { fonts, radii, type, useTheme } from '@/lib/theme';

/** One number in a grid of stats, with a short label and an optional hint underneath. */
export function Metric({ label, value, hint, tone }: { label: string; value: string; hint?: string; tone?: 'good' | 'gold' }) {
  const t = useTheme();
  return (
    <View style={{ flexBasis: '30%', flexGrow: 1, padding: 10, borderRadius: radii.sm, borderWidth: 1, borderColor: t.border, gap: 2 }}>
      <Text style={{ color: t.muted, fontSize: 12, fontFamily: fonts.medium }}>{label}</Text>
      <Text style={{ color: tone === 'good' ? t.good : tone === 'gold' ? t.gold : t.text, ...type.number, fontSize: 17 }}>{value}</Text>
      {hint ? <Text style={{ color: t.muted, fontSize: 11, fontFamily: fonts.body }}>{hint}</Text> : null}
    </View>
  );
}
