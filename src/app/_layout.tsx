import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { Inter_700Bold } from '@expo-google-fonts/inter/700Bold';
import { Sora_600SemiBold } from '@expo-google-fonts/sora/600SemiBold';
import { Sora_700Bold } from '@expo-google-fonts/sora/700Bold';
import { useFonts } from 'expo-font';
import { Redirect, Stack, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';

import { StoreProvider, useStore } from '@/lib/store';
import { fonts, useTheme } from '@/lib/theme';

function Gate() {
  const { state, ready } = useStore();
  const segments = useSegments();
  const t = useTheme();
  // Fonts ship inside the app. If one fails to load, the app falls back to the system font.
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Sora_600SemiBold,
    Sora_700Bold,
  });

  if (!ready || (!fontsLoaded && !fontError)) {
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
        headerStyle: { backgroundColor: t.bg },
        headerShadowVisible: false,
        headerTintColor: t.text,
        headerTitleStyle: { fontFamily: fonts.display, fontSize: 17 },
        contentStyle: { backgroundColor: t.bg },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="welcome" options={{ headerShown: false }} />
      <Stack.Screen name="help" options={{ title: 'Support services', presentation: 'modal' }} />
      <Stack.Screen name="settings" options={{ title: 'Settings and privacy' }} />
      <Stack.Screen name="preferences" options={{ title: 'Training preferences' }} />
      <Stack.Screen name="rafi/index" options={{ title: 'The Rafi Programme' }} />
      <Stack.Screen name="rafi/[id]" options={{ title: 'The Rafi Programme' }} />
      <Stack.Screen name="article/[id]" options={{ title: 'Learn' }} />
      <Stack.Screen name="backup" options={{ title: 'Backup and move' }} />
      <Stack.Screen name="stats/[game]" options={{ title: 'Game details' }} />
      <Stack.Screen name="research/index" options={{ title: 'The evidence' }} />
      <Stack.Screen name="research/[id]" options={{ title: 'The evidence' }} />
      <Stack.Screen name="mood" options={{ title: 'Mood check-in' }} />
      <Stack.Screen name="sleep" options={{ title: 'Sleep' }} />
      <Stack.Screen name="workout" options={{ headerShown: false, gestureEnabled: false }} />
      <Stack.Screen name="iq" options={{ headerShown: false, gestureEnabled: false }} />
      <Stack.Screen name="play/[game]" options={{ headerShown: false }} />
      <Stack.Screen name="championships/index" options={{ title: '' }} />
      <Stack.Screen name="benchmark/index" options={{ title: 'Benchmark' }} />
      <Stack.Screen name="benchmark/run" options={{ headerShown: false, gestureEnabled: false }} />
      <Stack.Screen name="championships/[event]" options={{ title: 'Event' }} />
      <Stack.Screen name="championships/heats" options={{ headerShown: false, gestureEnabled: false }} />
      <Stack.Screen name="championships/season" options={{ title: 'Season' }} />
      <Stack.Screen name="championships/settings" options={{ title: '' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <StoreProvider>
      <StatusBar style="light" />
      <Gate />
    </StoreProvider>
  );
}
