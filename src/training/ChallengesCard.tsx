import { router } from 'expo-router';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { Card } from '@/components/ui';
import { dayKey } from '@/lib/logic';
import { useStore } from '@/lib/store';
import { useTheme } from '@/lib/theme';

import { AVAILABLE, GAMES, SKILLS } from './catalog';
import { Skill } from './engine';
import { challengeDone, dailyChallenge, forgivingStreak, weeklyQuest } from './planner';
import { skillOf } from './usePlan';
import { GameBadge } from '@/components/GameBadge';
import { Icon } from '@/components/Icon';

/** Daily challenge, weekly quest and a streak that rest days never break. */
export function ChallengesCard() {
  const t = useTheme();
  const { state } = useStore();
  const today = dayKey();
  const { results, workouts, levels } = state.training;
  const c = dailyChallenge(today, AVAILABLE, levels);
  const done = challengeDone(c, today, results);
  const q = weeklyQuest(today, results, workouts, skillOf, Object.keys(SKILLS) as Skill[]);
  const active = new Set([...workouts, ...results.map((r) => r.day)]);
  const streak = forgivingStreak(active, today);
  const g = GAMES[c.game];

  return (
    <Card>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <GameBadge game={c.game} size={48} />
        <View style={{ flex: 1 }}>
          <Text style={{ color: t.primary, fontWeight: '800', fontSize: 12, letterSpacing: 0.8 }}>DAILY CHALLENGE</Text>
          <Text style={{ color: t.text, fontWeight: '800', fontSize: 17 }}>
            {g.name} at level {c.level}
          </Text>
          <Text style={{ color: t.muted, fontSize: 14 }}>{done ? 'Cleared. New challenge tomorrow.' : 'One level above yours. Hit 80% to clear it.'}</Text>
        </View>
        {done ? (
          <Icon name="check" size={26} color={t.good} strokeWidth={3} />
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Play the daily challenge: ${g.name} at level ${c.level}`}
            onPress={() => router.push(`/play/${c.game}?challenge=${c.level}`)}
            style={({ pressed }) => ({ backgroundColor: t.primary, paddingHorizontal: 16, minHeight: 44, borderRadius: 12, justifyContent: 'center', opacity: pressed ? 0.85 : 1 })}
          >
            <Text style={{ color: t.primaryText, fontWeight: '800' }}>Play</Text>
          </Pressable>
        )}
      </View>

      <View style={{ height: 1, backgroundColor: t.border }} />

      <View style={{ gap: 6 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ color: t.primary, fontWeight: '800', fontSize: 12, letterSpacing: 0.8 }}>WEEKLY QUEST · {q.title.toUpperCase()}</Text>
          <Text style={{ color: t.text, fontWeight: '800' }}>
            {Math.min(q.progress, q.target)} / {q.target}
          </Text>
        </View>
        <Text style={{ color: t.text, fontSize: 15 }}>{q.progress >= q.target ? 'Quest complete. Strong week.' : q.detail}</Text>
        <View style={{ height: 8, borderRadius: 4, backgroundColor: t.soft }}>
          <View style={{ height: 8, borderRadius: 4, backgroundColor: q.progress >= q.target ? t.good : t.primary, width: `${Math.min(1, q.progress / q.target) * 100}%` }} />
        </View>
      </View>

      <View style={{ height: 1, backgroundColor: t.border }} />

      <View style={{ gap: 2 }}>
        <Text style={{ color: t.text, fontWeight: '800', fontSize: 16 }}>
          {streak > 0 ? `${streak} training day${streak === 1 ? '' : 's'} in your current run` : 'Start a run today'}
        </Text>
        <Text style={{ color: t.muted, fontSize: 14 }}>Rest days are part of training. Up to two in a row never break your run.</Text>
      </View>
    </Card>
  );
}
