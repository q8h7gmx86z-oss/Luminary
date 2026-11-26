import React, { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { useTheme } from '@/lib/theme';
import { tapIn } from '@/training/BenchmarkTests';
import { useKeys } from '@/training/useKeys';

import { CHECK_SECONDS, LAPSE_MS, pvtSummary } from './lab';

/** Longest wait for a response before the trial counts as a long lapse and moves on. */
const TIMEOUT_MS = 10_000;

export type CheckResult = NonNullable<ReturnType<typeof pvtSummary>>;

/**
 * A two-minute psychomotor vigilance test. A counter starts at random moments, two to five seconds apart.
 * Stop it as fast as you can. A tap before it starts is a false start.
 */
export function AlertnessCheck({ onDone }: { onDone: (r: CheckResult | undefined) => void }) {
  const t = useTheme();
  const [running, setRunning] = useState(false);
  const [lit, setLit] = useState(false);
  const [shown, setShown] = useState<number | null>(null);
  const [left, setLeft] = useState(CHECK_SECONDS);
  const [note, setNote] = useState('');
  const s = useRef({ rts: [] as number[], shownAt: 0, lit: false, endAt: 0, finished: false, running: false });
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const ticker = useRef<ReturnType<typeof setInterval> | null>(null);
  const [count, setCount] = useState(0);

  const clear = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  useEffect(
    () => () => {
      clear();
      if (ticker.current) clearInterval(ticker.current);
    },
    [],
  );

  const finish = () => {
    const st = s.current;
    if (st.finished) return;
    st.finished = true;
    st.running = false;
    clear();
    if (ticker.current) clearInterval(ticker.current);
    setRunning(false);
    onDone(pvtSummary(st.rts));
  };

  const schedule = () => {
    const st = s.current;
    if (Date.now() >= st.endAt) return finish();
    timers.current.push(
      setTimeout(() => {
        st.lit = true;
        st.shownAt = Date.now();
        setLit(true);
        setShown(null);
        setNote('');
        timers.current.push(setTimeout(() => respondRef.current(), TIMEOUT_MS));
      }, 2000 + Math.random() * 3000),
    );
  };

  const respond = () => {
    const st = s.current;
    if (st.finished || !st.running) return;
    if (!st.lit) {
      // A false start. It is recorded (as zero) so it can be counted, and the wait begins again.
      st.rts.push(0);
      setNote('Too early. Wait for the counter.');
      clear();
      schedule();
      return;
    }
    const rt = Date.now() - st.shownAt;
    st.lit = false;
    st.rts.push(rt);
    clear();
    setLit(false);
    setShown(rt);
    setNote(rt >= LAPSE_MS ? 'Slow response.' : '');
    schedule();
  };
  const respondRef = useRef(respond);
  respondRef.current = respond;

  // While lit, the counter runs, as in the laboratory test.
  useEffect(() => {
    if (!lit) return;
    const id = setInterval(() => setCount(Date.now() - s.current.shownAt), 31);
    return () => clearInterval(id);
  }, [lit]);

  const start = () => {
    const st = s.current;
    st.endAt = Date.now() + CHECK_SECONDS * 1000;
    st.running = true;
    setRunning(true);
    ticker.current = setInterval(() => setLeft(Math.max(0, Math.ceil((st.endAt - Date.now()) / 1000))), 250);
    schedule();
  };

  useKeys(running ? { ' ': () => respondRef.current() } : {});

  return (
    <View style={{ alignItems: 'center', gap: 16, width: '100%' }}>
      <Text style={{ color: t.muted, fontSize: 15, textAlign: 'center', maxWidth: 380, lineHeight: 21 }}>
        {running ? `${left} s remaining` : 'For two minutes, a counter will start at random moments. Stop it the instant it starts by tapping the panel.'}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={running ? (lit ? 'Counter running, tap now' : 'Waiting') : 'Alertness check panel'}
        disabled={!running}
        {...tapIn(() => respondRef.current())}
        style={{ width: '100%', maxWidth: 380, height: 220, borderRadius: 24, borderWidth: 1, borderColor: lit ? t.gold : t.border, backgroundColor: t.surface, alignItems: 'center', justifyContent: 'center' }}
      >
        <Text style={{ color: lit ? t.gold : t.muted, fontSize: 56, fontWeight: '800', fontVariant: ['tabular-nums'] }}>{lit ? count : shown !== null ? shown : ''}</Text>
        {!lit && shown !== null ? <Text style={{ color: t.muted, fontSize: 13 }}>milliseconds</Text> : null}
      </Pressable>
      <Text style={{ color: t.help, height: 20 }}>{note}</Text>
      {!running ? (
        <Pressable accessibilityRole="button" onPress={start} style={({ pressed }) => ({ backgroundColor: t.primary, borderRadius: 999, paddingHorizontal: 28, paddingVertical: 14, opacity: pressed ? 0.9 : 1 })}>
          <Text style={{ color: t.primaryText, fontWeight: '700', fontSize: 16 }}>Begin two minutes</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
