import { useColorScheme } from 'react-native';

// A calm, low-glare palette. Contrast checked for body text on surface.
const light = {
  bg: '#F6F5F2',
  surface: '#FFFFFF',
  text: '#1D2433',
  muted: '#5A6375',
  border: '#ECEAE4',
  primary: '#4B5FD6',
  primaryText: '#FFFFFF',
  soft: '#E9ECFB',
  good: '#2F7D5B',
  /** Achievement gold, dark enough to read on light backgrounds. */
  gold: '#8F6212',
  help: '#B3261E',
  helpSoft: '#FCECEA',
  /** Soft lift for cards. */
  shadow: '0px 1px 2px rgba(16, 24, 40, 0.05), 0px 6px 20px rgba(16, 24, 40, 0.06)',
};

const dark: typeof light = {
  bg: '#12151C',
  surface: '#1B1F29',
  text: '#ECEEF3',
  muted: '#A3AAB8',
  border: '#2C3240',
  primary: '#8B9BFF',
  primaryText: '#0E1220',
  soft: '#252B3D',
  good: '#6FCF9F',
  gold: '#E6AC3A',
  help: '#FF8A80',
  helpSoft: '#3A1F1F',
  shadow: 'none',
};

export type Theme = typeof light;

export function useTheme(): Theme {
  return useColorScheme() === 'dark' ? dark : light;
}

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 };
export const radius = 18;
