import { router } from 'expo-router';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { useStore } from '@/lib/store';
import { radii, type, useTheme } from '@/lib/theme';

import { daysUntilDue, report, summary } from './benchmark';

/** Entry point to the Luminary Benchmark, with its due status. */
export function BenchmarkCard() {
  const t = useTheme();
  const { state } = useStore();
  const records = state.training.benchmarks ?? [];
  const due = daysUntilDue(records, Date.now());
  const changes = report(records);
  const status = !records.length
    ? 'Four untrained tests, about ten minutes. This sets your baseline.'
    : due <= 0
      ? 'Your next Benchmark is due.'
      : `Next Benchmark in ${due} ${due === 1 ? 'day' : 'days'}.`;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="The Luminary Benchmark"
      onPress={() => router.push('/benchmark')}
      style={({ pressed }) => ({
        borderRadius: radii.panel,
        borderWidth: 1,
        borderColor: 'rgba(45,182,163,0.32)',
        backgroundColor: t.surface,
        padding: 18,
        gap: 8,
        opacity: pressed ? 0.92 : 1,
      })}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={[type.overline, { color: t.teal }]}>Monthly measurement</Text>
        <Icon name="chart" size={18} color={t.teal} strokeWidth={1.6} />
      </View>
      <Text style={[type.section, { color: t.text, fontSize: 19 }]}>The Luminary Benchmark</Text>
      <Text style={[type.caption, { color: t.muted }]}>{changes ? summary(changes) : 'Does your training carry over? Measured on tasks you never practise.'}</Text>
      <Text style={[type.caption, { color: due <= 0 ? t.gold : t.muted, fontWeight: '600' }]}>{status}</Text>
    </Pressable>
  );
}
