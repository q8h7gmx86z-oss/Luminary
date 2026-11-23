import React, { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useStore } from '@/lib/store';
import { useTheme } from '@/lib/theme';

import { preloadCues } from './feedback';

export type RoundOutcome = { score: number; accuracy: number; rtMs?: number };
export type GameProps = { level: number; onFinish: (o: RoundOutcome) => void; /** No answer deadlines, slower pacing. */ untimed?: boolean };

/** Shared chrome for every game: title, level, progress bar and a way out. */
export function GameFrame({
  title,
  level,
  progress,
  status,
  onQuit,
  children,
}: {
  title: string;
  level?: number;
  progress: number;
  status?: string;
  onQuit?: () => void;
  children: React.ReactNode;
}) {
  const t = useTheme();
  return (
    <View style={[styles.wrap, { backgroundColor: t.bg }]}>
      <View style={styles.top}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: t.text }]}>{title}</Text>
          <Text style={{ color: t.muted, fontSize: 13 }}>
            {[level !== undefined ? `Level ${level}` : null, status].filter(Boolean).join('  ·  ')}
          </Text>
        </View>
        <SoundToggle />
        {onQuit ? (
          <Pressable accessibilityRole="button" onPress={onQuit} hitSlop={10} style={[styles.quit, { backgroundColor: t.soft }]}>
            <Text style={{ color: t.text, fontWeight: '600' }}>Stop</Text>
          </Pressable>
        ) : null}
      </View>
      <View style={[styles.bar, { backgroundColor: t.soft }]} accessibilityRole="progressbar" accessibilityValue={{ now: Math.round(progress * 100), min: 0, max: 100 }}>
        <View style={{ width: `${Math.min(1, Math.max(0, progress)) * 100}%`, height: '100%', backgroundColor: t.primary, borderRadius: 4 }} />
      </View>
      <View style={styles.stage}>{children}</View>
    </View>
  );
}

/** Quick mute in every game. The same switch lives in Settings. */
function SoundToggle() {
  const t = useTheme();
  const { state, setSetting } = useStore();
  const on = state.settings.sound;
  useEffect(() => {
    if (on) preloadCues();
  }, [on]);
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel="Game sounds"
      accessibilityState={{ checked: on }}
      onPress={() => setSetting('sound', !on)}
      hitSlop={10}
      style={[styles.quit, { backgroundColor: t.soft, marginRight: 8 }]}
    >
      <Text style={{ color: t.text, fontWeight: '600' }}>{on ? '🔊 Sound' : '🔇 Muted'}</Text>
    </Pressable>
  );
}

/**
 * Answer on touch-down for fair reaction times. A very quick click can end before press-in fires
 * (seen on web), so onPress covers that case without answering twice.
 */
export function useTap(fn: () => void) {
  const last = useRef(0);
  return {
    onPressIn: () => {
      last.current = Date.now();
      fn();
    },
    onPress: () => {
      if (Date.now() - last.current > 1000) fn();
    },
  };
}

/** Big answer button used by several games. */
export function AnswerButton({
  label,
  onPress,
  disabled,
  tone = 'primary',
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  tone?: 'primary' | 'secondary';
}) {
  const t = useTheme();
  const tap = useTap(onPress);
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      {...tap}
      style={({ pressed }) => [
        styles.answer,
        {
          backgroundColor: tone === 'primary' ? t.primary : t.surface,
          borderColor: tone === 'primary' ? t.primary : t.border,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
          transform: [{ scale: pressed ? 0.97 : 1 }],
        },
      ]}
    >
      <Text style={{ color: tone === 'primary' ? t.primaryText : t.text, fontSize: 20, fontWeight: '700' }}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 16, gap: 12 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { fontSize: 20, fontWeight: '700' },
  quit: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999 },
  bar: { height: 8, borderRadius: 4, overflow: 'hidden' },
  stage: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 24, width: '100%', maxWidth: 560, alignSelf: 'center' },
  answer: { flex: 1, minHeight: 72, borderRadius: 18, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
});
