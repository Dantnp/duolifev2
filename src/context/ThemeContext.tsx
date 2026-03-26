import React, { createContext, useContext, useMemo, useState } from 'react';
import { Platform, StyleSheet, useColorScheme, ViewStyle } from 'react-native';

// ══════════════════════════════════════════════════════════════════════════════
// 1. RAW PALETTE — Brand / base colours (numbered scale)
// ══════════════════════════════════════════════════════════════════════════════

export const PALETTE = {
  // Blue
  blue100: '#EBF0FF',
  blue200: 'rgba(30, 77, 183, 0.08)',
  blue500: '#1E4DB7',
  blue700: '#163a91',

  // Orange
  orange100: '#FFF8ED',
  orange500: '#F59E0B',
  orange700: '#d97706',

  // Gold
  gold100: '#FEF9EF',
  gold500: '#F5A623',

  // Green
  green100: '#ECFDF5',
  green200: 'rgba(46, 204, 113, 0.08)',
  green500: '#2ECC71',
  green700: '#27AE60',

  // Red
  red100: '#FEF2F2',
  red200: 'rgba(231, 76, 60, 0.08)',
  red500: '#E74C3C',
  red700: '#C0392B',

  // Neutrals
  grey50: '#F5F6F8',
  grey100: '#F1F5F9',
  grey200: '#E5E7EB',
  grey300: '#E2E6ED',
  grey400: '#9CA3AF',
  grey500: '#6B7280',
  grey600: '#3D4254',
  grey700: '#1F2937',
  grey800: '#1A1D26',

  white: '#FFFFFF',
  black: '#000000',
} as const;

// ══════════════════════════════════════════════════════════════════════════════
// 2. SEMANTIC TOKENS — Colour by role, not hue
// ══════════════════════════════════════════════════════════════════════════════
//
// primary  → actions / progress / CTA
// warning  → recommendations / urgency
// success  → correct / complete
// danger   → error / wrong
// reward   → XP / achievements

export const SEMANTIC = {
  primary: PALETTE.blue500,
  primaryDark: PALETTE.blue700,
  primaryLight: PALETTE.blue100,
  primaryBg: PALETTE.blue200,

  warning: PALETTE.orange500,
  warningDark: PALETTE.orange700,
  warningLight: PALETTE.orange100,

  success: PALETTE.green500,
  successDark: PALETTE.green700,
  successLight: PALETTE.green100,
  successBg: PALETTE.green200,

  danger: PALETTE.red500,
  dangerDark: PALETTE.red700,
  dangerLight: PALETTE.red100,
  dangerBg: PALETTE.red200,

  reward: PALETTE.gold500,
  rewardLight: PALETTE.gold100,

  iconSurface: PALETTE.grey100,
} as const;

// ── Backward-compatible COLORS alias ──
export const COLORS = {
  blue: SEMANTIC.primary,
  blueDark: SEMANTIC.primaryDark,
  blueLight: SEMANTIC.primaryLight,
  blueBg: SEMANTIC.primaryBg,
  orange: SEMANTIC.warning,
  orangeDark: SEMANTIC.warningDark,
  orangeLight: SEMANTIC.warningLight,
  gold: SEMANTIC.reward,
  goldLight: SEMANTIC.rewardLight,
  green: SEMANTIC.success,
  greenDark: SEMANTIC.successDark,
  greenLight: SEMANTIC.successLight,
  greenBg: SEMANTIC.successBg,
  red: SEMANTIC.danger,
  redDark: SEMANTIC.dangerDark,
  redLight: SEMANTIC.dangerLight,
  redBg: SEMANTIC.dangerBg,
  iconBg: SEMANTIC.iconSurface,
} as const;

// ══════════════════════════════════════════════════════════════════════════════
// 3. RADIUS TOKENS
// ══════════════════════════════════════════════════════════════════════════════

export const RADIUS = {
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
} as const;

// ══════════════════════════════════════════════════════════════════════════════
// 4. SPACING (8 px base)
// ══════════════════════════════════════════════════════════════════════════════

