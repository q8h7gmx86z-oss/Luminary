import React, { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { useTheme } from '@/lib/theme';

import { AnswerButton, GameFrame, GameProps } from '../GameFrame';
import { useAnswerFeedback } from '../feedback';
import { letterNumberAnswer, makeLetterNumber, sequenceParams } from '../newgames';

type Phase = 'ready' | 'show' | 'input' | 'right' | 'wrong' | 'done';

const ACCENT = '#B48CFF';

/** Letter-number sequencing: hold a mixed list in mind, then rebuild it in order. */
export function SequenceBuilder({ level, onFinish, onQuit, untimed }: GameProps & { onQuit?: () => void }) {
  const t = useTheme();
  const p = sequenceParams(level);
  const showMs = untimed ? p.showMs + 400 : p.showMs;
  const [phase, setPhase] = useState<Phase>('ready');
  useAnswerFeedback(phase === 'right' || phase === 'wrong' ? phase : null, ['right']);
  const [trial, setTrial] = useState(0);
  const [items, setItems] = useState<string[]>([]);
  const [shown, setShown] = useState<string | null>(null);
  const [built, setBuilt] = useState<string[]>([]);
  const [keys, setKeys] = useState<string[]>([]);
  const stats = useRef({ perfect: 0, correctItems: 0 });
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const clear = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  useEffect(() => clear, []);

  const play = (n: number) => {
    clear();
    const list = makeLetterNumber(p.length);
    setItems(list);
    setBuilt([]);
    setTrial(n);
    setPhase('show');
    const step = showMs + 250;
    list.forEach((x, i) => {
      timers.current.push(setTimeout(() => setShown(x), 500 + i * step));
      timers.current.push(setTimeout(() => setShown(null), 500 + i * step + showMs));
    });
    timers.current.push(
      setTimeout(() => {
        // Answer keys in a neutral order: numbers then letters would give the game away.
        setKeys([...list].sort(() => Math.random() - 0.5));
        setPhase('input');
      }, 500 + list.length * step),
    );
  };

  const end = (ok: boolean) => {
    setPhase(ok ? 'right' : 'wrong');
    if (ok) stats.current.perfect += 1;
    timers.current.push(
      setTimeout(() => {
        if (trial + 1 >= p.trials) {
          setPhase('done');
          const s = stats.current;
          onFinish({ score: s.correctItems * (6 + level), accuracy: s.perfect / p.trials, metrics: { length: p.length, perfect: s.perfect, trials: p.trials } });
        } else play(trial + 1);
      }, 1100),
    );
  };

  const tap = (x: string) => {
    if (phase !== 'input' || built.includes(x)) return;
    const answer = letterNumberAnswer(items);
    const next = [...built, x];
    setBuilt(next);
    if (answer[next.length - 1] !== x) {
      end(false);
      return;
    }
    stats.current.correctItems += 1;
    if (next.length === answer.length) end(true);
  };

  const message =
    phase === 'ready'
      ? `You will see ${p.length} numbers and letters. Then rebuild them: numbers smallest first, then letters A to Z.`
      : phase === 'show'
        ? 'Retain the sequence.'
        : phase === 'input'
          ? 'Numbers first, smallest to largest. Then letters, A to Z.'
          : phase === 'right'
            ? 'Correct order.'
            : phase === 'wrong'
              ? `The order was ${letterNumberAnswer(items).join(' ')}`
              : '';

  return (
    <GameFrame
      title="Sequence Builder"
      level={level}
      progress={(trial + (phase === 'right' || phase === 'wrong' ? 1 : 0)) / p.trials}
      status={`List ${Math.min(trial + 1, p.trials)} of ${p.trials}`}
      onQuit={onQuit}
    >
      <Text style={{ color: phase === 'wrong' ? t.help : phase === 'right' ? t.good : t.muted, fontSize: 16, fontWeight: '600', textAlign: 'center', maxWidth: 380 }}>{message}</Text>
      <View
        accessible
        accessibilityLiveRegion="assertive"
        accessibilityLabel={shown ?? (phase === 'show' ? 'Waiting' : 'Your answer')}
        style={{ width: 170, height: 170, borderRadius: 28, borderWidth: 1, borderColor: shown ? ACCENT : t.border, backgroundColor: shown ? `${ACCENT}22` : t.surface, alignItems: 'center', justifyContent: 'center' }}
      >
        <Text style={{ color: t.text, fontSize: 88, fontWeight: '800', fontVariant: ['tabular-nums'] }}>{shown ?? ''}</Text>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center', minHeight: 40 }}>
        {built.map((x, i) => (
          <View key={i} style={{ minWidth: 34, height: 40, paddingHorizontal: 8, borderRadius: 10, backgroundColor: t.soft, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: t.text, fontSize: 20, fontWeight: '700' }}>{x}</Text>
          </View>
        ))}
      </View>
      {phase === 'ready' ? (
        <View style={{ flexDirection: 'row', width: '100%' }}>
          <AnswerButton label="Start" onPress={() => play(0)} />
        </View>
      ) : (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center', maxWidth: 380, minHeight: 72 }}>
          {phase === 'input' || phase === 'right' || phase === 'wrong'
            ? keys.map((x) => {
                const used = built.includes(x);
                return (
                  <Pressable
                    key={x}
                    accessibilityRole="button"
                    accessibilityLabel={x}
                    disabled={phase !== 'input' || used}
                    onPress={() => tap(x)}
                    style={({ pressed }) => ({
                      width: 60,
                      height: 60,
                      borderRadius: 16,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 1,
                      borderColor: used ? t.border : ACCENT,
                      backgroundColor: pressed ? `${ACCENT}33` : t.surface,
                      opacity: used ? 0.35 : 1,
                    })}
                  >
                    <Text style={{ color: t.text, fontSize: 24, fontWeight: '700' }}>{x}</Text>
                  </Pressable>
                );
              })
            : null}
        </View>
      )}
    </GameFrame>
  );
}
