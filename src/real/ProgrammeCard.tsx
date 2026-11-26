import { router } from 'expo-router';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { dayKey } from '@/lib/logic';
import { State, useStore } from '@/lib/store';
import { fonts, radii, type, useTheme } from '@/lib/theme';

import { Activity, programmeById, PROGRAMME_DAYS, TargetProgress, weekOf, weekProgress } from './programmes';

export function activityOf(s: State): Activity {
  return {
    workouts: s.training.workouts,
    movement: s.movement,
    sleeps: s.sleeps,
    lessons: s.courses?.lessons,
    reviews: s.recall?.reviews,
    focusBlocks: s.focusBlocks,
    dumps: s.dumps,
    benchmarks: (s.training.benchmarks ?? []).map((b) => b.at),
  };
}

/** The running programme, its week and today's place in it. Null when none is running. */
export function useProgramme() {
  const { state } = useStore();
  const run = state.programme && !state.programme.endedAt ? state.programme : undefined;
  const p = run ? programmeById(run.id) : undefined;
  if (!run || !p) return undefined;
  const today = dayKey();
  const week = weekOf(run.start, today);
  const day = Math.min(PROGRAMME_DAYS, Math.round((Date.parse(today + 'T12:00:00Z') - Date.parse(run.start + 'T12:00:00Z')) / 86_400_000) + 1);
  const targets = week < 4 ? weekProgress(p, run.start, week, activityOf(state)) : [];
  return { run, p, week, day, targets, finished: week >= 4 };
}

export function TargetRow({ t: tp, compact }: { t: TargetProgress; compact?: boolean }) {
  const t = useTheme();
  const unit = tp.kind === 'movement' ? ' min' : '';
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${tp.label}: ${tp.done} of ${tp.n}${tp.met ? ', met' : ''}`} onPress={() => router.push(tp.href as never)} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: compact ? 4 : 8, opacity: pressed ? 0.75 : 1 })}>
      <View style={{ width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: tp.met ? t.gold : 'transparent', borderWidth: tp.met ? 0 : 1, borderColor: t.borderStrong }}>
        {tp.met ? <Icon name="check" size={13} color={t.bg} strokeWidth={2.8} /> : null}
      </View>
      <Text style={{ flex: 1, color: t.text, fontSize: 15 }}>{tp.label}</Text>
      <Text style={{ color: tp.met ? t.gold : t.muted, fontFamily: fonts.semibold, fontVariant: ['tabular-nums'] }}>
        {Math.min(tp.done, tp.n)}
        {unit} / {tp.n}
        {unit}
      </Text>
    </Pressable>
  );
}

/** On Today: the programme's week at a glance, or an invitation to start one. */
export function ProgrammeCard() {
  const t = useTheme();
  const g = useProgramme();
  if (!g) return null;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${g.p.name}, week ${Math.min(4, g.week + 1)} of 4`}
      onPress={() => router.push('/programmes')}
      style={({ pressed }) => ({ borderRadius: radii.panel, borderWidth: 1, borderColor: t.gold + '55', backgroundColor: t.surface, padding: 16, gap: 6, opacity: pressed ? 0.95 : 1 })}
    >
      <Text style={[type.overline, { color: t.gold }]}>{g.finished ? 'Programme complete' : `Week ${g.week + 1} of 4 · day ${g.day} of ${PROGRAMME_DAYS}`}</Text>
      <Text style={[type.section, { color: t.text, fontSize: 19 }]}>{g.p.name}</Text>
      {g.targets.map((tp) => (
        <TargetRow key={tp.label} t={tp} compact />
      ))}
      {g.finished ? <Text style={[type.caption, { color: t.muted }]}>Four weeks complete. See how it went.</Text> : null}
    </Pressable>
  );
}
