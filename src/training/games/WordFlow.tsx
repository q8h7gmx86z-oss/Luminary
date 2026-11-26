import React, { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';

import { useTheme } from '@/lib/theme';

import { costMs, defined, rtStats } from '../engine';
import { AnswerButton, GameFrame, GameProps } from '../GameFrame';
import { useAnswerFeedback } from '../feedback';
import { fitsRule, makeRule, makeWord, WordRule, wordParams } from '../newgames';
import { useKeys } from '../useKeys';

type Fb = 'right' | 'wrong' | 'late' | null;
const ACCENT = '#F28C5A';

/** Category switching with words: the question changes, and you have to change with it. */
export function WordFlow({ level, onFinish, onQuit, untimed }: GameProps & { onQuit?: () => void }) {
  const t = useTheme();
  const p = wordParams(level);
  const [phase, setPhase] = useState<'ready' | 'play' | 'done'>('ready');
  const [n, setN] = useState(0);
  const [rule, setRule] = useState<WordRule>(() => makeRule(p.letterRules));
  const [word, setWord] = useState<string | null>(null);
  const [fb, setFb] = useState<Fb>(null);
  useAnswerFeedback(fb, ['right']);
  const s = useRef({
    i: 0,
    rule,
    word: '',
    switched: false,
    open: false,
    shownAt: 0,
    correct: 0,
    bonus: 0,
    rts: [] as number[],
    switchRts: [] as number[],
    repeatRts: [] as number[],
    switchN: 0,
    switchRight: 0,
  });
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const clear = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  useEffect(() => clear, []);
  const later = (fn: () => void, ms: number) => timers.current.push(setTimeout(fn, ms));

  const show = (i: number) => {
    const st = s.current;
    if (i >= p.trials) {
      setPhase('done');
      setWord(null);
      onFinish({
        score: Math.round(st.correct * (10 + level * 2) + st.bonus),
        accuracy: st.correct / p.trials,
        ...rtStats(st.rts),
        metrics: defined({ switchCost: costMs(st.switchRts, st.repeatRts), switchAccuracy: st.switchN ? st.switchRight / st.switchN : undefined }),
      });
      return;
    }
    st.switched = i > 0 && Math.random() < p.switchRate;
    if (st.switched) st.rule = makeRule(p.letterRules, Math.random, st.rule);
    st.word = makeWord(st.rule, Math.random, st.word);
    st.i = i;
    st.open = true;
    st.shownAt = Date.now();
    setN(i);
    setRule(st.rule);
    setWord(st.word);
    setFb(null);
    if (!untimed) later(() => answerRef.current(null), p.deadlineMs);
  };

  const answer = (yes: boolean | null) => {
    const st = s.current;
    if (phase !== 'play' || !st.open) return;
    st.open = false;
    clear();
    const rt = Date.now() - st.shownAt;
    const kind = st.i === 0 ? null : st.switched ? 'switch' : 'repeat';
    if (kind === 'switch') st.switchN += 1;
    let f: Fb;
    if (yes === null) f = 'late';
    else if (yes === fitsRule(st.word, st.rule)) {
      f = 'right';
      st.correct += 1;
      st.rts.push(rt);
      if (kind === 'switch') {
        st.switchRight += 1;
        st.switchRts.push(rt);
      } else if (kind === 'repeat') st.repeatRts.push(rt);
      if (!untimed) st.bonus += Math.max(0, ((p.deadlineMs - rt) / p.deadlineMs) * (st.switched ? 10 : 4));
    } else f = 'wrong';
    setFb(f);
    later(() => show(st.i + 1), f === 'right' ? 250 : 700);
  };
  const answerRef = useRef(answer);
  answerRef.current = answer;

  useKeys(phase === 'play' ? { ArrowLeft: () => answer(false), ArrowRight: () => answer(true) } : {});

  return (
    <GameFrame title="Word Flow" level={level} progress={phase === 'play' ? n / p.trials : 0} status={phase === 'play' ? `${n + 1} of ${p.trials}` : undefined} onQuit={onQuit}>
      {phase === 'ready' ? (
        <View style={{ gap: 12, maxWidth: 380 }}>
          <Text style={{ color: t.text, fontSize: 17, textAlign: 'center' }}>Read the question, then decide if the word fits.</Text>
          <Text style={{ color: t.muted, textAlign: 'center' }}>
            The question changes without warning{p.letterRules ? ', and some ask about the first letter instead of the meaning' : ''}. Always check it before you answer.
          </Text>
        </View>
      ) : (
        <>
          <Text accessibilityLiveRegion="polite" style={{ color: ACCENT, fontSize: 24, fontWeight: '800', textAlign: 'center' }}>{rule.question}</Text>
          <View
            accessible
            accessibilityLabel={word ? `${rule.question} ${word}` : 'Waiting'}
            style={{ minWidth: 240, height: 130, paddingHorizontal: 20, borderRadius: 24, borderWidth: 1, borderColor: fb === 'right' ? t.good : fb ? t.help : t.border, backgroundColor: t.surface, alignItems: 'center', justifyContent: 'center' }}
          >
            <Text style={{ color: t.text, fontSize: 40, fontWeight: '700' }}>{word ?? ''}</Text>
          </View>
          <Text style={{ height: 22, fontWeight: '700', color: fb === 'right' ? t.good : t.help }}>
            {fb === 'right' ? 'Correct' : fb === 'wrong' ? (s.current.switched ? 'The question changed' : 'Not quite') : fb === 'late' ? 'Too slow' : ''}
          </Text>
        </>
      )}
      <View style={{ flexDirection: 'row', gap: 14, width: '100%' }}>
        {phase === 'ready' ? (
          <AnswerButton label="Start" onPress={() => { setPhase('play'); later(() => show(0), 500); }} />
        ) : (
          <>
            <AnswerButton label="No" tone="secondary" onPress={() => answer(false)} disabled={phase !== 'play'} />
            <AnswerButton label="Yes" tone="secondary" onPress={() => answer(true)} disabled={phase !== 'play'} />
          </>
        )}
      </View>
      <Text style={{ color: t.muted, fontSize: 12 }}>Keyboard: ← No, → Yes</Text>
    </GameFrame>
  );
}
