import { router } from 'expo-router';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { Overline, Screen } from '@/components/ui';
import { dayIndex } from '@/training/engine';
import { fonts, radii, type, useTheme } from '@/lib/theme';
import { EVENT_ORDER, EVENTS, FULL_WEEK, sessionsThisWeek } from '@/training/championships';
import { useChampionships } from '@/training/ChampionshipsUI';

const fmt = (d: number) => new Date(d * 86_400_000).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });

/** The four-week season: trials, two weeks of training, then finals under the same conditions. */
export default function SeasonScreen() {
  const t = useTheme();
  const c = useChampionships();
  const s = c.season;
  const started = c.heats.length > 0;
  const sessions = sessionsThisWeek(c.heats, s);
  const weekStart = s.startDay + (s.week - 1) * 7;
  const playedDays = new Set(c.heats.map((h) => dayIndex(h.day)));
  const today = s.startDay + 28 - s.daysLeft;
  const records = EVENT_ORDER.filter((e) => c.standings[e].record !== undefined).map((e) => EVENTS[e].name);
  const weeks: { n: 1 | 2 | 3 | 4; name: string }[] = [
    { n: 1, name: 'Trials' },
    { n: 2, name: 'Training' },
    { n: 3, name: 'Training' },
    { n: 4, name: 'Finals' },
  ];

  return (
    <Screen>
      <View style={{ gap: 6 }}>
        <Overline>{started ? `Season ${s.number} · ${fmt(s.startDay)} to ${fmt(s.startDay + 27)}` : 'Your first season'}</Overline>
        <Text accessibilityRole="header" style={[type.title, { color: t.text }]}>
          Trials, training, finals
        </Text>
        <Text style={[type.body, { color: t.muted, fontSize: 14 }]}>
          Week 1 establishes your baseline. Weeks 2 and 3 train at threshold. Week 4 repeats the trials under the same conditions, so change is measured rather than assumed.
        </Text>
      </View>

      <View style={{ flexDirection: 'row', gap: 8 }}>
        {weeks.map((w) => {
          const now = started && w.n === s.week;
          const past = started && w.n < s.week;
          return (
            <View
              key={w.n}
              style={{
                flex: 1,
                padding: 10,
                gap: 4,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: now ? 'rgba(169,149,255,0.6)' : w.n === 4 ? 'rgba(232,189,114,0.35)' : t.border,
                backgroundColor: now ? 'rgba(117,97,232,0.14)' : t.surface,
              }}
            >
              <Text style={{ color: now ? t.lavender : t.muted, fontFamily: fonts.body, fontSize: 11 }}>Week {w.n}</Text>
              <Text style={{ color: w.n === 4 ? t.gold : t.text, fontFamily: fonts.semibold, fontSize: 13 }}>{w.name}</Text>
              <Text style={{ color: now ? t.lavender : past ? t.teal : t.muted, fontFamily: fonts.body, fontSize: 11 }}>{now ? 'Current' : past ? 'Completed' : 'Ahead'}</Text>
            </View>
          );
        })}
      </View>

      <View style={{ borderRadius: radii.row, borderWidth: 1, borderColor: t.border, backgroundColor: t.surface, padding: 16, gap: 10 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <Text style={[type.section, { color: t.text }]}>This week</Text>
          <Text style={{ color: sessions >= FULL_WEEK ? t.teal : t.muted, fontFamily: fonts.medium, fontSize: 12.5 }}>
            {Math.min(sessions, FULL_WEEK)} of {FULL_WEEK} sessions
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 6 }} accessible accessibilityLabel={`${sessions} training days this week.`}>
          {Array.from({ length: 7 }, (_, i) => {
            const d = weekStart + i;
            const played = playedDays.has(d);
            return (
              <View key={i} style={{ flex: 1, gap: 4, alignItems: 'center' }}>
                <Text style={{ color: t.muted, fontSize: 10.5, fontFamily: fonts.body }}>{new Date(d * 86_400_000).toLocaleDateString('en-GB', { weekday: 'narrow', timeZone: 'UTC' })}</Text>
                <View
                  style={{
                    alignSelf: 'stretch',
                    height: 30,
                    borderRadius: 9,
                    borderWidth: 1,
                    borderStyle: d === today && !played ? 'dashed' : 'solid',
                    borderColor: played ? 'rgba(45,182,163,0.6)' : d === today ? 'rgba(169,149,255,0.6)' : t.border,
                    backgroundColor: played ? 'rgba(45,182,163,0.25)' : 'transparent',
                  }}
                />
              </View>
            );
          })}
        </View>
        <Text style={[type.caption, { color: t.muted }]}>Four sessions constitute a full week. Missed days carry no penalty: distributed practice outperforms massed practice.</Text>
      </View>

      <View style={{ borderRadius: radii.row, borderWidth: 1, borderColor: t.border, backgroundColor: t.surface, padding: 16, gap: 10 }}>
        <Text style={[type.section, { color: t.text }]}>Against week 1</Text>
        {EVENT_ORDER.map((e) => {
          const st = c.standings[e];
          const pct = st.change === undefined ? undefined : Math.round(st.change * 100);
          return (
            <View key={e} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Text style={{ width: 64, color: t.text, fontFamily: fonts.body, fontSize: 13 }}>{EVENTS[e].name}</Text>
              <View style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: t.border, overflow: 'hidden' }}>
                <View style={{ width: `${Math.max(0, Math.min(100, (pct ?? 0) * 3))}%`, height: 6, backgroundColor: EVENTS[e].accent }} />
              </View>
              <Text style={{ width: 64, textAlign: 'right', color: pct !== undefined && pct > 0 ? t.teal : t.muted, fontFamily: fonts.medium, fontSize: 12.5, fontVariant: ['tabular-nums'] }}>
                {pct === undefined ? 'From week 2' : `${pct > 0 ? '+' : ''}${pct}%`}
              </Text>
            </View>
          );
        })}
        <Text style={[type.caption, { color: t.muted }]}>These results measure task performance. Each event’s research card sets out what is known about transfer to daily life.</Text>
      </View>

      <View style={{ borderRadius: radii.row, borderWidth: 1, borderColor: 'rgba(232,189,114,0.3)', backgroundColor: 'rgba(232,189,114,0.06)', padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ gap: 2, flex: 1 }}>
          <Text style={{ color: t.gold, fontFamily: fonts.semibold, fontSize: 13.5 }}>Confirmed records</Text>
          <Text style={[type.caption, { color: t.muted }]}>{records.length ? records.join(', ') : 'A record is confirmed once you reach it in two heats.'}</Text>
        </View>
        <Text style={{ color: t.gold, fontFamily: fonts.displayBold, fontSize: 26 }}>{records.length}</Text>
      </View>

      <Pressable accessibilityRole="link" onPress={() => router.push('/championships/settings')} hitSlop={8}>
        <Text style={{ color: t.lavender, fontFamily: fonts.medium, fontSize: 14, textAlign: 'center' }}>Training settings</Text>
      </Pressable>
    </Screen>
  );
}
