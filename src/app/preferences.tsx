import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { Body, Card, Heading, Screen, Title } from '@/components/ui';
import { Settings, useStore } from '@/lib/store';
import { useTheme } from '@/lib/theme';
import { Goal, GOAL_NAMES } from '@/training/planner';

function Segmented<T extends string | number>({ value, options, onChange, label }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; label: string }) {
  const t = useTheme();
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label} style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={String(o.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            onPress={() => onChange(o.value)}
            style={{
              flexGrow: 1,
              minHeight: 44,
              paddingHorizontal: 14,
              borderRadius: 12,
              borderWidth: 2,
              alignItems: 'center',
              justifyContent: 'center',
              borderColor: on ? t.primary : t.border,
              backgroundColor: on ? t.soft : t.surface,
            }}
          >
            <Text style={{ color: t.text, fontWeight: on ? '800' : '600' }}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function Row({ title, why, children }: { title: string; why: string; children: React.ReactNode }) {
  return (
    <Card>
      <Heading>{title}</Heading>
      <Body muted>{why}</Body>
      {children}
    </Card>
  );
}

/** Training preferences. Every brain trains differently; these let people set it up their way. */
export default function Preferences() {
  const { state, setSetting } = useStore();
  const s = state.settings;
  const set = <K extends keyof Settings>(k: K) => (v: Settings[K]) => setSetting(k, v);
  const soundValue = !s.sound ? 'off' : s.volume;

  return (
    <Screen>
      <Title>Your training</Title>
      <Body muted>Set Luminary up the way your brain works best. Change anything, any time.</Body>

      <Row title="Training goal" why="Your plan puts extra work into this area. Mixed lets Luminary target whichever skill has the most room to grow.">
        <Segmented<Goal>
          label="Training goal"
          value={s.goal}
          onChange={set('goal')}
          options={(Object.keys(GOAL_NAMES) as Goal[]).map((g) => ({ value: g, label: GOAL_NAMES[g] }))}
        />
      </Row>

      <Row title="Session length" why="Short sessions done often beat long ones done rarely. Pick what fits your day.">
        <Segmented<Settings['sessionMinutes']>
          label="Session length"
          value={s.sessionMinutes}
          onChange={set('sessionMinutes')}
          options={[3, 5, 10, 15].map((m) => ({ value: m as Settings['sessionMinutes'], label: `${m} min` }))}
        />
      </Row>

      <Row title="Challenge level" why="How quickly games get harder. Push moves you up sooner; steady gives you more time at each level.">
        <Segmented<Settings['challenge']>
          label="Challenge level"
          value={s.challenge}
          onChange={set('challenge')}
          options={[
            { value: 'steady', label: 'Steady' },
            { value: 'balanced', label: 'Balanced' },
            { value: 'push', label: 'Push me' },
          ]}
        />
      </Row>

      <Row title="Time pressure" why="Untimed removes answer deadlines and slows paced games. Good for learning a game, or on days when the clock gets in the way.">
        <Segmented<'timed' | 'untimed'>
          label="Time pressure"
          value={s.timed ? 'timed' : 'untimed'}
          onChange={(v) => setSetting('timed', v === 'timed')}
          options={[
            { value: 'timed', label: 'Timed' },
            { value: 'untimed', label: 'Untimed' },
          ]}
        />
      </Row>

      <Row title="Visuals" why="Minimal turns off glows and moving effects for a calmer screen.">
        <Segmented<Settings['visuals']>
          label="Visuals"
          value={s.visuals}
          onChange={set('visuals')}
          options={[
            { value: 'minimal', label: 'Minimal' },
            { value: 'standard', label: 'Standard' },
          ]}
        />
      </Row>

      <Row title="Sound" why="Gentle cues for right and wrong answers. Turn them down or off if they distract you.">
        <Segmented<'off' | 'gentle' | 'standard'>
          label="Sound"
          value={soundValue}
          onChange={(v) => {
            setSetting('sound', v !== 'off');
            if (v !== 'off') setSetting('volume', v);
          }}
          options={[
            { value: 'off', label: 'Off' },
            { value: 'gentle', label: 'Gentle' },
            { value: 'standard', label: 'Standard' },
          ]}
        />
      </Row>

      <Row title="Breaks between games" why="Adds a pause screen between games. Take as long as you like before the next one.">
        <Segmented<'on' | 'off'>
          label="Breaks between games"
          value={s.breaks ? 'on' : 'off'}
          onChange={(v) => setSetting('breaks', v === 'on')}
          options={[
            { value: 'off', label: 'Straight through' },
            { value: 'on', label: 'Pause between games' },
          ]}
        />
      </Row>

      <Row title="Vibration" why="A light tap for right answers and a short buzz for wrong ones. Phones only.">
        <Segmented<'on' | 'off'>
          label="Vibration"
          value={s.vibration ? 'on' : 'off'}
          onChange={(v) => setSetting('vibration', v === 'on')}
          options={[
            { value: 'on', label: 'On' },
            { value: 'off', label: 'Off' },
          ]}
        />
      </Row>
    </Screen>
  );
}
