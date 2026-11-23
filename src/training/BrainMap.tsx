import React from 'react';
import Svg, { Circle, Line, Path } from 'react-native-svg';

import type { Skill } from './engine';

/** Bright versions of the skill colours, for the dark brain card. */
export const GLOW: Record<Skill, string> = {
  speed: '#8A98FF',
  memory: '#B79BFF',
  attention: '#3FD3BA',
  flexibility: '#FFB55E',
};

// Side view of a brain, front on the left. Hand-placed outline points, smoothed below.
const OUTLINE: [number, number][] = [
  [40, 140], [24, 106], [33, 70], [62, 40], [104, 21], [150, 14], [196, 19], [236, 37], [263, 64], [276, 100],
  [271, 134], [252, 154], [222, 160], [196, 158], [160, 166], [122, 171], [86, 166], [58, 156],
];
const CEREBELLUM = { cx: 218, cy: 176, rx: 40, ry: 22 };

function smoothPath(pts: [number, number][]): string {
  const mid = (a: [number, number], b: [number, number]) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const n = pts.length;
  const start = mid(pts[n - 1], pts[0]);
  let d = `M${start[0]},${start[1]}`;
  for (let i = 0; i < n; i++) {
    const m = mid(pts[i], pts[(i + 1) % n]);
    d += ` Q${pts[i][0]},${pts[i][1]} ${m[0]},${m[1]}`;
  }
  return d + ' Z';
}

function inside(x: number, y: number): boolean {
  let hit = false;
  for (let i = 0, j = OUTLINE.length - 1; i < OUTLINE.length; j = i++) {
    const [xi, yi] = OUTLINE[i];
    const [xj, yj] = OUTLINE[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}

function inCerebellum(x: number, y: number) {
  const { cx, cy, rx, ry } = CEREBELLUM;
  return ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 < 0.8;
}

/** Which skill each part of the picture stands for. Illustrative, not an anatomy lesson. */
function zone(x: number, y: number, cerebellum: boolean): Skill {
  if (cerebellum || x >= 215) return 'speed';
  if (x < 108) return 'flexibility';
  return y < 92 ? 'attention' : 'memory';
}

type Node = { x: number; y: number; skill: Skill; rank: number };

// Fixed seed, so everyone's brain has the same shape and only the light changes.
function buildGeometry() {
  let seed = 20261123;
  const rand = () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const nodes: Node[] = [];
  for (let tries = 0; tries < 6000 && nodes.length < 120; tries++) {
    const x = 22 + rand() * 260;
    const y = 12 + rand() * 190;
    const cb = inCerebellum(x, y);
    if (!(cb || (inside(x, y) && insideMargin(x, y)))) continue;
    if (nodes.some((n) => (n.x - x) ** 2 + (n.y - y) ** 2 < 15 ** 2)) continue;
    nodes.push({ x, y, skill: zone(x, y, cb), rank: rand() });
  }
  const edges: [number, number][] = [];
  const seen = new Set<string>();
  nodes.forEach((a, i) => {
    nodes
      .map((b, j) => ({ j, d: (a.x - b.x) ** 2 + (a.y - b.y) ** 2 }))
      .filter((o) => o.j !== i)
      .sort((p, q) => p.d - q.d)
      .slice(0, 2)
      .forEach(({ j }) => {
        const k = i < j ? `${i}-${j}` : `${j}-${i}`;
        if (!seen.has(k)) {
          seen.add(k);
          edges.push([i, j]);
        }
      });
  });
  return { nodes, edges, outline: smoothPath(OUTLINE) };
}

// Keep nodes a little way in from the edge so glows do not spill outside the outline.
function insideMargin(x: number, y: number) {
  return [
    [6, 0],
    [-6, 0],
    [0, 6],
    [0, -6],
  ].every(([dx, dy]) => inside(x + dx, y + dy));
}

const GEO = buildGeometry();

/** Share of a skill's nodes that light up for a skill index from 0 to 1. */
export function litShare(index: number) {
  return index <= 0 ? 0 : Math.min(1, 0.05 + 0.95 * index);
}

/**
 * A network brain that lights up as skills improve. Each colour is one skill; more lit
 * connections mean a higher score on that skill.
 */
export function BrainMap({ bySkill, size = 300 }: { bySkill: Record<Skill, number>; size?: number }) {
  const lit = GEO.nodes.map((n) => n.rank < litShare(bySkill[n.skill] ?? 0));
  return (
    <Svg width={size} height={(size * 230) / 300} viewBox="0 0 300 230" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Path d={`M178,160 Q182,190 176,222 L198,222 Q196,192 204,162 Z`} fill="#1A2758" />
      <Path
        d={`M${CEREBELLUM.cx - CEREBELLUM.rx},${CEREBELLUM.cy} a${CEREBELLUM.rx},${CEREBELLUM.ry} 0 1,0 ${CEREBELLUM.rx * 2},0 a${CEREBELLUM.rx},${CEREBELLUM.ry} 0 1,0 ${-CEREBELLUM.rx * 2},0`}
        fill="#18245A"
        stroke="#2C3D82"
        strokeWidth={1.5}
      />
      <Path d={GEO.outline} fill="#18245A" stroke="#2C3D82" strokeWidth={1.5} />
      {GEO.edges.map(([a, b], i) => {
        const on = lit[a] && lit[b];
        const na = GEO.nodes[a];
        const nb = GEO.nodes[b];
        return (
          <Line
            key={i}
            x1={na.x}
            y1={na.y}
            x2={nb.x}
            y2={nb.y}
            stroke={on ? GLOW[na.skill] : '#2C3D82'}
            strokeOpacity={on ? 0.75 : 0.7}
            strokeWidth={on ? 1.4 : 1}
          />
        );
      })}
      {GEO.nodes.map((n, i) =>
        lit[i] ? (
          <React.Fragment key={i}>
            <Circle cx={n.x} cy={n.y} r={8} fill={GLOW[n.skill]} fillOpacity={0.22} />
            <Circle cx={n.x} cy={n.y} r={3.4} fill={GLOW[n.skill]} />
          </React.Fragment>
        ) : (
          <Circle key={i} cx={n.x} cy={n.y} r={2.2} fill="#3A4C8E" />
        ),
      )}
    </Svg>
  );
}
