import React, { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { useTheme } from '@/lib/theme';

import { clashParams, mean } from '../engine';
import { AnswerButton, GameFrame, GameProps } from '../GameFrame';
import { useKeys } from '../useKeys';

const COLOURS = [
  { name: 'Blue', hex: '#3D7BFF' },
  { name: 'Red', hex: '#E5484D' },
  { name: 'Green', hex: '#2E9E5B' },
  { name: 'Purple', hex: '#8A4DE0' },
  { name: 'Orange', hex: '#E8730C' },
];

type Trial = { word: number; ink: number };
type Fb = 'right' | 'wrong' | 'word' | 'late' | null;

/** Stroop task: name the ink colour and ignore what the word says. */
export function ColourClash({ level, onFinish, onQuit }: GameProps & { onQuit?: () => void }) {
  const t = useTheme();
  const p = clashParams(level);
  const palette = COLOURS.slice(0, p.colours);
  const [phase, setPhase] = useState<'ready' | 'play' | 'done'>('ready');
  const [trial, setTrial] = useState<Trial | null>(null);
  const [n, setN] = useState(0);
  const [fb, setFb] = useState<Fb>(null);

  const s = useRef({ n: 0, cur: null as Trial | null, locked: true, shownAt: 0, correct: 0, rts: [] as number[], clashRts: [] as number[], bonus: 0 });
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const later = (fn: () => void, ms: number) => timers.current.push(setTimeout(fn, ms));
  const deadline = useRef<ReturnType<typeof setTimeout> | null>(null);

  const next = (i: number) => {
    const st = s.current;
    if (i >= p.trials) {
      setPhase('done');
      setTrial(null);
      onFinish({
        score: Math.round(st.correct * (10 + level * 2) + st.bonus),
        accuracy: st.correct / p.trials,
        rtMs: mean(st.rts),
      });
      return;
    }
    const ink = Math.floor(Math.random() * palette.length);
    let word = ink;
    if (Math.random() < p.clashRate) while (word === ink) word = Math.floor(Math.random() * palette.length);
    const tr = { word, ink };
    st.n = i;
    st.cur = tr;
    st.locked = false;
    st.shownAt = Date.now();
    setN(i);
    setTrial(tr);
    setFb(null);
    deadline.current = setTimeout(() => answerRef.current(null), p.deadlineMs);
  };

  const answer = (choice: number | null) => {
    const st = s.current;
    if (phase !== 'play' || st.locked || !st.cur) return;
    st.locked = true;
    if (deadline.current) clearTimeout(deadline.current);
    const rt = Date.now() - st.shownAt;
    let f: Fb;
    if (choice === null) f = 'late';
    else if (choice === st.cur.ink) {
      f = 'right';
      st.correct += 1;
      st.rts.push(rt);
      if (st.cur.word !== st.cur.ink) st.clashRts.push(rt);
      // Clashing words are harder, so they earn a little more.
      st.bonus += Math.max(0, ((p.deadlineMs - rt) / p.deadlineMs) * (st.cur.word !== st.cur.ink ? 8 : 4));
    } else f = choice === st.cur.word ? 'word' : 'wrong';
    setFb(f);
    const i = st.n;
    later(() => next(i + 1), f === 'right' ? 220 : 520);
  };
  const answerRef = useRef(answer);
  answerRef.current = answer;
  useEffect(() => () => {
    if (deadline.current) clearTimeout(deadline.current);
  }, []);

  const keys: Record<string, () => void> = {};
  if (phase === 'play') palette.forEach((_, i) => (keys[String(i + 1)] = () => answer(i)));
  useKeys(keys);

  const start = () => {
    setPhase('play');
    later(() => next(0), 600);
  };

  const ring = fb === 'right' ? t.good : fb ? t.help : t.border;

  return (
    <GameFrame title="Colour Clash" level={level} progress={phase === 'play' ? n / p.trials : 0} status={phase === 'play' ? `${n + 1} of ${p.trials}` : undefined} onQuit={onQuit}>
      <Text style={{ color: t.muted, fontSize: 16, textAlign: 'center' }}>
        {phase === 'ready' ? 'Tap the colour of the ink. Ignore what the word says.' : 'What colour is the ink?'}
      </Text>
      <View
        style={{ width: '100%', maxWidth: 340, height: 150, borderRadius: 24, borderWidth: 4, borderColor: ring, backgroundColor: t.surface, alignItems: 'center', justifyContent: 'center' }}
        accessible
        accessibilityLabel={trial ? `The word ${palette[trial.word].name}, written in ${palette[trial.ink].name}` : 'Waiting'}
      >
        {phase === 'ready' ? (
          <Text style={{ fontSize: 48, fontWeight: '900', color: COLOURS[0].hex, letterSpacing: 2 }}>RED</Text>
        ) : trial ? (
          <Text style={{ fontSize: 54, fontWeight: '900', color: palette[trial.ink].hex, letterSpacing: 2 }}>{palette[trial.word].name.toUpperCase()}</Text>
        ) : null}
      </View>
      <Text style={{ height: 22, fontWeight: '700', color: fb === 'right' ? t.good : t.help }}>
        {phase === 'ready' ? '' : fb === 'right' ? 'Correct' : fb === 'word' ? 'That was the word, not the ink' : fb === 'wrong' ? 'Not quite' : fb === 'late' ? 'Too slow' : ''}
      </Text>
      {phase === 'ready' ? (
        <>
          <Text style={{ color: t.muted, textAlign: 'center' }}>Here the right answer is Blue.</Text>
          <View style={{ flexDirection: 'row', width: '100%' }}>
            <AnswerButton label="Start" onPress={start} />
          </View>
        </>
      ) : (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, width: '100%', maxWidth: 420, justifyContent: 'center' }}>
          {palette.map((c, i) => (
            <ColourKey key={c.name} name={c.name} hex={c.hex} n={i + 1} onPress={() => answer(i)} />
          ))}
        </View>
      )}
    </GameFrame>
  );
}

function ColourKey({ name, hex, n, onPress }: { name: string; hex: string; n: number; onPress: () => void }) {
  const t = useTheme();
  const last = useRef(0);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={name}
      onPressIn={() => {
        last.current = Date.now();
        onPress();
      }}
      onPress={() => {
        if (Date.now() - last.current > 1000) onPress();
      }}
      style={({ pressed }) => ({
        flexBasis: '46%',
        flexGrow: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderRadius: 16,
        backgroundColor: t.surface,
        borderWidth: 2,
        borderColor: pressed ? hex : t.border,
        transform: [{ scale: pressed ? 0.97 : 1 }],
      })}
    >
      <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: hex }} />
      <Text style={{ color: t.text, fontSize: 18, fontWeight: '700', flex: 1 }}>{name}</Text>
      <Text style={{ color: t.muted, fontSize: 12 }}>{n}</Text>
    </Pressable>
  );
}
