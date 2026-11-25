import React, { useMemo } from 'react';
import Svg, { Circle, Defs, Line, RadialGradient, Stop, Text as SvgText } from 'react-native-svg';

import { GameId } from '@/training/engine';
import { GAMES } from '@/training/catalog';

// Luminary's signature visual: a network with one region per task. Each region glows brighter as
// measured performance on that task rises. It maps results in the app, not brain activity.

const CENTRES: Record<GameId, [number, number]> = {
  speed: [0.22, 0.38],
  grid: [0.42, 0.22],
  nback: [0.64, 0.24],
  catch: [0.8, 0.48],
  clash: [0.56, 0.62],
  switch: [0.3, 0.7],
};
const ORDER = Object.keys(CENTRES) as GameId[];
const NEUTRAL = '#A995FF';

/** A small seeded random generator, so the network has the same shape on every visit. */
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

type Node = { game: GameId | null; x: number; y: number; r: number };

function build(w: number, h: number) {
  const rand = seeded(7);
  const nodes: Node[] = [];
  for (const g of ORDER) {
    const [cx, cy] = CENTRES[g];
    for (let i = 0; i < 9; i++) {
      const a = rand() * Math.PI * 2;
      const d = Math.sqrt(rand()) * 0.13;
      nodes.push({ game: g, x: (cx + Math.cos(a) * d * 1.1) * w, y: (cy + Math.sin(a) * d * 1.3) * h, r: 1 + rand() * 1.8 });
    }
  }
  for (let i = 0; i < 26; i++) nodes.push({ game: null, x: (0.08 + rand() * 0.84) * w, y: (0.1 + rand() * 0.8) * h, r: 0.6 + rand() });
  const links: [number, number][] = [];
  const maxD = (w * 0.2) ** 2;
  nodes.forEach((a, i) => {
    nodes
      .map((b, j) => [j, (a.x - b.x) ** 2 + (a.y - b.y) ** 2] as const)
      .filter(([j]) => j > i)
      .sort((p, q) => p[1] - q[1])
      .slice(0, 2)
      .forEach(([j, d]) => {
        if (d <= maxD) links.push([i, j]);
      });
  });
  return { nodes, links };
}

export function SkillNetwork({
  width,
  height,
  level,
  focus,
  labels,
  dim = 1,
}: {
  width: number;
  height: number;
  /** 0 to 1 per task: how brightly its region glows. */
  level: Partial<Record<GameId, number>>;
  /** Highlight one task and quieten the rest. */
  focus?: GameId;
  labels?: boolean;
  dim?: number;
}) {
  const { nodes, links } = useMemo(() => build(width, height), [width, height]);
  const p = (g: GameId) => level[g] ?? 0;
  const quiet = (g: GameId) => focus !== undefined && focus !== g;

  return (
    <Svg width={width} height={height} accessibilityElementsHidden importantForAccessibility="no" pointerEvents="none">
      <Defs>
        {ORDER.map((g) => (
          <RadialGradient key={g} id={`net_${g}`}>
            <Stop offset="0" stopColor={GAMES[g].accent} stopOpacity={0.9} />
            <Stop offset="1" stopColor={GAMES[g].accent} stopOpacity={0} />
          </RadialGradient>
        ))}
      </Defs>
      {ORDER.map((g) => {
        const [cx, cy] = CENTRES[g];
        const o = quiet(g) ? 0.12 : 0.15 + p(g) * 0.6;
        return <Circle key={g} cx={cx * width} cy={cy * height} r={width * 0.15} fill={`url(#net_${g})`} opacity={o * dim} />;
      })}
      {links.map(([i, j]) => {
        const a = nodes[i];
        const b = nodes[j];
        const same = a.game !== null && a.game === b.game;
        const o = same ? (quiet(a.game!) ? 0.12 : 0.22 + p(a.game!) * 0.55) : 0.08;
        return (
          <Line
            key={`${i}-${j}`}
            x1={a.x}
            y1={a.y}
            x2={b.x}
            y2={b.y}
            stroke={same ? GAMES[a.game!].accent : NEUTRAL}
            strokeOpacity={o * dim}
            strokeWidth={same ? 1.1 : 0.7}
          />
        );
      })}
      {nodes.map((n, i) => {
        const o = n.game ? (quiet(n.game) ? 0.25 : 0.45 + p(n.game) * 0.55) : 0.25;
        return <Circle key={i} cx={n.x} cy={n.y} r={n.r} fill={n.game ? GAMES[n.game].accent : NEUTRAL} opacity={o * dim} />;
      })}
      {labels
        ? ORDER.map((g) => {
            const [cx, cy] = CENTRES[g];
            return (
              <SvgText
                key={g}
                x={cx * width}
                y={cy * height + width * 0.16 + 4}
                textAnchor="middle"
                fontSize={10.5}
                fontWeight="600"
                fill={GAMES[g].accent}
                opacity={quiet(g) ? 0.45 : 0.95}
              >
                {GAMES[g].name}
              </SvgText>
            );
          })
        : null}
    </Svg>
  );
}

/** Region brightness from levels: unplayed tasks stay faint, level 20 glows fully. */
export function networkLevels(levels: Partial<Record<GameId, number>>, played: Set<GameId>, maxLevel: number) {
  const out: Partial<Record<GameId, number>> = {};
  for (const g of ORDER) out[g] = played.has(g) ? Math.max(0.2, Math.min(1, (levels[g] ?? 1) / maxLevel + 0.15)) : 0.05;
  return out;
}
