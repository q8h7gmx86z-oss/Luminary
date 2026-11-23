import { Link } from 'expo-router';
import React, { useState } from 'react';

import { Body, Button, Card, Field, Heading, ScalePicker, Screen } from '@/components/ui';
import { dayKey, formatDuration, lastNDays, mean, parseTime, sleepMinutes } from '@/lib/logic';
import { Score, useStore } from '@/lib/store';
import { useTheme } from '@/lib/theme';

const TIPS = [
  'Get up at the same time every day, even at weekends.',
  'If you are awake for about 20 minutes, get up and do something calm in dim light. Go back to bed when sleepy.',
  'Keep your bed for sleep. Scroll, work and game somewhere else.',
  'Skip caffeine after early afternoon.',
  'Give yourself 30 to 60 minutes to wind down.',
];

export default function Sleep() {
  const { state, saveSleep } = useStore();
  const t = useTheme();
  const existing = state.sleeps[dayKey()];
  const [bed, setBed] = useState(existing?.bed ?? '23:00');
  const [wake, setWake] = useState(existing?.wake ?? '07:00');
  const [quality, setQuality] = useState<Score | null>(existing?.quality ?? null);
  const [saved, setSaved] = useState(false);

  const valid = parseTime(bed) !== null && parseTime(wake) !== null;
  const mins = valid ? sleepMinutes(bed, wake) : null;

  const week = lastNDays(7)
    .map((k) => state.sleeps[k])
    .filter(Boolean)
    .map((e) => sleepMinutes(e!.bed, e!.wake))
    .filter((m): m is number => m !== null);
  const avg = mean(week);

  return (
    <Screen>
      <Card>
        <Heading>Last night</Heading>
        <Body muted>Use 24-hour time, like 23:30 or 07:15.</Body>
        <Field label="I went to bed at" value={bed} onChangeText={(v) => { setBed(v); setSaved(false); }} inputMode="numeric" />
        <Field label="I got up at" value={wake} onChangeText={(v) => { setWake(v); setSaved(false); }} inputMode="numeric" />
        {!valid ? <Body style={{ color: t.help }}>Please enter times like 23:30.</Body> : null}
        {mins !== null ? <Body>Time in bed: {formatDuration(mins)}</Body> : null}
        <ScalePicker label="How well did you sleep?" value={quality} onChange={(v) => { setQuality(v); setSaved(false); }} low="Badly" high="Really well" />
        <Button
          label={saved ? 'Saved ✓' : existing ? 'Update' : 'Save'}
          disabled={!valid || !quality}
          onPress={() => {
            if (!quality) return;
            saveSleep({ bed, wake, quality });
            setSaved(true);
          }}
        />
      </Card>

      <Card>
        <Heading>Your week</Heading>
        <Body>
          {avg === null
            ? 'Log a few nights to see your average.'
            : `Average time in bed over ${week.length} night${week.length === 1 ? '' : 's'}: ${formatDuration(avg)}.`}
        </Body>
        <Body muted>Most teens need 8 to 10 hours, and most adults need 7 to 9.</Body>
      </Card>

      <Card>
        <Heading>Sleep skills from CBT-I</Heading>
        {TIPS.map((tip) => (
          <Body key={tip}>• {tip}</Body>
        ))}
        <Link href="/article/sleep" style={{ color: t.primary, fontWeight: '600', fontSize: 15 }}>
          Read more about better sleep
        </Link>
      </Card>
    </Screen>
  );
}
