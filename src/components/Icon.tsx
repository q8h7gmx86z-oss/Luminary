import React from 'react';
import { ColorValue } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

// Line icons drawn on a 24 by 24 grid, so every icon in the app shares one stroke weight and style.
const ICONS = {
  sun: (
    <>
      <Circle cx={12} cy={12} r={4} />
      <Path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  ),
  train: <Path d="M6.5 6.5v11M17.5 6.5v11M3 9.5v5M21 9.5v5M6.5 12h11" />,
  chart: <Path d="M3 3v18h18M8 17v-5M13 17V8M18 17v-8" />,
  target: (
    <>
      <Circle cx={12} cy={12} r={9} />
      <Circle cx={12} cy={12} r={5} />
      <Circle cx={12} cy={12} r={1} />
    </>
  ),
  book: <Path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2zM22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z" />,
  sliders: <Path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6" />,
  bolt: <Path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />,
  grid: (
    <>
      <Rect x={3} y={3} width={7.5} height={7.5} rx={1.5} />
      <Rect x={13.5} y={3} width={7.5} height={7.5} rx={1.5} />
      <Rect x={3} y={13.5} width={7.5} height={7.5} rx={1.5} />
      <Rect x={13.5} y={13.5} width={7.5} height={7.5} rx={1.5} />
    </>
  ),
  bulb: <Path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.3h6c0-1 .4-1.8 1-2.3A7 7 0 0 0 12 2z" />,
  star: <Path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8-6.2-3.2-6.2 3.2L7 14.2 2 9.3l6.9-1z" />,
  palette: (
    <>
      <Path d="M12 22a10 10 0 1 1 10-10c0 2.8-2.2 4-4 4h-2a2 2 0 0 0-1.5 3.3A1.6 1.6 0 0 1 12 22z" />
      <Circle cx={7.5} cy={11} r={1} />
      <Circle cx={10.5} cy={7} r={1} />
      <Circle cx={15.5} cy={7.5} r={1} />
    </>
  ),
  swap: <Path d="M17 3l4 4-4 4M21 7H9M7 21l-4-4 4-4M3 17h12" />,
  matrix: (
    <>
      <Rect x={3.5} y={3.5} width={17} height={17} rx={2} />
      <Path d="M3.5 12h17M12 3.5v17" />
    </>
  ),
  laurel: <Path d="M12 21v-6M8 21h8M12 15a6 6 0 0 0 6-6V3H6v6a6 6 0 0 0 6 6zM6 5H3v2a3 3 0 0 0 3 3M18 5h3v2a3 3 0 0 1-3 3" />,
  wind: <Path d="M3 8h10a3 3 0 1 0-3-3M3 12h15a3 3 0 1 1-3 3M3 16h7" />,
  check: <Path d="M20 6 9 17l-5-5" />,
  info: (
    <>
      <Circle cx={12} cy={12} r={9} />
      <Path d="M12 11v5M12 8h.01" />
    </>
  ),
  arrow: <Path d="M5 12h14M13 6l6 6-6 6" />,
  sort: <Path d="M4 20V14M10 20V10M16 20V6M22 20V3M2 20h21" />,
  rewind: <Path d="M11 19 2 12l9-7v14zM22 19l-9-7 9-7v14z" />,
  stop: <Path d="M7.9 2h8.2L22 7.9v8.2L16.1 22H7.9L2 16.1V7.9zM8 12h8" />,
  search: (
    <>
      <Circle cx={11} cy={11} r={7} />
      <Path d="m21 21-4.3-4.3" />
    </>
  ),
  tower: <Path d="M5 21V9M12 21V12M19 21V15M2 21h20M5 9a2 2 0 1 0 0-.01M12 12a2 2 0 1 0 0-.01" />,
  words: <Path d="M4 7V5h10v2M9 5v14M7 19h4M14 13v-1h7v1M17.5 12v7M16 19h3" />,
  moon: <Path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />,
  heart: <Path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z" />,
} as const;

export type IconName = keyof typeof ICONS;

export function Icon({
  name,
  size = 22,
  color,
  strokeWidth = 2,
}: {
  name: IconName;
  size?: number;
  color: ColorValue;
  strokeWidth?: number;
}) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color as string}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      accessibilityElementsHidden
      importantForAccessibility="no"
    >
      {ICONS[name]}
    </Svg>
  );
}
