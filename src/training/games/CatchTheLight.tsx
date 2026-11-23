import React, { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { useStore } from '@/lib/store';
import { useTheme } from '@/lib/theme';

import { catchParams, goNoGoAccuracy, mean } from '../engine';
import { AnswerButton, GameFrame, GameProps, useTap } from '../GameFrame';
import { useAnswerFeedback } from '../feedback';
import { useKeys } from '../useKeys';

type Stim = 'go' | 'nogo' | null;
type Fb = 'hit' | 'miss' | 'false' | 'hold' | null;

export function CatchTheLight({ level, onFinish, onQuit, untimed }: GameProps & { onQuit?: () => void }) {
  const t = useTheme();
  const calm = useStore().state.settings.visuals === 'minimal';
  // Untimed mode keeps each light on twice as long. The task still needs a window to respond in.
  const base = catchParams(level);
  const p = untimed ? { ...base, showMs: base.showMs * 2 } : base;
  const [phase, setPhase] = useState<'ready' | 'play' | 'done'>('ready');
  const [stim, setStim] = useState<Stim>(null);
  const [trial, setTrial] = useState(0);
  const [fb, setFb] = useState<Fb>(null);
  useAnswerFeedback(fb, ['hit', 'hold']);

  const s = useRef({ hits: 0, holds: 0, rts: [] as number[], trial: 0, responded: false, shownAt: 0, stim: null as Stim });
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const later = (fn: () => void, ms: number) => timers.current.push(setTimeout(fn, ms));

  const runTrial = (n: number) => {
    if (n >= p.trials) {
      setPhase('done');
      setStim(null);
      const st = s.current;
      onFinish({
        score: Math.round((st.hits + st.holds) * (8 + level * 2) + (mean(st.rts) ? Math.max(0, 600 - mean(st.rts)!) / 10 : 0)),
        accuracy: goNoGoAccuracy(st.hits, st.holds, p.trials),
        rtMs: mean(st.rts),
      });
      return;
    }
    const kind: Stim = Math.random() < p.noGoRate ? 'nogo' : 'go';
    const st = s.current;
    st.trial = n;
    st.responded = false;
    st.stim = kind;
    st.shownAt = Date.now();
    setTrial(n);
    setFb(null);
    setStim(kind);
    later(() => {
      // Light goes out: score whatever happened.
      if (!st.responded) {
        if (kind === 'nogo') {
          st.holds += 1;
          setFb('hold');
        } else setFb('miss');
      }
      setStim(null);
      later(() => runTrial(n + 1), p.gapMs + Math.random() * 300);
    }, p.showMs);
  };

  const press = () => {
    const st = s.current;
    if (phase !== 'play' || st.responded || !st.stim) return;
    st.responded = true;
    if (st.stim === 'go') {
      st.hits += 1;
      st.rts.push(Date.now() - st.shownAt);
      setFb('hit');
    } else {
      setFb('false');
    }
  };

  useKeys(phase === 'play' ? { ' ': press, Enter: press } : {});
  const pressTap = useTap(press);

  const start = () => {
    setPhase('play');
    later(() => runTrial(0), 700);
  };

  // At higher levels the "stop" light is a closer match to the "go" light.
  const goColor = '#3D7BFF';
  const noGoColor = p.lookalike ? '#8A4DE0' : '#E5484D';
  const color = stim === 'go' ? goColor : stim === 'nogo' ? noGoColor : t.soft;

  const FB_TEXT: Record<Exclude<Fb, null>, string> = { hit: 'Nice catch', miss: 'Missed', false: 'Hold back on that one', hold: 'Well held' };
  const fbText = fb ? FB_TEXT[fb] : '';
  const fbColor = fb === 'hit' || fb === 'hold' ? t.good : t.help;

  return (
    <GameFrame title="Catch the Light" level={level} progress={trial / p.trials} status={phase === 'play' ? `${trial + 1} of ${p.trials}` : undefined} onQuit={onQuit}>
      {phase === 'ready' ? (
        <View style={{ alignItems: 'center', gap: 14 }}>
          <View style={{ flexDirection: 'row', gap: 28 }}>
            <View style={{ alignItems: 'center', gap: 6 }}>
              <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: goColor }} />
              <Text style={{ color: t.text, fontWeight: '700' }}>Tap</Text>
            </View>
            <View style={{ alignItems: 'center', gap: 6 }}>
              <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: noGoColor }} />
              <Text style={{ color: t.text, fontWeight: '700' }}>Don't tap</Text>
            </View>
          </View>
          <Text style={{ color: t.muted, textAlign: 'center' }}>Tap anywhere on the big circle, or press the space bar.</Text>
        </View>
      ) : (
        <Text style={{ height: 24, fontSize: 17, fontWeight: '700', color: fbColor }}>{fbText}</Text>
      )}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={stim === 'go' ? 'Blue light, tap now' : stim === 'nogo' ? 'Stop light, do not tap' : 'Waiting for a light'}
        {...pressTap}
        disabled={phase !== 'play'}
        style={{
          width: 240,
          height: 240,
          borderRadius: 120,
          backgroundColor: color,
          borderWidth: 6,
          borderColor: stim ? color : t.border,
          shadowColor: color,
          shadowOpacity: stim && !calm ? 0.7 : 0,
          shadowRadius: 30,
        }}
      />
      {phase === 'ready' ? (
        <View style={{ flexDirection: 'row', width: '100%' }}>
          <AnswerButton label="Start" onPress={start} />
        </View>
      ) : (
        <View style={{ height: 72 }} />
      )}
    </GameFrame>
  );
}
