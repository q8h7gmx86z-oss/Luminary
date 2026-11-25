import React, { useId } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, RadialGradient, Rect, Stop } from 'react-native-svg';

import { GOLD } from '@/lib/brand';
import { GameId } from '@/training/engine';
import { GAMES, SKILLS } from '@/training/catalog';

import { Icon } from './Icon';

/** A game's icon on a rounded tile shaded in its skill colour. */
export function GameBadge({ game, size = 52 }: { game: GameId; size?: number }) {
  const info = GAMES[game];
  const [from, to] = SKILLS[info.skill].gradient;
  const id = `g${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const r = Math.round(size * 0.28);
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Defs>
          <LinearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={from} />
            <Stop offset="1" stopColor={to} />
          </LinearGradient>
        </Defs>
        <Rect x={0} y={0} width={size} height={size} rx={r} fill={`url(#${id})`} />
        <Rect x={0.5} y={0.5} width={size - 1} height={size - 1} rx={r} fill="none" stroke="#FFFFFF" strokeOpacity={0.18} />
      </Svg>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={info.icon} size={Math.round(size * 0.48)} color="#FFFFFF" strokeWidth={2.2} />
      </View>
    </View>
  );
}

// Fixed star positions (as fractions of the panel) so the panel looks the same on every visit.
const STARS = [
  [0.62, 0.1, 1.4],
  [0.78, 0.24, 1],
  [0.9, 0.08, 1.6],
  [0.71, 0.36, 0.8],
  [0.95, 0.3, 1],
  [0.55, 0.05, 0.8],
  [0.85, 0.45, 0.7],
];

/**
 * A soft gold glow and a few stars for the top corner of a navy panel, echoing the logo.
 * Place it as the first child of a panel that has overflow: 'hidden'.
 */
export function NavyGlow({ width = 360, height = 240 }: { width?: number; height?: number }) {
  const id = `n${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  return (
    <Svg
      width={width}
      height={height}
      style={{ position: 'absolute', top: 0, right: 0 }}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no"
    >
      <Defs>
        <RadialGradient id={id} cx="0.92" cy="0.05" r="0.75">
          <Stop offset="0" stopColor={GOLD} stopOpacity={0.32} />
          <Stop offset="0.45" stopColor="#4B5FD6" stopOpacity={0.14} />
          <Stop offset="1" stopColor="#4B5FD6" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect x={0} y={0} width={width} height={height} fill={`url(#${id})`} />
      {STARS.map(([x, y, s], i) => (
        <Circle key={i} cx={x * width} cy={y * height} r={s * 1.3} fill="#FFFFFF" opacity={0.35 + (i % 3) * 0.15} />
      ))}
    </Svg>
  );
}
