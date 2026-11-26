import { router } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { ResearchLink } from '@/components/Research';
import { Button, Overline, Screen } from '@/components/ui';
import { analyse, armFor, dayIndex, Experiment, LabResult, makeSchedule, MIN_PAIRS, TEMPLATES, verdictText } from '@/lab/lab';
import { dayKey, uid } from '@/lib/logic';
import { useStore } from '@/lib/store';
import { fonts, radii, type, useTheme } from '@/lib/theme';

const LENGTHS = [14, 20, 28];

function Panel({ children, tone }: { children: React.ReactNode; tone?: string }) {
  const t = useTheme();
  return <View style={{ backgroundColor: t.surface, borderRadius: radii.panel, borderWidth: 1, borderColor: tone ?? t.border, padding: 16, gap: 10 }}>{children}</View>;
}

function ResultBlock({ r }: { r: LabResult }) {
  const t = useTheme();
  const colour = r.verdict === 'a' || r.verdict === 'b' ? t.teal : t.muted;
  return (
    <View style={{ gap: 8 }}>
      <Text style={[type.body, { color: r.verdict === 'collecting' ? t.muted : t.text }]}>{verdictText(r)}</Text>
      {r.meanA !== undefined && r.meanB !== undefined ? (
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {(['A', 'B'] as const).map((arm) => (
            <View key={arm} style={{ flex: 1, borderWidth: 1, borderColor: t.border, borderRadius: 14, padding: 12, gap: 2 }}>
              <Text style={[type.overline, { color: t.muted }]}>{arm} days</Text>
              <Text style={[type.metric, { color: t.text, fontSize: 24 }]}>{(arm === 'A' ? r.meanA! : r.meanB!).toFixed(2)}</Text>
              <Text style={[type.caption, { color: t.muted }]}>responses per second · {arm === 'A' ? r.lapsesA : r.lapsesB} slow on average</Text>
            </View>
          ))}
        </View>
      ) : null}
      {r.low !== undefined && r.high !== undefined ? (
        <Text style={{ color: colour, fontFamily: fonts.semibold, fontSize: 12.5 }}>
          A minus B: {r.diff! >= 0 ? '+' : ''}
          {r.diff!.toFixed(3)} (95% range {r.low.toFixed(3)} to {r.high.toFixed(3)}) · {r.pairs} pairs
        </Text>
      ) : null}
    </View>
  );
}

function Calendar({ exp, today }: { exp: Experiment; today: string }) {
  const t = useTheme();
  const done = new Map(exp.entries.map((e) => [e.day, e]));
  const startMs = Date.parse(exp.start + 'T12:00:00Z');
  const ti = dayIndex(exp.start, today);
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }} accessibilityLabel={`${exp.entries.length} of ${exp.schedule.length} days checked`}>
      {exp.schedule.map((arm, i) => {
        const key = new Date(startMs + i * 86_400_000).toISOString().slice(0, 10);
        const e = done.get(key);
        const isToday = i === ti;
        return (
          <View
            key={i}
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: isToday ? 1.5 : 1,
              borderColor: isToday ? t.gold : t.border,
              backgroundColor: e ? (e.kept ? t.teal + '40' : t.soft) : 'transparent',
              opacity: i > ti ? 0.45 : 1,
            }}
          >
            <Text style={{ color: t.text, fontSize: 12, fontFamily: fonts.semibold }}>{i <= ti ? arm : '·'}</Text>
          </View>
        );
      })}
    </View>
  );
}