export const SP = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
} as const;

// ══════════════════════════════════════════════════════════════════════════════
// 5. LAYOUT TOKENS — common container values
// ══════════════════════════════════════════════════════════════════════════════

export const LAYOUT = {
  screenPadding: SP.md,
  sectionGap: SP.lg,
  cardGap: SP.sm,
  rowMinHeight: 52,
  bottomCtaInset: SP.xl,
} as const;

// ══════════════════════════════════════════════════════════════════════════════
// 6. TYPOGRAPHY — with lineHeight & letterSpacing for headings
// ══════════════════════════════════════════════════════════════════════════════

export const TYPE = {
  h1: { fontSize: 28, lineHeight: 34, fontWeight: '700' as const, letterSpacing: -0.3 },
  h2: { fontSize: 18, lineHeight: 24, fontWeight: '600' as const },
  body: { fontSize: 15, lineHeight: 22, fontWeight: '400' as const },
  label: { fontSize: 13, lineHeight: 18, fontWeight: '500' as const },
  labelSmall: { fontSize: 12, lineHeight: 16, fontWeight: '500' as const },
};

// ══════════════════════════════════════════════════════════════════════════════
// 7. CARD TOKENS
// ══════════════════════════════════════════════════════════════════════════════

export const CARD = {
  borderRadius: RADIUS.lg,
  padding: SP.md,
};

// ══════════════════════════════════════════════════════════════════════════════
// 8. BUTTON / CTA TOKENS
// ══════════════════════════════════════════════════════════════════════════════

export const CTA = {
  height: 56,
  borderRadius: 14, // RADIUS.md + 2
  fontSize: 16,
  fontWeight: '600' as const,
  depthWidth: 4,
};

// ══════════════════════════════════════════════════════════════════════════════
// 9. PROGRESS BAR
// ══════════════════════════════════════════════════════════════════════════════

export const PROGRESS = {
  height: 8,
  borderRadius: RADIUS.xs,
};

// ══════════════════════════════════════════════════════════════════════════════
// 10. ICON CONTAINER
// ══════════════════════════════════════════════════════════════════════════════

export const ICON_CONTAINER = {
  width: 40,
  height: 40,
  borderRadius: 10,
};

// ══════════════════════════════════════════════════════════════════════════════
// 11. SHADOWS — Properly typed, with Platform.select default
// ══════════════════════════════════════════════════════════════════════════════

export const SHADOW_CARD: ViewStyle = Platform.select({
  ios: {
    shadowColor: PALETTE.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
  },
  android: { elevation: 4 },
  default: {},
})!;

