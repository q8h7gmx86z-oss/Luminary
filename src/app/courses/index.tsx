import React from 'react';
import { Text, View } from 'react-native';

import { Overline, Screen } from '@/components/ui';
import { COURSES } from '@/content/courses';
import { useStore } from '@/lib/store';
import { type, useTheme } from '@/lib/theme';
import { EntryCard } from '@/real/ui';
import { PlusGate } from '@/plus/PlusGate';

/** The memory courses. */
function CoursesScreen() {
  const t = useTheme();
  const { state } = useStore();
  const done = state.courses?.lessons ?? {};
  return (
    <Screen>
      <View style={{ gap: 6 }}>
        <Overline color={t.lavender}>Memory courses</Overline>
        <Text accessibilityRole="header" style={[type.title, { color: t.text }]}>
          Remember what matters.
        </Text>
        <Text style={[type.body, { color: t.muted }]}>
          Training sharpens the skills behind memory. Technique changes how much you actually remember: names, lists, what you read. Each course is four
          short lessons with practice built in.
        </Text>
      </View>
      {COURSES.map((c, i) => {
        const n = c.lessons.filter((l) => done[l.id]).length;
        return (
          <EntryCard
            key={c.id}
            overline={`Course ${i + 1} · ${n} of ${c.lessons.length} lessons`}
            title={c.title}
            detail={c.subtitle}
            href={`/courses/${c.id}`}
            icon={c.id === 'palace' ? 'grid' : 'book'}
            colour={c.id === 'palace' ? t.gold : t.teal}
            cta={n === 0 ? 'Begin' : n === c.lessons.length ? 'Review' : 'Continue'}
          />
        );
      })}
    </Screen>
  );
}

export default function Courses() {
  return (
    <PlusGate feature="courses">
      <CoursesScreen />
    </PlusGate>
  );
}
