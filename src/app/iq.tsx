import { router, Stack } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { formatClock } from '@/lib/logic';
import { useStore } from '@/lib/store';
import { useTheme } from '@/lib/theme';
import { describeCell, MatrixCell } from '@/iq/MatrixCell';
import { band, buildTest, Item, scoreTest, Section, TestScore } from '@/iq/items';
import { AnswerButton } from '@/training/GameFrame';

const NAVY = '#0B1640';
const GOLD = '#F2C14E';

const SECTION_INTRO: Record<Section['id'], string> = {
  patterns: 'Each grid follows rules across its rows and columns. Shape, number, fill and colour can all change. Pick the square that completes it.',
  numbers: 'Each sequence follows a rule. Work it out and pick the next number.',
  words: 'Analogies, odd ones out and word meanings. Pick the best answer.',
};

type Stage = { kind: 'intro' } | { kind: 'section'; s: number } | { kind: 'item'; s: number; i: number } | { kind: 'result'; score: TestScore; seconds: number };

/** Timed reasoning test in three sections, with an estimated score on an IQ-style scale. */
export default function ReasoningTest() {
  const t = useTheme();
  const { state, recordTest } = useStore();
  const [seed] = useState(() => Date.now() % 2147483647);
  const sections = useMemo(() => buildTest(seed), [seed]);
  const [stage, setStage] = useState<Stage>({ kind: 'intro' });
  const answers = useRef<(number | null)[][]>(sections.map((s) => s.items.map(() => null)));
  const [endsAt, setEndsAt] = useState(0);
  const [now, setNow] = useState(Date.now());
  const started = useRef(0);
  const { width } = useWindowDimensions();
  const inner = Math.min(width, 520) - 40;

  const finish = () => {
    const score = scoreTest(sections, answers.current);
    const seconds = Math.round((Date.now() - started.current) / 1000);
    recordTest({ at: Date.now(), estimate: score.estimate, percent: score.percent });
    setStage({ kind: 'result', score, seconds });
  };

  const nextSection = (s: number) => (s + 1 < sections.length ? setStage({ kind: 'section', s: s + 1 }) : finish());

  // Section clock. When it runs out, unanswered items count as wrong and the next section starts.
  useEffect(() => {
    if (stage.kind !== 'item') return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [stage.kind]);
  const left = Math.max(0, Math.ceil((endsAt - now) / 1000));
  useEffect(() => {
    if (stage.kind === 'item' && endsAt && now >= endsAt) nextSection(stage.s);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now]);

  const answer = (choice: number | null) => {
    if (stage.kind !== 'item') return;
    answers.current[stage.s][stage.i] = choice;
    const sec = sections[stage.s];
    if (stage.i + 1 < sec.items.length) setStage({ kind: 'item', s: stage.s, i: stage.i + 1 });
    else nextSection(stage.s);
  };

  const quit = () => (router.canGoBack() ? router.back() : router.replace('/train'));
  const previous = state.training.tests ?? [];

  let body: React.ReactNode;
  if (stage.kind === 'intro') {
    const last = previous[previous.length - 1];
    body = (
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16, flexGrow: 1, justifyContent: 'center', maxWidth: 560, width: '100%', alignSelf: 'center' }}>
        <View style={{ backgroundColor: NAVY, borderRadius: 22, padding: 22, gap: 10 }}>
          <Text style={{ color: GOLD, fontWeight: '800', letterSpacing: 1, fontSize: 12 }}>REASONING TEST</Text>
          <Text style={{ color: '#FFFFFF', fontSize: 30, fontWeight: '900' }}>How sharp is your reasoning?</Text>
          <Text style={{ color: '#D7DCF5', fontSize: 16, lineHeight: 23 }}>
            20 questions in three timed sections: patterns, numbers and words. About 13 minutes. Questions get harder as you go.
          </Text>
          {last ? <Text style={{ color: GOLD, fontWeight: '700' }}>Your last score: {last.estimate}</Text> : null}
        </View>
        {[
          ['Patterns', '8 questions · 6 minutes'],
          ['Numbers', '6 questions · 4 minutes'],
          ['Words', '6 questions · 3 minutes'],
        ].map(([n, d]) => (
          <View key={n} style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 14, borderRadius: 14, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border }}>
            <Text style={{ color: t.text, fontWeight: '700', fontSize: 16 }}>{n}</Text>
            <Text style={{ color: t.muted }}>{d}</Text>
          </View>
        ))}
        <Text style={{ color: t.muted, fontSize: 14, lineHeight: 20 }}>
          Find a quiet spot and give it your full attention. You cannot go back, and skipped questions score zero. Every attempt uses new questions.
        </Text>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <AnswerButton label="Not now" tone="secondary" onPress={quit} />
          <AnswerButton
            label="Begin"
            onPress={() => {
              started.current = Date.now();
              setStage({ kind: 'section', s: 0 });
            }}
          />
        </View>
      </ScrollView>
    );
  } else if (stage.kind === 'section') {
    const sec = sections[stage.s];
    body = (
      <View style={{ flex: 1, padding: 20, gap: 16, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: t.primary, fontWeight: '800', letterSpacing: 1 }}>SECTION {stage.s + 1} OF 3</Text>
        <Text style={{ color: t.text, fontSize: 32, fontWeight: '900' }}>{sec.name}</Text>
        <Text style={{ color: t.muted, fontSize: 16, textAlign: 'center', maxWidth: 420, lineHeight: 23 }}>{SECTION_INTRO[sec.id]}</Text>
        <Text style={{ color: t.text, fontWeight: '700' }}>
          {sec.items.length} questions · {formatClock(sec.seconds)}
        </Text>
        <View style={{ flexDirection: 'row', width: '100%', maxWidth: 420 }}>
          <AnswerButton
            label="Start the clock"
            onPress={() => {
              setEndsAt(Date.now() + sec.seconds * 1000);
              setNow(Date.now());
              setStage({ kind: 'item', s: stage.s, i: 0 });
            }}
          />
        </View>
      </View>
    );
  } else if (stage.kind === 'item') {
    const sec = sections[stage.s];
    const item = sec.items[stage.i];
    body = (
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: t.text, fontWeight: '800', fontSize: 18 }}>{sec.name}</Text>
            <Text style={{ color: t.muted, fontSize: 13 }}>
              Question {stage.i + 1} of {sec.items.length}
            </Text>
          </View>
          <Text
            accessibilityLabel={`${left} seconds left`}
            style={{ color: left <= 30 ? t.help : t.text, fontWeight: '800', fontSize: 20, fontVariant: ['tabular-nums'] }}
          >
            {formatClock(left)}
          </Text>
        </View>
        <View style={{ height: 6, marginHorizontal: 20, marginTop: 10, borderRadius: 3, backgroundColor: t.soft }}>
          <View style={{ height: 6, borderRadius: 3, backgroundColor: t.primary, width: `${(stage.i / sec.items.length) * 100}%` }} />
        </View>
        <ScrollView contentContainerStyle={{ padding: 20, gap: 18, alignItems: 'center' }}>
          <ItemView key={`${stage.s}-${stage.i}`} item={item} width={inner} onAnswer={answer} />
          <Pressable accessibilityRole="button" onPress={() => answer(null)} hitSlop={10}>
            <Text style={{ color: t.muted, fontWeight: '700' }}>Skip this one</Text>
          </Pressable>
        </ScrollView>
      </View>
    );
  } else {
    const { score, seconds } = stage;
    body = (
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16, maxWidth: 560, width: '100%', alignSelf: 'center' }}>
        <View style={{ backgroundColor: NAVY, borderRadius: 22, padding: 22, gap: 6, alignItems: 'center' }}>
          <Text style={{ color: GOLD, fontWeight: '800', letterSpacing: 1, fontSize: 12 }}>ESTIMATED SCORE</Text>
          <Text style={{ color: '#FFFFFF', fontSize: 72, fontWeight: '900', fontVariant: ['tabular-nums'] }}>{score.estimate}</Text>
          <Text style={{ color: GOLD, fontSize: 18, fontWeight: '800' }}>{band(score.estimate)}</Text>
          <Text style={{ color: '#D7DCF5' }}>
            {Math.round(score.percent * 100)}% of weighted points · {formatClock(seconds)}
          </Text>
        </View>
        {sections.map((s) => {
          const r = score.sections[s.id];
          return (
            <View key={s.id} style={{ gap: 6, padding: 14, borderRadius: 14, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: t.text, fontWeight: '700', fontSize: 16 }}>{s.name}</Text>
                <Text style={{ color: t.text, fontWeight: '800' }}>
                  {r.right} / {r.total}
                </Text>
              </View>
              <View style={{ height: 8, borderRadius: 4, backgroundColor: t.soft }}>
                <View style={{ height: 8, borderRadius: 4, backgroundColor: t.primary, width: `${(r.right / r.total) * 100}%` }} />
              </View>
            </View>
          );
        })}
        <Text style={{ color: t.muted, fontSize: 14, lineHeight: 20 }}>
          This is an estimate on an IQ-style scale, where 100 is average and most people score between 85 and 115. It is not a clinical IQ
          test: those take an hour or more with a trained psychologist. Our scale is provisional and has not yet been checked against a large
          group of people, so treat it as a guide. Scores also rise with practice, so for a fair comparison wait about a month between
          attempts.
        </Text>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <AnswerButton label="Done" onPress={() => router.replace('/progress')} />
        </View>
      </ScrollView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <Stack.Screen options={{ headerShown: false }} />
      {stage.kind === 'section' ? (
        <Pressable accessibilityRole="button" onPress={quit} hitSlop={10} style={{ position: 'absolute', right: 16, top: 12, zIndex: 2 }}>
          <Text style={{ color: t.muted, fontWeight: '700' }}>Stop</Text>
        </Pressable>
      ) : null}
      {body}
    </SafeAreaView>
  );
}

