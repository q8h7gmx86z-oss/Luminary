import { Stack } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Button, Overline, Screen } from '@/components/ui';
import { useStore } from '@/lib/store';
import { fonts, radii, type, useTheme } from '@/lib/theme';
import { makePalace, PALACE_SIZE, scorePalace } from '@/real/palace';
import { Panel } from '@/real/ui';
import { PlusGate } from '@/plus/PlusGate';

type Phase = 'intro' | 'study' | 'walk' | 'recall' | 'result';

/** Memory Palace practice: place ten words along your route, then recall them in order. */
function PalacePracticeScreen() {
  const t = useTheme();
  const { state, recordPalace } = useStore();
  const [round, setRound] = useState(() => makePalace());
  const [phase, setPhase] = useState<Phase>('intro');
  const [i, setI] = useState(0);
  const [answer, setAnswer] = useState<string[]>([]);
  const best = Math.max(0, ...(state.courses?.palace ?? []).map((p) => p.score));
  const score = scorePalace(round.list, answer);

  const restart = () => {
    setRound(makePalace());
    setI(0);
    setAnswer([]);
    setPhase('study');
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Memory Palace practice' }} />
      {phase === 'intro' ? (
        <View style={{ gap: 14 }}>
          <Overline color={t.gold}>Practice</Overline>
          <Text accessibilityRole="header" style={[type.title, { color: t.text }]}>
            Ten words, one route.
          </Text>
          <Text style={[type.body, { color: t.muted }]}>
            Use the ten-stop palace from lesson 2. Each word appears on its own. Place it at the next stop with a vivid, moving image, then continue.
            Afterwards you will pick the ten words, in order, from a board of twenty.
          </Text>
          {best ? <Text style={[type.caption, { color: t.gold }]}>Your best so far: {best} of {PALACE_SIZE} in order.</Text> : null}
          <Button label="Begin" onPress={() => setPhase('study')} />
        </View>
      ) : null}

      {phase === 'study' ? (
        <View style={{ gap: 18, alignItems: 'center' }}>
          <Overline>
            Stop {i + 1} of {PALACE_SIZE}
          </Overline>
          <View style={{ width: '100%', height: 180, borderRadius: radii.panel, borderWidth: 1, borderColor: t.gold + '66', backgroundColor: t.surface, alignItems: 'center', justifyContent: 'center' }}>
            <Text accessibilityLiveRegion="polite" style={{ color: t.text, fontSize: 40, fontFamily: fonts.display }}>
              {round.list[i]}
            </Text>
          </View>
          <Text style={[type.caption, { color: t.muted, textAlign: 'center' }]}>Make it large, make it move, make it touch the place.</Text>
          <View style={{ alignSelf: 'stretch' }}>
            <Button label={i + 1 < PALACE_SIZE ? 'Placed. Next word' : 'Placed. Finish'} onPress={() => (i + 1 < PALACE_SIZE ? setI(i + 1) : setPhase('walk'))} />
          </View>
        </View>
      ) : null}

      {phase === 'walk' ? (
        <View style={{ gap: 14 }}>
          <Overline color={t.gold}>Before you recall</Overline>
          <Text style={[type.title, { color: t.text }]}>Walk the route once.</Text>
          <Text style={[type.body, { color: t.muted }]}>Close your eyes and walk your palace from the first stop to the last, looking at each image. Take as long as you need.</Text>
          <Button label="I am ready to recall" onPress={() => setPhase('recall')} />
        </View>
      ) : null}

      {phase === 'recall' ? (
        <View style={{ gap: 14 }}>
          <Overline>
            Tap the words in order · {answer.length} of {PALACE_SIZE}
          </Overline>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {Array.from({ length: PALACE_SIZE }, (_, k) => (
              <View key={k} style={{ minWidth: 92, paddingHorizontal: 8, height: 32, borderRadius: 8, borderWidth: 1, borderColor: answer[k] ? t.gold + '88' : t.border, justifyContent: 'center' }}>
                <Text style={{ color: answer[k] ? t.text : t.muted, fontSize: 13 }}>
                  {k + 1}. {answer[k] ?? ''}
                </Text>
              </View>
            ))}
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {round.board.map((w) => {
              const used = answer.includes(w);
              return (
                <Pressable
                  key={w}
                  accessibilityRole="button"
                  accessibilityLabel={w}
                  accessibilityState={{ disabled: used }}
                  disabled={used || answer.length >= PALACE_SIZE}
                  onPress={() => setAnswer([...answer, w])}
                  style={({ pressed }) => ({ height: 44, paddingHorizontal: 14, borderRadius: 22, justifyContent: 'center', borderWidth: 1, borderColor: t.border, backgroundColor: pressed ? t.soft : t.surface, opacity: used ? 0.3 : 1 })}
                >
                  <Text style={{ color: t.text, fontFamily: fonts.medium }}>{w}</Text>
                </Pressable>
              );
            })}
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Button label="Undo" kind="secondary" disabled={!answer.length} onPress={() => setAnswer(answer.slice(0, -1))} />
            </View>
            <View style={{ flex: 1 }}>
              <Button
                label="Check"
                disabled={answer.length < PALACE_SIZE}
                onPress={() => {
                  recordPalace(scorePalace(round.list, answer));
                  setPhase('result');
                }}
              />
            </View>
          </View>
        </View>
      ) : null}

      {phase === 'result' ? (
        <View style={{ gap: 14 }}>
          <Overline color={t.gold}>{score > best ? 'Personal record' : 'Result'}</Overline>
          <Text style={[type.title, { color: t.text }]}>
            {score} of {PALACE_SIZE} in order.
          </Text>
          <Panel>
            {round.list.map((w, k) => (
              <View key={k} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={[type.caption, { color: t.text }]}>
                  {k + 1}. {w}
                </Text>
                <Text style={[type.caption, { color: answer[k] === w ? t.teal : t.help }]}>{answer[k] === w ? 'Correct' : `You chose ${answer[k]}`}</Text>
              </View>
            ))}
          </Panel>
          <Text style={[type.caption, { color: t.muted }]}>
            Tomorrow, walk the palace again without looking. The images that survive a night are the real test.
          </Text>
          <Button label="Practise again" onPress={restart} />
        </View>
      ) : null}
    </Screen>
  );
}

export default function PalacePractice() {
  return (
    <PlusGate feature="courses">
      <PalacePracticeScreen />
    </PlusGate>
  );
}
