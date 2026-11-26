import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { useStore } from '@/lib/store';
import { useTheme } from '@/lib/theme';

import { gridParams } from '../engine';
import { echoAnswer, echoParams } from '../newgames';
import { AnswerButton, GameFrame, GameProps } from '../GameFrame';
import { useAnswerFeedback } from '../feedback';

type Phase = 'ready' | 'show' | 'input' | 'right' | 'wrong' | 'done';

function makeSequence(span: number, cells: number): number[] {
  const seq: number[] = [];
  while (seq.length < span) {
    const n = Math.floor(Math.random() * cells);
    if (n !== seq[seq.length - 1]) seq.push(n);
  }
  return seq;
}

/** Memory Grid repeats the pattern forwards. Echo (backwards = true) plays it back in reverse. */
export function MemoryGrid({ level, onFinish, onQuit, backwards = false }: GameProps & { onQuit?: () => void; backwards?: boolean }) {
  const t = useTheme();
  const calm = useStore().state.settings.visuals === 'minimal';
  const p = backwards ? echoParams(level) : gridParams(level);
  const cells = p.size * p.size;

  const [trial, setTrial] = useState(0);
  const [phase, setPhase] = useState<Phase>('ready');
  useAnswerFeedback(phase === 'right' || phase === 'wrong' ? phase : null, ['right']);
  const [seq, setSeq] = useState<number[]>([]);
  const [lit, setLit] = useState<number | null>(null);
  const [taps, setTaps] = useState<number[]>([]);
  const stats = useRef({ correctTrials: 0, correctTiles: 0 });
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const lastIn = useRef(0);

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  useEffect(() => clearTimers, []);

  const play = useCallback(
    (n: number) => {
      const s = makeSequence(p.span, cells);
      setSeq(backwards ? echoAnswer(s) : s);
      setTaps([]);
      setTrial(n);
      setPhase('show');
      clearTimers();
      const step = p.flashMs + 180;
      s.forEach((cell, i) => {
        timers.current.push(setTimeout(() => setLit(cell), 500 + i * step));
        timers.current.push(setTimeout(() => setLit(null), 500 + i * step + p.flashMs));
      });
      timers.current.push(setTimeout(() => setPhase('input'), 500 + s.length * step));
    },
    [cells, p.flashMs, p.span],
  );

  const endTrial = (ok: boolean) => {
    setPhase(ok ? 'right' : 'wrong');
    if (ok) stats.current.correctTrials += 1;
    timers.current.push(
      setTimeout(() => {
        if (trial + 1 >= p.trials) {
          setPhase('done');
          const s = stats.current;
          onFinish({ score: s.correctTiles * (6 + level), accuracy: s.correctTrials / p.trials, metrics: { span: p.span, perfect: s.correctTrials, trials: p.trials } });
        } else {
          play(trial + 1);
        }
      }, 900),
    );
  };

  const tap = (cell: number) => {
    if (phase !== 'input') return;
    const i = taps.length;
    const next = [...taps, cell];
    setTaps(next);
    setLit(cell);
    timers.current.push(setTimeout(() => setLit((c) => (c === cell ? null : c)), 160));
    if (seq[i] !== cell) {
      endTrial(false);
      return;
    }
    stats.current.correctTiles += 1;
    if (next.length === seq.length) endTrial(true);
  };

  const message =
    phase === 'ready'
      ? backwards
        ? `Watch ${p.span} tiles light up, then tap them in reverse: last one first.`
        : `Watch ${p.span} tiles light up, then repeat them in order.`
      : phase === 'show'
        ? 'Watch carefully...'
        : phase === 'input'
          ? `${backwards ? 'Reverse it' : 'Your turn'}: ${taps.length} of ${seq.length}`
          : phase === 'right'
            ? 'Perfect!'
            : phase === 'wrong'
              ? 'Not quite. Next one.'
              : '';

  const gap = 10;
  const boardSize = 320;
  const tile = (boardSize - gap * (p.size - 1)) / p.size;

  return (
    <GameFrame
      title={backwards ? 'Echo' : 'Memory Grid'}
      level={level}
      progress={(trial + (phase === 'right' || phase === 'wrong' ? 1 : 0)) / p.trials}
      status={`Round ${Math.min(trial + 1, p.trials)} of ${p.trials}`}
      onQuit={onQuit}
    >
      <Text style={{ color: phase === 'wrong' ? t.help : phase === 'right' ? t.good : t.muted, fontSize: 17, fontWeight: '600', textAlign: 'center' }}>
        {message}
      </Text>
      <View style={{ width: boardSize, height: boardSize, flexDirection: 'row', flexWrap: 'wrap', gap }}>
        {Array.from({ length: cells }, (_, c) => {
          const on = lit === c;
          return (
            <Pressable
              key={c}
              accessibilityRole="button"
              accessibilityLabel={`Tile ${c + 1}`}
              onPressIn={() => {
                lastIn.current = Date.now();
                tap(c);
              }}
              onPress={() => {
                if (Date.now() - lastIn.current > 1000) tap(c);
              }}
              disabled={phase !== 'input'}
              style={{
                width: tile,
                height: tile,
                borderRadius: 16,
                backgroundColor: on ? t.primary : t.surface,
                borderWidth: 2,
                borderColor: on ? t.primary : t.border,
                shadowColor: t.primary,
                shadowOpacity: on && !calm ? 0.6 : 0,
                shadowRadius: on ? 16 : 0,
              }}
            />
          );
        })}
      </View>
      {phase === 'ready' ? (
        <View style={{ flexDirection: 'row', width: '100%' }}>
          <AnswerButton label="Start" onPress={() => play(0)} />
        </View>
      ) : (
        <View style={{ height: 72 }} />
      )}
    </GameFrame>
  );
}
