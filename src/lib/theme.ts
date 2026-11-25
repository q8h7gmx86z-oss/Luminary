import { TextStyle } from 'react-native';

// The cognitive performance studio palette. See docs/design-system.md.
// The app is dark-first: Sandra found the light background too bright. A proper light mode,
// designed rather than inverted, comes later.
const studio = {
  /** Midnight: the app background. */
  bg: '#0B1020',
  /** Deep Navy: panels and cards. */
  surface: '#171D38',
  /** Raised surface inside a panel. */
  raised: '#1E2547',
  /** Cloud White: primary text. */
  text: '#F1F0FA',
  /** Muted Slate: secondary text and labels. */
  muted: '#9298B3',
  /** Fine 1px borders. */
  border: 'rgba(241, 240, 250, 0.09)',
  /** Stronger border for outlined controls. */
  borderStrong: 'rgba(241, 240, 250, 0.16)',
  /** Electric Violet: primary actions. */
  primary: '#7561E8',
  primaryText: '#FFFFFF',
  /** Soft Lavender: secondary accents and the active tab. */
  lavender: '#A995FF',
  /** Quiet fill for secondary buttons and selected states. */
  soft: 'rgba(169, 149, 255, 0.12)',
  good: '#4FD1A5',
  /** Warm Gold: achievements and milestones only. */
  gold: '#E8BD72',
  goldSoft: 'rgba(232, 189, 114, 0.12)',
  /** Focus Teal. */
  teal: '#2DB6A3',
  help: '#FF8A80',
  helpSoft: 'rgba(255, 138, 128, 0.12)',
  /** Depth comes from borders and a top-lit gradient, not heavy shadows. */
  shadow: 'none',
  /** Glow under the primary button. */
  primaryGlow: '0px 8px 24px rgba(117, 97, 232, 0.35)',
};

export type Theme = typeof studio;

export function useTheme(): Theme {
  return studio;
}

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, gutter: 20 };
/** Corners: 12 small controls, 16 rows, 22 panels. */
export const radius = 22;
export const radii = { sm: 12, row: 16, button: 14, panel: 22 };

/** Font family names, as registered in the root layout. */
export const fonts = {
  display: 'Sora_600SemiBold',
  displayBold: 'Sora_700Bold',
  body: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
};

/** The type scale. Nothing else should be needed. */
export const type: Record<string, TextStyle> = {
  overline: { fontFamily: fonts.semibold, fontSize: 11, letterSpacing: 1.4, textTransform: 'uppercase' },
  caption: { fontFamily: fonts.body, fontSize: 12.5, lineHeight: 18 },
  body: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22 },
  label: { fontFamily: fonts.semibold, fontSize: 15 },
  section: { fontFamily: fonts.display, fontSize: 17, letterSpacing: -0.2 },
  title: { fontFamily: fonts.display, fontSize: 24, letterSpacing: -0.6, lineHeight: 30 },
  metric: { fontFamily: fonts.display, fontSize: 52, letterSpacing: -2, fontVariant: ['tabular-nums'] },
  number: { fontFamily: fonts.display, fontSize: 18, fontVariant: ['tabular-nums'] },
};
