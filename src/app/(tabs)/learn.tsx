import { router } from 'expo-router';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { NavyGlow } from '@/components/GameBadge';
import { Icon } from '@/components/Icon';
import { Overline, Screen } from '@/components/ui';
import { ARTICLES } from '@/content/content';
import { fonts, radii, type, useTheme } from '@/lib/theme';
import { EntryCard } from '@/real/ui';

/** Reading time at about 200 words a minute, never less than one. */
function minutes(body: string[]): number {
  const words = body.join(' ').split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

export default function Learn() {
  const t = useTheme();
  return (
    <Screen>
      <View style={{ gap: 6 }}>
        <Overline>The science library</Overline>
        <Text accessibilityRole="header" style={[type.title, { color: t.text }]}>
          Why every task works.
        </Text>
        <Text style={[type.body, { color: t.muted }]}>Short reads on the research behind your training. Every claim is sourced.</Text>
      </View>

      <Pressable accessibilityRole="button" accessibilityLabel="The evidence. Every game and tool linked to its peer-reviewed papers." onPress={() => router.push('/research')}>
        {({ pressed }) => (
          <View
            style={{
              backgroundColor: t.surface,
              borderRadius: radii.panel,
              borderWidth: 1,
              borderColor: t.border,
              padding: 18,
              gap: 6,
              overflow: 'hidden',
              opacity: pressed ? 0.92 : 1,
            }}
          >
            <NavyGlow height={160} color={t.primary} />
            <Overline color={t.lavender}>The evidence</Overline>
            <Text style={[type.section, { color: t.text, fontSize: 20 }]}>Don’t take our word for it</Text>
            <Text style={[type.caption, { color: t.muted }]}>
              Every game and tool, linked to the peer-reviewed papers behind it, with an honest rating of how strong the evidence is.
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 }}>
              <Text style={{ color: t.lavender, fontFamily: fonts.semibold, fontSize: 14 }}>Read the research</Text>
              <Icon name="arrow" size={16} color={t.lavender} />
            </View>
          </View>
        )}
      </Pressable>

      <EntryCard
        overline="Four-week programmes"
        title="A month with a purpose"
        detail="Faster Thinking, Memory Foundations, Steady Focus or The Whole Brain: one goal, weekly targets, tracked for you."
        href="/programmes"
        icon="target"
        colour={t.gold}
        cta="Choose a programme"
      />

      <EntryCard
        overline="Memory courses"
        title="Remember what matters"
        detail="The Memory Palace, and Remember for Good with your own recall deck. Short lessons with practice built in."
        href="/courses"
        icon="book"
        colour={t.teal}
        cta="Open the courses"
      />

      <Pressable accessibilityRole="button" onPress={() => router.push('/rafi')}>
        {({ pressed }) => (
          <View
            style={{
              backgroundColor: t.surface,
              borderRadius: radii.panel,
              borderWidth: 1,
              borderColor: t.border,
              padding: 18,
              gap: 6,
              overflow: 'hidden',
              opacity: pressed ? 0.92 : 1,
            }}
          >
            <NavyGlow height={160} color={t.gold} />
            <Overline color={t.gold}>The Rafi Programme</Overline>
            <Text style={[type.section, { color: t.text, fontSize: 20 }]}>Protect your brain for life</Text>
            <Text style={[type.caption, { color: t.muted }]}>The 14 changeable dementia risk factors, turned into your personal plan.</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 }}>
              <Text style={{ color: t.gold, fontFamily: fonts.semibold, fontSize: 14 }}>Open your plan</Text>
              <Icon name="arrow" size={16} color={t.gold} />
            </View>
          </View>
        )}
      </Pressable>

      <View>
        {ARTICLES.map((a, i) => (
          <Pressable
            key={a.id}
            accessibilityRole="link"
            accessibilityLabel={`${a.title}. ${minutes(a.body)} minute read.`}
            onPress={() => router.push(`/article/${a.id}`)}
            style={({ pressed }) => ({
              flexDirection: 'row',
              gap: 14,
              paddingVertical: 16,
              borderTopWidth: 1,
              borderTopColor: t.border,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text style={{ color: t.lavender, fontFamily: fonts.display, fontSize: 13, width: 22, marginTop: 3, fontVariant: ['tabular-nums'] }}>
              {String(i + 1).padStart(2, '0')}
            </Text>
            <View style={{ flex: 1, gap: 6 }}>
              <Text style={[type.section, { color: t.text, fontSize: 16.5, lineHeight: 22 }]}>{a.title}</Text>
              <Text style={[type.caption, { color: t.muted, lineHeight: 18 }]}>{a.summary}</Text>
              <Text style={[type.overline, { color: t.muted, fontSize: 9.5, marginTop: 2 }]}>
                {minutes(a.body)} min read · {a.sources.length} {a.sources.length === 1 ? 'source' : 'sources'}
              </Text>
            </View>
            <View style={{ justifyContent: 'center' }}>
              <Icon name="arrow" size={16} color={t.muted} />
            </View>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}
