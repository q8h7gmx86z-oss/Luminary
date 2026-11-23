import { Redirect, Stack, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';

import { StoreProvider, useStore } from '@/lib/store';
import { useTheme } from '@/lib/theme';

function Gate() {
  const { state, ready } = useStore();
  const segments = useSegments();
  const t = useTheme();

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: t.bg }}>
        <ActivityIndicator color={t.primary} />
      </View>
    );
  }

  // Crisis help must always be reachable, even before onboarding.
  const onPublicRoute = segments[0] === 'welcome' || segments[0] === 'help';
  if (!state.onboarded && !onPublicRoute) return <Redirect href="/welcome" />;

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: t.surface },
        headerTintColor: t.text,
        contentStyle: { backgroundColor: t.bg },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="welcome" options={{ headerShown: false }} />
      <Stack.Screen name="help" options={{ title: 'Support services', presentation: 'modal' }} />
      <Stack.Screen name="settings" options={{ title: 'Settings and privacy' }} />
      <Stack.Screen name="article/[id]" options={{ title: 'Learn' }} />
      <Stack.Screen name="mood" options={{ title: 'Mood check-in' }} />
      <Stack.Screen name="sleep" options={{ title: 'Sleep' }} />
      <Stack.Screen name="workout" options={{ headerShown: false, gestureEnabled: false }} />
      <Stack.Screen name="iq" options={{ headerShown: false, gestureEnabled: false }} />
      <Stack.Screen name="play/[game]" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <StoreProvider>
      <StatusBar style="auto" />
      <Gate />
    </StoreProvider>
  );
}
