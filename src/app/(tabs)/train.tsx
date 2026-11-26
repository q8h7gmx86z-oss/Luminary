import { router } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { GameBadge, NavyGlow } from '@/components/GameBadge';
import { Icon } from '@/components/Icon';
import { Overline, Screen } from '@/components/ui';
import { savedScore } from '@/iq/items';
import { useStore } from '@/lib/store';
import { ChampionshipsCard } from '@/training/ChampionshipsUI';
import { fonts, radii, type, useTheme } from '@/lib/theme';
import { AVAILABLE, GAMES, SKILLS } from '@/training/catalog';
import { GameId, MAX_LEVEL, Skill } from '@/training/engine';

const SKILL_LIST = Object.keys(SKILLS) as Skill[];
const SHORT: Record<Skill, string> = { speed: 'Speed', memory: 'Memory', attention: 'Attention', flexibility: 'Flexibility' };

function Chip({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      onPress={onPress}
      style={{
        height: 32,
        paddingHorizontal: 13,
        borderRadius: 16,
        justifyContent: 'center',
        backgroundColor: on ? t.text : 'transparent',
        borderWidth: 1,
        borderColor: on ? t.text : t.borderStrong,
      }}
    >
      <Text style={{ color: on ? t.bg : t.muted, fontFamily: fonts.semibold, fontSize: 13 }}>{label}</Text>
    </Pressable>
  );
}

function GameCard({ game }: { game: GameId }) {
  const t = useTheme();
  const { state } = useStore();
  const info = GAMES[game];
  const playable = AVAILABLE.includes(game);
  const level = state.training.levels[game] ?? 1;
  const best = Math.max(0, ...state.training.results.filter((r) => r.game === game).map((r) => r.score));
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${info.name}, ${SKILLS[info.skill].name}, level ${level}`}
      disabled={!playable}
      onPress={() => router.push(`/play/${game}`)}
      style={({ pressed }) => ({
        flexBasis: '47%',
        flexGrow: 1,
        minHeight: 170,
        padding: 14,
        borderRadius: 18,
        backgroundColor: t.surface,
        borderWidth: 1,
        borderColor: t.border,
        overflow: 'hidden',
        opacity: playable ? (pressed ? 0.85 : 1) : 0.5,
        transform: [{ scale: pressed ? 0.98 : 1 }],
      })}
    >
      <NavyGlow width={180} height={120} color={info.accent} />
      <GameBadge game={game} size={36} />
      <Text style={[type.label, { color: t.text, marginTop: 12 }]}>{info.name}</Text>
      <Text style={{ color: info.accent, fontFamily: fonts.medium, fontSize: 12, marginTop: 2 }}>{SKILLS[info.skill].name}</Text>
      <Text style={[type.caption, { color: t.muted, marginTop: 6, flex: 1 }]}>{playable ? info.tagline : 'Coming in the next update'}</Text>
      {playable ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 }}>
          <View style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: 'rgba(241, 240, 250, 0.08)', overflow: 'hidden' }}>
            <View style={{ width: `${Math.round((level / MAX_LEVEL) * 100)}%`, height: 4, backgroundColor: info.accent }} />
          </View>
          <Text style={[type.caption, { color: t.muted, fontVariant: ['tabular-nums'] }]}>Lv {level}</Text>
        </View>
      ) : null}
      {best > 0 ? <Text style={{ color: t.muted, fontSize: 11, fontFamily: fonts.body, marginTop: 4, fontVariant: ['tabular-nums'] }}>Best {best}</Text> : null}
    </Pressable>
  );
}

export default function Train() {
  const t = useTheme();
  const { state } = useStore();
  const [filter, setFilter] = useState<Skill | 'all'>('all');
  const games = (Object.keys(GAMES) as GameId[]).filter((g) => filter === 'all' || GAMES[g].skill === filter);
  const lastTest = state.training.tests?.length ? state.training.tests[state.training.tests.length - 1] : undefined;

  return (
    <Screen>
      <View style={{ gap: 6 }}>
        <Overline>The cognitive laboratory</Overline>
        <Text accessibilityRole="header" style={[type.title, { color: t.text }]}>
          Six tasks. Four skills.
        </Text>
        <Text style={[type.body, { color: t.muted }]}>Every task adapts to you, getting harder as you improve.</Text>
      </View>

      <ChampionshipsCard />

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        <Chip label="All" on={filter === 'all'} onPress={() => setFilter('all')} />
        {SKILL_LIST.map((s) => (
          <Chip key={s} label={SHORT[s]} on={filter === s} onPress={() => setFilter(s)} />
        ))}
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {games.map((g) => (
          <GameCard key={g} game={g} />
        ))}
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={() => router.push('/iq')}
        style={({ pressed }) => ({
          backgroundColor: t.surface,
          borderRadius: radii.panel,
          borderWidth: 1,
          borderColor: t.border,
          padding: 18,
          gap: 6,
          overflow: 'hidden',
          opacity: pressed ? 0.92 : 1,
        })}
      >
        <NavyGlow height={170} />
        <Overline color={t.lavender}>Reasoning assessment</Overline>
        <Text style={[type.section, { color: t.text, fontSize: 19 }]}>Put your reasoning to the test</Text>
        <Text style={[type.caption, { color: t.muted }]}>
          20 timed questions on patterns, numbers and words. {lastTest ? `Last score ${savedScore(lastTest)} / 100.` : 'About 13 minutes.'}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 }}>
          <Text style={{ color: t.lavender, fontFamily: fonts.semibold, fontSize: 14 }}>Begin assessment</Text>
          <Icon name="arrow" size={16} color={t.lavender} />
        </View>
      </Pressable>

      <Pressable accessibilityRole="link" onPress={() => router.push('/preferences')} hitSlop={8}>
        <Text style={{ color: t.lavender, fontFamily: fonts.medium, fontSize: 14, textAlign: 'center' }}>Set your goal, pace, untimed mode and more</Text>
      </Pressable>
    </Screen>
  );
}
