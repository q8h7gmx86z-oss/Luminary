import { Href, router } from 'expo-router';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { Icon, IconName } from '@/components/Icon';
import { fonts, radii, type, useTheme } from '@/lib/theme';

export function Panel({ children, tone, gap = 10 }: { children: React.ReactNode; tone?: string; gap?: number }) {
  const t = useTheme();
  return <View style={{ backgroundColor: t.surface, borderRadius: radii.panel, borderWidth: 1, borderColor: tone ?? t.border, padding: 16, gap }}>{children}</View>;
}

/** A tappable entry card with an overline, a title, a line of detail and an icon. */
export function EntryCard({ overline, title, detail, href, icon, colour, cta }: { overline: string; title: string; detail: string; href: Href; icon: IconName; colour: string; cta?: string }) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${overline}. ${title}`}
      onPress={() => router.push(href)}
      style={({ pressed }) => ({ borderRadius: radii.panel, borderWidth: 1, borderColor: colour + '55', backgroundColor: t.surface, padding: 18, gap: 8, opacity: pressed ? 0.92 : 1 })}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={[type.overline, { color: colour }]}>{overline}</Text>
        <Icon name={icon} size={18} color={colour} strokeWidth={1.6} />
      </View>
      <Text style={[type.section, { color: t.text, fontSize: 19 }]}>{title}</Text>
      <Text style={[type.caption, { color: t.muted }]}>{detail}</Text>
      {cta ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
          <Text style={{ color: colour, fontFamily: fonts.semibold, fontSize: 14 }}>{cta}</Text>
          <Icon name="arrow" size={15} color={colour} />
        </View>
      ) : null}
    </Pressable>
  );
}

/** A thin progress bar. */
export function Bar({ value, colour }: { value: number; colour: string }) {
  const t = useTheme();
  const v = Math.max(0, Math.min(1, value));
  return (
    <View style={{ height: 6, borderRadius: 3, backgroundColor: t.soft, overflow: 'hidden' }}>
      <View style={{ width: `${v * 100}%`, height: 6, borderRadius: 3, backgroundColor: colour }} />
    </View>
  );
}
