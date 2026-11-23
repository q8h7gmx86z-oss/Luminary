import { router, Stack, useLocalSearchParams } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LogoMark } from '@/components/Logo';
import { dayKey } from '@/lib/logic';
import { useStore } from '@/lib/store';
import { useTheme } from '@/lib/theme';
import { Breathing } from '@/training/Breathing';
import { AVAILABLE, GAMES, SKILLS } from '@/training/catalog';
import { dailyGames, focusGames, GameResult } from '@/training/engine';
import { AnswerButton } from '@/training/GameFrame';
import { GameRunner } from '@/training/GameRunner';

/** Today's workout: one minute of breathing, three games, then a summary. */
export default function Workout() {
  const t = useTheme();
  const { completeWorkout } = useStore();
  const today = dayKey();
  const { track } = useLocalSearchParams<{ track?: string }>();
  const focus = track === 'focus';
  const games = useMemo(() => (focus ? focusGames : dailyGames)(today, AVAILABLE), [today, focus]);
  const [step, setStep] = useState(0); // 0 = breathing, 1..n = games, n+1 = summary
  const [results, setResults] = useState<GameResult[]>([]);

  const quit = () => (router.canGoBack() ? router.back() : router.replace('/'));

  let body: React.ReactNode;
  if (step === 0) {
    body = <Breathing onFinish={() => setStep(1)} onQuit={quit} />;
  } else if (step <= games.length) {
    const id = games[step - 1];
    body = (
      <GameRunner
        key={id}
        id={id}
        onQuit={quit}
        doneLabel={step === games.length ? 'See today’s results' : `Next: ${GAMES[games[step]].name}`}
        onDone={(r) => {
          if (r) setResults((rs) => [...rs, r]);
          if (step === games.length) completeWorkout(today);
          setStep(step + 1);
        }}
      />
    );
  } else {
    body = (
      <ScrollView style={{ backgroundColor: t.bg }} contentContainerStyle={{ padding: 20, gap: 16, alignItems: 'center', flexGrow: 1, justifyContent: 'center' }}>
        <LogoMark size={72} />
        <Text style={{ fontSize: 28, fontWeight: '800', color: t.text, textAlign: 'center' }}>{focus ? 'Focus track complete' : 'Workout complete'}</Text>
        <Text style={{ color: t.muted, fontSize: 16, textAlign: 'center', maxWidth: 420 }}>
          You trained {new Set(results.map((r) => GAMES[r.game].skill)).size} skills today. Regular, spaced practice matters more than any
          single score.
        </Text>
        <View style={{ gap: 10, width: '100%', maxWidth: 440 }}>
          {results.map((r) => {
            const g = GAMES[r.game];
            return (
              <View
                key={r.at}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: t.surface, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: t.border }}
              >
                <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: SKILLS[g.skill].color, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: '#fff', fontSize: 22 }}>{g.glyph}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: t.text, fontWeight: '700', fontSize: 16 }}>{g.name}</Text>
                  <Text style={{ color: t.muted, fontSize: 13 }}>
                    {SKILLS[g.skill].name} · {Math.round(r.accuracy * 100)}% accurate
                  </Text>
                </View>
                <Text style={{ color: t.primary, fontWeight: '800', fontSize: 20, fontVariant: ['tabular-nums'] }}>{r.score}</Text>
              </View>
            );
          })}
        </View>
        <View style={{ flexDirection: 'row', width: '100%', maxWidth: 440 }}>
          <AnswerButton label="Done" onPress={() => router.replace('/progress')} />
        </View>
      </ScrollView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <Stack.Screen options={{ headerShown: false }} />
      {body}
    </SafeAreaView>
  );
}
