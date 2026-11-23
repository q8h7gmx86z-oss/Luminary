import React from 'react';
import { Text, View } from 'react-native';

import { useTheme } from '@/lib/theme';

/** One number in a grid of stats, with a short label and an optional hint underneath. */
export function Metric({ label, value, hint, tone }: { label: string; value: string; hint?: string; tone?: 'good' }) {
  const t = useTheme();
  return (
    <View style={{ flexBasis: '30%', flexGrow: 1, padding: 10, borderRadius: 12, backgroundColor: t.bg, gap: 2 }}>
      <Text style={{ color: t.muted, fontSize: 12 }}>{label}</Text>
      <Text style={{ color: tone === 'good' ? t.good : t.text, fontSize: 17, fontWeight: '800', fontVariant: ['tabular-nums'] }}>{value}</Text>
      {hint ? <Text style={{ color: t.muted, fontSize: 11 }}>{hint}</Text> : null}
    </View>
  );
}
