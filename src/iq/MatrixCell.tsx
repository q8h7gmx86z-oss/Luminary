import React from 'react';
import Svg, { Circle, Polygon, Rect } from 'react-native-svg';

import type { Cell } from './items';

const TONES = ['#1E2A5E', '#D9822B', '#1F9D8B'];
const SPOTS: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [
    [29, 50],
    [71, 50],
  ],
  3: [
    [50, 27],
    [27, 70],
    [73, 70],
  ],
};

function Shape({ kind, x, y, r, fill, tone }: { kind: number; x: number; y: number; r: number; fill: number; tone: string }) {
  const props = {
    fill: fill === 0 ? 'none' : tone,
    fillOpacity: fill === 2 ? 0.3 : 1,
    stroke: tone,
    strokeWidth: 3.5,
  };
  if (kind === 0) return <Circle cx={x} cy={y} r={r} {...props} />;
  if (kind === 1) return <Rect x={x - r * 0.88} y={y - r * 0.88} width={r * 1.76} height={r * 1.76} rx={2} {...props} />;
  if (kind === 2) return <Polygon points={`${x},${y - r} ${x + r * 1.05},${y + r * 0.8} ${x - r * 1.05},${y + r * 0.8}`} {...props} />;
  return <Polygon points={`${x},${y - r * 1.1} ${x + r},${y} ${x},${y + r * 1.1} ${x - r},${y}`} {...props} />;
}

/** One square of a pattern matrix: 1 to 3 copies of a shape, with a fill style and a colour. */
export function MatrixCell({ cell, shapes, size }: { cell: Cell; shapes: number[]; size: number }) {
  const n = cell.count + 1;
  const r = n === 1 ? 19 : n === 2 ? 15 : 13;
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {SPOTS[n].map(([x, y], i) => (
        <Shape key={i} kind={shapes[cell.shape]} x={x} y={y} r={r} fill={cell.fill} tone={TONES[cell.tone]} />
      ))}
    </Svg>
  );
}

const FILL_WORDS = ['outlined', 'solid', 'pale'];
const SHAPE_WORDS = ['circle', 'square', 'triangle', 'diamond'];
const TONE_WORDS = ['navy', 'orange', 'teal'];

/** Spoken description for screen readers. */
export function describeCell(cell: Cell, shapes: number[]) {
  const n = cell.count + 1;
  return `${n} ${FILL_WORDS[cell.fill]} ${TONE_WORDS[cell.tone]} ${SHAPE_WORDS[shapes[cell.shape]]}${n > 1 ? 's' : ''}`;
}
