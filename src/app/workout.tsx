import { router, Stack, useLocalSearchParams } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LogoMark } from '@/components/Logo';
import { dayKey } from '@/lib/logic';
import { useStore } from '@/lib/store';
import { GOLD } from '@/lib/brand';
import { useTheme } from '@/lib/theme';
import { Breathing } from '@/training/Breathing';
import { AVAILABLE, GAMES, SKILLS } from '@/training/catalog';
import { focusGames, GameResult } from '@/training/engine';
import { useTodayPlan } from '@/training/usePlan';
import { AnswerButton } from '@/training/GameFrame';
import { GameRunner } from '@/training/GameRunner';
import { MAX_SHARPNESS, sharpnessOf } from '@/training/sharpness';
import { Skill } from '@/training/engine';
import { GameBadge } from '@/components/GameBadge';

const SKILL_LIST = Object.keys(SKILLS) as Skill[];

/** Today's workout: one minute of breathing, three games, then a summary. */
export default function Workout() {
  const t = useTheme();
  const { state, completeWorkout } = useStore();
  const [before] = useState(() => sharpnessOf(state.training.results, (g) => GAMES[g].skill, SKILL_LIST).total);
  const [firstTime] = useState(() => state.training.results.length === 0);
  const after = sharpnessOf(state.training.results, (g) => GAMES[g].skill, SKILL_LIST).total;
  const today = dayKey();
  const { track } = useLocalSearchParams<{ track?: string }>();
  const focus = track === 'focus';
  const plan = useTodayPlan();
  const [games] = useState(() => (focus ? focusGames(today, AVAILABLE) : plan.map((p) => p.game)));
  const [step, setStep] = useState(0); // 0 = breathing, 1..n = games, n+1 = summary
  const [resting, setResting] = useState(false);
  const [results, setResults] = useState<GameResult[]>([]);

  const quit = () => (router.canGoBack() ? router.back() : router.replace('/'));

  let body: React.ReactNode;
  if (resting) {
    body = <BreakCard next={GAMES[games[step - 1]].name} onContinue={() => setResting(false)} />;
  } else if (step === 0) {
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
          else if (state.settings.breaks) setResting(true);
          setStep(step + 1);
        }}
      />
    );
  } else {
    body = (
      <ScrollView style={{ backgroundColor: t.bg }} contentContainerStyle={{ padding: 20, gap: 16, alignItems: 'center', flexGrow: 1, justifyContent: 'center' }}>
        <LogoMark size={72} />
        <Text style={{ fontSize: 28, fontWeight: '800', color: t.text, textAlign: 'center' }}>{focus ? 'Focus session complete' : 'Workout complete'}</Text>
        <Text style={{ color: t.muted, fontSize: 16, textAlign: 'center', maxWidth: 420 }}>
          {new Set(results.map((r) => GAMES[r.game].skill)).size} skills trained. Spaced sessions, about three a week, build skill faster
          than cramming.
        </Text>
        <View style={{ backgroundColor: '#0B1640', borderRadius: 18, padding: 16, width: '100%', maxWidth: 440, alignItems: 'center', gap: 4 }}>
          <Text style={{ color: GOLD, fontWeight: '800', letterSpacing: 1, fontSize: 12 }}>BRAIN SHARPNESS</Text>
          <Text style={{ color: '#FFFFFF', fontSize: 40, fontWeight: '900', fontVariant: ['tabular-nums'] }}>
            {after}
            <Text style={{ color: '#8C97C9', fontSize: 15 }}> / {MAX_SHARPNESS}</Text>
          </Text>
          <Text style={{ color: after > before ? GOLD : '#D7DCF5', fontWeight: '700' }}>
            {firstTime ? 'Baseline set. Every workout from here is measured against it.' : after > before ? `Up ${after - before} from ${before} this session` : after < before ? 'A dip is normal on harder levels. Keep the streak.' : 'Holding steady. Consistency is how scores climb.'}
          </Text>
        </View>
        <View style={{ gap: 10, width: '100%', maxWidth: 440 }}>
          {results.map((r) => {
            const g = GAMES[r.game];
            return (
              <View
                key={r.at}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: t.surface, borderRadius: 18, padding: 14, borderWidth: 1, borderColor: t.border, boxShadow: t.shadow }}
              >
                <GameBadge game={r.game} size={44} />
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

/** Optional pause between games, for people who want a moment to reset. */
function BreakCard({ next, onContinue }: { next: string; onContinue: () => void }) {
  const t = useTheme();
  return (
    <View style={{ flex: 1, padding: 24, gap: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: t.bg }}>
      <Text style={{ color: t.primary, fontWeight: '800', letterSpacing: 1 }}>BREATHER</Text>
      <Text style={{ color: t.text, fontSize: 28, fontWeight: '900', textAlign: 'center' }}>Reset before {next}</Text>
      <Text style={{ color: t.muted, fontSize: 16, textAlign: 'center', maxWidth: 380, lineHeight: 23 }}>
        Look away from the screen, roll your shoulders and take three slow breaths. A short pause clears the last game so you start the next one
        fresh. Take as long as you like.
      </Text>
      <View style={{ flexDirection: 'row', width: '100%', maxWidth: 420 }}>
        <AnswerButton label="I'm ready" onPress={onContinue} />
      </View>
    </View>
  );
}
