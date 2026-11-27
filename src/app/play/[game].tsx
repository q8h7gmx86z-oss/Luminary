import { Redirect, router, Stack, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/lib/theme';
import { GameId } from '@/training/engine';
import { GameRunner, isPlayable } from '@/training/GameRunner';
import { AVAILABLE } from '@/training/catalog';
import { dailyGames } from '@/training/engine';
import { dayKey } from '@/lib/logic';
import { PlusLocked, useMembership } from '@/plus/PlusGate';

/** Free play of a single game from the Train tab. */
export default function Play() {
  const { game, challenge } = useLocalSearchParams<{ game: string; challenge?: string }>();
  const t = useTheme();
  const [round, setRound] = useState(0);
  const id = game as GameId;
  const quit = () => (router.canGoBack() ? router.back() : router.replace('/train'));

  const { can } = useMembership();

  if (!isPlayable(id)) return <Redirect href="/train" />;
  // Free: the three tasks of the day and any daily challenge. Plus: every task, any time.
  if (!challenge && !can('allGames') && !dailyGames(dayKey(), AVAILABLE).includes(id)) return <PlusLocked feature="allGames" />;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <Stack.Screen options={{ headerShown: false }} />
      {challenge ? (
        <GameRunner id={id} onQuit={quit} doneLabel="Done" challengeLevel={Number(challenge)} onDone={quit} />
      ) : (
        <GameRunner key={round} id={id} onQuit={quit} doneLabel="Play again" onExit={quit} onDone={() => setRound((r) => r + 1)} />
      )}
    </SafeAreaView>
  );
}
