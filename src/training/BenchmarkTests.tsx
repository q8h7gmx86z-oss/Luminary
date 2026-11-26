import React, { useEffect, useRef, useState } from 'react';
import { Pressable, Text, useWindowDimensions, View } from 'react-native';

import { useTheme } from '@/lib/theme';

import { codingKey, codingMeasure, digitList, longestSpan, Measure, MeasureId, nextSpanLength, rtMeasure, trailPositions, trailsLabels, trailsMeasure } from './benchmark';
import { AnswerButton } from './GameFrame';
import { useKeys } from './useKeys';

type Done = (m: Partial<Record<MeasureId, Measure>>) => void;
type Timer = ReturnType<typeof setTimeout>;

function useTimers() {
  const ts = useRef<Timer[]>([]);
  useEffect(() => () => ts.current.forEach(clearTimeout), []);
  return {
    later: (fn: () => void, ms: number) => ts.current.push(setTimeout(fn, ms)),
    clear: () => {
      ts.current.forEach(clearTimeout);
      ts.current = [];
    },
  };
}

/**
 * Respond at the moment of touch (accurate timing), but never miss a very quick tap: on the web a tap shorter
 * than one frame can skip `onPressIn`, so `onPress` stands in for it. The flag is shared, not per render,
 * because a press re-renders the button between its press-in and its press.
 */
let pressedIn = false;
function tapIn(fn: () => void) {
  return {
    onPressIn: () => {
      pressedIn = true;
      fn();
    },
    onPress: () => {
      if (!pressedIn) fn();
      pressedIn = false;
    },
  };
}

function Instruction({ children }: { children: React.ReactNode }) {
  const t = useTheme();
  return <Text style={{ color: t.muted, fontSize: 15, textAlign: 'center', maxWidth: 380, lineHeight: 21 }}>{children}</Text>;
}

// --- 1. Reaction time: simple, then four-choice (after Deary, Liewald & Nissan 2011) -----------------

const SIMPLE_TRIALS = 10;
const CHOICE_TRIALS = 20;

