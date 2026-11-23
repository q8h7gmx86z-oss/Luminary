import { Tabs } from 'expo-router/js-tabs';
import React from 'react';
import { ColorValue, Text } from 'react-native';

import { HelpButton } from '@/components/ui';
import { useTheme } from '@/lib/theme';

function Icon({ glyph, color }: { glyph: string; color: ColorValue }) {
  return <Text style={{ fontSize: 20, color }} accessibilityElementsHidden importantForAccessibility="no">{glyph}</Text>;
}

export default function TabsLayout() {
  const t = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: t.surface },
        headerTintColor: t.text,
        headerRight: () => <HelpButton />,
        tabBarStyle: { backgroundColor: t.surface, borderTopColor: t.border },
        tabBarActiveTintColor: t.primary,
        tabBarInactiveTintColor: t.muted,
        sceneStyle: { backgroundColor: t.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Today', tabBarIcon: ({ color }) => <Icon glyph="☀" color={color} /> }} />
      <Tabs.Screen name="focus" options={{ title: 'Focus', tabBarIcon: ({ color }) => <Icon glyph="◎" color={color} /> }} />
      <Tabs.Screen name="mood" options={{ title: 'Mood', tabBarIcon: ({ color }) => <Icon glyph="♡" color={color} /> }} />
      <Tabs.Screen name="sleep" options={{ title: 'Sleep', tabBarIcon: ({ color }) => <Icon glyph="☾" color={color} /> }} />
      <Tabs.Screen name="learn" options={{ title: 'Learn', tabBarIcon: ({ color }) => <Icon glyph="✦" color={color} /> }} />
    </Tabs>
  );
}
