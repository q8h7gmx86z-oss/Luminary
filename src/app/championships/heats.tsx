import { router, Stack, useLocalSearchParams } from 'expo-router';
import React, { useRef, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { dayKey } from '@/lib/logic';
import { useStore } from '@/lib/store';
import { fonts, radii, type, useTheme } from '@/lib/theme';
import { EVENT_ORDER, EventId, EVENTS, formatValue, Heat, heatOrder, Medal, medalFor, MEDALS, thresholdFor, unitOf } from '@/training/championships';
import { EventIcon, useChampionships } from '@/training/ChampionshipsUI';
import { GameResult } from '@/training/engine';
import { useCue } from '@/training/feedback';
import { AnswerButton, RoundOutcome } from '@/training/GameFrame';
import { COMPONENTS } from '@/training/GameRunner';
import { LogicMatrix } from '@/training/games/LogicMatrix';

type Done = { heat: Heat; medal: Medal };

/** Runs today's heats, or a single event's heat, then shows medals against your own record. */
export default function Heats() {
  const t = useTheme();
  const cue = useCue();
  const { recordResult, recordHeat } = useStore();
  const c = useChampionships();
  const { event } = useLocalSearchParams<{ event?: string }>();
  const [order] = useState<EventId[]>(() => {
    if (event && EVENT_ORDER.includes(event as EventId)) return [event as EventId];
    const lv = Object.fromEntries(EVENT_ORDER.map((e) => [e, c.levelOf(e)])) as Record<EventId, number>;
    return heatOrder(lv, c.chooseOrder);
  });
  const [step, setStep] = useState(0);
  const [stage, setStage] = useState<'brief' | 'play' | 'results'>('brief');
  const [done, setDone] = useState<Done[]>([]);
  // Heats as they stood when this session began, plus this session's, for fair medals.
  const history = useRef<Heat[]>(c.heats);

  const leave = () => (router.canGoBack() ? router.back() : router.replace('/championships'));
  const current = order[step];

  const finish = (o: RoundOutcome, level: number) => {
    const ev = EVENTS[current];
    const now = Date.now();
    const day = dayKey();
    if (ev.game !== 'logic') {
      const r: GameResult = { game: ev.game, level, score: o.score, accuracy: o.accuracy, rtMs: o.rtMs, rtMedian: o.rtMedian, rtSd: o.rtSd, metrics: o.metrics, at: now, day };
      recordResult(r);
    }
    const heat: Heat = { event: current, level, accuracy: o.accuracy, value: thresholdFor(current, level, o.accuracy, c.target, c.untimed, o.metrics), untimed: c.untimed, at: now, day };
    const medal = medalFor(heat, history.current, c.target);
    history.current = [...history.current, heat];
    recordHeat(heat);
    cue('complete');
    setDone((d) => [...d, { heat, medal }]);
    if (step + 1 < order.length) {
      setStep(step + 1);
      setStage('brief');
    } else setStage('results');
  };

  if (stage === 'play') {
    const ev = EVENTS[current];
    const level = c.levelOf(current);
    const Game = ev.game === 'logic' ? LogicMatrix : COMPONENTS[ev.game];
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
        <Stack.Screen options={{ headerShown: false }} />
        <Game key={step} level={level} untimed={c.untimed} onQuit={() => setStage('results')} onFinish={(o: RoundOutcome) => finish(o, level)} />
      </SafeAreaView>
    );
  }

  if (stage === 'results') return <Results done={done} onDone={leave} />;

  const ev = EVENTS[current];
  const s = c.standings[current];
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={{ padding: 20, gap: 18, flexGrow: 1, justifyContent: 'center', maxWidth: 520, width: '100%', alignSelf: 'center' }}>
        <View style={{ gap: 8, alignItems: 'center' }}>
          <Text style={[type.overline, { color: t.muted }]}>
            {order.length > 1 ? `Event ${step + 1} of ${order.length}` : 'Single heat'} · {ev.name}
          </Text>
          <View style={{ flexDirection: 'row', gap: 6 }} accessibilityElementsHidden>
            {order.map((e, i) => (
              <View key={e} style={{ width: 28, height: 4, borderRadius: 2, backgroundColor: i < step ? t.lavender : i === step ? ev.accent : t.border }} />
            ))}
          </View>
        </View>
        <View style={{ alignItems: 'center', gap: 10 }}>
          <EventIcon event={current} size={64} />
          <Text accessibilityRole="header" style={[type.title, { color: t.text, fontSize: 28 }]}>
            {ev.name}
          </Text>
          <Text style={{ color: ev.accent, fontFamily: fonts.medium, fontSize: 14 }}>
            {ev.skill} · {ev.task}
          </Text>
        </View>
        <View style={{ borderRadius: radii.row, borderWidth: 1, borderColor: t.border, backgroundColor: t.surface, padding: 16, gap: 10 }}>
          <Row label="Level" value={`${c.levelOf(current)}`} />
          <Row label="Current threshold" value={s.current === undefined ? 'To be measured' : formatValue(s.current, s.unit)} />
          <Row label="Personal record" value={s.record === undefined ? 'Confirmed after two heats' : formatValue(s.record, s.unit)} gold={s.record !== undefined} />
          <Row label="Target accuracy" value={`${Math.round(c.target * 100)}%`} />
        </View>
        <Text style={[type.caption, { color: t.muted, textAlign: 'center' }]}>
          {ev.game === 'logic' ? 'Choose the square that completes each grid. Shape, number, fill and colour may each follow a rule.' : 'The task runs exactly as in training. You may stop at any point; completed heats are kept.'}
        </Text>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <AnswerButton label={done.length ? 'Finish here' : 'Leave'} tone="secondary" onPress={() => (done.length ? setStage('results') : leave())} />
          <AnswerButton label="Begin heat" onPress={() => setStage('play')} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, value, gold }: { label: string; value: string; gold?: boolean }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
      <Text style={[type.caption, { color: t.muted }]}>{label}</Text>
      <Text style={{ color: gold ? t.gold : t.text, fontFamily: fonts.semibold, fontSize: 13, fontVariant: ['tabular-nums'] }}>{value}</Text>
    </View>
  );
}

