import React, { useState } from 'react';
import { router } from 'expo-router';
import { Pressable, Text, useWindowDimensions, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { CENTRES, networkLevels, SkillNetwork } from '@/components/SkillNetwork';
import { Body, Card, Heading, Overline, Screen } from '@/components/ui';
import { lastNDays } from '@/lib/logic';
import { useStore } from '@/lib/store';
import { fonts, radii, type, useTheme } from '@/lib/theme';
import { GAMES, SKILLS } from '@/training/catalog';
import { GameId, MAX_LEVEL, Skill } from '@/training/engine';
import { savedScore } from '@/iq/items';
import { SharpnessCard } from '@/training/SharpnessCard';
import { InsightsCard } from '@/training/InsightsCard';
import { Metric } from '@/training/Metric';
import { Spark } from '@/training/Spark';
import { gameAnalytics, skillSummaries, workoutsThisWeek } from '@/training/stats';
import { GameBadge } from '@/components/GameBadge';

const WEEKLY_GOAL = 3;

function Stat({ label, value, hint, tone }: { label: string; value: string; hint?: string; tone?: 'good' }) {
  const t = useTheme();
  return (
    <View style={{ flexBasis: '45%', flexGrow: 1, borderTopWidth: 1, borderTopColor: t.border, paddingTop: 8, gap: 2 }}>
      <Text style={[type.overline, { color: t.muted, fontSize: 9.5 }]}>{label}</Text>
      <Text style={[type.number, { color: tone === 'good' ? t.good : t.text }]}>{value}</Text>
      {hint ? <Text style={{ color: t.muted, fontSize: 11, fontFamily: fonts.body }}>{hint}</Text> : null}
    </View>
  );
}

/** The signature map: one glowing region per task. Tap a region to see that task's numbers. */
function NetworkExplorer() {
  const t = useTheme();
  const { width } = useWindowDimensions();
  const { state } = useStore();
  const { results, levels } = state.training;
  const played = new Set(results.map((r) => r.game));
  const mostPlayed = [...played].sort((a, b) => results.filter((r) => r.game === b).length - results.filter((r) => r.game === a).length)[0];
  const [sel, setSel] = useState<GameId>(mostPlayed ?? 'speed');
  const w = Math.min(width, 640) - 42;
  const h = Math.round(w * 0.72);
  const info = GAMES[sel];
  const a = gameAnalytics(results, sel, levels[sel] ?? 1);
  const levelGain = a.levelTrend.length > 1 ? a.levelTrend[a.levelTrend.length - 1] - a.levelTrend[0] : undefined;
  const hit = 56;

  return (
    <View style={{ backgroundColor: t.surface, borderRadius: radii.panel, borderWidth: 1, borderColor: t.border, overflow: 'hidden' }}>
      <View style={{ width: w, height: h }}>
        <SkillNetwork width={w} height={h} level={networkLevels(levels, played, MAX_LEVEL)} focus={sel} labels />
        {(Object.keys(CENTRES) as GameId[]).map((g) => (
          <Pressable
            key={g}
            accessibilityRole="button"
            accessibilityState={{ selected: g === sel }}
            accessibilityLabel={`${GAMES[g].name}, ${SKILLS[GAMES[g].skill].name}`}
            onPress={() => setSel(g)}
            style={{
              position: 'absolute',
              left: CENTRES[g][0] * w - hit / 2,
              top: CENTRES[g][1] * h - hit / 2,
              width: hit,
              height: hit,
              borderRadius: hit / 2,
              borderWidth: g === sel ? 1 : 0,
              borderColor: `${GAMES[g].accent}88`,
            }}
          />
        ))}
      </View>

      <View style={{ padding: 16, paddingTop: 4, gap: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <GameBadge game={sel} size={40} />
          <View style={{ flex: 1 }}>
            <Text style={[type.section, { color: t.text }]}>{info.name}</Text>
            <Text style={{ color: info.accent, fontFamily: fonts.medium, fontSize: 12.5 }}>{SKILLS[info.skill].name}</Text>
          </View>
          <Text style={[type.caption, { color: t.muted, fontVariant: ['tabular-nums'] }]}>
            Lv {a.level} of {MAX_LEVEL}
          </Text>
        </View>
        {a.sessions ? (
          <>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: 14, rowGap: 10 }}>
              <Stat label="Accuracy" value={a.recentAccuracy !== undefined ? `${Math.round(a.recentAccuracy * 100)}%` : '—'} hint="last 3 rounds" />
              <Stat
                label="Median speed"
                value={a.rtNow ? `${a.rtNow} ms` : '—'}
                hint={a.rtNow && a.rtFirst ? `${a.rtNow <= a.rtFirst ? '−' : '+'}${Math.abs(a.rtNow - a.rtFirst)} ms vs start` : 'recent rounds'}
              />
              <Stat label="Best score" value={`${a.bestScore ?? 0}`} hint={`${a.sessions} round${a.sessions === 1 ? '' : 's'} played`} />
              <Stat
                label="Trend"
                value={levelGain === undefined ? '—' : `${levelGain > 0 ? '+' : ''}${levelGain} lv`}
                hint="since your first round"
                tone={levelGain && levelGain > 0 ? 'good' : undefined}
              />
            </View>
            <Spark values={a.levelTrend} color={info.accent} height={44} label={`${info.name} level by round`} />
          </>
        ) : (
          <Text style={[type.caption, { color: t.muted }]}>Not played yet. This region lights up once you do.</Text>
        )}
        <Pressable accessibilityRole="link" onPress={() => router.push(`/stats/${sel}`)} hitSlop={8} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ color: t.lavender, fontFamily: fonts.semibold, fontSize: 14 }}>Full {info.name} stats</Text>
          <Icon name="arrow" size={16} color={t.lavender} />
        </Pressable>
        <Text style={{ color: t.muted, fontSize: 11.5, fontFamily: fonts.body, lineHeight: 16 }}>
          Each region is one task, and it glows brighter as your level rises. The map shows your results in Luminary. It does not show
          or measure activity in your brain.
        </Text>
      </View>
    </View>
  );
}

