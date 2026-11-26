import React, { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';

import { useTheme } from '@/lib/theme';

import { defined, rtStats } from '../engine';
import { AnswerButton, GameFrame, GameProps } from '../GameFrame';
import { useAnswerFeedback } from '../feedback';
import { holdParams, nextSsd, ssrt } from '../newgames';
import { useKeys } from '../useKeys';

type Dir = 'left' | 'right';
type Fb = 'right' | 'wrong' | 'late' | 'held' | 'slip' | null;

const GO = '#5DA8FF';
const STOP = '#E2607A';

/**
 * Stop-signal task. Follow the arrow, but cancel the tap if it turns red. The delay before red adapts
 * (50 ms steps) so stopping succeeds about half the time, which is what lets us estimate stopping time.
 */
export function HoldIt({ level, onFinish, onQuit, untimed }: GameProps & { onQuit?: () => void }) {
  const t = useTheme();
  const p = holdParams(level);
  const deadline = untimed ? 2000 : p.deadlineMs;
  const [phase, setPhase] = useState<'ready' | 'play' | 'done'>('ready');
  const [n, setN] = useState(0);
  const [dir, setDir] = useState<Dir | null>(null);
  const [red, setRed] = useState(false);
  const [fb, setFb] = useState<Fb>(null);
  useAnswerFeedback(fb === 'right' || fb === 'held' ? 'right' : fb === 'wrong' || fb === 'slip' ? 'wrong' : null, ['right']);

  const s = useRef({
    i: 0,
    dir: 'left' as Dir,
    stop: false,
    open: false,
    shownAt: 0,
    ssd: p.startSsdMs,
    goN: 0,
    goRight: 0,
    stopN: 0,
    held: 0,
    rts: [] as number[],
    ssds: [] as number[],
  });
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const clear = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  useEffect(() => clear, []);
  const later = (fn: () => void, ms: number) => timers.current.push(setTimeout(fn, ms));

  const finish = () => {
    const st = s.current;
    setPhase('done');
    const goAccuracy = st.goN ? st.goRight / st.goN : 0;
    const stopRate = st.stopN ? st.held / st.stopN : 0;
    onFinish({
      score: Math.round(st.goRight * (8 + level) + st.held * (14 + level * 2)),
      // Stopping is held near 50% by design, so it counts as full marks from 40%. Go accuracy carries the rest.
      accuracy: 0.75 * goAccuracy + 0.25 * Math.min(1, stopRate / 0.4),
      ...rtStats(st.rts),
      metrics: defined({ ssrt: ssrt(st.rts, st.ssds), stopRate: st.stopN ? stopRate : undefined, goAccuracy }),
    });
  };

  const close = (f: Fb) => {
    const st = s.current;
    st.open = false;
    clear();
    setFb(f);
    const i = st.i;
    later(() => (i + 1 >= p.trials ? finish() : trialAt(i + 1)), 650);
  };

  const trialAt = (i: number) => {
    const st = s.current;
    st.i = i;
    // No stop trial first, and never two in a row, so the go habit stays strong.
    st.stop = i > 1 && !st.stop && Math.random() < p.stopRate / (1 - p.stopRate);
    st.dir = Math.random() < 0.5 ? 'left' : 'right';
    setN(i);
    setFb(null);
    setDir(null);
    setRed(false);
    later(() => {
      st.open = true;
      st.shownAt = Date.now();
      setDir(st.dir);
      if (st.stop) {
        const ssd = st.ssd;
        later(() => setRed(true), ssd);
      }
      later(() => {
        if (!st.open) return;
        if (st.stop) {
          st.stopN += 1;
          st.held += 1;
          st.ssds.push(st.ssd);
          st.ssd = nextSsd(st.ssd, true, deadline - 100);
          close('held');
        } else {
          st.goN += 1;
          close('late');
        }
      }, deadline);
    }, 450 + Math.random() * 300);
  };

  const press = (d: Dir) => {
    const st = s.current;
    if (phase !== 'play' || !st.open) return;
    const rt = Date.now() - st.shownAt;
    if (st.stop) {
      st.stopN += 1;
      st.ssds.push(st.ssd);
      st.ssd = nextSsd(st.ssd, false, deadline - 100);
      close('slip');
      return;
    }
    st.goN += 1;
    if (d === st.dir) {
      st.goRight += 1;
      st.rts.push(rt);
      close('right');
    } else close('wrong');
  };

  useKeys(phase === 'play' ? { ArrowLeft: () => press('left'), ArrowRight: () => press('right') } : {});

  const start = () => {
    setPhase('play');
    later(() => trialAt(0), 500);
  };

  const colour = red ? STOP : GO;
  return (
    <GameFrame title="Hold It" level={level} progress={phase === 'play' ? n / p.trials : 0} status={phase === 'play' ? `${n + 1} of ${p.trials}` : undefined} onQuit={onQuit}>
      {phase === 'ready' ? (
        <View style={{ gap: 12, maxWidth: 380 }}>
          <Text style={{ color: t.text, fontSize: 17, textAlign: 'center' }}>Tap the side the blue arrow points to, as fast as you can.</Text>
          <Text style={{ color: STOP, fontSize: 17, fontWeight: '700', textAlign: 'center' }}>If it turns red, stop. Tap nothing.</Text>
          <Text style={{ color: t.muted, textAlign: 'center' }}>Do not wait for red. The task adapts so that you stop about half the time. This is by design.</Text>
        </View>
      ) : (
        <>
          <View
            accessible
            accessibilityLiveRegion="assertive"
            accessibilityLabel={dir ? `${red ? 'Red, stop.' : 'Go'} ${dir}` : 'Get ready'}
            style={{ width: 200, height: 200, borderRadius: 100, borderWidth: 2, borderColor: dir ? colour : t.border, backgroundColor: dir ? `${colour}1F` : t.surface, alignItems: 'center', justifyContent: 'center' }}
          >
            <Text style={{ color: dir ? colour : t.muted, fontSize: dir ? 120 : 40, fontWeight: '800', lineHeight: dir ? 140 : 48 }}>{dir === 'left' ? '←' : dir === 'right' ? '→' : '+'}</Text>
          </View>
          <Text style={{ height: 22, fontWeight: '700', color: fb === 'right' || fb === 'held' ? t.good : t.help }}>
            {fb === 'right' ? 'Correct' : fb === 'held' ? 'Stop held' : fb === 'slip' ? 'Stop signal missed' : fb === 'wrong' ? 'Incorrect direction' : fb === 'late' ? 'Time elapsed' : ''}
          </Text>
        </>
      )}
      <View style={{ flexDirection: 'row', gap: 14, width: '100%' }}>
        {phase === 'ready' ? (
          <AnswerButton label="Start" onPress={start} />
        ) : (
          <>
            <AnswerButton label="← Left" tone="secondary" onPress={() => press('left')} disabled={phase !== 'play'} />
            <AnswerButton label="Right →" tone="secondary" onPress={() => press('right')} disabled={phase !== 'play'} />
          </>
        )}
      </View>
      <Text style={{ color: t.muted, fontSize: 12 }}>Keyboard: ← and →</Text>
    </GameFrame>
  );
}
