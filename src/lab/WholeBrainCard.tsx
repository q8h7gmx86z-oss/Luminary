import { Href, router } from 'expo-router';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { FACTORS, recordFor } from '@/content/rafi';
import { dayKey, formatDuration } from '@/lib/logic';
import { useStore } from '@/lib/store';
import { fonts, radii, type, useTheme } from '@/lib/theme';
import { MOVE_TARGET, weekSummary } from '@/lib/wholebrain';


import { analyse, armFor } from './lab';

function Row({ label, value, note, href, good }: { label: string; value: string; note: string; href: Href; good?: boolean }) {
  const t = useTheme();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${label}: ${value}. ${note}`} onPress={() => router.push(href)} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderTopWidth: 1, borderTopColor: t.border, opacity: pressed ? 0.8 : 1 })}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ color: t.text, fontFamily: fonts.semibold, fontSize: 15 }}>{label}</Text>
        <Text style={[type.caption, { color: t.muted }]}>{note}</Text>
      </View>
      <Text style={{ color: good ? t.gold : t.text, fontFamily: fonts.semibold, fontSize: 15, fontVariant: ['tabular-nums'] }}>{value}</Text>
      <Icon name="arrow" size={14} color={t.muted} />
    </Pressable>
  );
}

/** The whole-brain week: the training and the habits the research links to brain health, side by side. */
export function WholeBrainCard() {
  const t = useTheme();
  const { state } = useStore();
  const rafiDone = FACTORS.filter((f) => recordFor(f.id, state.rafiPlan, state.rafi).status === 'done').length;
  const w = weekSummary({ workouts: state.training.workouts, movement: state.movement, sleeps: state.sleeps, moods: state.moods, rafiDone, rafiTotal: FACTORS.length });
  return (
    <View style={{ backgroundColor: t.surface, borderRadius: radii.panel, borderWidth: 1, borderColor: t.border, padding: 16, gap: 4 }}>
      <Text style={[type.overline, { color: t.lavender }]}>The whole brain · last seven days</Text>
      <Text style={[type.body, { color: t.muted, marginBottom: 6 }]}>Training is one part. Movement, sleep and your risk factors matter too.</Text>
      <Row label="Training" value={`${w.trainingDays} ${w.trainingDays === 1 ? 'day' : 'days'}`} note="About three sessions a week is the evidence-based target." href="/workout" good={w.trainingDays >= 3} />
      <Row label="Movement" value={`${w.movementMinutes} min`} note={`Guideline: ${MOVE_TARGET} minutes of moderate activity a week.`} href="/movement" good={w.movementMinutes >= MOVE_TARGET} />
      <Row
        label="Sleep"
        value={w.sleepAvg === null ? 'Not logged' : formatDuration(w.sleepAvg)}
        note={w.sleepAvg === null ? 'Log your nights to see your average.' : `Average over ${w.sleepNights} logged ${w.sleepNights === 1 ? 'night' : 'nights'}. Adults need seven to nine hours.`}
        href="/sleep"
        good={w.sleepAvg !== null && w.sleepAvg >= 420}
      />
      <Row label="Focus" value={w.focusAvg === null ? 'Not logged' : `${w.focusAvg} / 5`} note="Your own rating from the daily check-in." href="/mood" />
      <Row label="Risk factors in place" value={`${w.rafiDone} of ${w.rafiTotal}`} note="The Rafi Programme: the 14 factors from the Lancet Commission." href="/rafi" good={w.rafiDone === w.rafiTotal} />
    </View>
  );
}

/** Entry point to the Personal Lab, with the running experiment's state. */
export function LabCard() {
  const t = useTheme();
  const { state } = useStore();
  const running = (state.lab ?? []).filter((e) => !e.endedAt).pop();
  const r = running ? analyse(running) : undefined;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Personal Lab"
      onPress={() => router.push('/lab')}
      style={({ pressed }) => ({ borderRadius: radii.panel, borderWidth: 1, borderColor: 'rgba(232,189,114,0.32)', backgroundColor: t.surface, padding: 18, gap: 8, opacity: pressed ? 0.92 : 1 })}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={[type.overline, { color: t.gold }]}>Personal Lab</Text>
        <Icon name="bulb" size={18} color={t.gold} strokeWidth={1.6} />
      </View>
      <Text style={[type.section, { color: t.text, fontSize: 19 }]}>{running ? running.question : 'Test what sharpens you.'}</Text>
      <Text style={[type.caption, { color: t.muted }]}>
        {running
          ? `${running.entries.length} of ${running.schedule.length} days checked · ${r && r.pairs ? `${r.pairs} complete ${r.pairs === 1 ? 'pair' : 'pairs'}` : 'no complete pairs yet'}`
          : 'Does a walk, an earlier night or your morning coffee really change your alertness? Run a randomised experiment on yourself and find out.'}
      </Text>
    </Pressable>
  );
}

/** On Today, only while an experiment runs and today's check is still to do. */
export function LabToday() {
  const t = useTheme();
  const { state } = useStore();
  const running = (state.lab ?? []).filter((e) => !e.endedAt).pop();
  const today = dayKey();
  const arm = running ? armFor(running, today) : null;
  if (!running || !arm || running.entries.some((e) => e.day === today)) return null;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push('/lab')}
      style={({ pressed }) => ({ borderRadius: radii.panel, borderWidth: 1, borderColor: 'rgba(232,189,114,0.45)', backgroundColor: t.surface, padding: 16, gap: 6, opacity: pressed ? 0.92 : 1 })}
    >
      <Text style={[type.overline, { color: t.gold }]}>Personal Lab · today is {arm === 'A' ? 'an A' : 'a B'} day</Text>
      <Text style={[type.body, { color: t.text }]}>{arm === 'A' ? running.a : running.b}</Text>
      <Text style={[type.caption, { color: t.muted }]}>Then take your two-minute alertness check.</Text>
    </Pressable>
  );
}
