import { Tabs } from 'expo-router/js-tabs';
import React from 'react';
import { ColorValue } from 'react-native';

import { Icon, IconName } from '@/components/Icon';
import { Wordmark } from '@/components/Logo';
import { SettingsButton } from '@/components/ui';
import { useTheme } from '@/lib/theme';

function TabIcon({ name, color, focused }: { name: IconName; color: ColorValue; focused: boolean }) {
  return <Icon name={name} color={color} size={23} strokeWidth={focused ? 2.3 : 1.8} />;
}

export default function TabsLayout() {
  const t = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: t.bg },
        headerShadowVisible: false,
        headerTintColor: t.text,
        headerTitleStyle: { fontWeight: '800' },
        headerRight: () => <SettingsButton />,
        tabBarStyle: { backgroundColor: t.surface, borderTopColor: t.border, height: 64, paddingTop: 6 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
        tabBarActiveTintColor: t.primary,
        tabBarInactiveTintColor: t.muted,
        sceneStyle: { backgroundColor: t.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Today', headerTitle: () => <Wordmark />, tabBarIcon: ({ color, focused }) => <TabIcon name="sun" color={color} focused={focused} /> }} />
      <Tabs.Screen name="train" options={{ title: 'Train', tabBarIcon: ({ color, focused }) => <TabIcon name="train" color={color} focused={focused} /> }} />
      <Tabs.Screen name="progress" options={{ title: 'Progress', tabBarIcon: ({ color, focused }) => <TabIcon name="chart" color={color} focused={focused} /> }} />
      <Tabs.Screen name="focus" options={{ title: 'Focus', tabBarIcon: ({ color, focused }) => <TabIcon name="target" color={color} focused={focused} /> }} />
      <Tabs.Screen name="learn" options={{ title: 'Learn', tabBarIcon: ({ color, focused }) => <TabIcon name="book" color={color} focused={focused} /> }} />
    </Tabs>
  );
}
