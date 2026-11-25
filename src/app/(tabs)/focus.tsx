import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, Text, Vibration, View } from 'react-native';

import Svg, { Circle } from 'react-native-svg';

import { Body, Button, Card, Checkbox, Field, Heading, Overline, Screen } from '@/components/ui';
import { formatClock, secondsLeft } from '@/lib/logic';
import { useStore } from '@/lib/store';
import { fonts, radii, type, useTheme } from '@/lib/theme';
import { FocusTrackCard } from '@/training/FocusTrackCard';

const PRESETS = [5, 10, 15, 25];

function VisualTimer({ onRunning }: { onRunning: (running: boolean) => void }) {
  const t = useTheme();
  const [minutes, setMinutes] = useState(10);
  const [endAt, setEndAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    onRunning(endAt !== null);
    if (!endAt) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [endAt, onRunning]);

  const total = minutes * 60;
  const left = endAt ? secondsLeft(endAt, now) : total;

  useEffect(() => {
    if (endAt && left === 0) {
      setEndAt(null);
      setFinished(true);
      Vibration.vibrate(400);
    }
  }, [endAt, left]);

  const fraction = total > 0 ? left / total : 0;
  const size = 220;
  const stroke = 6;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;

  return (
    <View style={{ backgroundColor: t.surface, borderRadius: radii.panel, borderWidth: 1, borderColor: t.border, padding: 18, gap: 16, alignItems: 'center' }}>
      <View style={{ alignSelf: 'stretch', gap: 4 }}>
        <Overline color={t.teal}>Focus block</Overline>
        <Text style={[type.caption, { color: t.muted }]}>
          Time can feel invisible, especially with ADHD. A shrinking ring makes it concrete, so starting and stopping get easier.
        </Text>
      </View>

      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={size} height={size} style={{ position: 'absolute' }} accessibilityElementsHidden importantForAccessibility="no">
          <Circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(241, 240, 250, 0.08)" strokeWidth={stroke} fill="none" />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={t.teal}
            strokeWidth={stroke}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${c} ${c}`}
            strokeDashoffset={c * (1 - fraction)}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>
        <Text
          accessibilityLiveRegion="polite"
          accessibilityLabel={`${Math.ceil(left / 60)} minutes left`}
          style={[type.metric, { color: t.text, fontSize: 48 }]}
        >
          {formatClock(left)}
        </Text>
        <Text style={[type.overline, { color: t.muted, fontSize: 9.5, marginTop: 2 }]}>{endAt ? 'Stay with it' : 'Ready'}</Text>
      </View>

      {endAt ? null : (
        <View style={{ flexDirection: 'row', gap: 8, alignSelf: 'stretch' }}>
          {PRESETS.map((m) => {
            const on = m === minutes;
            return (
              <Pressable
                key={m}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                onPress={() => {
                  setMinutes(m);
                  setFinished(false);
                }}
                style={{
                  flex: 1,
                  height: 40,
                  borderRadius: 20,
                  borderWidth: 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderColor: on ? t.text : t.borderStrong,
                  backgroundColor: on ? t.text : 'transparent',
                }}
              >
                <Text style={{ color: on ? t.bg : t.muted, fontFamily: fonts.semibold, fontSize: 13 }}>{m} min</Text>
              </Pressable>
            );
          })}
        </View>
      )}
      {finished ? (
        <Text style={[type.caption, { color: t.text, textAlign: 'center' }]}>
          Block done. Take five minutes off, then go again. Short breaks keep attention fresh for the next block.
        </Text>
      ) : null}
      <View style={{ alignSelf: 'stretch' }}>
        {endAt ? (
          <Button kind="secondary" label="Stop" onPress={() => setEndAt(null)} />
        ) : (
          <Button
            label={`Start ${minutes} minutes`}
            onPress={() => {
              setFinished(false);
              setNow(Date.now());
              setEndAt(Date.now() + total * 1000);
            }}
          />
        )}
      </View>
    </View>
  );
}

function TaskBreakdown() {
  const { state, addTask, toggleStep, removeTask } = useStore();
  const [title, setTitle] = useState('');
  const [steps, setSteps] = useState('');
  const t = useTheme();

  const stepList = steps
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <Card>
      <Heading>Break it down</Heading>
      <Body muted>
        Starting is the hardest part. Split the task into steps, one per line, and make the first step so small you cannot fail it.
        Momentum does the rest.
      </Body>
      <Field label="Task" value={title} onChangeText={setTitle} placeholder="For example: tidy my room" />
      <Field
        label="Steps (one per line)"
        value={steps}
        onChangeText={setSteps}
        multiline
        style={{ minHeight: 96, textAlignVertical: 'top' }}
        placeholder={'Put clothes in the basket\nClear the desk\nTake cups to the kitchen'}
      />
      <Button
        label="Add task"
        disabled={!title.trim() || stepList.length === 0}
        onPress={() => {
          addTask(title.trim(), stepList);
          setTitle('');
          setSteps('');
        }}
      />

      {state.tasks.map((task) => {
        const doneCount = task.steps.filter((s) => s.done).length;
        const allDone = doneCount === task.steps.length;
        return (
          <View key={task.id} style={{ borderTopWidth: 1, borderTopColor: t.border, paddingTop: 12, gap: 4 }}>
            <Text style={[type.label, { color: t.text }]}>{task.title}</Text>
            <Text style={[type.caption, { color: t.muted }]}>
              {allDone ? 'All done. Well done!' : `${doneCount} of ${task.steps.length} steps done`}
            </Text>
            {task.steps.map((s) => (
              <Checkbox key={s.id} checked={s.done} label={s.text} onPress={() => toggleStep(task.id, s.id)} />
            ))}
            <Pressable accessibilityRole="button" onPress={() => removeTask(task.id)} hitSlop={8}>
              <Text style={{ color: t.muted, fontSize: 14, fontFamily: fonts.medium, paddingVertical: 6 }}>{allDone ? 'Clear task' : 'Remove task'}</Text>
            </Pressable>
          </View>
        );
      })}
    </Card>
  );
}

function IfThenPlans() {
  const { state, addPlan, removePlan } = useStore();
  const [when, setWhen] = useState('');
  const [then, setThen] = useState('');
  const t = useTheme();

  return (
    <Card>
      <Heading>When... then... plans</Heading>
      <Body muted>Tie an action to a cue you already hit every day. Across 94 studies, plans like this clearly improved follow-through, because the cue does the remembering.</Body>
      <Field label="When I..." value={when} onChangeText={setWhen} placeholder="finish breakfast" />
      <Field label="Then I will..." value={then} onChangeText={setThen} placeholder="check today's plan" />
      <Button
        label="Save plan"
        disabled={!when.trim() || !then.trim()}
        onPress={() => {
          addPlan(when.trim(), then.trim());
          setWhen('');
          setThen('');
        }}
      />
      {state.plans.map((p) => (
        <View
          key={p.id}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 8, borderTopWidth: 1, borderTopColor: t.border, paddingTop: 10 }}
        >
          <Text style={[type.body, { color: t.text, flex: 1 }]}>
            When I {p.when}, then I will {p.then}.
          </Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Remove plan" onPress={() => removePlan(p.id)} hitSlop={8}>
            <Text style={{ color: t.muted, fontSize: 18 }}>✕</Text>
          </Pressable>
        </View>
      ))}
    </Card>
  );
}

export default function Focus() {
  const t = useTheme();
  const [running, setRunning] = useState(false);
  const onRunning = useCallback((r: boolean) => setRunning(r), []);
  return (
    <Screen>
      <View style={{ gap: 6 }}>
        <Overline>Focus</Overline>
        <Text accessibilityRole="header" style={[type.title, { color: t.text }]}>
          {running ? 'One thing at a time.' : 'Clear the noise.'}
        </Text>
        <Text style={[type.body, { color: t.muted }]}>
          {running ? 'Everything else is hidden until the block ends.' : 'A timer, a plan and nothing else competing for your attention.'}
        </Text>
      </View>
      <VisualTimer onRunning={onRunning} />
      {running ? null : (
        <>
          <FocusTrackCard />
          <TaskBreakdown />
          <IfThenPlans />
        </>
      )}
    </Screen>
  );
}
