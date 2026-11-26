import { router } from 'expo-router';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import Svg, { Circle, Line, Polygon, Polyline, Text as SvgText } from 'react-native-svg';

import { Icon, IconName } from '@/components/Icon';
import { dayKey } from '@/lib/logic';
import { useStore } from '@/lib/store';
import { fonts, radii, type, useTheme } from '@/lib/theme';

import { EVENT_ORDER, EventId, EVENTS, EventStanding, formatValue, Heat, seasonOf, standing, TARGET } from './championships';

export const EVENT_ICON: Record<EventId, IconName> = { sprint: 'bolt', span: 'grid', focus: 'target', shift: 'swap', logic: 'matrix' };

/** Everything the Championships screens read from the store, computed once. */
export function useChampionships() {
  const { state } = useStore();
  const heats: Heat[] = state.championships?.heats ?? [];
  const untimed = !state.settings.timed;
  const target = TARGET[state.settings.challenge];
  const season = seasonOf(heats, dayKey());
  const standings = Object.fromEntries(EVENT_ORDER.map((e) => [e, standing(heats, e, untimed, season)])) as Record<EventId, EventStanding>;
  const levelOf = (e: EventId): number => {
    const g = EVENTS[e].game;
    return g === 'logic' ? (state.championships?.logicLevel ?? 1) : (state.training.levels[g] ?? 1);
  };
  return { heats, untimed, target, season, standings, levelOf, chooseOrder: !!state.championships?.chooseOrder };
}

export function EventIcon({ event, size = 34 }: { event: EventId; size?: number }) {
  const accent = EVENTS[event].accent;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.3,
        backgroundColor: `${accent}1F`,
        borderWidth: 1,
        borderColor: `${accent}80`,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icon name={EVENT_ICON[event]} size={size * 0.52} color={accent} strokeWidth={1.8} />
    </View>
  );
}

