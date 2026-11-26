import React, { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { useTheme } from '@/lib/theme';

import { defined, median } from '../engine';
import { AnswerButton, GameFrame, GameProps } from '../GameFrame';
import { useAnswerFeedback } from '../feedback';
import { makeTowerPuzzle, PEG_CAP, Tower, towerCredit, towerKey, towerParams } from '../newgames';

const BALLS = ['#E2607A', '#2DB6A3', '#9B7BFF'];
const BALL_NAMES = ['red', 'teal', 'violet'];

function Pegs({ tower, size, selected, onPeg, label }: { tower: Tower; size: number; selected?: number | null; onPeg?: (i: number) => void; label: string }) {
  const t = useTheme();
  const ball = size * 0.26;
  return (
    <View accessibilityLabel={label} style={{ flexDirection: 'row', alignItems: 'flex-end', gap: size * 0.06, paddingBottom: 4, borderBottomWidth: 2, borderBottomColor: t.border }}>
      {tower.map((peg, i) => {
        const h = PEG_CAP[i] * (ball + 4) + 14;
        const lifted = selected === i;
        const content = (
          <View style={{ width: ball + 18, height: h + ball * 0.6, alignItems: 'center', justifyContent: 'flex-end' }}>
            <View style={{ position: 'absolute', bottom: 0, width: 4, height: h, borderRadius: 2, backgroundColor: lifted ? t.lavender : t.muted, opacity: 0.6 }} />
            {peg.map((b, k) => (
              <View
                key={k}
                style={{
                  width: ball,
                  height: ball,
                  borderRadius: ball / 2,
                  backgroundColor: BALLS[b],
                  marginTop: 4,
                  transform: [{ translateY: lifted && k === peg.length - 1 ? -ball * 0.5 : 0 }],
                }}
              />
            )).reverse()}
          </View>
        );
        return onPeg ? (
          <Pressable
            key={i}
            accessibilityRole="button"
            accessibilityLabel={`Peg ${i + 1}, holds ${PEG_CAP[i]}. ${peg.length ? `Balls bottom to top: ${peg.map((b) => BALL_NAMES[b]).join(', ')}` : 'Empty'}${lifted ? '. Selected' : ''}`}
            onPress={() => onPeg(i)}
            hitSlop={6}
          >
            {content}
          </Pressable>
        ) : (
          <View key={i}>{content}</View>
        );
      })}
    </View>
  );
}

/** Tower of London: rearrange the balls to match the target in as few moves as possible. */
export function NextMove({ level, onFinish, onQuit }: GameProps & { onQuit?: () => void }) {
  const t = useTheme();
  const p = towerParams(level);
  const [phase, setPhase] = useState<'ready' | 'play' | 'solved' | 'failed' | 'done'>('ready');
  useAnswerFeedback(phase === 'solved' ? 'right' : phase === 'failed' ? 'wrong' : null, ['right']);
  const [k, setK] = useState(0);
  const [puzzle, setPuzzle] = useState(() => makeTowerPuzzle(p.minMoves));
  const [tower, setTower] = useState<Tower>(puzzle.start);
  const [sel, setSel] = useState<number | null>(null);
  const [moves, setMoves] = useState(0);
  const st = useRef({ shownAt: 0, firstAt: 0, credit: 0, optimal: 0, plans: [] as number[] });
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const maxMoves = p.minMoves * 2 + 2;

  const begin = (i: number) => {
    const pz = i === 0 ? puzzle : makeTowerPuzzle(p.minMoves);
    setPuzzle(pz);
    setTower(pz.start);
    setSel(null);
    setMoves(0);
    setK(i);
    st.current.shownAt = Date.now();
    st.current.firstAt = 0;
    setPhase('play');
  };

  const settle = (solved: boolean, used: number) => {
    const s = st.current;
    const c = towerCredit(used, p.minMoves, solved);
    s.credit += c;
    if (solved && used <= p.minMoves) s.optimal += 1;
    setPhase(solved ? 'solved' : 'failed');
    timers.current.push(
      setTimeout(() => {
        if (k + 1 >= p.puzzles) {
          setPhase('done');
          onFinish({
            score: Math.round(s.credit * (20 + level * 4)),
            accuracy: s.credit / p.puzzles,
            metrics: defined({ minMoves: p.minMoves, optimal: s.optimal / p.puzzles, planMs: median(s.plans) }),
          });
        } else begin(k + 1);
      }, 1200),
    );
  };

  const onPeg = (i: number) => {
    if (phase !== 'play') return;
    if (sel === null) {
      if (tower[i].length) setSel(i);
      return;
    }
    if (sel === i || tower[i].length >= PEG_CAP[i]) {
      setSel(tower[i].length && sel !== i ? i : null);
      return;
    }
    const s = st.current;
    if (!s.firstAt) {
      s.firstAt = Date.now();
      s.plans.push(s.firstAt - s.shownAt);
    }
    const next = tower.map((x) => [...x]) as Tower;
    next[i].push(next[sel].pop()!);
    const used = moves + 1;
    setTower(next);
    setMoves(used);
    setSel(null);
    if (towerKey(next) === towerKey(puzzle.goal)) settle(true, used);
    else if (used >= maxMoves) settle(false, used);
  };

  const status =
    phase === 'solved'
      ? moves <= p.minMoves
        ? 'Solved in the fewest moves.'
        : `Solved in ${moves}. It can be done in ${p.minMoves}.`
      : phase === 'failed'
        ? 'Out of moves. Next puzzle.'
        : `Moves: ${moves}  ·  Target: ${p.minMoves}`;

  return (
    <GameFrame title="Next Move" level={level} progress={(k + (phase === 'solved' || phase === 'failed' ? 1 : 0)) / p.puzzles} status={`Puzzle ${Math.min(k + 1, p.puzzles)} of ${p.puzzles}`} onQuit={onQuit}>
      {phase === 'ready' ? (
        <View style={{ gap: 12, maxWidth: 380 }}>
          <Text style={{ color: t.text, fontSize: 17, textAlign: 'center' }}>Make your pegs match the target, in {p.minMoves} moves.</Text>
          <Text style={{ color: t.muted, textAlign: 'center' }}>Tap a peg to lift its top ball, then tap where it should go. Work out the whole plan before your first move.</Text>
        </View>
      ) : (
        <>
          <View style={{ alignItems: 'center', gap: 6 }}>
            <Text style={{ color: t.muted, fontSize: 12, letterSpacing: 1 }}>TARGET</Text>
            <Pegs tower={puzzle.goal} size={130} label={`Target: ${puzzle.goal.map((peg, i) => `peg ${i + 1} ${peg.map((b) => BALL_NAMES[b]).join(' ') || 'empty'}`).join('; ')}`} />
          </View>
          <Pegs tower={tower} size={250} selected={sel} onPeg={onPeg} label="Your pegs" />
          <Text style={{ color: phase === 'solved' ? t.good : phase === 'failed' ? t.help : t.text, fontWeight: '700', fontSize: 16 }}>{status}</Text>
        </>
      )}
      {phase === 'ready' ? (
        <View style={{ flexDirection: 'row', width: '100%' }}>
          <AnswerButton label="Start" onPress={() => begin(0)} />
        </View>
      ) : (
        <View style={{ height: 10 }} />
      )}
    </GameFrame>
  );
}
