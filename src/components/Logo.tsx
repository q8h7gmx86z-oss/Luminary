import React from 'react';
import { Image, Text, View } from 'react-native';

import { useTheme } from '@/lib/theme';

const mark = require('../../assets/logo/logo-256.png');

export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <Image
      source={mark}
      style={{ width: size, height: size, borderRadius: size * 0.22 }}
      accessibilityIgnoresInvertColors
      accessible={false}
    />
  );
}

/** Logo and name, used in headers. */
export function Wordmark({ size = 28 }: { size?: number }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }} accessibilityRole="header" accessibilityLabel="Luminary">
      <LogoMark size={size} />
      <Text style={{ color: t.text, fontSize: size * 0.68, fontFamily: 'Sora_600SemiBold', letterSpacing: -0.2 }}>Luminary</Text>
    </View>
  );
}
