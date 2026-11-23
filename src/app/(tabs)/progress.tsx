import React from 'react';
import { Text, View } from 'react-native';

import { Body, Card, Heading, Screen, Title } from '@/components/ui';
import { lastNDays } from '@/lib/logic';
import { useStore } from '@/lib/store';
import { useTheme } from '@/lib/theme';
import { GAMES, SKILLS } from '@/training/catalog';
import { Skill } from '@/training/engine';
import { Spark } from '@/training/Spark';
import { skillSummaries, workoutsThisWeek } from '@/training/stats';

const WEEKLY_GOAL = 3;

export default function Progress() {
  const t = useTheme();
  const { state } = useStore();
  const week = lastNDays(7);
  const done = workoutsThisWeek(state.training.workouts, week);
  const summaries = skillSummaries(state.training.results, state.training.levels, (g) => GAMES[g].skill, Object.keys(SKILLS) as Skill[]);
  const totalRounds = state.training.results.length;

  return (
    <Screen>
      <Title>Your progress</Title>

      <Card>
        <Heading>This week</Heading>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {week.map((d) => {
            const did = state.training.workouts.includes(d);
            const label = ['S', 'M', 'T', 'W', 'T', 'F', 'S'][new Date(d + 'T12:00').getDay()];
            return (
              <View key={d} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
                <View
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 17,
                    backgroundColor: did ? t.primary : t.soft,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {did ? <Text style={{ color: t.primaryText, fontWeight: '800' }}>✓</Text> : null}
                </View>
                <Text style={{ color: t.muted, fontSize: 12 }}>{label}</Text>
              </View>
            );
          })}
        </View>
        <Body>
          {done >= WEEKLY_GOAL
            ? `${done} workouts this week. Goal reached, well done.`
            : `${done} of ${WEEKLY_GOAL} workouts this week.`}
        </Body>
        <Body muted>
          Research suggests about three sessions a week works as well as, or better than, training every day, so rest days are part of
          the plan.
        </Body>
      </Card>

      {summaries.map((s) => {
        const sk = SKILLS[s.skill];
        return (
          <Card key={s.skill}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: sk.color }} />
              <Text style={{ color: t.text, fontSize: 18, fontWeight: '700', flex: 1 }}>{sk.name}</Text>
              <Text style={{ color: t.text, fontWeight: '800' }}>Level {s.level}</Text>
            </View>
            <Body muted>{sk.description}</Body>
            <Spark values={s.trend.map((p) => p.value)} color={sk.color} label={`${sk.name} skill score by day`} />
            <Text style={{ color: t.muted, fontSize: 13 }}>
              {s.rounds === 0
                ? 'No rounds yet.'
                : `${s.rounds} round${s.rounds === 1 ? '' : 's'} played${s.recentAccuracy !== undefined ? ` · recent accuracy ${Math.round(s.recentAccuracy * 100)}%` : ''}`}
            </Text>
          </Card>
        );
      })}

      <Body muted>
        Skill score is your accuracy weighted by level, averaged per day. {totalRounds > 0 ? '' : 'Finish a workout to see it grow.'} Scores show
        how you do on these games. They are not a medical measure of your brain.
      </Body>
    </Screen>
  );
}
