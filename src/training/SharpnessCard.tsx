import { router } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { GOLD, NAVY } from '@/lib/brand';
import { useStore } from '@/lib/store';

import { BrainMap, GLOW } from './BrainMap';
import { GAMES, SKILLS } from './catalog';
import { Skill } from './engine';
import { MAX_SHARPNESS, sharpnessHistory, sharpnessOf } from './sharpness';
import { Spark } from './Spark';

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
  const measured = new Set(state.training.results.map((r) => GAMES[r.game].skill));
  const [open, setOpen] = useState(false);

  const body = (
    <View style={{ backgroundColor: NAVY, borderRadius: 22, padding: 18, gap: 12, overflow: 'hidden' }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <View>
          <Text style={{ color: GOLD, fontWeight: '800', letterSpacing: 1, fontSize: 12 }}>BRAIN SHARPNESS</Text>
          {empty ? (
            <View style={{ gap: 2, paddingTop: 4 }}>
              <Text style={{ color: '#FFFFFF', fontSize: compact ? 26 : 32, fontWeight: '900' }}>Not yet measured</Text>
              <Text style={{ color: '#D7DCF5', fontSize: 14 }}>Your first workout sets your baseline.</Text>
            </View>
          ) : (
            <Text style={{ color: '#FFFFFF', fontSize: compact ? 40 : 52, fontWeight: '900', fontVariant: ['tabular-nums'] }}>
              {now.total}
              <Text style={{ color: '#8C97C9', fontSize: 16, fontWeight: '700' }}> / {MAX_SHARPNESS}</Text>
            </Text>
          )}
        </View>
        {gain > 0 ? (
          <View
            style={{
              backgroundColor: 'rgba(230,172,58,0.16)',
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 999,
              marginBottom: 10,
            }}
          >
            <Text style={{ color: GOLD, fontWeight: '800' }}>+{gain} since day one</Text>
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
              {measured.has(s) ? Math.round((now.bySkill[s] * MAX_SHARPNESS) / SKILL_LIST.length) : '–'}
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
            : 'It is not a medical test, and it does not compare you with other people. It shows how your own training is going.'}
      </Text>
      {!compact ? (
        <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={() => setOpen(!open)} hitSlop={6}>
          <Text style={{ color: GOLD, fontWeight: '800', fontSize: 14 }}>
            {open ? 'Hide how this score is built ▲' : 'How this score is built ▼'}
          </Text>
        </Pressable>
      ) : null}
      {!compact && open ? <Breakdown measured={measured} bySkill={now.bySkill} /> : null}
    </View>
  );

  if (!compact) return body;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        empty ? 'Brain sharpness not yet measured. Open progress.' : `Brain sharpness ${now.total} out of ${MAX_SHARPNESS}. Open progress.`
      }
      onPress={() => router.push('/progress')}
    >
      {body}
    </Pressable>
  );
}

function Breakdown({ measured, bySkill }: { measured: Set<Skill>; bySkill: Record<Skill, number> }) {
  const per = MAX_SHARPNESS / SKILL_LIST.length;
  const line = { color: '#D7DCF5', fontSize: 13, lineHeight: 19 } as const;
  return (
    <View style={{ gap: 10, borderTopWidth: 1, borderTopColor: '#2C3D82', paddingTop: 12 }}>
      <Text style={line}>
        Four skills, each worth up to {per}. For every game you play, Luminary takes your last three rounds and scores each one from its
        level (1 to 20) and your accuracy. A skill's points are the average of its games. Add the four together and you get your score out
        of {MAX_SHARPNESS}.
      </Text>
      {SKILL_LIST.map((s) => {
        const games = (Object.keys(GAMES) as (keyof typeof GAMES)[]).filter((g) => GAMES[g].skill === s).map((g) => GAMES[g].name);
        return (
          <View key={s} style={{ gap: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: GLOW[s] }} />
              <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 14, flex: 1 }}>{SKILLS[s].name}</Text>
              <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 14, fontVariant: ['tabular-nums'] }}>
                {measured.has(s) ? `${Math.round(bySkill[s] * per)} / ${per}` : 'Not yet measured'}
              </Text>
            </View>
            <View style={{ height: 6, borderRadius: 3, backgroundColor: '#1A2758' }}>
              <View style={{ height: 6, borderRadius: 3, backgroundColor: GLOW[s], width: `${bySkill[s] * 100}%` }} />
            </View>
            <Text style={{ color: '#8C97C9', fontSize: 12 }}>From: {games.join(', ')}</Text>
          </View>
        );
      })}
      <Text style={line}>
        What it does not measure: intelligence, brain health or brain age. A skill you have not played yet shows as not measured and adds
        nothing, so your score can jump when you try a new game. That is the new baseline, not sudden improvement.
      </Text>
    </View>
  );
}
