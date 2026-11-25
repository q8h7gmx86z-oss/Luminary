import { router } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, TextInputProps, View, ViewStyle } from 'react-native';

import { fonts, radii, space, type, useTheme } from '@/lib/theme';

import { Icon } from './Icon';

export function Screen({ children }: { children: React.ReactNode }) {
  const t = useTheme();
  return (
    <ScrollView
      style={{ backgroundColor: t.bg }}
      contentContainerStyle={styles.screen}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.inner}>{children}</View>
    </ScrollView>
  );
}

export function Title({ children }: { children: React.ReactNode }) {
  const t = useTheme();
  return (
    <Text accessibilityRole="header" style={[styles.title, { color: t.text }]}>
      {children}
    </Text>
  );
}

export function Heading({ children }: { children: React.ReactNode }) {
  const t = useTheme();
  return (
    <Text accessibilityRole="header" style={[styles.heading, { color: t.text }]}>
      {children}
    </Text>
  );
}

export function Body({ children, muted, style }: { children: React.ReactNode; muted?: boolean; style?: object }) {
  const t = useTheme();
  return <Text style={[styles.body, { color: muted ? t.muted : t.text }, style]}>{children}</Text>;
}

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  const t = useTheme();
  return <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }, style]}>{children}</View>;
}

type ButtonProps = {
  label: string;
  onPress: () => void;
  kind?: 'primary' | 'secondary' | 'help';
  disabled?: boolean;
  accessibilityHint?: string;
};

export function Button({ label, onPress, kind = 'primary', disabled, accessibilityHint }: ButtonProps) {
  const t = useTheme();
  const bg = kind === 'primary' ? t.primary : kind === 'help' ? t.help : 'transparent';
  const fg = kind === 'secondary' ? t.text : kind === 'help' ? '#0B1020' : t.primaryText;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      accessibilityHint={accessibilityHint}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: bg,
          borderWidth: kind === 'secondary' ? 1 : 0,
          borderColor: t.borderStrong,
          boxShadow: kind === 'primary' && !disabled ? t.primaryGlow : undefined,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}
    >
      <Text style={[styles.buttonText, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

export function Field(props: TextInputProps & { label: string }) {
  const t = useTheme();
  const { label, style, ...rest } = props;
  return (
    <View style={{ gap: space.xs }}>
      <Text style={[styles.label, { color: t.muted }]}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={t.muted}
        style={[styles.input, { color: t.text, borderColor: t.border, backgroundColor: t.bg }, style]}
        {...rest}
      />
    </View>
  );
}

/** A row of 1 to 5 choices, labelled at both ends. */
export function ScalePicker({
  label,
  value,
  onChange,
  low,
  high,
}: {
  label: string;
  value: number | null;
  onChange: (v: 1 | 2 | 3 | 4 | 5) => void;
  low: string;
  high: string;
}) {
  const t = useTheme();
  return (
    <View style={{ gap: space.sm }}>
      <Text style={[styles.label, { color: t.text }]}>{label}</Text>
      <View style={styles.scaleRow} accessibilityRole="radiogroup" accessibilityLabel={label}>
        {([1, 2, 3, 4, 5] as const).map((n) => {
          const on = value === n;
          return (
            <Pressable
              key={n}
              accessibilityRole="radio"
              accessibilityState={{ checked: on }}
              accessibilityLabel={`${n} of 5${n === 1 ? `, ${low}` : n === 5 ? `, ${high}` : ''}`}
              onPress={() => onChange(n)}
              style={[styles.scaleDot, { borderColor: on ? t.primary : t.borderStrong, backgroundColor: on ? t.primary : 'transparent' }]}
            >
              <Text style={{ color: on ? t.primaryText : t.text, fontSize: 17, fontFamily: fonts.display }}>{n}</Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.scaleEnds}>
        <Text style={[type.caption, { color: t.muted }]}>{low}</Text>
        <Text style={[type.caption, { color: t.muted }]}>{high}</Text>
      </View>
    </View>
  );
}

/** Header shortcut to Settings. */
export function SettingsButton() {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Settings"
      onPress={() => router.push('/settings')}
      style={({ pressed }) => [styles.iconButton, { borderColor: t.borderStrong, opacity: pressed ? 0.8 : 1 }]}
      hitSlop={8}
    >
      <Icon name="sliders" size={18} color={t.text} strokeWidth={1.8} />
    </Pressable>
  );
}

export function Checkbox({ checked, label, onPress }: { checked: boolean; label: string; onPress: () => void }) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={label}
      onPress={onPress}
      style={styles.checkRow}
    >
      <View style={[styles.box, { borderColor: checked ? t.teal : t.borderStrong, backgroundColor: checked ? t.teal : 'transparent' }]}>
        {checked ? <Icon name="check" size={16} color="#FFFFFF" strokeWidth={3} /> : null}
      </View>
      <Text style={[styles.body, { color: checked ? t.muted : t.text, flex: 1 }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { paddingHorizontal: space.gutter, paddingTop: space.md, paddingBottom: 48, alignItems: 'center' },
  inner: { width: '100%', maxWidth: 640, gap: space.lg },
  title: type.title,
  heading: type.section,
  body: type.body,
  card: { borderWidth: 1, borderRadius: radii.panel, padding: 18, gap: space.md },
  button: { minHeight: 52, borderRadius: radii.button, paddingHorizontal: space.lg, alignItems: 'center', justifyContent: 'center' },
  buttonText: { fontSize: 16, fontFamily: fonts.semibold },
  label: { fontSize: 14, fontFamily: fonts.semibold },
  input: { borderWidth: 1, borderRadius: radii.sm, paddingHorizontal: space.md, paddingVertical: 10, fontSize: 16, fontFamily: fonts.body, minHeight: 46 },
  scaleRow: { flexDirection: 'row', justifyContent: 'space-between', gap: space.sm },
  scaleDot: { flex: 1, minHeight: 48, borderRadius: radii.sm, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  scaleEnds: { flexDirection: 'row', justifyContent: 'space-between' },
  iconButton: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: 44 },
  box: { width: 24, height: 24, borderRadius: 7, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
});

/** Small tracked capitals above a heading. */
export function Overline({ children, color }: { children: React.ReactNode; color?: string }) {
  const t = useTheme();
  return <Text style={[type.overline, { color: color ?? t.muted }]}>{children}</Text>;
}