/** A row on the hub: the event, its skill and task, and your current threshold against your record. */
export function EventRow({ s }: { s: EventStanding }) {
  const t = useTheme();
  const ev = EVENTS[s.event];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${ev.name}, ${ev.skill}. Threshold ${formatValue(s.current, s.unit)}.`}
      onPress={() => router.push(`/championships/${s.event}`)}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 11,
        paddingHorizontal: 14,
        borderRadius: radii.row,
        borderWidth: 1,
        borderColor: t.border,
        backgroundColor: t.surface,
        opacity: pressed ? 0.88 : 1,
      })}
    >
      <EventIcon event={s.event} />
      <View style={{ flex: 1, gap: 1 }}>
        <Text style={[type.label, { color: t.text }]}>{ev.name}</Text>
        <Text style={{ color: ev.accent, fontFamily: fonts.medium, fontSize: 12 }}>
          {ev.skill}
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 1 }}>
        <Text style={[type.number, { color: t.text, fontSize: 15 }]}>{s.current === undefined ? '—' : formatValue(s.current, s.unit)}</Text>
        <Text style={{ color: s.record !== undefined ? t.gold : t.muted, fontFamily: fonts.body, fontSize: 11, fontVariant: ['tabular-nums'] }}>
          {s.record !== undefined ? `Record ${formatValue(s.record, s.unit)}` : s.heats ? 'Record after two heats' : 'Not yet measured'}
        </Text>
      </View>
    </Pressable>
  );
}

const AXES = EVENT_ORDER.map((_, i) => {
  const a = (-90 + i * 72) * (Math.PI / 180);
  return [Math.cos(a), Math.sin(a)] as const;
});

/** Five-sided chart of your events: now against week 1. Each axis is your level in that event. */
export function ChampionshipChart({ standings, size = 300 }: { standings: Record<EventId, EventStanding>; size?: number }) {
  const t = useTheme();
  const c = size / 2;
  const cy = size * 0.46;
  const h = size * 0.9;
  const r = size * 0.33;
  const pts = (f: (e: EventId) => number) =>
    EVENT_ORDER.map((e, i) => {
      const v = Math.max(0.06, f(e));
      return `${(c + AXES[i][0] * r * v).toFixed(1)},${(cy + AXES[i][1] * r * v).toFixed(1)}`;
    }).join(' ');
  const ring = (k: number) => pts(() => k);
  const hasBase = EVENT_ORDER.some((e) => standings[e].levelBaseline !== undefined);
  const label = EVENT_ORDER.map((e, i) => ({
    e,
    x: c + AXES[i][0] * (r + 22),
    y: cy + AXES[i][1] * (r + 22) + 4,
    anchor: (Math.abs(AXES[i][0]) < 0.2 ? 'middle' : AXES[i][0] > 0 ? 'start' : 'end') as 'middle' | 'start' | 'end',
  }));
  const summary = EVENT_ORDER.map((e) => `${EVENTS[e].name} ${Math.round(standings[e].levelNow * 100)}%`).join(', ');
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={`Your five events, as a share of the top level: ${summary}.`}>
      <Svg width={size} height={h} viewBox={`0 0 ${size} ${h}`}>
        <Polygon points={ring(1)} fill="none" stroke={t.border} strokeWidth={1} />
        <Polygon points={ring(0.5)} fill="none" stroke={t.border} strokeWidth={1} />
        {AXES.map(([x, y], i) => (
          <Line key={i} x1={c} y1={cy} x2={c + x * r} y2={cy + y * r} stroke={t.border} />
        ))}
        {hasBase ? <Polygon points={pts((e) => standings[e].levelBaseline ?? 0)} fill="none" stroke={t.muted} strokeWidth={1.2} strokeDasharray="3 3" /> : null}
        <Polygon points={pts((e) => standings[e].levelNow)} fill="rgba(117,97,232,0.18)" stroke={t.lavender} strokeWidth={1.6} />
        {EVENT_ORDER.map((e, i) => {
          const v = Math.max(0.06, standings[e].levelNow);
          return <Circle key={e} cx={c + AXES[i][0] * r * v} cy={cy + AXES[i][1] * r * v} r={4} fill={EVENTS[e].accent} />;
        })}
        {label.map((l) => (
          <SvgText key={l.e} x={l.x} y={l.y} textAnchor={l.anchor} fill={t.text} fontFamily={fonts.semibold} fontSize={11}>
            {EVENTS[l.e].name}
          </SvgText>
        ))}
      </Svg>
    </View>
  );
}

/** Trend line of measured thresholds, drawn so that better is always higher. */
export function TrendLine({ values, better, color, record, width = 300, height = 70 }: { values: number[]; better: 'lower' | 'higher'; color: string; record?: number; width?: number; height?: number }) {
  const t = useTheme();
  if (values.length < 2) return null;
  const all = record !== undefined ? [...values, record] : values;
  const lo = Math.min(...all);
  const hi = Math.max(...all);
  const span = hi - lo || 1;
  const y = (v: number) => {
    const f = (v - lo) / span;
    return 6 + (better === 'lower' ? f : 1 - f) * (height - 12);
  };
  const x = (i: number) => 4 + (i * (width - 8)) / (values.length - 1);
  return (
    <Svg width={width} height={height} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {record !== undefined ? <Line x1={0} x2={width} y1={y(record)} y2={y(record)} stroke={t.gold} strokeOpacity={0.45} strokeDasharray="3 4" /> : null}
      <Polyline points={values.map((v, i) => `${x(i)},${y(v)}`).join(' ')} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" />
      <Circle cx={x(values.length - 1)} cy={y(values[values.length - 1])} r={3.5} fill={color} />
    </Svg>
  );
}

/** Entry card for the Championships, used on Today and Train. */
export function ChampionshipsCard() {
  const t = useTheme();
  const c = useChampionships();
  const started = c.heats.length > 0;
  const records = EVENT_ORDER.filter((e) => c.standings[e].record !== undefined).length;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="The Neural Championships"
      onPress={() => router.push('/championships')}
      style={({ pressed }) => ({
        borderRadius: radii.panel,
        borderWidth: 1,
        borderColor: 'rgba(169,149,255,0.32)',
        backgroundColor: t.surface,
        padding: 18,
        gap: 8,
        opacity: pressed ? 0.92 : 1,
      })}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={[type.overline, { color: t.lavender }]}>{started ? `Season ${c.season.number} · Week ${c.season.week} · ${c.season.phase}` : 'Adaptive training'}</Text>
        <Icon name="laurel" size={18} color={t.gold} strokeWidth={1.6} />
      </View>
      <Text style={[type.section, { color: t.text, fontSize: 19 }]}>The Neural Championships</Text>
      <Text style={[type.caption, { color: t.muted }]}>
        {started
          ? `Five events trained at your threshold. ${records} ${records === 1 ? 'record' : 'records'} confirmed.`
          : 'Five events, one for each thinking skill, each trained precisely at your threshold. Begin with your trials.'}
      </Text>
      <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
        {EVENT_ORDER.map((e) => (
          <EventIcon key={e} event={e} size={28} />
        ))}
      </View>
    </Pressable>
  );
}
