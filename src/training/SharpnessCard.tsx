import { router } from 'expo-router';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { useStore } from '@/lib/store';

import { BrainMap, GLOW } from './BrainMap';
import { GAMES, SKILLS } from './catalog';
import { Skill } from './engine';
import { MAX_SHARPNESS, sharpnessHistory, sharpnessOf } from './sharpness';
import { Spark } from './Spark';

const NAVY = '#0B1640';
const GOLD = '#F2C14E';
const SKILL_LIST = Object.keys(SKILLS) as Skill[];
const skillOf = (g: keyof typeof GAMES) => GAMES[g].skill;

export function useSharpness() {
  const { state } = useStore();
  const results = state.training.results;
  const now = sharpnessOf(results, skillOf, SKILL_LIST);
  const history = sharpnessHistory(results, skillOf, SKILL_LIST);
  return { now, history, first: history[0]?.value };
}

/** The headline motivator: one score and a brain that lights up as it rises. */
export function SharpnessCard({ compact }: { compact?: boolean }) {
  const { state } = useStore();
  const { now, history, first } = useSharpness();
  const gain = first !== undefined && history.length > 1 ? now.total - first : 0;
  const empty = history.length === 0;

  const body = (
    <View style={{ backgroundColor: NAVY, borderRadius: 22, padding: 18, gap: 12, overflow: 'hidden' }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <View>
          <Text style={{ color: GOLD, fontWeight: '800', letterSpacing: 1, fontSize: 12 }}>BRAIN SHARPNESS</Text>
          <Text style={{ color: '#FFFFFF', fontSize: compact ? 40 : 52, fontWeight: '900', fontVariant: ['tabular-nums'] }}>
            {now.total}
            <Text style={{ color: '#8C97C9', fontSize: 16, fontWeight: '700' }}> / {MAX_SHARPNESS}</Text>
          </Text>
        </View>
        {gain > 0 ? (
          <View style={{ backgroundColor: 'rgba(63,211,186,0.16)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, marginBottom: 10 }}>
            <Text style={{ color: '#3FD3BA', fontWeight: '800' }}>+{gain} since day one</Text>
          </View>
        ) : null}
      </View>
      <View style={{ alignItems: 'center' }}>
        <BrainMap bySkill={now.bySkill} size={compact ? 230 : 300} calm={state.settings.visuals === 'minimal'} />
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {SKILL_LIST.map((s) => (
          <View key={s} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexBasis: '46%', flexGrow: 1 }}>
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: GLOW[s] }} />
            <Text style={{ color: '#D7DCF5', fontSize: 13, flex: 1 }}>{SKILLS[s].name}</Text>
            <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 13, fontVariant: ['tabular-nums'] }}>
              {Math.round((now.bySkill[s] * MAX_SHARPNESS) / SKILL_LIST.length)}
            </Text>
          </View>
        ))}
      </View>
      {!compact && history.length > 1 ? (
        <View style={{ gap: 6 }}>
          <Text style={{ color: '#8C97C9', fontSize: 12, fontWeight: '700' }}>SCORE BY DAY</Text>
          <Spark values={history.map((h) => h.value)} color={GOLD} label="Brain sharpness by day" />
        </View>
      ) : null}
      <Text style={{ color: '#8C97C9', fontSize: 13, lineHeight: 19 }}>
        {empty
          ? 'Every node lights up as you level up. Finish your first workout to switch it on.'
          : compact
            ? 'Each skill is worth 250. Level up in all four to light the whole brain.'
            : 'What it measures: your four skill scores added together, each worth up to 250, from your level and accuracy over your last three rounds of each game. What it does not measure: intelligence, brain health or brain age. It is not a medical test and it does not compare you with other people. It shows how your own training is going.'}
      </Text>
    </View>
  );

  if (!compact) return body;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`Brain sharpness ${now.total} out of ${MAX_SHARPNESS}. Open progress.`} onPress={() => router.push('/progress')}>
      {body}
    </Pressable>
  );
}