function Results({ done, onDone }: { done: Done[]; onDone: () => void }) {
  const t = useTheme();
  const count = (m: Medal) => done.filter((d) => d.medal === m).length;
  const golds = done.filter((d) => d.medal === 'gold');
  const onTarget = done.filter((d) => d.medal !== 'none').length;
  const headline = !done.length
    ? 'No heats completed'
    : golds.length === 1
      ? `A new ${EVENTS[golds[0].heat.event].name} record`
      : golds.length > 1
        ? `${golds.length} new personal records`
        : onTarget === done.length
          ? 'Every event completed at target'
          : 'Heats completed';
  const summary = done.length
    ? `${onTarget} of ${done.length} ${done.length === 1 ? 'event' : 'events'} at or above target. ${count('gold')} gold, ${count('silver')} silver, ${count('bronze')} bronze.`
    : 'Nothing was recorded. Your thresholds are unchanged.';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16, maxWidth: 560, width: '100%', alignSelf: 'center' }}>
        <View style={{ alignItems: 'center', gap: 8, paddingTop: 12 }}>
          <Text style={[type.overline, { color: t.muted }]}>Heats completed</Text>
          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }} accessibilityElementsHidden>
            {(['gold', 'silver', 'bronze'] as Medal[]).map((m, i) => (
              <View
                key={m}
                style={{ width: 52 - i * 6, height: 52 - i * 6, borderRadius: 26, borderWidth: 1.5, borderColor: MEDALS[m].color, backgroundColor: `${MEDALS[m].color}1F`, alignItems: 'center', justifyContent: 'center' }}
              >
                <Text style={{ color: MEDALS[m].color, fontFamily: fonts.displayBold, fontSize: 19 - i * 2 }}>{count(m)}</Text>
              </View>
            ))}
          </View>
          <Text accessibilityRole="header" style={[type.title, { color: t.text, textAlign: 'center' }]}>
            {headline}
          </Text>
          <Text style={[type.caption, { color: t.muted, textAlign: 'center', maxWidth: 360 }]}>{summary}</Text>
        </View>

        <View style={{ gap: 8 }}>
          {done.map(({ heat, medal }) => {
            const ev = EVENTS[heat.event];
            const m = MEDALS[medal];
            return (
              <View
                key={heat.at}
                accessible
                accessibilityLabel={`${ev.name}: ${m.label}, ${m.meaning}. ${formatValue(heat.value, unitOf(heat.event, heat.untimed))}, ${Math.round(heat.accuracy * 100)}% accuracy.`}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: radii.row, borderWidth: 1, borderColor: medal === 'gold' ? 'rgba(232,189,114,0.4)' : t.border, backgroundColor: t.surface }}
              >
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: m.color }} />
                <View style={{ flex: 1, gap: 1 }}>
                  <Text style={[type.label, { color: t.text }]}>{ev.name}</Text>
                  <Text style={{ color: m.color, fontFamily: fonts.medium, fontSize: 12 }}>
                    {m.label} · {m.meaning}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 1 }}>
                  <Text style={[type.number, { color: t.text, fontSize: 15 }]}>{heat.value === undefined ? '—' : formatValue(heat.value, unitOf(heat.event, heat.untimed))}</Text>
                  <Text style={{ color: t.muted, fontFamily: fonts.body, fontSize: 11, fontVariant: ['tabular-nums'] }}>{Math.round(heat.accuracy * 100)}% accuracy</Text>
                </View>
              </View>
            );
          })}
        </View>

        <View style={{ borderRadius: radii.row, borderWidth: 1, borderColor: t.border, padding: 14, gap: 6 }}>
          <Text style={[type.label, { color: t.text, fontSize: 13.5 }]}>How medals are awarded</Text>
          <Text style={[type.caption, { color: t.muted }]}>
            Gold marks a new personal record, confirmed across two heats. Silver marks a result above your four-week average. Bronze marks a heat completed at target accuracy. Your only benchmark is your own performance.
          </Text>
        </View>

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <AnswerButton label="Season" tone="secondary" onPress={() => router.replace('/championships/season')} />
          <AnswerButton label="Done" onPress={onDone} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