/** The Personal Lab: test what sharpens you, with a randomised experiment on yourself. */
export default function Lab() {
  const t = useTheme();
  const { state, startExperiment, endExperiment } = useStore();
  const today = dayKey();
  const all = state.lab ?? [];
  const running = all.filter((e) => !e.endedAt).pop();
  const past = all.filter((e) => e.endedAt).reverse();
  const [pick, setPick] = useState<string | null>(null);
  const [days, setDays] = useState(14);
  const [confirmEnd, setConfirmEnd] = useState(false);

  const arm = running ? armFor(running, today) : null;
  const over = running ? dayIndex(running.start, today) >= running.schedule.length : false;
  const checkedToday = running?.entries.some((e) => e.day === today);
  const result = running ? analyse(running) : undefined;

  const begin = () => {
    const tpl = TEMPLATES.find((x) => x.id === pick);
    if (!tpl) return;
    startExperiment({ id: uid(), templateId: tpl.id, question: tpl.question, a: tpl.a, b: tpl.b, start: today, schedule: makeSchedule(days / 2), entries: [] });
    setPick(null);
  };

  return (
    <Screen>
      <View style={{ gap: 6 }}>
        <Overline color={t.lavender}>Personal Lab</Overline>
        <Text accessibilityRole="header" style={[type.title, { color: t.text }]}>
          Test what sharpens you.
        </Text>
        <Text style={[type.body, { color: t.muted }]}>
          Advice about sleep, exercise and caffeine is drawn from averages across thousands of people. You are one person. The Lab runs a randomised
          experiment on you alone, the method doctors use to find the right treatment for a single patient, and reports only what your own data can
          support.
        </Text>
      </View>

      {running ? (
        <Panel tone="rgba(232,189,114,0.35)">
          <Overline>{over ? 'Experiment complete' : `Day ${Math.min(dayIndex(running.start, today) + 1, running.schedule.length)} of ${running.schedule.length}`}</Overline>
          <Text style={[type.section, { color: t.text, fontSize: 19 }]}>{running.question}</Text>
          {!over && arm ? (
            <View style={{ gap: 6 }}>
              <Text style={{ color: t.gold, fontFamily: fonts.semibold }}>Today is {arm === 'A' ? 'an A' : 'a B'} day</Text>
              <Text style={[type.body, { color: t.text }]}>{arm === 'A' ? running.a : running.b}</Text>
              <Text style={[type.caption, { color: t.muted }]}>Then take the two-minute alertness check. {TEMPLATES.find((x) => x.id === running.templateId)?.note ?? ''}</Text>
              {checkedToday ? (
                <Text style={[type.caption, { color: t.teal }]}>Today’s check is recorded. You may retake it; the latest one counts.</Text>
              ) : null}
              <Button label={checkedToday ? 'Retake today’s check' : 'Take today’s check'} kind={checkedToday ? 'secondary' : 'primary'} onPress={() => router.push('/lab/check')} />
            </View>
          ) : null}
          <Calendar exp={running} today={today} />
          {result ? <ResultBlock r={result} /> : null}
          {confirmEnd ? (
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Button label="Keep going" kind="secondary" onPress={() => setConfirmEnd(false)} />
              </View>
              <View style={{ flex: 1 }}>
                <Button label="End and keep the result" kind="secondary" onPress={() => { endExperiment(); setConfirmEnd(false); }} />
              </View>
            </View>
          ) : (
            <Button label={over ? 'Close this experiment' : 'End early'} kind="secondary" onPress={() => (over ? endExperiment() : setConfirmEnd(true))} />
          )}
        </Panel>
      ) : (
        <Panel>
          <Overline>Choose a question</Overline>
          {TEMPLATES.map((tpl) => {
            const on = pick === tpl.id;
            return (
              <Pressable
                key={tpl.id}
                accessibilityRole="radio"
                accessibilityState={{ selected: on }}
                onPress={() => setPick(on ? null : tpl.id)}
                style={{ borderWidth: 1, borderColor: on ? t.lavender : t.border, borderRadius: 14, padding: 12, gap: 4 }}
              >
                <Text style={{ color: t.text, fontFamily: fonts.semibold, fontSize: 15.5 }}>{tpl.question}</Text>
                {on ? (
                  <>
                    <Text style={[type.caption, { color: t.muted }]}>A days: {tpl.a}</Text>
                    <Text style={[type.caption, { color: t.muted }]}>B days: {tpl.b}</Text>
                  </>
                ) : null}
              </Pressable>
            );
          })}
          {pick ? (
            <View style={{ gap: 10 }}>
              <Text style={[type.caption, { color: t.muted }]}>Length. Longer experiments can detect smaller effects.</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {LENGTHS.map((d) => (
                  <Pressable
                    key={d}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: days === d }}
                    onPress={() => setDays(d)}
                    style={{ height: 36, paddingHorizontal: 14, borderRadius: 18, justifyContent: 'center', borderWidth: 1, borderColor: days === d ? t.text : t.border, backgroundColor: days === d ? t.text : 'transparent' }}
                  >
                    <Text style={{ color: days === d ? t.bg : t.text, fontFamily: fonts.semibold }}>{d} days</Text>
                  </Pressable>
                ))}
              </View>
              <Button label="Begin the experiment today" onPress={begin} />
            </View>
          ) : null}
        </Panel>
      )}

      <Panel>
        <Overline>How it works</Overline>
        <Text style={[type.caption, { color: t.muted }]}>
          Days come in pairs: one A day and one B day, in an order Luminary chooses at random. Randomising stops your expectations, the weather or a
          busy week from deciding the result, and pairing cancels out slow changes such as getting used to the check.
        </Text>
        <Text style={[type.caption, { color: t.muted }]}>
          Each day you take a two-minute alertness check, a shortened version of the psychomotor vigilance test used in sleep research. Luminary
          reports your response speed and slow responses, the two measures that research found most sensitive.
        </Text>
        <Text style={[type.caption, { color: t.muted }]}>
          A result is called clear only when the 95% range of the difference between A and B days excludes zero, and only after at least{' '}
          {MIN_PAIRS} complete pairs. Otherwise the Lab says plainly that it cannot tell.
        </Text>
      </Panel>

      {past.length ? (
        <Panel>
          <Overline>Past experiments</Overline>
          {past.map((e) => (
            <View key={e.id} style={{ gap: 6, borderTopWidth: 1, borderTopColor: t.border, paddingTop: 10 }}>
              <Text style={{ color: t.text, fontFamily: fonts.semibold }}>{e.question}</Text>
              <Text style={[type.caption, { color: t.muted }]}>Began {new Date(e.start + 'T12:00:00').toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}</Text>
              <ResultBlock r={analyse(e)} />
            </View>
          ))}
        </Panel>
      ) : null}

      <ResearchLink id="lab" label="The science behind the Lab" />
      <Text style={[type.caption, { color: t.muted }]}>
        The Lab is for personal insight, not medical advice. Do not change prescribed medication as part of an experiment without speaking to your doctor.
      </Text>
    </Screen>
  );
}
