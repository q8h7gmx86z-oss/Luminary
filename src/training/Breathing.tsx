import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Text, View } from 'react-native';

import { useStore } from '@/lib/store';
import { useTheme } from '@/lib/theme';

import { ResearchLink } from '@/components/Research';

import { useCue } from './feedback';
import { AnswerButton, GameFrame } from './GameFrame';

const IN_MS = 5000;
const OUT_MS = 5000;
const CYCLES = 6; // one minute at six breaths a minute

/** Paced breathing at about six breaths a minute, the rate used in HRV biofeedback studies. */
export function Breathing({ onFinish, onQuit }: { onFinish: () => void; onQuit?: () => void }) {
  const t = useTheme();
  const cue = useCue();
  const scale = useRef(new Animated.Value(0.55)).current;
  const [phase, setPhase] = useState<'ready' | 'in' | 'out' | 'done'>('ready');
  const [cycle, setCycle] = useState(0);
  const [systemReduce, setReduceMotion] = useState(false);
  const reduceMotion = systemReduce || useStore().state.settings.visuals === 'minimal';
  const alive = useRef(true);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled?.()
      .then(setReduceMotion)
      .catch(() => {});
    return () => {
      alive.current = false;
      scale.stopAnimation();
    };
  }, [scale]);

  const run = (n: number) => {
    if (!alive.current) return;
    if (n >= CYCLES) {
      setPhase('done');
      onFinish();
      return;
    }
    setCycle(n);
    setPhase('in');
    cue('breathe-in');
    Animated.timing(scale, {
      toValue: 1,
      duration: IN_MS,
      easing: Easing.inOut(Easing.sin),
      useNativeDriver: false,
    }).start(() => {
      if (!alive.current) return;
      setPhase('out');
      cue('breathe-out');
      Animated.timing(scale, {
        toValue: 0.55,
        duration: OUT_MS,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: false,
      }).start(() => run(n + 1));
    });
  };

  const label = phase === 'in' ? 'Breathe in' : phase === 'out' ? 'Breathe out' : phase === 'ready' ? 'Settle in' : 'Ready';

  return (
    <GameFrame title="Settle" progress={(cycle + (phase === 'out' ? 0.5 : 0)) / CYCLES} status="Calm breathing" onQuit={onQuit}>
      <Text
        style={{
          color: t.muted,
          textAlign: 'center',
          fontSize: 16,
          maxWidth: 360,
        }}
      >
        {phase === 'ready'
          ? 'One minute at six breaths a minute. Slow breathing steadies your heart rate, so you start training focused.'
          : `Breath ${cycle + 1} of ${CYCLES}`}
      </Text>
      {phase === 'ready' ? <ResearchLink id="breathing" label="Why slow breathing" /> : null}
      <View
        style={{
          width: 260,
          height: 260,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Animated.View
          style={{
            position: 'absolute',
            width: 260,
            height: 260,
            borderRadius: 130,
            backgroundColor: t.soft,
            transform: [{ scale: reduceMotion ? 1 : scale }],
            opacity: reduceMotion ? (phase === 'in' ? 1 : 0.6) : 1,
          }}
        />
        <Animated.View
          style={{
            width: 150,
            height: 150,
            borderRadius: 75,
            backgroundColor: t.primary,
            opacity: 0.9,
            transform: [{ scale: reduceMotion ? 1 : scale }],
          }}
        />
        <Text
          accessibilityLiveRegion="polite"
          style={{
            position: 'absolute',
            color: '#FFFFFF',
            fontSize: 20,
            fontWeight: '700',
          }}
        >
          {label}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', width: '100%', gap: 12 }}>
        {phase === 'ready' ? <AnswerButton label="Begin" onPress={() => run(0)} /> : null}
        <AnswerButton
          label="Skip"
          tone="secondary"
          onPress={() => {
            alive.current = false;
            scale.stopAnimation();
            onFinish();
          }}
        />
      </View>
    </GameFrame>
  );
}