export function ReactionTest({ onDone }: { onDone: Done }) {
  const t = useTheme();
  const { later, clear } = useTimers();
  const [part, setPart] = useState<'simple' | 'choice'>('simple');
  const [lit, setLit] = useState<number | null>(null);
  const [n, setN] = useState(0);
  const [note, setNote] = useState('');
  const s = useRef({ shownAt: 0, target: -1, armed: false, simple: [] as number[], choice: [] as number[], waiting: false });

  const arm = (p: 'simple' | 'choice') => {
    const st = s.current;
    st.armed = false;
    st.waiting = true;
    setLit(null);
    later(() => {
      st.target = p === 'simple' ? 0 : Math.floor(Math.random() * 4);
      st.shownAt = Date.now();
      st.armed = true;
      st.waiting = false;
      setLit(st.target);
    }, 900 + Math.random() * 1600);
  };
  useEffect(() => {
    arm('simple');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const press = (box: number) => {
    const st = s.current;
    if (!st.armed) {
      if (st.waiting) {
        // A tap before the light is a false start: restart the wait, record nothing.
        clear();
        setNote('Wait for the light.');
        arm(part);
      }
      return;
    }
    const rt = Date.now() - st.shownAt;
    st.armed = false;
    setNote('');
    if (part === 'simple') st.simple.push(rt);
    else if (box === st.target) st.choice.push(rt);
    else setNote('Incorrect position.');
    const next = n + 1;
    const total = part === 'simple' ? SIMPLE_TRIALS : CHOICE_TRIALS;
    if (next < total) {
      setN(next);
      arm(part);
    } else if (part === 'simple') {
      setPart('choice');
      setN(0);
      setLit(null);
      later(() => arm('choice'), 1400);
    } else {
      onDone({ simpleRt: rtMeasure(st.simple), choiceRt: rtMeasure(st.choice) });
    }
  };
  useKeys(part === 'simple' ? { ' ': () => press(0) } : { '1': () => press(0), '2': () => press(1), '3': () => press(2), '4': () => press(3) });

  const size = 72;
  return (
    <View style={{ alignItems: 'center', gap: 18 }}>
      <Instruction>
        {part === 'simple'
          ? `Part 1 of 2 · ${n + 1} of ${SIMPLE_TRIALS}. Tap the box the moment it lights.`
          : `Part 2 of 2 · ${n + 1} of ${CHOICE_TRIALS}. Tap whichever of the four boxes lights.`}
      </Instruction>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        {(part === 'simple' ? [0] : [0, 1, 2, 3]).map((b) => (
          <Pressable
            key={b}
            accessibilityRole="button"
            accessibilityLabel={`Box ${b + 1}${lit === b ? ', lit' : ''}`}
            {...tapIn(() => press(b))}
            style={{ width: part === 'simple' ? 160 : size, height: part === 'simple' ? 160 : size, borderRadius: 18, borderWidth: 1, borderColor: lit === b ? t.teal : t.border, backgroundColor: lit === b ? t.teal : t.surface }}
          />
        ))}
      </View>
      <Text style={{ color: t.help, height: 20 }}>{note}</Text>
    </View>
  );
}

// --- 2. Digit span: forwards, then backwards --------------------------------------------------------

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

export function SpanTest({ onDone }: { onDone: Done }) {
  const t = useTheme();
  const { later } = useTimers();
  const [dir, setDir] = useState<'forward' | 'backward'>('forward');
  const [phase, setPhase] = useState<'show' | 'input'>('show');
  const [shown, setShown] = useState<string | null>(null);
  const [typed, setTyped] = useState('');
  const [list, setList] = useState('');
  const res = useRef({ forward: [] as { length: number; correct: boolean }[], backward: [] as { length: number; correct: boolean }[] });

  const present = (d: 'forward' | 'backward') => {
    const len = nextSpanLength(res.current[d], d === 'forward' ? 3 : 2, d === 'forward' ? 9 : 8);
    if (len === null) {
      if (d === 'forward') {
        setDir('backward');
        later(() => present('backward'), 1500);
      } else {
        const total = longestSpan(res.current.forward) + longestSpan(res.current.backward);
        onDone({ span: { value: total } });
      }
      return;
    }
    const l = digitList(len);
    setList(l);
    setTyped('');
    setPhase('show');
    [...l].forEach((c, i) => {
      later(() => setShown(c), 600 + i * 1000);
      later(() => setShown(null), 600 + i * 1000 + 750);
    });
    later(() => setPhase('input'), 600 + l.length * 1000);
  };
  useEffect(() => {
    present('forward');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const key = (k: string) => {
    if (phase !== 'input') return;
    const next = typed + k;
    setTyped(next);
    if (next.length === list.length) {
      const want = dir === 'forward' ? list : [...list].reverse().join('');
      res.current[dir].push({ length: list.length, correct: next === want });
      setPhase('show');
      later(() => present(dir), 700);
    }
  };
  useKeys(Object.fromEntries(KEYS.map((k) => [k, () => key(k)])));

  return (
    <View style={{ alignItems: 'center', gap: 16 }}>
      <Instruction>
        {dir === 'forward' ? 'Forwards: enter the digits in the order shown.' : 'Backwards: enter the digits in reverse order, last one first.'}
      </Instruction>
      <View accessible accessibilityLiveRegion="assertive" accessibilityLabel={shown ?? (phase === 'input' ? 'Enter the digits' : 'Watch')} style={{ width: 140, height: 140, borderRadius: 24, borderWidth: 1, borderColor: t.border, backgroundColor: t.surface, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: t.text, fontSize: 72, fontWeight: '800' }}>{shown ?? ''}</Text>
      </View>
      <Text style={{ color: t.text, fontSize: 26, letterSpacing: 6, height: 34, fontVariant: ['tabular-nums'] }}>{phase === 'input' ? typed.padEnd(list.length, '·') : ''}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', width: 3 * 72 + 2 * 10, gap: 10, opacity: phase === 'input' ? 1 : 0.35 }}>
        {KEYS.map((k) => (
          <Pressable key={k} accessibilityRole="button" accessibilityLabel={k} disabled={phase !== 'input'} onPress={() => key(k)} style={({ pressed }) => ({ width: 72, height: 56, borderRadius: 14, borderWidth: 1, borderColor: t.border, backgroundColor: pressed ? t.soft : t.surface, alignItems: 'center', justifyContent: 'center' })}>
            <Text style={{ color: t.text, fontSize: 22, fontWeight: '700' }}>{k}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

// --- 3. Trails A then B (after Bowie & Harvey 2006) ------------------------------------------------

export function TrailsTest({ onDone }: { onDone: Done }) {
  const t = useTheme();
  const { width } = useWindowDimensions();
  const board = Math.min(width - 32, 400);
  const [kind, setKind] = useState<'A' | 'B'>('A');
  const [pts, setPts] = useState(() => trailPositions(12));
  const [next, setNext] = useState(0);
  const [miss, setMiss] = useState<number | null>(null);
  const s = useRef({ last: 0, segs: { A: [] as number[], B: [] as number[] } });
  const [started, setStarted] = useState(false);
  const labels = trailsLabels(kind);
  const r = 22;

  const tap = (i: number) => {
    const st = s.current;
    if (!started) {
      // The clock starts at the first correct tap.
      if (i !== 0) return;
      setStarted(true);
    }
    if (i !== next) {
      setMiss(i);
      return;
    }
    setMiss(null);
    const now = Date.now();
    if (i > 0) st.segs[kind].push(now - st.last);
    st.last = now;
    if (i + 1 < labels.length) setNext(i + 1);
    else if (kind === 'A') {
      setKind('B');
      setPts(trailPositions(12));
      setNext(0);
      setStarted(false);
    } else onDone({ trailsA: trailsMeasure(st.segs.A), trailsB: trailsMeasure(st.segs.B) });
  };

  return (
    <View style={{ alignItems: 'center', gap: 14 }}>
      <Instruction>
        {kind === 'A' ? 'Part A: tap 1 to 12 in order, as quickly as you can.' : 'Part B: alternate numbers and letters in order: 1, A, 2, B, 3, C and on to F.'} The clock starts at your first tap.
      </Instruction>
      <View style={{ width: board, height: board, borderRadius: 18, borderWidth: 1, borderColor: t.border, backgroundColor: t.surface }}>
        {pts.map((p, i) => {
          const done = i < next;
          return (
            <Pressable
              key={`${kind}${i}`}
              accessibilityRole="button"
              accessibilityLabel={labels[i]}
              {...tapIn(() => tap(i))}
              style={{ position: 'absolute', left: p.x * board - r, top: p.y * board - r, width: r * 2, height: r * 2, borderRadius: r, borderWidth: 1.5, borderColor: miss === i ? t.help : done ? t.teal : t.lavender, backgroundColor: done ? t.teal + '33' : t.bg, alignItems: 'center', justifyContent: 'center' }}
            >
              <Text style={{ color: t.text, fontWeight: '700', fontSize: 16 }}>{labels[i]}</Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={{ color: t.muted, height: 20 }}>{miss !== null ? `Next: ${labels[next]}` : started ? '' : `Begin at ${labels[0]}.`}</Text>
    </View>
  );
}

// --- 4. Symbol coding, 90 seconds (after the Digit Symbol Substitution Test; Jaeger 2018) ---------------

const CODING_MS = 90_000;
const BLOCK_MS = 15_000;

export function CodingTest({ onDone }: { onDone: Done }) {
  const t = useTheme();
  const { later } = useTimers();
  const [key] = useState(() => codingKey());
  const [target, setTarget] = useState(() => Math.floor(Math.random() * 9));
  const [left, setLeft] = useState(90);
  const [started, setStarted] = useState(false);
  const s = useRef({ start: 0, blocks: [0, 0, 0, 0, 0, 0], open: true });

  useEffect(() => {
    if (!started) return;
    const id = setInterval(() => setLeft(Math.max(0, Math.ceil((CODING_MS - (Date.now() - s.current.start)) / 1000))), 250);
    later(() => {
      s.current.open = false;
      clearInterval(id);
      onDone({ coding: codingMeasure(s.current.blocks) });
    }, CODING_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started]);

  const answer = (digit: number) => {
    const st = s.current;
    if (!started || !st.open) return;
    if (digit === target) {
      const b = Math.min(5, Math.floor((Date.now() - st.start) / BLOCK_MS));
      st.blocks[b] += 1;
      let nt = Math.floor(Math.random() * 9);
      while (nt === target) nt = Math.floor(Math.random() * 9);
      setTarget(nt);
    }
  };
  useKeys(started ? Object.fromEntries(KEYS.map((k) => [k, () => answer(Number(k) - 1)])) : {});

  return (
    <View style={{ alignItems: 'center', gap: 14 }}>
      <Instruction>Each symbol has a number in the key. Tap the number for the symbol shown. Work quickly and accurately for 90 seconds.</Instruction>
      <View accessibilityLabel={`Key: ${key.map((k, i) => `${k} is ${i + 1}`).join(', ')}`} style={{ flexDirection: 'row', borderWidth: 1, borderColor: t.border, borderRadius: 12, overflow: 'hidden' }}>
        {key.map((sym, i) => (
          <View key={i} style={{ width: 36, borderRightWidth: i < 8 ? 1 : 0, borderRightColor: t.border, alignItems: 'center', backgroundColor: t.surface }}>
            <Text style={{ color: t.text, fontSize: 20, paddingVertical: 4 }}>{sym}</Text>
            <Text style={{ color: t.muted, fontSize: 14, paddingBottom: 4 }}>{i + 1}</Text>
          </View>
        ))}
      </View>
      <View style={{ width: 120, height: 120, borderRadius: 24, borderWidth: 1, borderColor: t.lavender, backgroundColor: t.surface, alignItems: 'center', justifyContent: 'center' }}>
        <Text accessibilityLabel={started ? `Symbol ${key[target]}` : 'Not started'} style={{ color: t.text, fontSize: 60 }}>{started ? key[target] : ''}</Text>
      </View>
      <Text style={{ color: t.muted, fontVariant: ['tabular-nums'] }}>{started ? `${left} s` : ''}</Text>
      {started ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', width: 3 * 72 + 2 * 10, gap: 10 }}>
          {KEYS.map((k) => (
            <Pressable key={k} accessibilityRole="button" accessibilityLabel={k} {...tapIn(() => answer(Number(k) - 1))} style={({ pressed }) => ({ width: 72, height: 52, borderRadius: 14, borderWidth: 1, borderColor: t.border, backgroundColor: pressed ? t.soft : t.surface, alignItems: 'center', justifyContent: 'center' })}>
              <Text style={{ color: t.text, fontSize: 22, fontWeight: '700' }}>{k}</Text>
            </Pressable>
          ))}
        </View>
      ) : (
        <View style={{ flexDirection: 'row', width: '100%', maxWidth: 380 }}>
          <AnswerButton
            label="Begin 90 seconds"
            onPress={() => {
              s.current.start = Date.now();
              setStarted(true);
            }}
          />
        </View>
      )}
    </View>
  );
}
