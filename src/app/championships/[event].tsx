import { router, Stack, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Text, useWindowDimensions, View } from 'react-native';

import { ResearchPanel } from '@/components/Research';
import { Button, Overline, Screen } from '@/components/ui';
import { fonts, radii, type, useTheme } from '@/lib/theme';
import { EVENT_ORDER, EventId, EVENTS, formatValue } from '@/training/championships';
import { EventIcon, TrendLine, useChampionships } from '@/training/ChampionshipsUI';

/** One event: your threshold, record and trend, how it adapts, and the research behind it. */
export default function EventDetail() {
  const t = useTheme();
  const { event } = useLocalSearchParams<{ event: string }>();
  const { width } = useWindowDimensions();
  const c = useChampionships();
  if (!EVENT_ORDER.includes(event as EventId)) return null;
  const id = event as EventId;
  const ev = EVENTS[id];
  const s = c.standings[id];
  const pct = s.change !== undefined ? Math.round(s.change * 100) : undefined;
  const inner = Math.min(width, 560) - 72;

  return (
    <Screen>
      <Stack.Screen options={{ title: ev.name }} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <EventIcon event={id} size={44} />
        <View style={{ gap: 2 }}>
          <Text accessibilityRole="header" style={[type.title, { color: t.text }]}>
            {ev.name}
          </Text>
          <Text style={{ color: ev.accent, fontFamily: fonts.medium, fontSize: 13 }}>
            {ev.skill} · played as {ev.task}
          </Text>
        </View>
      </View>

      <View style={{ borderRadius: radii.panel, borderWidth: 1, borderColor: t.border, backgroundColor: t.surface, padding: 16, gap: 10 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', gap: 10 }}>
          <View style={{ gap: 2, flexShrink: 1 }}>
            <Overline>Threshold</Overline>
            <Text style={[type.metric, { color: t.text, fontSize: 40 }]}>{s.current === undefined ? '—' : formatValue(s.current, s.unit)}</Text>
          </View>
          <View style={{ alignItems: 'flex-end', gap: 4 }}>
            {s.record !== undefined ? (
              <View style={{ height: 26, paddingHorizontal: 10, borderRadius: 13, backgroundColor: t.goldSoft, borderWidth: 1, borderColor: 'rgba(232,189,114,0.45)', justifyContent: 'center' }}>
                <Text style={{ color: t.gold, fontFamily: fonts.semibold, fontSize: 12 }}>Record {formatValue(s.record, s.unit)}</Text>
              </View>
            ) : null}
            {pct !== undefined ? (
              <Text style={{ color: pct >= 0 ? t.teal : t.muted, fontFamily: fonts.medium, fontSize: 12 }}>
                {pct >= 0 ? `${pct}% better than week 1` : `${-pct}% below week 1`}
              </Text>
            ) : null}
          </View>
        </View>
        <Text style={[type.caption, { color: t.muted }]}>
          {c.untimed ? 'In untimed mode the threshold is the level you hold at target accuracy. Untimed records are kept separately.' : ev.measure}
        </Text>
        {s.trend.length >= 2 ? (
          <View style={{ gap: 4 }}>
            <TrendLine values={s.trend} better={s.better} color={ev.accent} record={s.record} width={inner} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: t.muted, fontSize: 11, fontFamily: fonts.body }}>{s.trend.length} heats ago</Text>
              <Text style={{ color: t.muted, fontSize: 11, fontFamily: fonts.body }}>Latest · better is higher</Text>
            </View>
          </View>
        ) : (
          <Text style={[type.caption, { color: t.muted }]}>Your trend appears after two heats.</Text>
        )}
      </View>

      <View style={{ borderRadius: radii.row, borderWidth: 1, borderColor: t.border, backgroundColor: t.surface, padding: 16, gap: 8 }}>
        <Text style={[type.section, { color: t.text }]}>How this event adapts</Text>
        <Text style={[type.caption, { color: t.text, opacity: 0.85 }]}>
          After a heat at or above your target accuracy, the next heat moves up a level. Well below it, the next heat moves down. This keeps you close to the level at which you answer correctly about {Math.round(c.target * 100)}% of the time.
        </Text>
        <Text style={[type.caption, { color: t.text, opacity: 0.85 }]}>{ev.adapts}</Text>
        <Text style={[type.caption, { color: t.text, opacity: 0.85 }]}>Each heat resumes from your most recent level.</Text>
      </View>

      <ResearchPanel id={ev.research} startOpen />

      <Button label={`Run a ${ev.name} heat`} onPress={() => router.push(`/championships/heats?event=${id}`)} />
    </Screen>
  );
}
