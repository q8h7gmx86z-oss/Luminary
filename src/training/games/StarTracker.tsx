import React, { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';

import { useTheme } from '@/lib/theme';

import { balancedAccuracy, mean, nbackParams, nbackSequence } from '../engine';
import { AnswerButton, GameFrame, GameProps } from '../GameFrame';
import { useAnswerFeedback } from '../feedback';
import { useKeys } from '../useKeys';

// Eight positions around a 3x3 board; the centre cell stays empty as a resting point for the eyes.
const CELLS = [0, 1, 2, 3, 5, 6, 7, 8];
type Fb = 'hit' | 'false' | 'miss' | null;

const STAR = '#C9A227';

/** Spatial n-back: tap Match when the star is where it was n steps ago. */
export function StarTracker({ level, onFinish, onQuit }: GameProps & { onQuit?: () => void }) {
  const t = useTheme();
  const p = nbackParams(level);
  const [phase, setPhase] = useState<'ready' | 'play' | 'done'>('ready');
  const [pos, setPos] = useState<number | null>(null);
  const [idx, setIdx] = useState(0);
  const [fb, setFb] = useState<Fb>(null);
  useAnswerFeedback(fb, ['hit']);

  const s = useRef({ seq: [] as number[], i: -1, responded: false, shownAt: 0, hits: 0, fa: 0, cr: 0, targets: 0, rts: [] as number[] });
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const later = (fn: () => void, ms: number) => timers.current.push(setTimeout(fn, ms));

  const isTarget = (i: number) => i >= p.n && s.current.seq[i] === s.current.seq[i - p.n];

  const step = (i: number) => {
    const st = s.current;
    // Score the trial that just ended.
    let missed = false;
    const prev = i - 1;
    if (prev >= p.n && !st.responded) {
      if (isTarget(prev)) missed = true;
      else st.cr += 1;
    }
    if (i >= st.seq.length) {
      setPhase('done');
      setPos(null);
      const nonTargets = st.seq.length - p.n - st.targets;
      onFinish({
        score: Math.max(0, Math.round((st.hits * 3 + st.cr - st.fa) * (4 + level))),
        accuracy: balancedAccuracy(st.hits, st.targets, st.cr, nonTargets),
        rtMs: mean(st.rts),
      });
      return;
    }
    st.i = i;
    st.responded = false;
    st.shownAt = Date.now();
    if (isTarget(i)) st.targets += 1;
    setIdx(i);
    setPos(st.seq[i]);
    setFb(missed ? 'miss' : null);
    later(() => setPos(null), p.showMs);
    later(() => step(i + 1), p.isiMs);
  };

  const start = () => {
    s.current.seq = nbackSequence(p.trials + p.n, p.n, CELLS.length, p.targetRate);
    setPhase('play');
    later(() => step(0), 600);
  };

  const press = () => {
    const st = s.current;
    if (phase !== 'play' || st.responded || st.i < p.n) return;
    st.responded = true;
    if (isTarget(st.i)) {
      st.hits += 1;
      st.rts.push(Date.now() - st.shownAt);
      setFb('hit');
    } else {
      st.fa += 1;
      setFb('false');
    }
  };
  useKeys(phase === 'play' ? { ' ': press, Enter: press, m: press } : {});

  const back = p.n === 1 ? 'the last one' : `${p.n} stars ago`;
  const warming = phase === 'play' && idx < p.n;
  const message =
    phase === 'ready'
      ? `Tap Match when the star lands where it was ${back}.`
      : warming
        ? `Just remember where it lands (${idx + 1} of ${p.n}).`
        : fb === 'hit'
          ? 'Match spotted'
          : fb === 'false'
            ? 'Not a match'
            : fb === 'miss'
              ? 'That was a match'
              : `Same place as ${back}?`;
  const msgColor = fb === 'hit' ? t.good : fb ? t.help : t.muted;

  const gap = 10;
  const board = 300;
  const tile = (board - gap * 2) / 3;
  const total = p.trials + p.n;

  return (
    <GameFrame
      title="Star Tracker"
      level={level}
      progress={phase === 'play' ? (idx + 1) / total : 0}
      status={`${p.n}-back`}
      onQuit={onQuit}
    >
      <Text style={{ color: msgColor, fontSize: 17, fontWeight: '600', textAlign: 'center', minHeight: 48 }}>{message}</Text>
      <View style={{ width: board, height: board, flexDirection: 'row', flexWrap: 'wrap', gap }} accessible accessibilityLabel={pos === null ? 'Board, empty' : `Star in position ${CELLS[pos] + 1}`}>
        {Array.from({ length: 9 }, (_, c) => {
          const on = pos !== null && CELLS[pos] === c;
          const centre = c === 4;
          return (
            <View
              key={c}
              style={{
                width: tile,
                height: tile,
                borderRadius: 18,
                backgroundColor: centre ? 'transparent' : t.surface,
                borderWidth: centre ? 0 : 2,
                borderColor: on ? STAR : t.border,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {on ? <Text style={{ fontSize: 56, color: STAR, lineHeight: 66 }}>★</Text> : centre ? <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: t.border }} /> : null}
            </View>
          );
        })}
      </View>
      <View style={{ flexDirection: 'row', width: '100%' }}>
        {phase === 'ready' ? <AnswerButton label="Start" onPress={start} /> : <AnswerButton label="Match" onPress={press} disabled={phase !== 'play' || warming} />}
      </View>
      <Text style={{ color: t.muted, fontSize: 12 }}>Keyboard: space for Match</Text>
    </GameFrame>
  );
}
