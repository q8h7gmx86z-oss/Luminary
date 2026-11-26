import React from 'react';
import { Pressable, Switch, Text, View } from 'react-native';

import { ResearchLink } from '@/components/Research';
import { Overline, Screen } from '@/components/ui';
import { useStore } from '@/lib/store';
import { fonts, radii, type, useTheme } from '@/lib/theme';
import { Challenge } from '@/training/engine';

const LEVELS: { id: Challenge; name: string; pct: string; blurb: string }[] = [
  { id: 'steady', name: 'Steady', pct: '90%', blurb: 'Targets 90% accuracy. Suited to new users, recovery days or a more measured pace.' },
  { id: 'balanced', name: 'Threshold', pct: '85%', blurb: 'Targets 85% accuracy, the level associated with the fastest learning. Recommended.' },
  { id: 'push', name: 'Stretch', pct: '75%', blurb: 'Targets 75% accuracy. Higher demand and greater fatigue, for deliberate stretch sessions.' },
];

/** Training intensity and presentation. Shared with the rest of Luminary's training. */
export default function ChampionshipSettings() {
  const t = useTheme();
  const { state, setSetting, setChooseOrder } = useStore();
  const s = state.settings;
  const current = LEVELS.find((l) => l.id === s.challenge) ?? LEVELS[1];
  const toggles = [
    { name: 'Untimed events', note: 'No time pressure. Untimed records are kept separately.', on: !s.timed, set: (v: boolean) => setSetting('timed', !v) },
    { name: 'Low stimulation', note: 'Removes glow, flashes and animated counts.', on: s.visuals === 'minimal', set: (v: boolean) => setSetting('visuals', v ? 'minimal' : 'standard') },
    { name: 'Choose my event order', note: 'When off, Luminary schedules your weakest event first, while attention is highest.', on: !!state.championships?.chooseOrder, set: setChooseOrder },
    { name: 'Sound cues', note: 'Discreet audio feedback on each response.', on: s.sound, set: (v: boolean) => setSetting('sound', v) },
  ];

  return (
    <Screen>
      <View style={{ gap: 6 }}>
        <Text accessibilityRole="header" style={[type.title, { color: t.text }]}>
          Training settings
        </Text>
        <Text style={[type.body, { color: t.muted, fontSize: 14 }]}>Calibrate training intensity and presentation to suit how you work best. These settings apply across Luminary.</Text>
      </View>

      <View style={{ borderRadius: radii.row, borderWidth: 1, borderColor: t.border, backgroundColor: t.surface, padding: 16, gap: 12 }}>
        <Text style={[type.label, { color: t.text }]}>Training intensity</Text>
        <View style={{ flexDirection: 'row', gap: 6, padding: 4, borderRadius: 12, backgroundColor: t.bg, borderWidth: 1, borderColor: t.border }} accessibilityRole="radiogroup">
          {LEVELS.map((l) => {
            const on = l.id === current.id;
            return (
              <Pressable
                key={l.id}
                accessibilityRole="radio"
                accessibilityState={{ checked: on }}
                onPress={() => setSetting('challenge', l.id)}
                style={{ flex: 1, minHeight: 44, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? t.primary : 'transparent' }}
              >
                <Text style={{ color: on ? t.primaryText : t.muted, fontFamily: fonts.semibold, fontSize: 13 }}>{l.name}</Text>
                <Text style={{ color: on ? t.primaryText : t.muted, fontFamily: fonts.body, fontSize: 11, opacity: 0.85 }}>{l.pct}</Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={[type.caption, { color: t.text, opacity: 0.85 }]}>{current.blurb}</Text>
      </View>

      <View style={{ borderRadius: radii.row, borderWidth: 1, borderColor: t.border, backgroundColor: t.surface, paddingHorizontal: 16 }}>
        {toggles.map((g, i) => (
          <View key={g.name} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderTopWidth: i ? 1 : 0, borderColor: t.border }}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[type.label, { color: t.text, fontSize: 14 }]}>{g.name}</Text>
              <Text style={[type.caption, { color: t.muted, fontSize: 12 }]}>{g.note}</Text>
            </View>
            <Switch accessibilityLabel={g.name} value={g.on} onValueChange={g.set} trackColor={{ true: t.primary, false: t.border }} thumbColor={t.text} />
          </View>
        ))}
      </View>

      <View style={{ borderRadius: radii.row, borderWidth: 1, borderColor: 'rgba(169,149,255,0.3)', backgroundColor: 'rgba(117,97,232,0.08)', padding: 14, gap: 6 }}>
        <Overline color={t.lavender}>Why 85%</Overline>
        <Text style={[type.caption, { color: t.text }]}>
          Computational modelling of human and machine learning indicates that learning is fastest at about 85% accuracy, where errors are frequent enough to inform learning without undermining it.
        </Text>
        <ResearchLink id="championships" label="Wilson et al. 2019 and the research on adaptive training" />
      </View>
    </Screen>
  );
}
