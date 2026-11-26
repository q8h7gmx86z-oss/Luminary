import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { ResearchLink } from '@/components/Research';
import { Overline, Screen } from '@/components/ui';
import { dayKey } from '@/lib/logic';
import { useStore } from '@/lib/store';
import { fonts, radii, type, useTheme } from '@/lib/theme';
import { MOVE_TARGET, movementWeek } from '@/lib/wholebrain';

const ADD = [10, 20, 30];

/** Movement: minutes that raise your heart rate, against the WHO weekly guideline. */
export default function Movement() {
  const t = useTheme();
  const { state, addMovement } = useStore();
  const today = dayKey();
  const mins = state.movement?.[today] ?? 0;
  const week = movementWeek(state.movement);
  const max = Math.max(60, ...week.days.map((d) => d.minutes));
  const share = Math.min(1, week.total / MOVE_TARGET);

  return (
    <Screen>
      <View style={{ gap: 6 }}>
        <Overline color={t.lavender}>Movement</Overline>
        <Text accessibilityRole="header" style={[type.title, { color: t.text }]}>
          {MOVE_TARGET} minutes a week.
        </Text>
        <Text style={[type.body, { color: t.muted }]}>
          The World Health Organization recommends 150 to 300 minutes of moderate activity each week: brisk walking, cycling, swimming, anything that
          raises your heart rate. Physical inactivity is one of the 14 changeable risk factors for dementia.
        </Text>
      </View>

      <View style={{ backgroundColor: t.surface, borderRadius: radii.panel, borderWidth: 1, borderColor: t.border, padding: 16, gap: 12 }}>
        <Overline>Today</Overline>
        <Text style={[type.metric, { color: t.text, fontSize: 40 }]} accessibilityLiveRegion="polite">
          {mins} <Text style={{ fontSize: 16, color: t.muted }}>minutes</Text>
        </Text>
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          {ADD.map((m) => (
            <Pressable
              key={m}
              accessibilityRole="button"
              accessibilityLabel={`Add ${m} minutes`}
              onPress={() => addMovement(today, m)}
              style={({ pressed }) => ({ height: 44, paddingHorizontal: 18, borderRadius: 22, justifyContent: 'center', backgroundColor: t.primary, opacity: pressed ? 0.88 : 1 })}
            >
              <Text style={{ color: t.primaryText, fontFamily: fonts.semibold }}>+{m} min</Text>
            </Pressable>
          ))}
          {mins > 0 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Remove 10 minutes"
              onPress={() => addMovement(today, -10)}
              style={({ pressed }) => ({ height: 44, paddingHorizontal: 18, borderRadius: 22, justifyContent: 'center', borderWidth: 1, borderColor: t.border, opacity: pressed ? 0.8 : 1 })}
            >
              <Text style={{ color: t.text, fontFamily: fonts.semibold }}>−10</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      <View style={{ backgroundColor: t.surface, borderRadius: radii.panel, borderWidth: 1, borderColor: t.border, padding: 16, gap: 12 }}>
        <Overline>Last seven days</Overline>
        <Text style={[type.body, { color: t.text }]}>
          {week.total} of {MOVE_TARGET} minutes{week.total >= MOVE_TARGET ? '. Guideline met.' : '.'}
        </Text>
        <View style={{ height: 8, borderRadius: 4, backgroundColor: t.soft, overflow: 'hidden' }} accessibilityLabel={`${Math.round(share * 100)}% of the weekly guideline`}>
          <View style={{ width: `${share * 100}%`, height: 8, borderRadius: 4, backgroundColor: share >= 1 ? t.gold : t.teal }} />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, height: 110 }}>
          {week.days.map((d) => (
            <View key={d.day} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
              <Text style={{ color: t.muted, fontSize: 11, fontVariant: ['tabular-nums'] }}>{d.minutes || ''}</Text>
              <View style={{ width: '70%', height: Math.max(3, (d.minutes / max) * 70), borderRadius: 4, backgroundColor: d.minutes ? t.teal : t.soft }} />
              <Text style={{ color: t.muted, fontSize: 12, fontFamily: fonts.medium }}>{['S', 'M', 'T', 'W', 'T', 'F', 'S'][new Date(d.day + 'T12:00').getDay()]}</Text>
            </View>
          ))}
        </View>
        <Text style={[type.caption, { color: t.muted }]}>
          Moderate means you can talk but not sing. A minute of vigorous activity, where speaking is difficult, counts as roughly two of moderate. Add
          muscle-strengthening work on two days a week.
        </Text>
      </View>

      <ResearchLink id="move" label="Why movement matters for the brain" />
    </Screen>
  );
}