function ItemView({ item, width, onAnswer }: { item: Item; width: number; onAnswer: (i: number) => void }) {
  const t = useTheme();
  if (item.kind === 'matrix') {
    const cell = Math.min(104, Math.floor((width - 16) / 3));
    const opt = Math.min(96, Math.floor((width - 20) / 3));
    return (
      <View style={{ gap: 18, alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', width: cell * 3 + 16, gap: 8 }}>
          {item.cells.map((c, i) => (
            <View
              key={i}
              accessible
              accessibilityLabel={i === 8 ? 'Missing square' : describeCell(c, item.shapes)}
              style={{ width: cell, height: cell, borderRadius: 12, backgroundColor: t.surface, borderWidth: 1.5, borderColor: i === 8 ? t.primary : t.border, alignItems: 'center', justifyContent: 'center', borderStyle: i === 8 ? 'dashed' : 'solid' }}
            >
              {i === 8 ? <Text style={{ color: t.primary, fontSize: 36, fontWeight: '900' }}>?</Text> : <MatrixCell cell={c} shapes={item.shapes} size={cell - 8} />}
            </View>
          ))}
        </View>
        <Text style={{ color: t.muted, fontWeight: '700' }}>Which square completes the grid?</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', width: opt * 3 + 20, gap: 10 }}>
          {item.options.map((c, i) => (
            <Pressable
              key={i}
              accessibilityRole="button"
              accessibilityLabel={`Option ${i + 1}: ${describeCell(c, item.shapes)}`}
              onPress={() => onAnswer(i)}
              style={({ pressed }) => ({ width: opt, height: opt, borderRadius: 12, backgroundColor: t.surface, borderWidth: 2, borderColor: pressed ? t.primary : t.border, alignItems: 'center', justifyContent: 'center' })}
            >
              <MatrixCell cell={c} shapes={item.shapes} size={opt - 10} />
            </Pressable>
          ))}
        </View>
      </View>
    );
  }
  if (item.kind === 'series') {
    return (
      <View style={{ gap: 22, alignItems: 'center', width: '100%' }}>
        <Text style={{ color: t.muted, fontWeight: '700' }}>What comes next?</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }} accessible accessibilityLabel={`${item.terms.join(', ')}, then what?`}>
          {[...item.terms.map(String), '?'].map((v, i) => (
            <View key={i} style={{ minWidth: 44, paddingHorizontal: 8, height: 52, borderRadius: 12, backgroundColor: v === '?' ? t.soft : t.surface, borderWidth: 1.5, borderColor: v === '?' ? t.primary : t.border, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: v === '?' ? t.primary : t.text, fontSize: 20, fontWeight: '800', fontVariant: ['tabular-nums'] }}>{v}</Text>
            </View>
          ))}
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
          {item.options.map((o, i) => (
            <Choice key={i} label={String(o)} onPress={() => onAnswer(i)} wide={false} />
          ))}
        </View>
      </View>
    );
  }
  return (
    <View style={{ gap: 18, width: '100%', maxWidth: 440 }}>
      <Text style={{ color: t.text, fontSize: 22, fontWeight: '800', textAlign: 'center' }}>{item.prompt}</Text>
      {item.options.map((o, i) => (
        <Choice key={i} label={o} onPress={() => onAnswer(i)} wide />
      ))}
    </View>
  );
}

function Choice({ label, onPress, wide }: { label: string; onPress: () => void; wide: boolean }) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        minWidth: wide ? undefined : 76,
        paddingHorizontal: 18,
        minHeight: 56,
        borderRadius: 14,
        backgroundColor: pressed ? t.soft : t.surface,
        borderWidth: 2,
        borderColor: pressed ? t.primary : t.border,
        alignItems: 'center',
        justifyContent: 'center',
      })}
    >
      <Text style={{ color: t.text, fontSize: 19, fontWeight: '700', fontVariant: ['tabular-nums'] }}>{label}</Text>
    </Pressable>
  );
}