export default function Progress() {
  const t = useTheme();
  const { state } = useStore();
  const week = lastNDays(7);
  const done = workoutsThisWeek(state.training.workouts, week);
  const summaries = skillSummaries(state.training.results, state.training.levels, (g) => GAMES[g].skill, Object.keys(SKILLS) as Skill[]);
  const totalRounds = state.training.results.length;

  return (
    <Screen>
      <View style={{ gap: 6 }}>
        <Overline>Your skill network</Overline>
        <Text accessibilityRole="header" style={[type.title, { color: t.text }]}>
          Watch it light up.
        </Text>
        <Text style={[type.body, { color: t.muted }]}>Tap a region to explore that task.</Text>
      </View>

      <NetworkExplorer />
      <SharpnessCard />

      {state.training.tests?.length ? (
        <Card>
          <Heading>Reasoning Assessment</Heading>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 10 }}>
            <Text style={[type.metric, { color: t.text, fontSize: 40 }]}>{savedScore(state.training.tests[state.training.tests.length - 1])}</Text>
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
                    backgroundColor: did ? t.primary : 'transparent',
                    borderWidth: did ? 0 : 1,
                    borderColor: t.borderStrong,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {did ? <Icon name="check" size={16} color="#FFFFFF" strokeWidth={2.4} /> : null}
                </View>
                <Text style={{ color: t.muted, fontSize: 12, fontFamily: fonts.medium }}>{label}</Text>
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
              <Text style={[type.section, { color: t.text, flex: 1 }]}>{sk.name}</Text>
              <Text style={[type.number, { color: t.text }]}>
                {s.skillScore}
                <Text style={{ color: t.muted, fontSize: 13, fontFamily: fonts.body }}> / 100</Text>
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
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 52, paddingHorizontal: 10, borderRadius: radii.sm, borderWidth: 1, borderColor: t.border }}
                    >
                      <GameBadge game={g} size={28} />
                      <Text style={{ color: t.text, flex: 1, fontFamily: fonts.semibold, fontSize: 14 }}>{GAMES[g].name}</Text>
                      <Text style={{ color: t.muted, fontSize: 13, fontVariant: ['tabular-nums'] }}>
                        {rs.length ? `Lv ${state.training.levels[g] ?? 1} · best ${best}` : 'Not played yet'}
                      </Text>
                      <Icon name="arrow" size={14} color={t.muted} />
                    </Pressable>
                  );
                })}
            </View>
            <Text style={[type.caption, { color: t.muted }]}>
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