export const SHADOW_CARD_SM: ViewStyle = Platform.select({
  ios: {
    shadowColor: PALETTE.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  android: { elevation: 2 },
  default: {},
})!;

export const SHADOW_CTA: ViewStyle = Platform.select({
  ios: {
    shadowColor: SEMANTIC.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  android: { elevation: 6 },
  default: {},
})!;

export const SHADOW_FEEDBACK: ViewStyle = Platform.select({
  ios: {
    shadowColor: PALETTE.black,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
  },
  android: { elevation: 8 },
  default: {},
})!;

// ══════════════════════════════════════════════════════════════════════════════
// 12. DARK-AWARE SHADOW HELPER
// ══════════════════════════════════════════════════════════════════════════════
// In dark mode shadows are less visible; use reduced opacity or borders.

export function getShadow(shadow: ViewStyle, isDark: boolean): ViewStyle {
  if (!isDark) return shadow;
  if (Platform.OS === 'ios') {
    const opacity = typeof shadow.shadowOpacity === 'number' ? shadow.shadowOpacity : 0;
    return { ...shadow, shadowOpacity: opacity * 0.4 };
  }
  const elev = (shadow as any).elevation ?? 0;
  return { ...shadow, elevation: Math.max(0, elev - 1) };
}

// ══════════════════════════════════════════════════════════════════════════════
// 13. ANSWER STATE COLOURS
// ══════════════════════════════════════════════════════════════════════════════

export const ANSWER = {
  correct:  { border: SEMANTIC.success, bg: SEMANTIC.successBg, text: SEMANTIC.successDark },
  wrong:    { border: SEMANTIC.danger,  bg: SEMANTIC.dangerBg,  text: SEMANTIC.dangerDark },
  selected: { border: SEMANTIC.primary, bg: SEMANTIC.primaryBg, text: SEMANTIC.primary },
};

// ══════════════════════════════════════════════════════════════════════════════
// 14. SEMANTIC COMPONENT STATES — banners, pills, alerts, answer options
// ══════════════════════════════════════════════════════════════════════════════

export const STATES = {
  info:     { bg: SEMANTIC.primaryBg,    border: SEMANTIC.primary,   text: SEMANTIC.primary },
  success:  { bg: SEMANTIC.successBg,    border: SEMANTIC.success,   text: SEMANTIC.successDark },
  warning:  { bg: SEMANTIC.warningLight, border: SEMANTIC.warning,   text: SEMANTIC.warningDark },
  error:    { bg: SEMANTIC.dangerBg,     border: SEMANTIC.danger,    text: SEMANTIC.dangerDark },
  selected: { bg: SEMANTIC.primaryBg,    border: SEMANTIC.primary,   text: SEMANTIC.primary },
};

// ══════════════════════════════════════════════════════════════════════════════
// 15. BUTTON STATES (default / pressed / disabled)
// ══════════════════════════════════════════════════════════════════════════════

export const BUTTON = {
  primary: {
    default:  { bg: SEMANTIC.primary,      border: SEMANTIC.primaryDark, text: PALETTE.white },
    pressed:  { bg: SEMANTIC.primaryDark,   border: SEMANTIC.primaryDark, text: PALETTE.white },
    disabled: { bg: PALETTE.grey400,        border: PALETTE.grey400,      text: PALETTE.white },
  },
  secondary: {
    default:  { bg: SEMANTIC.iconSurface,   border: 'transparent',        text: PALETTE.grey700 },
    pressed:  { bg: PALETTE.grey200,        border: 'transparent',        text: PALETTE.grey700 },
    disabled: { bg: PALETTE.grey100,        border: 'transparent',        text: PALETTE.grey400 },
  },
  destructive: {
    default:  { bg: SEMANTIC.danger,        border: SEMANTIC.dangerDark,  text: PALETTE.white },
    pressed:  { bg: SEMANTIC.dangerDark,    border: SEMANTIC.dangerDark,  text: PALETTE.white },
    disabled: { bg: PALETTE.grey400,        border: PALETTE.grey400,      text: PALETTE.white },
  },
  ghost: {
    default:  { bg: 'transparent',          border: 'transparent',        text: SEMANTIC.primary },
    pressed:  { bg: SEMANTIC.primaryBg,     border: 'transparent',        text: SEMANTIC.primaryDark },
    disabled: { bg: 'transparent',          border: 'transparent',        text: PALETTE.grey400 },
  },
} as const;

// ══════════════════════════════════════════════════════════════════════════════
// REUSABLE CARD STYLES — expanded variant system
// ══════════════════════════════════════════════════════════════════════════════

export const cardStyles = StyleSheet.create({
  // base — no shadow, used when you add your own
  base: {
    backgroundColor: PALETTE.white,
    borderRadius: CARD.borderRadius,
    padding: CARD.padding,
  },
  // default — settings, lists, sections, info
  default: {
    backgroundColor: PALETTE.white,
    borderRadius: CARD.borderRadius,
    padding: CARD.padding,
    ...SHADOW_CARD,
  },
  // elevated — same as default (alias for clarity)
  elevated: {
    backgroundColor: PALETTE.white,
    borderRadius: CARD.borderRadius,
    padding: CARD.padding,
    ...SHADOW_CARD,
  },
  // primary — continue, active, current progress
  primary: {
    backgroundColor: PALETTE.white,
    borderRadius: CARD.borderRadius,
    padding: CARD.padding,
    borderLeftWidth: 4,
    borderLeftColor: SEMANTIC.primary,
    ...SHADOW_CARD,
  },
  // highlight — recommendations, next step
  highlight: {
    backgroundColor: PALETTE.white,
    borderRadius: CARD.borderRadius,
    padding: CARD.padding,
    borderWidth: 2,
    borderColor: SEMANTIC.warning,
    ...SHADOW_CARD,
  },
  // outlined — bordered, no shadow
  outlined: {
    backgroundColor: PALETTE.white,
    borderRadius: CARD.borderRadius,
    padding: CARD.padding,
    borderWidth: 1,
    borderColor: PALETTE.grey200,
  },
  // tinted — primary-tinted background
  tinted: {
    backgroundColor: SEMANTIC.primaryLight,
    borderRadius: CARD.borderRadius,
    padding: CARD.padding,
  },
  // warning — orange-bordered for recommendations
  warning: {
    backgroundColor: SEMANTIC.warningLight,
    borderRadius: CARD.borderRadius,
    padding: CARD.padding,
    borderWidth: 2,
    borderColor: SEMANTIC.warning,
  },
});

// ══════════════════════════════════════════════════════════════════════════════
// REUSABLE BUTTON STYLES — default + pressed + disabled + destructive + ghost
// ══════════════════════════════════════════════════════════════════════════════

export const btnStyles = StyleSheet.create({
  // Primary
  primary: {
    height: CTA.height,
    borderRadius: CTA.borderRadius,
    backgroundColor: BUTTON.primary.default.bg,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: CTA.depthWidth,
    borderBottomColor: BUTTON.primary.default.border,
  },
  primaryText: {
    color: BUTTON.primary.default.text,
    fontSize: CTA.fontSize,
    fontWeight: CTA.fontWeight,
  },
  primaryPressed: {
    height: CTA.height,
    borderRadius: CTA.borderRadius,
    backgroundColor: BUTTON.primary.pressed.bg,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: CTA.depthWidth,
    borderBottomColor: BUTTON.primary.pressed.border,
  },
  primaryDisabled: {
    height: CTA.height,
    borderRadius: CTA.borderRadius,
    backgroundColor: BUTTON.primary.disabled.bg,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: CTA.depthWidth,
    borderBottomColor: BUTTON.primary.disabled.border,
  },
  primaryDisabledText: {
    color: BUTTON.primary.disabled.text,
    fontSize: CTA.fontSize,
    fontWeight: CTA.fontWeight,
  },

  // Secondary
  secondary: {
    height: CTA.height,
    borderRadius: CTA.borderRadius,
    backgroundColor: BUTTON.secondary.default.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: {
    color: BUTTON.secondary.default.text,
    fontSize: CTA.fontSize,
    fontWeight: CTA.fontWeight,
  },
  secondaryPressed: {
    height: CTA.height,
    borderRadius: CTA.borderRadius,
    backgroundColor: BUTTON.secondary.pressed.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Destructive
  destructive: {
    height: CTA.height,
    borderRadius: CTA.borderRadius,
    backgroundColor: BUTTON.destructive.default.bg,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: CTA.depthWidth,
    borderBottomColor: BUTTON.destructive.default.border,
  },
  destructiveText: {
    color: BUTTON.destructive.default.text,
    fontSize: CTA.fontSize,
    fontWeight: CTA.fontWeight,
  },

  // Ghost
  ghost: {
    height: CTA.height,
    borderRadius: CTA.borderRadius,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostText: {
    color: BUTTON.ghost.default.text,
    fontSize: CTA.fontSize,
    fontWeight: CTA.fontWeight,
  },
});

// ══════════════════════════════════════════════════════════════════════════════
// THEME COLORS — Light & Dark
// ══════════════════════════════════════════════════════════════════════════════

interface ThemeColors {
  bg: string;
  screenBg: string;
  altBg: string;
  mapBg: string;
  chipBg: string;
  inputBg: string;
  card: string;
  cardAlt: string;
  cardAlt2: string;
  border: string;
  borderCard: string;
  text: string;
  subtext: string;
  mutedText: string;
  bodyText: string;
  rowLabel: string;
  backIcon: string;
  accentText: string;
  tabBar: string;
  tabBarBorder: string;
  statusBar: 'dark-content' | 'light-content';
}

const lightColors: ThemeColors = {
  bg: '#F5F7FA',
  screenBg: '#F5F7FA',
  altBg: '#EEF1F6',
  mapBg: '#EEF3FF',
  chipBg: '#EEF1F6',
  inputBg: PALETTE.grey100,
  card: PALETTE.white,
  cardAlt: '#F8FAFF',
  cardAlt2: '#F5F7FA',
  border: PALETTE.grey200,
  borderCard: PALETTE.grey300,
  text: PALETTE.grey800,
  subtext: PALETTE.grey500,
  mutedText: PALETTE.grey400,
  bodyText: PALETTE.grey600,
  rowLabel: PALETTE.grey600,
  backIcon: PALETTE.grey600,
  accentText: SEMANTIC.primary,
  tabBar: PALETTE.white,
  tabBarBorder: PALETTE.grey200,
  statusBar: 'dark-content',
};

const darkColors: ThemeColors = {
  bg: '#0F1117',
  screenBg: '#0F1117',
  altBg: '#161822',
  mapBg: '#111628',
  chipBg: '#1C1F2E',
  inputBg: '#1C1F2E',
  card: '#1A1D2B',
  cardAlt: '#1E2235',
  cardAlt2: '#161822',
  border: '#262A3A',
  borderCard: '#2D3148',
  text: '#F0F1F5',
  subtext: '#7D82A0',   // bumped from #6B7190 for better contrast
  mutedText: '#6A7098', // bumped from #5A6080 for better contrast
  bodyText: '#C5C9D6',
  rowLabel: '#C5C9D6',
  backIcon: '#C5C9D6',
  accentText: '#6AABFF',
  tabBar: '#13151F',
  tabBarBorder: '#1C1F2E',
  statusBar: 'light-content',
};

// ══════════════════════════════════════════════════════════════════════════════
// UNIFIED THEME OBJECTS — one shape for everything
// ══════════════════════════════════════════════════════════════════════════════

export const lightTheme = {
  colors: lightColors,
  palette: PALETTE,
  semantic: SEMANTIC,
  spacing: SP,
  radius: RADIUS,
  layout: LAYOUT,
  typography: TYPE,
  shadows: {
    card: SHADOW_CARD,
    cardSm: SHADOW_CARD_SM,
    cta: SHADOW_CTA,
    feedback: SHADOW_FEEDBACK,
  },
  components: {
    card: CARD,
    cta: CTA,
    progress: PROGRESS,
    iconContainer: ICON_CONTAINER,
  },
  states: STATES,
  button: BUTTON,
  answer: ANSWER,
};

export const darkTheme: typeof lightTheme = {
  ...lightTheme,
  colors: darkColors,
};

export type AppTheme = typeof lightTheme;

// ══════════════════════════════════════════════════════════════════════════════
// THEME CONTEXT — Supports light / dark / system
// ══════════════════════════════════════════════════════════════════════════════

export type ThemeMode = 'light' | 'dark' | 'system';

type ThemeContextType = {
  isDark: boolean;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggleDark: () => void;
  colors: ThemeColors;
  theme: AppTheme;
};

const ThemeContext = createContext<ThemeContextType>({
  isDark: false,
  mode: 'system',
  setMode: () => {},
  toggleDark: () => {},
  colors: lightColors,
  theme: lightTheme,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>('system');

  const isDark =
    mode === 'system'
      ? systemScheme === 'dark'
      : mode === 'dark';

  const toggleDark = () => setMode(isDark ? 'light' : 'dark');
  const currentTheme = isDark ? darkTheme : lightTheme;

  const value = useMemo(() => ({
    isDark,
    mode,
    setMode,
    toggleDark,
    colors: currentTheme.colors,
    theme: currentTheme,
  }), [isDark, mode]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
