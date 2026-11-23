import { Redirect, router, Stack, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/lib/theme';
import { GameId } from '@/training/engine';
import { GameRunner, isPlayable } from '@/training/GameRunner';

/** Free play of a single game from the Train tab. */
export default function Play() {
  const { game } = useLocalSearchParams<{ game: string }>();
  const t = useTheme();
  const [round, setRound] = useState(0);
  const id = game as GameId;
  const quit = () => (router.canGoBack() ? router.back() : router.replace('/train'));

  if (!isPlayable(id)) return <Redirect href="/train" />;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <Stack.Screen options={{ headerShown: false }} />
      <GameRunner key={round} id={id} onQuit={quit} doneLabel="Play again" onExit={quit} onDone={() => setRound((r) => r + 1)} />
    </SafeAreaView>
  );
}
