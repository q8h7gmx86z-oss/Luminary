import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import React from 'react';
import { Platform, View } from 'react-native';

import { Body, Button, Card, Heading, Screen } from '@/components/ui';
import { HelpLine, REGION_NAMES, helpLinesFor, smsUrl, telUrl } from '@/lib/crisis';
import { useStore } from '@/lib/store';
import { useTheme } from '@/lib/theme';

function Line({ line }: { line: HelpLine }) {
  const t = useTheme();
  return (
    <Card style={line.emergency ? { borderColor: t.help, borderWidth: 2 } : undefined}>
      <Heading>{line.name}</Heading>
      <Body>{line.detail}</Body>
      <View style={{ gap: 8 }}>
        {line.call ? (
          <Button
            kind={line.emergency ? 'help' : 'primary'}
            label={`Call ${line.callLabel ?? line.call}`}
            onPress={() => Linking.openURL(telUrl(line.call!))}
          />
        ) : null}
        {line.text ? (
          <Button
            kind="secondary"
            label={line.text.body ? `Text ${line.text.body} to ${line.text.to}` : `Text ${line.text.to}`}
            onPress={() => Linking.openURL(smsUrl(line.text!.to, line.text!.body, Platform.OS))}
          />
        ) : null}
        {line.url ? <Button kind="secondary" label="Open website" onPress={() => Linking.openURL(line.url!)} /> : null}
      </View>
    </Card>
  );
}

export default function Help() {
  const { state } = useStore();
  const all = helpLinesFor(state.region);
  // Young people see youth lines first, after the emergency number.
  const lines =
    state.ageGroup === 'under18'
      ? [...all.filter((l) => l.emergency), ...all.filter((l) => l.young), ...all.filter((l) => !l.emergency && !l.young)]
      : all;

  return (
    <Screen>
      <Body>
        If you are thinking about ending your life, or you are not safe right now, please reach out. You do not have to go
        through this alone, and talking to someone can help.
      </Body>
      {lines.map((l) => (
        <Line key={l.name} line={l} />
      ))}
      <Body muted>
        Showing support for {REGION_NAMES[state.region]}. You can change your region in Settings. Luminary cannot see or
        respond to what you write, so it cannot send help to you.
      </Body>
      <Button
        kind="secondary"
        label={state.onboarded ? 'Back to Luminary' : 'Back'}
        onPress={() => (router.canGoBack() ? router.back() : router.replace(state.onboarded ? '/' : '/welcome'))}
      />
    </Screen>
  );
}
