import React from 'react';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { Body, Card, Heading, Screen, Title } from '@/components/ui';
import { lastNDays } from '@/lib/logic';
import { useStore } from '@/lib/store';
import { useTheme } from '@/lib/theme';
import { GAMES, SKILLS } from '@/training/catalog';
import { GameId, Skill } from '@/training/engine';
import { savedScore } from '@/iq/items';
import { SharpnessCard } from '@/training/SharpnessCard';
import { InsightsCard } from '@/training/InsightsCard';
import { Metric } from '@/training/Metric';
import { Spark } from '@/training/Spark';
import { skillSummaries, workoutsThisWeek } from '@/training/stats';
import { GameBadge } from '@/components/GameBadge';

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
      <SharpnessCard />

      {state.training.tests?.length ? (
        <Card>
          <Heading>Reasoning Assessment</Heading>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 10 }}>
            <Text style={{ color: t.text, fontSize: 36, fontWeight: '900' }}>{savedScore(state.training.tests[state.training.tests.length - 1])}</Text>
            <Text style={{ color: t.muted }}>
              / 100 latest · {state.training.tests.length} attempt{state.training.tests.length === 1 ? '' : 's'}
            </Text>
          </View>
          <Body muted>Experimental score for tracking your own reasoning over time. Not an IQ score. Retest monthly for a fair comparison.</Body>
        </Card>
      ) : null}

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
          All time: {state.training.workouts.length} workout{state.training.workouts.length === 1 ? '' : 's'} and {totalRounds} round
          {totalRounds === 1 ? '' : 's'} played.
        </Body>
        <Body muted>
          Research suggests about three sessions a week works as well as, or better than, training every day, so rest days are part of
          the plan.
        </Body>
      </Card>

      <InsightsCard />

      {summaries.map((s) => {
        const sk = SKILLS[s.skill];
        return (
          <Card key={s.skill}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: sk.color }} />
              <Text style={{ color: t.text, fontSize: 18, fontWeight: '700', flex: 1 }}>{sk.name}</Text>
              <Text style={{ color: t.text, fontWeight: '900', fontSize: 18 }}>
                {s.skillScore}
                <Text style={{ color: t.muted, fontSize: 13, fontWeight: '700' }}>/100</Text>
              </Text>
            </View>
            <Body muted>{sk.description}</Body>
            {s.rounds > 0 ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                <Metric label="Top level" value={`${s.level}`} />
                {s.recentAccuracy !== undefined ? <Metric label="Accuracy" value={`${Math.round(s.recentAccuracy * 100)}%`} hint="last 5 rounds" /> : null}
                {s.consistency ? <Metric label="Consistency" value={s.consistency} hint="accuracy spread" /> : null}
                {s.vsBaseline !== undefined ? (
                  <Metric
                    label="Vs your baseline"
                    value={`${s.vsBaseline > 0 ? '+' : ''}${s.vsBaseline} pts`}
                    hint={s.direction === 'improving' ? 'still climbing' : s.direction === 'dipping' ? 'recent dip' : 'holding steady'}
                    tone={s.vsBaseline > 0 ? 'good' : undefined}
                  />
                ) : (
                  <Metric label="Vs your baseline" value="—" hint="after 6 rounds" />
                )}
                {s.rtNow ? (
                  <Metric
                    label="Response time"
                    value={`${s.rtNow} ms`}
                    hint={s.rtBaseline ? `${s.rtNow <= s.rtBaseline ? '−' : '+'}${Math.abs(s.rtNow - s.rtBaseline)} ms vs start` : 'recent rounds'}
                  />
                ) : null}
              </View>
            ) : null}
            <Spark values={s.trend.map((p) => p.value)} color={sk.color} label={`${sk.name} skill score by day`} />
            <View style={{ gap: 6 }}>
              {(Object.keys(GAMES) as GameId[])
                .filter((g) => GAMES[g].skill === s.skill)
                .map((g) => {
                  const rs = state.training.results.filter((r) => r.game === g);
                  const best = rs.length ? Math.max(...rs.map((r) => r.score)) : 0;
                  return (
                    <Pressable
                      key={g}
                      accessibilityRole="button"
                      accessibilityLabel={`${GAMES[g].name} details`}
                      onPress={() => router.push(`/stats/${g}`)}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 48, paddingHorizontal: 10, borderRadius: 12, backgroundColor: t.bg }}
                    >
                      <GameBadge game={g} size={28} />
                      <Text style={{ color: t.text, flex: 1, fontWeight: '600' }}>{GAMES[g].name}</Text>
                      <Text style={{ color: t.muted, fontSize: 13, fontVariant: ['tabular-nums'] }}>
                        {rs.length ? `Lv ${state.training.levels[g] ?? 1} · best ${best}` : 'Not played yet'}
                      </Text>
                      <Text style={{ color: t.primary, fontWeight: '800' }}>›</Text>
                    </Pressable>
                  );
                })}
            </View>
            <Text style={{ color: t.muted, fontSize: 13 }}>
              {s.rounds === 0 ? 'No rounds yet.' : `${s.rounds} round${s.rounds === 1 ? '' : 's'} played`}
            </Text>
          </Card>
        );
      })}

      <Body muted>
        How to read your numbers. Skill score (out of 100): your level and accuracy over your last three rounds of that skill. Vs your
        baseline: your skill score now minus your skill score over your first three rounds. Consistency: how much your accuracy varies between rounds. The bar
        chart shows your daily average. {totalRounds > 0 ? '' : 'Finish a workout to see them fill in. '}These numbers describe how you perform
        on Luminary’s games. They are not clinical measurements and they do not compare you with anyone else.
      </Body>
    </Screen>
  );
}
