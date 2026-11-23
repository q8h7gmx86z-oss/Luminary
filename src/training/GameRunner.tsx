import * as Linking from 'expo-linking';
import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { useStore } from '@/lib/store';
import { dayKey } from '@/lib/logic';
import { useTheme } from '@/lib/theme';

import { GAMES, SKILLS } from './catalog';
import { GameId, GameResult, nextLevel } from './engine';
import { AnswerButton, RoundOutcome } from './GameFrame';
import { CatchTheLight } from './games/CatchTheLight';
import { MemoryGrid } from './games/MemoryGrid';
import { SpeedMatch } from './games/SpeedMatch';

const COMPONENTS = {
  speed: SpeedMatch,
  grid: MemoryGrid,
  catch: CatchTheLight,
} as const;

export function isPlayable(id: GameId): id is keyof typeof COMPONENTS {
  return id in COMPONENTS;
}

/** Intro card, the game itself, then a result card. Calls onDone when the player moves on. */
export function GameRunner({
  id,
  onDone,
  onQuit,
  doneLabel = 'Continue',
  onExit,
}: {
  id: GameId;
  /** Shows a secondary Done button on the result card. */
  onExit?: () => void;
  onDone: (r: GameResult | null) => void;
  onQuit: () => void;
  doneLabel?: string;
}) {
  const { state, recordResult } = useStore();
  const t = useTheme();
  const info = GAMES[id];
  const level = state.training.levels[id] ?? 1;
  const [stage, setStage] = useState<'intro' | 'play' | 'result'>('intro');
  const [result, setResult] = useState<GameResult | null>(null);
  const [showScience, setShowScience] = useState(false);

  if (!isPlayable(id)) return null;
  const Game = COMPONENTS[id];

  // Best score before this round, so a new record can be celebrated.
  const best = Math.max(0, ...state.training.results.filter((r) => r.game === id && r.at !== result?.at).map((r) => r.score));

  if (stage === 'play') {
    return (
      <Game
        level={level}
        onQuit={onQuit}
        onFinish={(o: RoundOutcome) => {
          const r: GameResult = { game: id, level, score: o.score, accuracy: o.accuracy, rtMs: o.rtMs, at: Date.now(), day: dayKey() };
          recordResult(r);
          setResult(r);
          setStage('result');
        }}
      />
    );
  }

  const skill = SKILLS[info.skill];

  if (stage === 'result' && result) {
    const newLevel = nextLevel(result.level, result.accuracy);
    const isBest = result.score > best;
    return (
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16, alignItems: 'center', flexGrow: 1, justifyContent: 'center' }} style={{ backgroundColor: t.bg }}>
        <Text style={{ fontSize: 15, color: skill.color, fontWeight: '700', letterSpacing: 0.5 }}>{skill.name.toUpperCase()}</Text>
        <Text style={{ fontSize: 26, fontWeight: '800', color: t.text }}>{info.name}</Text>
        <Text style={{ fontSize: 64, fontWeight: '800', color: t.primary, fontVariant: ['tabular-nums'] }}>{result.score}</Text>
        {isBest ? <Text style={{ color: t.good, fontWeight: '700', fontSize: 16 }}>New personal best!</Text> : <Text style={{ color: t.muted }}>Personal best: {best}</Text>}
        <View style={{ flexDirection: 'row', gap: 12, width: '100%', maxWidth: 420 }}>
          <Stat label="Accuracy" value={`${Math.round(result.accuracy * 100)}%`} />
          {result.rtMs ? <Stat label="Avg. speed" value={`${Math.round(result.rtMs)} ms`} /> : null}
          <Stat label="Next level" value={`${newLevel}`} hint={newLevel > result.level ? 'Up' : newLevel < result.level ? 'Easier' : 'Same'} />
        </View>
        <Text style={{ color: t.muted, textAlign: 'center', maxWidth: 420 }}>
          {newLevel > result.level
            ? 'Great accuracy, so the next round will be a little harder.'
            : newLevel < result.level
              ? 'We will ease off a little so you can build up again. That is how progress works.'
              : result.accuracy < 0.6
                ? 'That one was tough. Same level next time, and it gets easier with practice.'
                : 'You are in the sweet spot. Same level next time.'}
        </Text>
        <View style={{ flexDirection: 'row', gap: 12, width: '100%', maxWidth: 420 }}>
          {onExit ? <AnswerButton label="Done" tone="secondary" onPress={onExit} /> : null}
          <AnswerButton label={doneLabel} onPress={() => onDone(result)} />
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 20, gap: 16, alignItems: 'center', flexGrow: 1, justifyContent: 'center' }} style={{ backgroundColor: t.bg }}>
      <View style={{ width: 96, height: 96, borderRadius: 28, backgroundColor: skill.color, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 48, color: '#FFFFFF' }}>{info.glyph}</Text>
      </View>
      <Text style={{ fontSize: 15, color: skill.color, fontWeight: '700', letterSpacing: 0.5 }}>{skill.name.toUpperCase()}</Text>
      <Text style={{ fontSize: 28, fontWeight: '800', color: t.text }}>{info.name}</Text>
      <Text style={{ fontSize: 17, color: t.muted, textAlign: 'center' }}>{info.tagline}</Text>
      <View style={{ gap: 8, width: '100%', maxWidth: 440, backgroundColor: t.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: t.border }}>
        {info.howTo.map((h, i) => (
          <Text key={i} style={{ color: t.text, fontSize: 16, lineHeight: 22 }}>
            {i + 1}. {h}
          </Text>
        ))}
        <Text style={{ color: t.muted, fontSize: 14 }}>Your level: {level}</Text>
      </View>
      <Pressable accessibilityRole="button" onPress={() => setShowScience((v) => !v)} hitSlop={8}>
        <Text style={{ color: t.primary, fontWeight: '700', fontSize: 15 }}>{showScience ? 'Hide the science' : 'What does the science say?'}</Text>
      </Pressable>
      {showScience ? (
        <View style={{ gap: 8, width: '100%', maxWidth: 440 }}>
          <Text style={{ color: t.text, fontSize: 15, lineHeight: 22 }}>{info.science}</Text>
          {info.sources.map((s) => (
            <Pressable key={s.url} accessibilityRole="link" onPress={() => Linking.openURL(s.url)}>
              <Text style={{ color: t.primary, textDecorationLine: 'underline', fontSize: 14 }}>{s.label}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
      <View style={{ flexDirection: 'row', width: '100%', maxWidth: 440 }}>
        <AnswerButton label="Play" onPress={() => setStage('play')} />
      </View>
    </ScrollView>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  const t = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: t.surface, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: t.border, alignItems: 'center' }}>
      <Text style={{ color: t.muted, fontSize: 12 }}>{label}</Text>
      <Text style={{ color: t.text, fontSize: 20, fontWeight: '800', fontVariant: ['tabular-nums'] }}>{value}</Text>
      {hint ? <Text style={{ color: t.muted, fontSize: 12 }}>{hint}</Text> : null}
    </View>
  );
}
