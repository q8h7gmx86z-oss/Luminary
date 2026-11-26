import { router } from 'expo-router';
import React from 'react';
import { Text, View } from 'react-native';

import { ResearchLink } from '@/components/Research';
import { Button, Overline, Screen } from '@/components/ui';
import { useStore } from '@/lib/store';
import { fonts, radii, type, useTheme } from '@/lib/theme';
import { BENCHMARK_INTERVAL_DAYS, Change, daysUntilDue, MEASURE_ORDER, MEASURES, MeasureId, report, summary } from '@/training/benchmark';
import { useSharpness } from '@/training/SharpnessCard';
import { sharpnessOf } from '@/training/sharpness';
import { GAMES, SKILLS } from '@/training/catalog';
import { Skill } from '@/training/engine';

const fmt = (id: MeasureId, v: number) => {
  const u = MEASURES[id].unit;
  return u === 'ms' ? `${Math.round(v)} ms` : u === 's' ? `${v.toFixed(1)} s` : u === 'digits' ? `${v}` : `${Math.round(v)}`;
};

function VerdictTag({ c }: { c: Change }) {
  const t = useTheme();
  const colour = c.verdict === 'improved' ? t.teal : c.verdict === 'declined' ? t.help : t.muted;
  const label = c.verdict === 'improved' ? 'Reliable improvement' : c.verdict === 'declined' ? 'Reliable decline' : 'Within normal variation';
  return <Text style={{ color: colour, fontFamily: fonts.semibold, fontSize: 12.5 }}>{label}</Text>;
}

/** The Luminary Benchmark: untrained tasks, once a month, so you can see whether training carries over. */
export default function Benchmark() {
  const t = useTheme();
  const { state } = useStore();
  const records = state.training.benchmarks ?? [];
  const due = daysUntilDue(records, Date.now());
  const changes = report(records);
  const latest = records[records.length - 1];
  const { now: sharpNow } = useSharpness();
  const skillList = Object.keys(SKILLS) as Skill[];
  const sharpAtBase = records.length ? sharpnessOf(state.training.results.filter((r) => r.at <= records[0].at), (g) => GAMES[g].skill, skillList).total : undefined;

  return (
    <Screen>
      <View style={{ gap: 6 }}>
        <Overline color={t.lavender}>Untrained skills · every {BENCHMARK_INTERVAL_DAYS} days</Overline>
        <Text accessibilityRole="header" style={[type.title, { color: t.text }]}>
          The Luminary Benchmark
        </Text>
        <Text style={[type.body, { color: t.muted }]}>
          Scores in a game rise as you practise that game. The real question is whether your thinking improves on tasks you never train on. Once a month,
          four standard research tasks answer it honestly.
        </Text>
      </View>

      <View style={{ backgroundColor: t.surface, borderRadius: radii.panel, borderWidth: 1, borderColor: t.border, padding: 16, gap: 10 }}>
        <Overline>{records.length === 0 ? 'Your baseline' : due <= 0 ? 'Your next Benchmark is due' : 'Next Benchmark'}</Overline>
        <Text style={[type.body, { color: t.text }]}>
          {records.length === 0
            ? 'About ten minutes, four tasks. Your first Benchmark sets the baseline that every later one is measured against.'
            : due <= 0
              ? 'Four tasks, about ten minutes.'
              : `In ${due} ${due === 1 ? 'day' : 'days'}. A month between checks gives training time to show.`}
        </Text>
        {records.length === 0 || due <= 0 ? <Button label={records.length === 0 ? 'Set my baseline' : 'Begin the Benchmark'} onPress={() => router.push('/benchmark/run')} /> : null}
      </View>

      {latest && !changes ? (
        <View style={{ backgroundColor: t.surface, borderRadius: radii.panel, borderWidth: 1, borderColor: t.border, padding: 16, gap: 10 }}>
          <Overline>Baseline recorded</Overline>
          {MEASURE_ORDER.filter((id) => latest.measures[id]).map((id) => (
            <View key={id} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={[type.caption, { color: t.text }]}>{MEASURES[id].label}</Text>
              <Text style={[type.caption, { color: t.text, fontVariant: ['tabular-nums'] }]}>{fmt(id, latest.measures[id]!.value)}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {changes ? (
        <View style={{ backgroundColor: t.surface, borderRadius: radii.panel, borderWidth: 1, borderColor: t.border, padding: 16, gap: 12 }}>
          <Overline>Latest against your baseline</Overline>
          <Text style={[type.body, { color: t.text }]}>{summary(changes)}</Text>
          {changes.map((c) => (
            <View key={c.id} style={{ gap: 3, paddingTop: 10, borderTopWidth: 1, borderTopColor: t.border }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
                <Text style={[type.label, { color: t.text, flex: 1 }]}>{MEASURES[c.id].label}</Text>
                <VerdictTag c={c} />
              </View>
              <Text style={[type.caption, { color: t.muted, fontVariant: ['tabular-nums'] }]}>
                Baseline {fmt(c.id, c.base)} · Now {fmt(c.id, c.now)} · {c.pct > 0 ? '+' : ''}
                {c.pct}% {c.pct >= 0 ? 'better' : 'worse'}
              </Text>
              <Text style={[type.caption, { color: t.muted, fontSize: 12.5 }]}>
                {MEASURES[c.id].explain} A change counts as real beyond {fmt(c.id, c.threshold)}.
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      {records.length ? (
        <View style={{ backgroundColor: t.surface, borderRadius: radii.panel, borderWidth: 1, borderColor: t.border, padding: 16, gap: 8 }}>
          <Overline>Trained against untrained</Overline>
          <Text style={[type.body, { color: t.text }]}>
            Brain Sharpness, from your training games: {sharpAtBase ?? 0} at your baseline, {sharpNow.total} now.
          </Text>
          <Text style={[type.caption, { color: t.muted }]}>
            {changes
              ? changes.some((c) => c.verdict === 'improved')
                ? 'Your Benchmark shows reliable improvement on untrained tasks as well: the clearest sign that training is carrying over.'
                : 'If Sharpness rises while the Benchmark holds steady, your training is building game-specific skill. That is the most common finding in the research, and we will not pretend otherwise.'
              : 'Your second Benchmark will show whether gains in training carry over to tasks you have never practised.'}
          </Text>
        </View>
      ) : null}

      <View style={{ backgroundColor: t.soft, borderRadius: radii.row, padding: 14, gap: 4 }}>
        <Overline color={t.lavender}>How the comparison works</Overline>
        <Text style={[type.caption, { color: t.text, lineHeight: 20 }]}>
          Retaking any test improves scores through familiarity alone. So once you have three Benchmarks, your baseline becomes the average of your first two.
          A change is called real only when it is larger than the normal variation within your own sessions. Everything else is reported as within normal variation.
        </Text>
      </View>

      <ResearchLink id="benchmark" label="The research behind the Benchmark" />
      <Text style={[type.caption, { color: t.muted }]}>
        The Benchmark measures how you perform on these tasks, on this device. It is not a clinical assessment and cannot diagnose any condition.
      </Text>
    </Screen>
  );
}
