import { Tabs } from 'expo-router/js-tabs';
import React from 'react';
import { ColorValue, View } from 'react-native';

import { Icon, IconName } from '@/components/Icon';
import { Wordmark } from '@/components/Logo';
import { SettingsButton } from '@/components/ui';
import { fonts, useTheme } from '@/lib/theme';

/** Tab icon with a soft lavender light above the active tab, so the state is not shown by colour alone. */
function TabIcon({ name, color, focused }: { name: IconName; color: ColorValue; focused: boolean }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <View
        style={{
          position: 'absolute',
          top: -9,
          width: 26,
          height: 2,
          borderRadius: 1,
          backgroundColor: focused ? '#A995FF' : 'transparent',
          boxShadow: focused ? '0px 0px 10px 2px rgba(169, 149, 255, 0.7)' : undefined,
        }}
      />
      <Icon name={name} color={color} size={22} strokeWidth={focused ? 2 : 1.7} />
    </View>
  );
}

export default function TabsLayout() {
  const t = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: t.bg },
        headerShadowVisible: false,
        headerTintColor: t.text,
        headerTitleStyle: { fontFamily: fonts.display, fontSize: 17 },
        headerRight: () => <SettingsButton />,
        tabBarStyle: { backgroundColor: t.bg, borderTopColor: t.border, height: 66, paddingTop: 8 },
        tabBarLabelStyle: { fontSize: 10.5, fontFamily: fonts.semibold, letterSpacing: 0.2 },
        tabBarActiveTintColor: t.text,
        tabBarInactiveTintColor: '#6E7493',
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
