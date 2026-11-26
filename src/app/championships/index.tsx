import { router } from 'expo-router';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { ResearchLink } from '@/components/Research';
import { Overline, Screen } from '@/components/ui';
import { QUOTES } from '@/content/research';
import { fonts, radii, type, useTheme } from '@/lib/theme';
import { EVENT_ORDER, FULL_WEEK, sessionsThisWeek } from '@/training/championships';
import { ChampionshipChart, EventRow, useChampionships } from '@/training/ChampionshipsUI';

/** The Neural Championships: the adaptive training core. One event per thinking skill. */
export default function Championships() {
  const t = useTheme();
  const c = useChampionships();
  const records = EVENT_ORDER.filter((e) => c.standings[e].record !== undefined).length;
  const started = c.heats.length > 0;
  const week = sessionsThisWeek(c.heats, c.season);
  const quote = QUOTES.cajal;

  return (
    <Screen>
      <View style={{ gap: 6 }}>
        <Overline>{started ? `Season ${c.season.number} · Week ${c.season.week} of 4 · ${c.season.phase}` : 'Season 1 begins with your first heats'}</Overline>
        <Text accessibilityRole="header" style={[type.title, { color: t.text, fontSize: 26 }]}>
          The Neural Championships
        </Text>
        <Text style={[type.body, { color: t.muted, fontSize: 14 }]}>
          One event for each thinking skill, with more to come. Each event identifies your threshold and trains precisely at it. The only benchmark is your own record.
        </Text>
      </View>

      <View style={{ borderRadius: radii.panel, borderWidth: 1, borderColor: t.border, backgroundColor: t.surface, paddingVertical: 12, alignItems: 'center', gap: 6 }}>
        <ChampionshipChart standings={c.standings} />
        <View style={{ flexDirection: 'row', gap: 16, flexWrap: 'wrap', justifyContent: 'center', paddingHorizontal: 12 }}>
          <Legend color={t.lavender} label="Now" />
          <Legend color={t.muted} label="Week 1 baseline" dashed />
          <Text style={{ color: t.gold, fontFamily: fonts.medium, fontSize: 12 }}>
            {records} {records === 1 ? 'record' : 'records'} confirmed
          </Text>
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={() => router.push('/championships/heats')}
        style={({ pressed }) => ({
          minHeight: 60,
          borderRadius: radii.button,
          backgroundColor: t.primary,
          paddingHorizontal: 20,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          opacity: pressed ? 0.9 : 1,
          boxShadow: t.primaryGlow,
        })}
      >
        <View style={{ gap: 2 }}>
          <Text style={{ color: t.primaryText, fontFamily: fonts.display, fontSize: 16 }}>{started ? "Begin today's heats" : 'Begin your trials'}</Text>
          <Text style={{ color: t.primaryText, opacity: 0.85, fontFamily: fonts.body, fontSize: 12.5 }}>
            Five events · about 12 minutes{c.untimed ? ' · untimed' : ''}
          </Text>
        </View>
        <Icon name="arrow" size={20} color={t.primaryText} />
      </Pressable>

      <View style={{ gap: 8 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <Overline>Current thresholds</Overline>
          <Pressable accessibilityRole="link" onPress={() => router.push('/championships/season')} hitSlop={8}>
            <Text style={{ color: t.lavender, fontFamily: fonts.medium, fontSize: 13 }}>
              Season · {week} of {FULL_WEEK} this week
            </Text>
          </Pressable>
        </View>
        {EVENT_ORDER.map((e) => (
          <EventRow key={e} s={c.standings[e]} />
        ))}
      </View>

      <ResearchLink id="championships" label="Why the Championships train at threshold" />

      <Pressable accessibilityRole="link" onPress={() => router.push('/championships/settings')} hitSlop={8}>
        <Text style={{ color: t.lavender, fontFamily: fonts.medium, fontSize: 14, textAlign: 'center' }}>Training settings</Text>
      </Pressable>

      <View style={{ gap: 4, paddingTop: 4 }}>
        <Text style={{ color: t.muted, fontFamily: fonts.body, fontStyle: 'italic', fontSize: 13, lineHeight: 19 }}>“{quote.text}”</Text>
        <Text style={{ color: t.muted, fontFamily: fonts.medium, fontSize: 12 }}>
          {quote.who}, {quote.role}
        </Text>
      </View>
    </Screen>
  );
}

function Legend({ color, label, dashed }: { color: string; label: string; dashed?: boolean }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View style={{ width: 14, height: 0, borderTopWidth: 2, borderColor: color, borderStyle: dashed ? 'dashed' : 'solid' }} />
      <Text style={{ color: t.muted, fontFamily: fonts.body, fontSize: 12 }}>{label}</Text>
    </View>
  );
}
