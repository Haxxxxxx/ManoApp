/**
 * Design tokens — dark studio / pro-audio system.
 *
 * Single source of truth for the app's visual language. ThemeContext builds
 * the MUI theme from these; prefer referencing tokens over hardcoding hex in
 * components. Flat surfaces, 1px borders (not heavy shadows), one indigo
 * accent, 8px radius.
 */

export const palette = {
  // App canvas — near-black with a faint cool cast
  bg: {
    base: '#0E0E11',
    raised: '#131317',
  },
  // Panels / cards / inputs stack above the canvas
  surface: {
    default: '#1C1C21',
    elevated: '#232329',
    hover: '#26262D',
  },
  border: {
    subtle: '#2A2A31',
    default: '#35353D',
    strong: '#45454F',
  },
  text: {
    primary: '#F4F4F5',
    secondary: '#A1A1AA',
    disabled: '#52525B',
    onAccent: '#FFFFFF',
  },
  accent: {
    main: '#6366F1',
    hover: '#818CF8',
    pressed: '#4F46E5',
    // translucent indigo for focus rings / subtle fills
    soft: 'rgba(99, 102, 241, 0.16)',
    softHover: 'rgba(99, 102, 241, 0.24)',
  },
  semantic: {
    success: '#22C55E',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  },
} as const;

export const radius = {
  sm: 6,
  md: 8,
  lg: 12,
  pill: 999,
} as const;

export const typography = {
  fontFamily:
    '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  // Tabular numerals + UI feel
  fontFeatureSettings: '"cv11", "ss01", "tnum"',
} as const;

/** Spacing base unit (px) — MUI spacing(1) */
export const spacingUnit = 8;
