import { router, Stack, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { ResearchLink } from '@/components/Research';
import { Button, Overline, Screen } from '@/components/ui';
import { courseById } from '@/content/courses';
import { useStore } from '@/lib/store';
import { fonts, type, useTheme } from '@/lib/theme';
import { Bar, Panel } from '@/real/ui';
import { PlusGate } from '@/plus/PlusGate';

/** One course: its lessons in order, each opened in place, and its practice. */
function CourseScreenScreen() {
  const t = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const course = courseById(String(id));
  const { state, completeLesson } = useStore();
  const done = state.courses?.lessons ?? {};
  const firstOpen = course?.lessons.find((l) => !done[l.id])?.id ?? null;
  const [open, setOpen] = useState<string | null>(firstOpen);
  if (!course) return null;
  const n = course.lessons.filter((l) => done[l.id]).length;
  const colour = course.id === 'palace' ? t.gold : t.teal;

  return (
    <Screen>
      <Stack.Screen options={{ title: course.title }} />
      <View style={{ gap: 6 }}>
        <Overline color={colour}>
          {n} of {course.lessons.length} lessons complete
        </Overline>
        <Text accessibilityRole="header" style={[type.title, { color: t.text }]}>
          {course.title}
        </Text>
        <Text style={[type.body, { color: t.muted }]}>{course.subtitle}</Text>
        <Bar value={n / course.lessons.length} colour={colour} />
      </View>

      {course.lessons.map((l, i) => {
        const isOpen = open === l.id;
        const isDone = !!done[l.id];
        return (
          <Panel key={l.id} tone={isOpen ? colour + '66' : undefined}>
            <Pressable accessibilityRole="button" accessibilityState={{ expanded: isOpen }} onPress={() => setOpen(isOpen ? null : l.id)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: isDone ? colour : 'transparent', borderWidth: isDone ? 0 : 1, borderColor: t.borderStrong }}>
                {isDone ? <Icon name="check" size={15} color={t.bg} strokeWidth={2.6} /> : <Text style={{ color: t.muted, fontFamily: fonts.semibold, fontSize: 13 }}>{i + 1}</Text>}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: t.text, fontFamily: fonts.semibold, fontSize: 16 }}>{l.title}</Text>
                <Text style={[type.caption, { color: t.muted }]}>{l.minutes} minutes</Text>
              </View>
            </Pressable>
            {isOpen ? (
              <View style={{ gap: 12 }}>
                {l.body.map((para, k) => (
                  <Text key={k} style={[type.body, { color: t.text }]}>
                    {para}
                  </Text>
                ))}
                <View style={{ borderLeftWidth: 2, borderLeftColor: colour, paddingLeft: 12, gap: 4 }}>
                  <Text style={[type.overline, { color: colour }]}>Practise</Text>
                  <Text style={[type.body, { color: t.text }]}>{l.practise}</Text>
                </View>
                {isDone ? (
                  <Text style={[type.caption, { color: colour }]}>Lesson complete.</Text>
                ) : (
                  <Button
                    label="I have done the practice"
                    onPress={() => {
                      completeLesson(l.id);
                      setOpen(course.lessons[i + 1]?.id ?? null);
                    }}
                  />
                )}
              </View>
            ) : null}
          </Panel>
        );
      })}

      <Button label={course.practice.label} kind="secondary" onPress={() => router.push(course.practice.href as never)} />
      <ResearchLink id={course.evidence} />
    </Screen>
  );
}

export default function CourseScreen() {
  return (
    <PlusGate feature="courses">
      <CourseScreenScreen />
    </PlusGate>
  );
}
