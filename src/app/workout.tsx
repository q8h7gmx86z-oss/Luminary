import { router, Stack, useLocalSearchParams } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuraNote } from '@/aura/Aura';
import { summaryLine } from '@/aura/script';
import { Icon } from '@/components/Icon';
import { useCountUp } from '@/components/motion';
import { networkLevels, SkillNetwork } from '@/components/SkillNetwork';
import { Overline } from '@/components/ui';
import { dayKey } from '@/lib/logic';
import { useStore } from '@/lib/store';
import { fonts, radii, type, useTheme } from '@/lib/theme';
import { Breathing } from '@/training/Breathing';
import { ResearchPanel } from '@/components/Research';
import { AVAILABLE, GAMES, SKILLS } from '@/training/catalog';
import { focusGames, GameResult, MAX_LEVEL } from '@/training/engine';
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
    body = <Summary focus={focus} results={results} before={before} after={after} firstTime={firstTime} />;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <Stack.Screen options={{ headerShown: false }} />
      {body}
    </SafeAreaView>
  );
}

/** The results screen: the score as hero, what changed, and each task's numbers. */
function Summary({ focus, results, before, after, firstTime }: { focus: boolean; results: GameResult[]; before: number; after: number; firstTime: boolean }) {
  const t = useTheme();
  const { width } = useWindowDimensions();
  const { state } = useStore();
  const shown = useCountUp(after, 1100);
  const diff = after - before;
  const skills = new Set(results.map((r) => GAMES[r.game].skill)).size;
  const played = new Set(state.training.results.map((r) => r.game));
  const netW = Math.min(width, 480) - 40;
  return (
    <ScrollView style={{ backgroundColor: t.bg }} contentContainerStyle={{ padding: 20, paddingTop: 32, gap: 18, alignItems: 'center', flexGrow: 1 }}>
      <View style={{ width: '100%', maxWidth: 440, gap: 6 }}>
        <Overline color={t.lavender}>{focus ? 'Focus session' : 'Session complete'}</Overline>
        <Text accessibilityRole="header" style={[type.title, { color: t.text }]}>
          {focus ? 'Focus session banked.' : 'Workout banked.'}
        </Text>
        <Text style={[type.body, { color: t.muted }]}>
          {skills} {skills === 1 ? 'skill' : 'skills'} trained. Spaced sessions, about three a week, build skill faster than cramming.
        </Text>
      </View>

      <View style={{ width: '100%', maxWidth: 440, backgroundColor: t.surface, borderRadius: radii.panel, borderWidth: 1, borderColor: t.border, overflow: 'hidden' }}>
        <View style={{ position: 'absolute', top: 0, left: 0 }}>
          <SkillNetwork width={netW} height={Math.round(netW * 0.62)} level={networkLevels(state.training.levels, played, MAX_LEVEL)} dim={0.55} />
        </View>
        <View style={{ padding: 18, gap: 6, alignItems: 'center' }}>
          <Overline>Performance score</Overline>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
            <Text style={[type.metric, { color: t.text, lineHeight: 60 }]} accessibilityLabel={`${after} out of ${MAX_SHARPNESS}`}>
              {shown}
            </Text>
            <Text style={[type.number, { color: t.muted, fontSize: 15, fontFamily: fonts.body }]}>/ {MAX_SHARPNESS}</Text>
          </View>
          {!firstTime && diff > 0 ? (
            <View style={{ backgroundColor: t.goldSoft, borderRadius: 13, height: 26, paddingHorizontal: 10, justifyContent: 'center' }}>
              <Text style={{ color: t.gold, fontFamily: fonts.semibold, fontSize: 12 }}>+{diff} this session</Text>
            </View>
          ) : null}
          <Text style={[type.caption, { color: t.muted, textAlign: 'center', maxWidth: 300, marginTop: 4 }]}>
            {firstTime
              ? 'Baseline set. Every workout from here is measured against it.'
              : diff > 0
                ? `Up from ${before}. Your progress on Luminary's tasks, against your own baseline.`
                : diff < 0
                  ? 'A dip is normal when levels get harder. Your level is still climbing.'
                  : 'Holding steady. Consistency is how scores climb.'}
          </Text>
        </View>
      </View>

      <View style={{ width: '100%', maxWidth: 440 }}>
        <AuraNote
          line={summaryLine({
            firstTime,
            diff,
            focus,
            results: results.map((r) => ({ game: GAMES[r.game].name, accuracy: r.accuracy, levelledUp: (state.training.levels[r.game] ?? 1) > r.level })),
          })}
        />
      </View>

      <View style={{ gap: 8, width: '100%', maxWidth: 440 }}>
        {results.map((r) => {
          const g = GAMES[r.game];
          return (
            <View key={r.at} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: radii.row, borderWidth: 1, borderColor: t.border }}>
              <GameBadge game={r.game} size={40} />
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={[type.label, { color: t.text }]}>{g.name}</Text>
                <Text style={{ color: g.accent, fontFamily: fonts.medium, fontSize: 12.5 }}>{SKILLS[g.skill].name}</Text>
                <Text style={[type.caption, { color: t.muted, fontVariant: ['tabular-nums'] }]}>
                  {Math.round(r.accuracy * 100)}% accurate · Lv {r.level}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[type.number, { color: t.text }]}>{r.score}</Text>
                <Text style={[type.overline, { color: t.muted, fontSize: 9 }]}>Points</Text>
              </View>
            </View>
          );
        })}
      </View>

      <View style={{ width: '100%', maxWidth: 440 }}>
        <ResearchPanel id="workout" />
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={() => router.replace('/progress')}
        style={({ pressed }) => ({
          width: '100%',
          maxWidth: 440,
          backgroundColor: t.primary,
          borderRadius: radii.button,
          minHeight: 52,
          flexDirection: 'row',
          gap: 8,
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: t.primaryGlow,
          opacity: pressed ? 0.9 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        })}
      >
        <Text style={{ color: '#FFFFFF', fontSize: 16, fontFamily: fonts.semibold }}>See your progress</Text>
        <Icon name="arrow" size={18} color="#FFFFFF" strokeWidth={2.2} />
      </Pressable>
    </ScrollView>
  );
}

/** Optional pause between games, for people who want a moment to reset. */
function BreakCard({ next, onContinue }: { next: string; onContinue: () => void }) {
  const t = useTheme();
  return (
    <View style={{ flex: 1, padding: 24, gap: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: t.bg }}>
      <Overline color={t.teal}>Breather</Overline>
      <Text style={[type.title, { color: t.text, textAlign: 'center' }]}>Reset before {next}</Text>
      <Text style={[type.body, { color: t.muted, textAlign: 'center', maxWidth: 380, lineHeight: 23 }]}>
        Look away from the screen, roll your shoulders and take three slow breaths. A short pause clears the last game so you start the next one
        fresh. Take as long as you like.
      </Text>
      <View style={{ flexDirection: 'row', width: '100%', maxWidth: 420 }}>
        <AnswerButton label="I'm ready" onPress={onContinue} />
      </View>
    </View>
  );
}
