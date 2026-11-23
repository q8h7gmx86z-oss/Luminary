import React, { useState } from 'react';
import { Text, View } from 'react-native';

import { Body, Button, Card, Field, Heading, ScalePicker, Screen } from '@/components/ui';
import { dayKey, lastNDays } from '@/lib/logic';
import { Score, useStore } from '@/lib/store';
import { useTheme } from '@/lib/theme';

const DAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function WeekBars() {
  const { state } = useStore();
  const t = useTheme();
  const days = lastNDays(7);
  return (
    <Card>
      <Heading>Your last 7 days</Heading>
      <View
        style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, height: 120 }}
        accessible
        accessibilityLabel={days
          .map((k) => {
            const m = state.moods[k];
            return `${DAY[new Date(k + 'T12:00').getDay()]}: ${m ? `mood ${m.mood} of 5` : 'no entry'}`;
          })
          .join(', ')}
      >
        {days.map((k) => {
          const m = state.moods[k];
          return (
            <View key={k} style={{ flex: 1, alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
              <View
                style={{
                  width: '70%',
                  height: m ? `${(m.mood / 5) * 80}%` : 4,
                  borderRadius: 6,
                  backgroundColor: m ? t.primary : t.border,
                }}
              />
              <Text style={{ color: t.muted, fontSize: 12 }}>{DAY[new Date(k + 'T12:00').getDay()]}</Text>
            </View>
          );
        })}
      </View>
    </Card>
  );
}

export default function Mood() {
  const { state, saveMood } = useStore();
  const existing = state.moods[dayKey()];
  const [mood, setMood] = useState<Score | null>(existing?.mood ?? null);
  const [energy, setEnergy] = useState<Score | null>(existing?.energy ?? null);
  const [focus, setFocus] = useState<Score | null>(existing?.focus ?? null);
  const [note, setNote] = useState(existing?.note ?? '');
  const [saved, setSaved] = useState(false);
  const t = useTheme();


  return (
    <Screen>
      <Card>
        <Heading>How are you today?</Heading>
        <Body muted>Ten seconds. Tracking how you feel shows what drives your best days.</Body>
        <ScalePicker label="Mood" value={mood} onChange={(v) => { setMood(v); setSaved(false); }} low="Very low" high="Great" />
        <ScalePicker label="Energy" value={energy} onChange={(v) => { setEnergy(v); setSaved(false); }} low="Drained" high="Full of energy" />
        <ScalePicker label="Focus" value={focus} onChange={(v) => { setFocus(v); setSaved(false); }} low="Scattered" high="Sharp" />
        <Field
          label="Anything on your mind? (optional)"
          value={note}
          onChangeText={(v) => { setNote(v); setSaved(false); }}
          multiline
          style={{ minHeight: 80, textAlignVertical: 'top' }}
        />
        <Button
          label={saved ? 'Saved ✓' : existing ? 'Update check-in' : 'Save check-in'}
          disabled={!mood || !energy || !focus}
          onPress={() => {
            if (!mood || !energy || !focus) return;
            saveMood({ mood, energy, focus, note: note.trim() || undefined });
            setSaved(true);
          }}
        />
      </Card>


      <Card>
        <Heading>One-minute reset</Heading>
        <Body>Breathe in slowly for 4 counts. Hold for 4. Breathe out for 6. Repeat five times.</Body>
        <Body muted>A long out-breath slows your heart rate through the vagus nerve. Slow-breathing training lowers stress and anxiety in trials.</Body>
      </Card>

      <WeekBars />
    </Screen>
  );
}
