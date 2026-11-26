import { router } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Button, Overline, Screen } from '@/components/ui';
import { useStore } from '@/lib/store';
import { fonts, type, useTheme } from '@/lib/theme';
import { activityOf, TargetRow, useProgramme } from '@/real/ProgrammeCard';
import { PROGRAMMES, weekProgress, weeksMet } from '@/real/programmes';
import { Panel } from '@/real/ui';
import { dayKey } from '@/lib/logic';
import { PlusGate } from '@/plus/PlusGate';

/** Four-week programmes: choose one, then follow its weekly targets. */
function ProgrammesScreen() {
  const t = useTheme();
  const { state, startProgramme, endProgramme } = useStore();
  const g = useProgramme();
  const [pick, setPick] = useState<string | null>(null);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const a = activityOf(state);

  return (
    <Screen>
      <View style={{ gap: 6 }}>
        <Overline color={t.gold}>Four-week programmes</Overline>
        <Text accessibilityRole="header" style={[type.title, { color: t.text }]}>
          {g ? g.p.name : 'A month with a purpose.'}
        </Text>
        <Text style={[type.body, { color: t.muted }]}>
          {g
            ? g.p.summary
            : 'Each programme sets your daily workout towards one goal and adds weekly targets beyond the games: movement, sleep, technique. Luminary tracks them for you as you go.'}
        </Text>
      </View>

      {g ? (
        <>
          {[0, 1, 2, 3].map((w) => {
            const rows = weekProgress(g.p, g.run.start, w, a);
            const current = w === g.week;
            const past = w < g.week;
            return (
              <Panel key={w} tone={current ? t.gold + '66' : undefined}>
                <Overline color={current ? t.gold : undefined}>
                  Week {w + 1}
                  {current ? ' · this week' : past ? (rows.every((r) => r.met) ? ' · all targets met' : ' · complete') : ''}
                </Overline>
                {w <= g.week ? (
                  rows.map((r) => <TargetRow key={r.label} t={r} />)
                ) : (
                  <Text style={[type.caption, { color: t.muted }]}>{g.p.weeks[w].map((x) => x.label).join(' · ')}</Text>
                )}
              </Panel>
            );
          })}
          {g.finished ? (
            <Panel tone={t.gold + '66'}>
              <Overline color={t.gold}>Programme complete</Overline>
              <Text style={[type.body, { color: t.text }]}>
                You met every target in {weeksMet(g.p, g.run.start, dayKey(), a).met} of 4 weeks. Your Benchmark shows whether the change reaches beyond the
                games.
              </Text>
              <Button label="See your Benchmark" kind="secondary" onPress={() => router.push('/benchmark')} />
              <Button label="Close and choose another" onPress={endProgramme} />
            </Panel>
          ) : confirmEnd ? (
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Button label="Keep going" kind="secondary" onPress={() => setConfirmEnd(false)} />
              </View>
              <View style={{ flex: 1 }}>
                <Button label="End the programme" kind="secondary" onPress={() => { endProgramme(); setConfirmEnd(false); }} />
              </View>
            </View>
          ) : (
            <Button label="End early" kind="secondary" onPress={() => setConfirmEnd(true)} />
          )}
          <Panel>
            <Overline>Why this programme</Overline>
            <Text style={[type.caption, { color: t.muted }]}>{g.p.why}</Text>
          </Panel>
        </>
      ) : (
        PROGRAMMES.map((p) => {
          const on = pick === p.id;
          return (
            <Panel key={p.id} tone={on ? t.gold + '66' : undefined}>
              <Pressable accessibilityRole="radio" accessibilityState={{ selected: on }} onPress={() => setPick(on ? null : p.id)} style={{ gap: 6 }}>
                <Text style={{ color: t.text, fontFamily: fonts.semibold, fontSize: 17 }}>{p.name}</Text>
                <Text style={[type.caption, { color: t.muted }]}>{p.summary}</Text>
              </Pressable>
              {on ? (
                <View style={{ gap: 8 }}>
                  <Text style={[type.caption, { color: t.text }]}>Week 1: {p.weeks[0].map((x) => x.label).join(' · ')}. The targets build from there.</Text>
                  <Text style={[type.caption, { color: t.muted }]}>{p.why}</Text>
                  <Button label="Begin today" onPress={() => startProgramme(p.id)} />
                </View>
              ) : null}
            </Panel>
          );
        })
      )}
    </Screen>
  );
}

export default function Programmes() {
  return (
    <PlusGate feature="programmes">
      <ProgrammesScreen />
    </PlusGate>
  );
}
