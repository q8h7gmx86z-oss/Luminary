import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';

import { useTheme } from '@/lib/theme';

import { rtStats, speedParams } from '../engine';
import { AnswerButton, GameFrame, GameProps } from '../GameFrame';
import { useAnswerFeedback } from '../feedback';
import { useKeys } from '../useKeys';

const SYMBOLS = [
  { glyph: '●', color: '#4B5FD6' },
  { glyph: '▲', color: '#D9822B' },
  { glyph: '■', color: '#1F9D8B' },
  { glyph: '★', color: '#C9A227' },
  { glyph: '◆', color: '#7A5AE0' },
  { glyph: '✚', color: '#D64B6A' },
  { glyph: '▲', color: '#4B5FD6' },
  { glyph: '●', color: '#1F9D8B' },
  { glyph: '◆', color: '#D9822B' },
  { glyph: '■', color: '#7A5AE0' },
];

/** Untimed mode ends after a set number of answers instead of after 45 seconds. */
const UNTIMED_TRIALS = 30;

type Feedback = 'right' | 'wrong' | 'late' | null;

export function SpeedMatch({ level, onFinish, onQuit, untimed }: GameProps & { onQuit?: () => void }) {
  const t = useTheme();
  const p = speedParams(level);
  const pool = SYMBOLS.slice(0, p.symbolCount);

  const [prev, setPrev] = useState<number | null>(null);
  const [current, setCurrent] = useState(() => Math.floor(Math.random() * pool.length));
  const [phase, setPhase] = useState<'memorise' | 'play' | 'done'>('memorise');
  const [feedback, setFeedback] = useState<Feedback>(null);
  useAnswerFeedback(feedback, ['right']);
  const [elapsed, setElapsed] = useState(0);

  const stats = useRef({ correct: 0, answered: 0, rts: [] as number[], bonus: 0 });
  const shownAt = useRef(0);
  const startAt = useRef(0);
  const deadline = useRef<ReturnType<typeof setTimeout> | null>(null);
  const locked = useRef(false);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  const finish = useCallback(() => {
    phaseRef.current = 'done';
    setPhase('done');
    const s = stats.current;
    const accuracy = s.answered ? s.correct / s.answered : 0;
    onFinish({
      score: Math.round(s.correct * (10 + level * 2) + s.bonus),
      accuracy,
      ...rtStats(s.rts),
      metrics: { answered: s.answered },
    });
  }, [level, onFinish]);

  const nextTrial = useCallback(
    (from: number) => {
      if (untimed ? stats.current.answered >= UNTIMED_TRIALS : Date.now() - startAt.current >= p.durationMs) {
        finish();
        return;
      }
      // About half the trials repeat the previous symbol.
      const same = Math.random() < 0.5;
      let n = from;
      if (!same) {
        while (n === from) n = Math.floor(Math.random() * pool.length);
      }
      setPrev(from);
      setCurrent(n);
      setFeedback(null);
      locked.current = false;
      shownAt.current = Date.now();
      if (deadline.current) clearTimeout(deadline.current);
      if (!untimed) deadline.current = setTimeout(() => respondRef.current(null), p.deadlineMs);
    },
    [finish, p.deadlineMs, p.durationMs, pool.length, untimed],
  );

  const currentRef = useRef(current);
  const prevRef = useRef(prev);
  currentRef.current = current;
  prevRef.current = prev;

  const respond = useCallback(
    (answerSame: boolean | null) => {
      if (locked.current || phaseRef.current !== 'play') return;
      locked.current = true;
      if (deadline.current) clearTimeout(deadline.current);
      const s = stats.current;
      s.answered += 1;
      const rt = Date.now() - shownAt.current;
      const truth = currentRef.current === prevRef.current;
      let fb: Feedback;
      if (answerSame === null) fb = 'late';
      else if (answerSame === truth) {
        fb = 'right';
        s.correct += 1;
        s.rts.push(rt);
        s.bonus += Math.max(0, ((p.deadlineMs - rt) / p.deadlineMs) * 6);
      } else fb = 'wrong';
      setFeedback(fb);
      const from = currentRef.current;
      setTimeout(() => nextTrial(from), fb === 'right' ? 180 : 420);
    },
    [nextTrial, p.deadlineMs],
  );
  const respondRef = useRef(respond);
  respondRef.current = respond;

  useEffect(() => {
    if (phase !== 'play') return;
    const id = setInterval(() => setElapsed(Date.now() - startAt.current), 200);
    return () => clearInterval(id);
  }, [phase]);

  useEffect(() => () => {
    if (deadline.current) clearTimeout(deadline.current);
  }, []);

  useKeys(
    phase === 'play'
      ? { ArrowLeft: () => respond(false), ArrowRight: () => respond(true), d: () => respond(false), s: () => respond(true) }
      : {},
  );

  const start = () => {
    startAt.current = Date.now();
    phaseRef.current = 'play';
    setPhase('play');
    nextTrial(current);
  };

  const sym = pool[current];
  const ring = feedback === 'right' ? t.good : feedback === 'wrong' || feedback === 'late' ? t.help : t.border;

  return (
    <GameFrame
      title="Speed Match"
      level={level}
      progress={phase === 'play' ? (untimed ? stats.current.answered / UNTIMED_TRIALS : elapsed / p.durationMs) : 0}
      status={phase === 'play' ? `${stats.current.correct} correct` : undefined}
      onQuit={onQuit}
    >
      <Text style={{ color: t.muted, fontSize: 16, textAlign: 'center' }}>
        {phase === 'memorise' ? 'Remember this symbol.' : 'Same as the one before?'}
      </Text>
      <View
        style={{
          width: 200,
          height: 200,
          borderRadius: 28,
          borderWidth: 4,
          borderColor: ring,
          backgroundColor: t.surface,
          alignItems: 'center',
          justifyContent: 'center',
        }}
        accessible
        accessibilityLabel={`Symbol ${sym.glyph}`}
      >
        <Text style={{ fontSize: 110, color: sym.color, lineHeight: 130 }}>{sym.glyph}</Text>
      </View>
      <Text style={{ height: 22, fontWeight: '700', color: feedback === 'right' ? t.good : t.help }}>
        {feedback === 'right' ? 'Correct' : feedback === 'wrong' ? 'Not quite' : feedback === 'late' ? 'Too slow' : ''}
      </Text>
      {phase === 'memorise' ? (
        <View style={{ flexDirection: 'row', width: '100%' }}>
          <AnswerButton label="Got it, start" onPress={start} />
        </View>
      ) : (
        <View style={{ flexDirection: 'row', gap: 14, width: '100%' }}>
          <AnswerButton label="Different" tone="secondary" onPress={() => respond(false)} disabled={phase !== 'play'} />
          <AnswerButton label="Same" onPress={() => respond(true)} disabled={phase !== 'play'} />
        </View>
      )}
      <Text style={{ color: t.muted, fontSize: 12 }}>Keyboard: ← different, → same</Text>
    </GameFrame>
  );
}
