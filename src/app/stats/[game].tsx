import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Text, View } from 'react-native';

import { Body, Button, Card, Heading, Screen, Title } from '@/components/ui';
import { useStore } from '@/lib/store';
import { useTheme } from '@/lib/theme';
import { GAMES, SKILLS } from '@/training/catalog';
import { GameId } from '@/training/engine';
import { Metric } from '@/training/Metric';
import { Spark } from '@/training/Spark';
import { gameAnalytics, MetricSummary } from '@/training/stats';
import { GameBadge } from '@/components/GameBadge';
import { ResearchPanel } from '@/components/Research';

const pct = (x: number) => `${Math.round(x * 100)}%`;

function fmt(m: MetricSummary, v: number) {
  if (m.unit === 'ms') return `${Math.round(v)} ms`;
  if (m.unit === 'pct') return pct(v);
  if (m.unit === 'n') return Number.isInteger(v) ? `${v}` : v.toFixed(1);
  return Number.isInteger(v) ? `${v}` : v.toFixed(1);
}

/** Change from the first three rounds to the last three, phrased so "better" reads the right way round. */
function change(m: MetricSummary) {
  if (m.now === undefined || m.first === undefined || m.better === 'neither') return undefined;
  const d = m.now - m.first;
  const size =
    m.unit === 'pct' ? `${Math.abs(Math.round(d * 100))} pts` : m.unit === 'ms' ? `${Math.abs(Math.round(d))} ms` : Math.abs(d).toFixed(1);
  if (Math.abs(d) < (m.unit === 'pct' ? 0.01 : m.unit === 'ms' ? 5 : 0.1)) return { text: 'same as your start', good: false };
  const good = m.better === 'lower' ? d < 0 : d > 0;
  return { text: `${d < 0 ? '−' : '+'}${size} vs start`, good };
}

/** Everything Luminary has measured for one game. */
export default function GameStats() {
  const t = useTheme();
  const { game } = useLocalSearchParams<{ game: string }>();
  const { state } = useStore();
  const id = (game in GAMES ? game : 'speed') as GameId;
  const info = GAMES[id];
  const a = gameAnalytics(state.training.results, id, state.training.levels[id] ?? 1);
  const sk = SKILLS[info.skill];

  if (a.sessions === 0) {
    return (
      <Screen>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <GameBadge game={id} size={48} />
          <Title>{info.name}</Title>
        </View>
        <Card>
          <Heading>Not yet measured</Heading>
          <Body>
            Play one round to set your baseline. From then on, every round is compared with your own first results, never with anyone else.
          </Body>
          <ResearchPanel id={id} />

      <Button label={`Play ${info.name}`} onPress={() => router.push(`/play/${id}`)} />
        </Card>
      </Screen>
    );
  }

  const rtChange = a.rtNow !== undefined && a.rtFirst !== undefined ? a.rtNow - a.rtFirst : undefined;
  const steadiness =
    a.variability === undefined ? undefined : a.variability < 0.2 ? 'Very even' : a.variability < 0.35 ? 'Fairly even' : 'Uneven';

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <GameBadge game={id} size={48} />
        <Title>{info.name}</Title>
      </View>
      <Body muted>
        {sk.name}. {a.sessions} round{a.sessions === 1 ? '' : 's'} over {a.daysPlayed} day{a.daysPlayed === 1 ? '' : 's'}.
      </Body>

      <Card>
        <Heading>Difficulty and bests</Heading>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          <Metric label="Current level" value={`${a.level}`} hint="out of 20" />
          <Metric label="Highest level" value={`${a.topLevel}`} />
          <Metric label="Rounds played" value={`${a.sessions}`} />
          {a.bestScore !== undefined ? <Metric label="Best score" value={`${a.bestScore}`} hint="personal best" tone="gold" /> : null}
          {a.bestAccuracy !== undefined ? <Metric label="Best accuracy" value={pct(a.bestAccuracy)} /> : null}
          {a.recentAccuracy !== undefined ? <Metric label="Recent accuracy" value={pct(a.recentAccuracy)} hint="last 3 rounds" /> : null}
        </View>
        <Text style={{ color: t.muted, fontSize: 12, fontWeight: '700' }}>LEVEL, ROUND BY ROUND</Text>
        <Spark values={a.levelTrend} color={sk.color} label={`${info.name} level by round`} />
      </Card>

      {a.rtNow !== undefined ? (
        <Card>
          <Heading>Speed</Heading>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            <Metric
              label="Median response"
              value={`${a.rtNow} ms`}
              hint={rtChange !== undefined ? `${rtChange <= 0 ? '−' : '+'}${Math.abs(rtChange)} ms vs start` : 'last 3 rounds'}
              tone={rtChange !== undefined && rtChange < 0 ? 'good' : undefined}
            />
            {a.rtBest !== undefined ? <Metric label="Fastest round" value={`${a.rtBest} ms`} hint="personal best" /> : null}
            {steadiness ? (
              <Metric label="Variability" value={steadiness} hint={`spread ${Math.round(a.variability! * 100)}% of median`} />
            ) : null}
          </View>
          <Spark values={a.rtTrend} color={sk.color} label={`${info.name} median response time by round`} />
          <Body muted>
            Median response time is the middle of your correct answers, so one slow tap does not drag it up. Variability is how much your
            timing moves around within a round. Research links steadier timing with better sustained attention, and it often improves before
            raw speed does. Speed is compared at the level you were on, so it can rise for a while after you level up.
          </Body>
        </Card>
      ) : null}

      {a.metrics.length ? (
        <Card>
          <Heading>What this game measures</Heading>
          {a.metrics.map((m) => {
            const c = change(m);
            return (
              <View key={m.key} style={{ gap: 4, paddingVertical: 6, borderTopWidth: 1, borderTopColor: t.border }}>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
                  <Text style={{ color: t.text, fontWeight: '800', fontSize: 16, flex: 1 }}>{m.label}</Text>
                  <Text style={{ color: t.text, fontWeight: '900', fontSize: 18, fontVariant: ['tabular-nums'] }}>
                    {m.now !== undefined ? fmt(m, m.now) : '—'}
                  </Text>
                </View>
                <Text style={{ color: t.muted, fontSize: 13, lineHeight: 19 }}>{m.explain}</Text>
                <Text style={{ color: c?.good ? t.good : t.muted, fontSize: 12, fontWeight: '700' }}>
                  {m.now === undefined
                    ? 'Recorded from your next round on.'
                    : ['Last 3 rounds', c ? c.text : 'baseline after 6 rounds', m.best !== undefined ? `best ${fmt(m, m.best)}` : undefined]
                        .filter(Boolean)
                        .join(' · ')}
                </Text>
              </View>
            );
          })}
        </Card>
      ) : null}

      <Button label={`Play ${info.name}`} onPress={() => router.push(`/play/${id}`)} />
      <Body muted>
        All figures come from your own rounds on this device. They describe how you play this game, not a clinical measure, and they are
        never compared with other people.
      </Body>
    </Screen>
  );
}
