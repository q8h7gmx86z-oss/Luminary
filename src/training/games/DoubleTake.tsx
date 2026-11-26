import React, { useEffect, useRef, useState } from 'react';
import { Pressable, Text, useWindowDimensions, View } from 'react-native';
import Svg, { Circle, Polygon, Rect } from 'react-native-svg';

import { useTheme } from '@/lib/theme';

import { defined, median, rtStats } from '../engine';
import { AnswerButton, GameFrame, GameProps } from '../GameFrame';
import { useAnswerFeedback } from '../feedback';
import { makeSearch, SearchItem, searchParams } from '../newgames';

// Three colours that stay distinct for the common forms of colour vision difference (blue, orange, light grey),
// and every target also differs in shape at conjunction levels.
const COLOURS = ['#5DA8FF', '#F2A65A', '#D9DBEA'];

function Shape({ item, size }: { item: SearchItem; size: number }) {
  const c = COLOURS[item.colour];
  const s = size;
  return (
    <Svg width={s} height={s} viewBox="0 0 24 24">
      {item.shape === 'circle' ? <Circle cx={12} cy={12} r={8} fill={c} /> : null}
      {item.shape === 'square' ? <Rect x={4.5} y={4.5} width={15} height={15} rx={2} fill={c} /> : null}
      {item.shape === 'triangle' ? <Polygon points="12,3.5 21,19.5 3,19.5" fill={c} /> : null}
    </Svg>
  );
}

type Fb = 'right' | 'wrong' | 'late' | null;

/** Visual search: find the odd one out. Feature search first, then conjunction search. */
export function DoubleTake({ level, onFinish, onQuit, untimed }: GameProps & { onQuit?: () => void }) {
  const t = useTheme();
  const p = searchParams(level);
  const { width } = useWindowDimensions();
  const board = Math.min(width - 40, 380);
  const cols = Math.ceil(Math.sqrt(p.setSize * 1.25));
  const rows = Math.ceil(p.setSize / cols) + 1;
  const cell = board / cols;

  const [phase, setPhase] = useState<'ready' | 'play' | 'done'>('ready');
  const [n, setN] = useState(0);
  const [screen, setScreen] = useState<{ items: SearchItem[]; target: number; slots: number[] } | null>(null);
  const [fb, setFb] = useState<Fb>(null);
  useAnswerFeedback(fb, ['right']);
  const s = useRef({ i: 0, open: false, shownAt: 0, correct: 0, rts: [] as number[], bonus: 0 });
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
      const med = median(st.rts);
      onFinish({
        score: Math.round(st.correct * (10 + level * 2) + st.bonus),
        accuracy: st.correct / p.trials,
        ...rtStats(st.rts),
        metrics: defined({ setSize: p.setSize, msPerItem: med === undefined ? undefined : Math.round(med / p.setSize) }),
      });
      return;
    }
    const sc = makeSearch(p.setSize, p.conjunction);
    // Scatter the shapes over a slightly larger grid, so their positions vary every screen.
    const slots = [...Array(cols * rows).keys()].sort(() => Math.random() - 0.5).slice(0, p.setSize);
    st.i = i;
    st.open = true;
    st.shownAt = Date.now();
    setN(i);
    setFb(null);
    setScreen({ ...sc, slots });
    if (!untimed) later(() => answerRef.current(-1), p.deadlineMs);
  };

  const answer = (idx: number) => {
    const st = s.current;
    if (!st.open || (!screen && idx !== -1)) return;
    st.open = false;
    clear();
    const rt = Date.now() - st.shownAt;
    let f: Fb;
    if (idx === -1) f = 'late';
    else if (screen && idx === screen.target) {
      f = 'right';
      st.correct += 1;
      st.rts.push(rt);
      if (!untimed) st.bonus += Math.max(0, ((p.deadlineMs - rt) / p.deadlineMs) * 8);
    } else f = 'wrong';
    setFb(f);
    later(() => show(st.i + 1), f === 'right' ? 350 : 900);
  };
  const answerRef = useRef(answer);
  answerRef.current = answer;

  return (
    <GameFrame title="Double Take" level={level} progress={phase === 'play' ? n / p.trials : 0} status={phase === 'play' ? `${n + 1} of ${p.trials}` : undefined} onQuit={onQuit}>
      {phase === 'ready' ? (
        <View style={{ gap: 12, maxWidth: 380 }}>
          <Text style={{ color: t.text, fontSize: 17, textAlign: 'center' }}>One shape is different from all the others. Tap it as fast as you can.</Text>
          <Text style={{ color: t.muted, textAlign: 'center' }}>
            {p.conjunction ? 'At this level it differs only in its mix of colour and shape. A deliberate search is required.' : 'At this level it is a different colour, so it should stand out at once.'}
          </Text>
        </View>
      ) : (
        <>
          <View style={{ width: board, height: rows * cell, position: 'relative' }}>
            {screen?.items.map((it, k) => {
              const slot = screen.slots[k];
              const x = (slot % cols) * cell;
              const y = Math.floor(slot / cols) * cell;
              const showTarget = fb && fb !== 'right' && k === screen.target;
              return (
                <Pressable
                  key={`${n}-${k}`}
                  accessibilityRole="button"
                  accessibilityLabel={`${it.shape}, ${['blue', 'orange', 'grey'][it.colour]}`}
                  onPress={() => answerRef.current(k)}
                  style={{ position: 'absolute', left: x, top: y, width: cell, height: cell, alignItems: 'center', justifyContent: 'center', borderRadius: cell / 2, borderWidth: showTarget ? 2 : 0, borderColor: t.good }}
                >
                  <Shape item={it} size={cell * 0.62} />
                </Pressable>
              );
            })}
          </View>
          <Text style={{ height: 22, fontWeight: '700', color: fb === 'right' ? t.good : t.help }}>
            {fb === 'right' ? 'Located' : fb === 'wrong' ? 'Incorrect. The target is circled' : fb === 'late' ? 'Time elapsed. The target is circled' : ''}
          </Text>
        </>
      )}
      {phase === 'ready' ? (
        <View style={{ flexDirection: 'row', width: '100%' }}>
          <AnswerButton label="Start" onPress={() => { setPhase('play'); later(() => show(0), 400); }} />
        </View>
      ) : null}
    </GameFrame>
  );
}
