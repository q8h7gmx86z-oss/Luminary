import { router, Stack } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Overline } from '@/components/ui';
import { AlertnessCheck, CheckResult } from '@/lab/AlertnessCheck';
import { armFor } from '@/lab/lab';
import { dayKey } from '@/lib/logic';
import { useStore } from '@/lib/store';
import { type, useTheme } from '@/lib/theme';
import { AnswerButton } from '@/training/GameFrame';
import { PlusGate } from '@/plus/PlusGate';

/** Today's alertness check for the running experiment, then one question: did you keep to the condition? */
function LabCheckScreen() {
  const t = useTheme();
  const { state, recordLabEntry } = useStore();
  const exp = (state.lab ?? []).filter((e) => !e.endedAt).pop();
  const today = dayKey();
  const arm = exp ? armFor(exp, today) : null;
  const [result, setResult] = useState<CheckResult | undefined | null>(null);
  const quit = () => (router.canGoBack() ? router.back() : router.replace('/lab'));

  const save = (kept: boolean) => {
    if (exp && arm && result) recordLabEntry({ day: today, arm, kept, speed: result.speed, lapses: result.lapses, at: Date.now() });
    router.replace('/lab');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: t.text, fontSize: 18, fontWeight: '700' }}>Alertness check</Text>
          <Text style={{ color: t.muted, fontSize: 13 }}>{arm ? `Personal Lab · ${arm} day` : 'Personal Lab'}</Text>
        </View>
        <Pressable accessibilityRole="button" onPress={quit} hitSlop={10} style={{ backgroundColor: t.soft, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 }}>
          <Text style={{ color: t.text, fontWeight: '600' }}>Stop</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 18, alignItems: 'center', flexGrow: 1, justifyContent: 'center' }}>
        {!exp || !arm ? (
          <Text style={[type.body, { color: t.muted, textAlign: 'center' }]}>There is no experiment running today.</Text>
        ) : result === null ? (
          <AlertnessCheck onDone={setResult} />
        ) : result === undefined ? (
          <View style={{ gap: 14, width: '100%', maxWidth: 440 }}>
            <Text style={[type.body, { color: t.text }]}>Too few responses were recorded to score this check. Please take it again when you are ready.</Text>
            <View style={{ flexDirection: 'row' }}>
              <AnswerButton label="Take it again" onPress={() => setResult(null)} />
            </View>
          </View>
        ) : (
          <View style={{ gap: 14, width: '100%', maxWidth: 440 }}>
            <Overline color={t.lavender}>Check recorded</Overline>
            <Text style={[type.title, { color: t.text }]}>{result.speed.toFixed(2)} responses per second</Text>
            <Text style={[type.body, { color: t.muted }]}>
              {result.lapses} slow {result.lapses === 1 ? 'response' : 'responses'} of half a second or more
              {result.falseStarts ? `, ${result.falseStarts} early ${result.falseStarts === 1 ? 'tap' : 'taps'}` : ''}.
            </Text>
            <Text style={[type.section, { color: t.text, fontSize: 18 }]}>Did you keep to today’s condition?</Text>
            <Text style={[type.caption, { color: t.muted }]}>{arm === 'A' ? exp.a : exp.b}</Text>
            <Text style={[type.caption, { color: t.muted }]}>Answer honestly. Days that did not go to plan are left out of the result, which keeps it fair.</Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <AnswerButton label="Not quite" tone="secondary" onPress={() => save(false)} />
              <AnswerButton label="Yes, I kept to it" onPress={() => save(true)} />
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

export default function LabCheck() {
  return (
    <PlusGate feature="lab">
      <LabCheckScreen />
    </PlusGate>
  );
}
