import React, { useId } from 'react';
import { View } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

import { GameId } from '@/training/engine';
import { GAMES } from '@/training/catalog';
import { useOptionalSettings } from '@/lib/store';

import { Icon } from './Icon';

/** A task's line icon on a quiet tile tinted with its accent colour. */
export function GameBadge({ game, size = 40 }: { game: GameId; size?: number }) {
  const accent = GAMES[game].accent;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.3),
        backgroundColor: `${accent}1F`,
        borderWidth: 1,
        borderColor: `${accent}59`,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icon name={GAMES[game].icon} size={Math.round(size * 0.48)} color={accent} strokeWidth={2} />
    </View>
  );
}

/**
 * A soft violet light falling from the top corner of a panel. Restrained on purpose.
 * Place it as the first child of a panel that has overflow: 'hidden'.
 */
export function NavyGlow({ width = 360, height = 240, color = '#7561E8' }: { width?: number; height?: number; color?: string }) {
  const id = `n${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  if (useOptionalSettings()?.visuals === 'minimal') return null;
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
        <RadialGradient id={id} cx="0.9" cy="0" r="0.8">
          <Stop offset="0" stopColor={color} stopOpacity={0.28} />
          <Stop offset="1" stopColor={color} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect x={0} y={0} width={width} height={height} fill={`url(#${id})`} />
    </Svg>
  );
}
