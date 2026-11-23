import React, { useEffect, useState } from 'react';
import { Pressable, Text, Vibration, View } from 'react-native';

import { Body, Button, Card, Checkbox, Field, Heading, Screen } from '@/components/ui';
import { formatClock, secondsLeft } from '@/lib/logic';
import { useStore } from '@/lib/store';
import { useTheme } from '@/lib/theme';
import { FocusTrackCard } from '@/training/FocusTrackCard';

const PRESETS = [5, 10, 15, 25];

function VisualTimer() {
  const t = useTheme();
  const [minutes, setMinutes] = useState(10);
  const [endAt, setEndAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    if (!endAt) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [endAt]);

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

  return (
    <Card>
      <Heading>Visual timer</Heading>
      <Body muted>ADHD can make time feel invisible. A shrinking bar makes it concrete, so starting and stopping get easier.</Body>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {PRESETS.map((m) => (
          <Pressable
            key={m}
            accessibilityRole="button"
            accessibilityState={{ selected: m === minutes }}
            disabled={!!endAt}
            onPress={() => {
              setMinutes(m);
              setFinished(false);
            }}
            style={{
              flex: 1,
              minHeight: 44,
              borderRadius: 10,
              borderWidth: 2,
              alignItems: 'center',
              justifyContent: 'center',
              borderColor: m === minutes ? t.primary : t.border,
              backgroundColor: m === minutes ? t.soft : t.surface,
              opacity: endAt ? 0.5 : 1,
            }}
          >
            <Text style={{ color: t.text, fontWeight: '600' }}>{m} min</Text>
          </Pressable>
        ))}
      </View>
      <Text
        accessibilityLiveRegion="polite"
        accessibilityLabel={`${Math.ceil(left / 60)} minutes left`}
        style={{ fontSize: 48, fontWeight: '700', textAlign: 'center', color: t.text, fontVariant: ['tabular-nums'] }}
      >
        {formatClock(left)}
      </Text>
      <View style={{ height: 18, borderRadius: 9, backgroundColor: t.soft, overflow: 'hidden' }}>
        <View style={{ width: `${fraction * 100}%`, height: '100%', backgroundColor: t.primary }} />
      </View>
      {finished ? <Body>Block done. Take five minutes off, then go again. Short breaks keep attention fresh for the next block.</Body> : null}
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
    </Card>
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
            <Text style={{ color: t.text, fontSize: 17, fontWeight: '700' }}>{task.title}</Text>
            <Text style={{ color: t.muted, fontSize: 13 }}>
              {allDone ? 'All done. Well done!' : `${doneCount} of ${task.steps.length} steps done`}
            </Text>
            {task.steps.map((s) => (
              <Checkbox key={s.id} checked={s.done} label={s.text} onPress={() => toggleStep(task.id, s.id)} />
            ))}
            <Pressable accessibilityRole="button" onPress={() => removeTask(task.id)} hitSlop={8}>
              <Text style={{ color: t.muted, fontSize: 14, paddingVertical: 6 }}>{allDone ? 'Clear task' : 'Remove task'}</Text>
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
          <Text style={{ color: t.text, fontSize: 16, flex: 1 }}>
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
  return (
    <Screen>
      <FocusTrackCard />
      <VisualTimer />
      <TaskBreakdown />
      <IfThenPlans />
    </Screen>
  );
}
