import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, Text, useWindowDimensions, View } from 'react-native';

import { describeCell, MatrixCell } from '@/iq/MatrixCell';
import { makeMatrix, seeded } from '@/iq/items';
import { useTheme } from '@/lib/theme';

import { logicParams } from '../championships';
import { rtStats, scoreFor } from '../engine';
import { GameFrame, GameProps } from '../GameFrame';
import { useAnswerFeedback } from '../feedback';

/** Logic: adaptive pattern matrices. Each matrix follows rules across rows and columns. */
export function LogicMatrix({ level, onFinish, onQuit, untimed }: GameProps & { onQuit?: () => void }) {
  const t = useTheme();
  const p = logicParams(level);
  const { width } = useWindowDimensions();
  const inner = Math.min(width, 520) - 32;
  const [seed] = useState(() => Date.now() % 2147483647);
  const items = useMemo(() => {
    const rand = seeded(seed);
    return Array.from({ length: p.items }, () => makeMatrix(rand, p.rules));
  }, [seed, p.items, p.rules]);
  const [i, setI] = useState(0);
  const [fb, setFb] = useState<'right' | 'wrong' | null>(null);
  useAnswerFeedback(fb, ['right']);
  const right = useRef(0);
  const rts = useRef<number[]>([]);
  const shownAt = useRef(Date.now());
  const [now, setNow] = useState(Date.now());

  const answer = (choice: number | null) => {
    if (fb) return;
    const ok = choice === items[i].answer;
    if (ok) {
      right.current += 1;
      rts.current.push(Date.now() - shownAt.current);
    }
    setFb(ok ? 'right' : 'wrong');
    setTimeout(() => {
      setFb(null);
      if (i + 1 < items.length) {
        shownAt.current = Date.now();
        setNow(Date.now());
        setI(i + 1);
      }
      else {
        const accuracy = right.current / items.length;
        onFinish({ score: scoreFor(right.current, level), accuracy, ...rtStats(rts.current), metrics: { rules: p.rules } });
      }
    }, 450);
  };

  // Time per matrix, unless untimed.
  useEffect(() => {
    if (untimed) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [untimed]);
  const left = untimed ? undefined : Math.max(0, Math.ceil((shownAt.current + p.itemMs - now) / 1000));
  useEffect(() => {
    if (left === 0 && !fb) answer(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left]);

  const item = items[i];
  const cell = Math.min(96, Math.floor((inner - 16) / 3));
  const opt = Math.min(88, Math.floor((inner - 20) / 3));
  const status = [`Matrix ${i + 1} of ${items.length}`, `${p.rules} ${p.rules === 1 ? 'rule' : 'rules'}`, left !== undefined ? `${left}s` : null].filter(Boolean).join('  ·  ');

  return (
    <GameFrame title="Logic" level={level} progress={i / items.length} status={status} onQuit={onQuit}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', width: cell * 3 + 16, gap: 8 }}>
        {item.cells.map((c, k) => (
          <View
            key={k}
            accessible
            accessibilityLabel={k === 8 ? 'Missing square' : describeCell(c, item.shapes)}
            style={{
              width: cell,
              height: cell,
              borderRadius: 12,
              backgroundColor: '#BDBBD2',
              borderWidth: 1.5,
              borderColor: k === 8 ? t.primary : 'transparent',
              borderStyle: k === 8 ? 'dashed' : 'solid',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {k === 8 ? <Text style={{ color: t.primary, fontSize: 32, fontWeight: '700' }}>?</Text> : <MatrixCell cell={c} shapes={item.shapes} size={cell - 10} />}
          </View>
        ))}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', width: opt * 3 + 20, gap: 10 }}>
        {item.options.map((c, k) => {
          const mark = fb && k === item.answer ? t.good : 'transparent';
          return (
            <Pressable
              key={k}
              accessibilityRole="button"
              accessibilityLabel={`Option ${k + 1}: ${describeCell(c, item.shapes)}`}
              onPress={() => answer(k)}
              style={({ pressed }) => ({
                width: opt,
                height: opt,
                borderRadius: 12,
                backgroundColor: '#BDBBD2',
                borderWidth: 2,
                borderColor: fb ? mark : pressed ? t.primary : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
              })}
            >
              <MatrixCell cell={c} shapes={item.shapes} size={opt - 12} />
            </Pressable>
          );
        })}
      </View>
    </GameFrame>
  );
}
