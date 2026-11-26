import { router, Stack } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Overline } from '@/components/ui';
import { dayKey } from '@/lib/logic';
import { useStore } from '@/lib/store';
import { type, useTheme } from '@/lib/theme';
import { Measure, MeasureId } from '@/training/benchmark';
import { CodingTest, ReactionTest, SpanTest, TrailsTest } from '@/training/BenchmarkTests';
import { AnswerButton } from '@/training/GameFrame';

const STEPS = [
  { id: 'reaction', name: 'Reaction time', minutes: 2, about: 'A single light, then four positions. Respond the moment a box lights.', C: ReactionTest },
  { id: 'span', name: 'Digit span', minutes: 3, about: 'Digits appear one at a time. Enter them forwards, then in a second part backwards.', C: SpanTest },
  { id: 'trails', name: 'Trails', minutes: 2, about: 'Connect circles in order: numbers first, then numbers and letters alternating.', C: TrailsTest },
  { id: 'coding', name: 'Symbol coding', minutes: 2, about: 'Match symbols to their numbers using a key, for 90 seconds.', C: CodingTest },
] as const;

/** The Benchmark itself: four untrained tasks in a fixed order, then saved. */
export default function BenchmarkRun() {
  const t = useTheme();
  const { recordBenchmark } = useStore();
  const [i, setI] = useState(0);
  const [stage, setStage] = useState<'intro' | 'test'>('intro');
  const measures = useRef<Partial<Record<MeasureId, Measure>>>({});
  const step = STEPS[i];
  const quit = () => (router.canGoBack() ? router.back() : router.replace('/benchmark'));

  const done = (m: Partial<Record<MeasureId, Measure>>) => {
    for (const [k, v] of Object.entries(m)) if (v) measures.current[k as MeasureId] = v;
    if (i + 1 < STEPS.length) {
      setI(i + 1);
      setStage('intro');
    } else {
      recordBenchmark({ at: Date.now(), day: dayKey(), measures: measures.current });
      router.replace('/benchmark');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: t.text, fontSize: 18, fontWeight: '700' }}>Luminary Benchmark</Text>
          <Text style={{ color: t.muted, fontSize: 13 }}>
            Task {i + 1} of {STEPS.length} · {step.name}
          </Text>
        </View>
        <Pressable accessibilityRole="button" onPress={quit} hitSlop={10} style={{ backgroundColor: t.soft, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 }}>
          <Text style={{ color: t.text, fontWeight: '600' }}>Stop</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 18, alignItems: 'center', flexGrow: 1, justifyContent: 'center' }}>
        {stage === 'intro' ? (
          <View style={{ gap: 14, width: '100%', maxWidth: 440 }}>
            <Overline color={t.lavender}>{`Task ${i + 1} · about ${step.minutes} minutes`}</Overline>
            <Text accessibilityRole="header" style={[type.title, { color: t.text }]}>
              {step.name}
            </Text>
            <Text style={[type.body, { color: t.muted }]}>{step.about}</Text>
            <Text style={[type.caption, { color: t.muted }]}>
              {i === 0
                ? 'Find a quiet moment. Complete all four tasks in one sitting, at a similar time of day each month, so the results are comparable.'
                : 'Take a breath before you begin. There is no time pressure between tasks.'}
            </Text>
            <View style={{ flexDirection: 'row' }}>
              <AnswerButton label="Begin" onPress={() => setStage('test')} />
            </View>
          </View>
        ) : (
          <step.C key={step.id} onDone={done} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
