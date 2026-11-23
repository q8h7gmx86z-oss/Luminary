import React, { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';

import { useTheme } from '@/lib/theme';

import { costMs, defined, rtStats, switchParams } from '../engine';
import { AnswerButton, GameFrame, GameProps } from '../GameFrame';
import { useAnswerFeedback } from '../feedback';
import { useKeys } from '../useKeys';

type Rule = 'parity' | 'size';
type Trial = { digit: number; rule: Rule; switched: boolean };
type Fb = 'right' | 'wrong' | 'late' | null;

const RULES: Record<Rule, { question: string; left: string; right: string; color: string }> = {
  parity: { question: 'Odd or even?', left: 'Odd', right: 'Even', color: '#1F9D8B' },
  size: { question: 'Less or more than 5?', left: 'Less', right: 'More', color: '#D9822B' },
};
const DIGITS = [1, 2, 3, 4, 6, 7, 8, 9];

/** Truth for a trial: true means the right-hand answer (Even, More) is correct. */
function rightIsCorrect(tr: Trial) {
  return tr.rule === 'parity' ? tr.digit % 2 === 0 : tr.digit > 5;
}

/** Task switching: the colour of the card tells you which question to answer. */
export function SwitchIt({ level, onFinish, onQuit, untimed }: GameProps & { onQuit?: () => void }) {
  const t = useTheme();
  const p = switchParams(level);
  const [phase, setPhase] = useState<'ready' | 'play' | 'done'>('ready');
  const [trial, setTrial] = useState<Trial | null>(null);
  const [n, setN] = useState(0);
  const [fb, setFb] = useState<Fb>(null);
  useAnswerFeedback(fb, ['right']);

  const s = useRef({ n: 0, cur: null as Trial | null, rule: 'parity' as Rule, locked: true, shownAt: 0, correct: 0, rts: [] as number[], switchRts: [] as number[], repeatRts: [] as number[], switchN: 0, switchRight: 0, repeatN: 0, repeatRight: 0, bonus: 0 });
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const deadline = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
      if (deadline.current) clearTimeout(deadline.current);
    },
    [],
  );
  const later = (fn: () => void, ms: number) => timers.current.push(setTimeout(fn, ms));

  const next = (i: number) => {
    const st = s.current;
    if (i >= p.trials) {
      setPhase('done');
      setTrial(null);
      onFinish({
        score: Math.round(st.correct * (10 + level * 2) + st.bonus),
        accuracy: st.correct / p.trials,
        ...rtStats(st.rts),
        metrics: defined({
          switchCost: costMs(st.switchRts, st.repeatRts),
          switchAccuracy: st.switchN ? st.switchRight / st.switchN : undefined,
          repeatAccuracy: st.repeatN ? st.repeatRight / st.repeatN : undefined,
        }),
      });
      return;
    }
    const switched = i > 0 && Math.random() < p.switchRate;
    if (switched) st.rule = st.rule === 'parity' ? 'size' : 'parity';
    let digit = DIGITS[Math.floor(Math.random() * DIGITS.length)];
    if (st.cur) while (digit === st.cur.digit) digit = DIGITS[Math.floor(Math.random() * DIGITS.length)];
    const tr: Trial = { digit, rule: st.rule, switched };
    st.n = i;
    st.cur = tr;
    st.locked = false;
    st.shownAt = Date.now();
    setN(i);
    setTrial(tr);
    setFb(null);
    if (!untimed) deadline.current = setTimeout(() => answerRef.current(null), p.deadlineMs);
  };

  const answer = (right: boolean | null) => {
    const st = s.current;
    if (phase !== 'play' || st.locked || !st.cur) return;
    st.locked = true;
    if (deadline.current) clearTimeout(deadline.current);
    const rt = Date.now() - st.shownAt;
    // The first card has no rule before it, so it counts as neither kind.
    const kind = st.n === 0 ? null : st.cur.switched ? 'switch' : 'repeat';
    if (kind === 'switch') st.switchN += 1;
    if (kind === 'repeat') st.repeatN += 1;
    let f: Fb;
    if (right === null) f = 'late';
    else if (right === rightIsCorrect(st.cur)) {
      f = 'right';
      st.correct += 1;
      st.rts.push(rt);
      if (kind === 'switch') {
        st.switchRight += 1;
        st.switchRts.push(rt);
      } else if (kind === 'repeat') {
        st.repeatRight += 1;
        st.repeatRts.push(rt);
      }
      // Switch trials are the hard ones, so they earn more.
      st.bonus += Math.max(0, ((p.deadlineMs - rt) / p.deadlineMs) * (st.cur.switched ? 10 : 4));
    } else f = 'wrong';
    setFb(f);
    const i = st.n;
    later(() => next(i + 1), f === 'right' ? 220 : 600);
  };
  const answerRef = useRef(answer);
  answerRef.current = answer;

  useKeys(phase === 'play' ? { ArrowLeft: () => answer(false), ArrowRight: () => answer(true) } : {});

  const start = () => {
    setPhase('play');
    later(() => next(0), 600);
  };

  const rule = RULES[trial?.rule ?? s.current.rule];
  const ring = fb === 'right' ? t.good : fb ? t.help : rule.color;

  return (
    <GameFrame title="Switch It" level={level} progress={phase === 'play' ? n / p.trials : 0} status={phase === 'play' ? `${n + 1} of ${p.trials}` : undefined} onQuit={onQuit}>
      {phase === 'ready' ? (
        <View style={{ gap: 12, width: '100%', maxWidth: 380 }}>
          <Text style={{ color: t.muted, fontSize: 16, textAlign: 'center' }}>The colour of the card tells you which question to answer.</Text>
          {(Object.keys(RULES) as Rule[]).map((r) => (
            <View key={r} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 14, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border }}>
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: RULES[r].color }} />
              <Text style={{ color: t.text, fontSize: 16, fontWeight: '700', flex: 1 }}>{RULES[r].question}</Text>
            </View>
          ))}
          <Text style={{ color: t.muted, textAlign: 'center' }}>The rule can change at any moment. Stay alert.</Text>
        </View>
      ) : (
        <>
          <Text style={{ color: rule.color, fontSize: 22, fontWeight: '800', textAlign: 'center' }}>{rule.question}</Text>
          <View
            style={{ width: 180, height: 180, borderRadius: 28, backgroundColor: rule.color, borderWidth: 5, borderColor: ring, alignItems: 'center', justifyContent: 'center' }}
            accessible
            accessibilityLabel={trial ? `${rule.question} The number is ${trial.digit}` : 'Waiting'}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 100, fontWeight: '800', lineHeight: 118 }}>{trial?.digit ?? ''}</Text>
          </View>
          <Text style={{ height: 22, fontWeight: '700', color: fb === 'right' ? t.good : t.help }}>
            {fb === 'right' ? 'Correct' : fb === 'wrong' ? (trial?.switched ? 'The rule changed. Check the colour' : 'Not quite') : fb === 'late' ? 'Too slow' : ''}
          </Text>
        </>
      )}
      <View style={{ flexDirection: 'row', gap: 14, width: '100%' }}>
        {phase === 'ready' ? (
          <AnswerButton label="Start" onPress={start} />
        ) : (
          <>
            <AnswerButton label={rule.left} tone="secondary" onPress={() => answer(false)} disabled={phase !== 'play'} />
            <AnswerButton label={rule.right} tone="secondary" onPress={() => answer(true)} disabled={phase !== 'play'} />
          </>
        )}
      </View>
      <Text style={{ color: t.muted, fontSize: 12 }}>Keyboard: ← left answer, → right answer</Text>
    </GameFrame>
  );
}
