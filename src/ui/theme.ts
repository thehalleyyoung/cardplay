/**
 * @fileoverview Design System Foundation.
 * 
 * Provides a complete theming system with:
 * - CSS custom properties for theming
 * - Dark/light/high-contrast themes
 * - Semantic color palette
 * - Typography scale
 * - Spacing and sizing tokens
 * - Animation timing tokens
 * - Focus, hover, and state styling
 */

// ============================================================================
// COLOR TYPES
// ============================================================================

/**
 * Theme mode.
 */
export type ThemeMode = 'light' | 'dark' | 'high-contrast';

/**
 * Color intent for semantic naming.
 */
export type ColorIntent = 
  | 'primary'
  | 'secondary'
  | 'accent'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'neutral';

/**
 * Color shade level (50-950).
 */
export type ColorShade = 
  | 50 | 100 | 200 | 300 | 400 
  | 500 | 600 | 700 | 800 | 900 | 950;

/**
 * Color scale with all shades.
 */
export interface ColorScale {
  readonly 50: string;
  readonly 100: string;
  readonly 200: string;
  readonly 300: string;
  readonly 400: string;
  readonly 500: string;
  readonly 600: string;
  readonly 700: string;
  readonly 800: string;
  readonly 900: string;
  readonly 950: string;
}

/**
 * Semantic color palette.
 */
export interface SemanticColors {
  // Backgrounds
  readonly bgPrimary: string;
  readonly bgSecondary: string;
  readonly bgTertiary: string;
  readonly bgInverse: string;
  readonly bgOverlay: string;
  readonly bgCard: string;
  readonly bgInput: string;
  readonly bgSelected: string;
  readonly bgHover: string;
  readonly bgActive: string;
  readonly bgDisabled: string;

  // Text
  readonly textPrimary: string;
  readonly textSecondary: string;
  readonly textTertiary: string;
  readonly textInverse: string;
  readonly textDisabled: string;
  readonly textLink: string;
  readonly textError: string;
  readonly textSuccess: string;

  // Borders
  readonly borderPrimary: string;
  readonly borderSecondary: string;
  readonly borderFocus: string;
  readonly borderError: string;
  readonly borderSuccess: string;

  // Interactive
  readonly interactive: string;
  readonly interactiveHover: string;
  readonly interactiveActive: string;
  readonly interactiveDisabled: string;

  // Status
  readonly success: string;
  readonly warning: string;
  readonly error: string;
  readonly info: string;

  // Shadows
  readonly shadowColor: string;
}

// ============================================================================
// TYPOGRAPHY TYPES
// ============================================================================

/**
 * Typography size scale (8 sizes).
 */
export type TypographySize = 
  | 'xs'     // 11px
  | 'sm'     // 12px
  | 'base'   // 14px
  | 'md'     // 16px
  | 'lg'     // 18px
  | 'xl'     // 20px
  | '2xl'    // 24px
  | '3xl';   // 32px

/**
 * Typography weight.
 */
export type TypographyWeight = 
  | 'regular'   // 400
  | 'medium'    // 500
  | 'semibold'  // 600
  | 'bold';     // 700

/**
 * Typography definition.
 */
export interface TypographyStyle {
  readonly fontSize: string;
  readonly lineHeight: string;
  readonly fontWeight: number;
  readonly letterSpacing: string;
}

/**
 * Complete typography scale.
 */
export interface TypographyScale {
  readonly fontFamily: string;
  readonly fontFamilyMono: string;
  readonly sizes: Record<TypographySize, TypographyStyle>;
  readonly weights: Record<TypographyWeight, number>;
}

// ============================================================================
// SPACING & SIZING TYPES
// ============================================================================

/**
 * Spacing scale (4px base unit).
 */
export type SpacingSize = 
  | '0'      // 0px
  | '0.5'    // 2px
  | '1'      // 4px
  | '1.5'    // 6px
  | '2'      // 8px
  | '2.5'    // 10px
  | '3'      // 12px
  | '4'      // 16px
  | '5'      // 20px
  | '6'      // 24px
  | '8'      // 32px
  | '10'     // 40px
  | '12'     // 48px
  | '16'     // 64px
  | '20'     // 80px
  | '24';    // 96px

/**
 * Border radius tokens.
 */
export type RadiusSize = 
  | 'none'   // 0px
  | 'sm'     // 2px
  | 'base'   // 4px
  | 'md'     // 6px
  | 'lg'     // 8px
  | 'xl'     // 12px
  | '2xl'    // 16px
  | 'full';  // 9999px

/**
 * Shadow elevation levels.
 */
export type ElevationLevel = 
  | 'none'
  | 'sm'
  | 'base'
  | 'md'
  | 'lg'
  | 'xl';

// ============================================================================
// ANIMATION TYPES
// ============================================================================

/**
 * Animation duration tokens.
 */
export type AnimationDuration = 
  | 'instant'   // 0ms
  | 'fast'      // 100ms
  | 'normal'    // 200ms
  | 'slow'      // 300ms
  | 'slower'    // 500ms
  | 'slowest';  // 1000ms

/**
 * Animation easing curves.
 */
export type AnimationEasing = 
  | 'linear'
  | 'ease'
  | 'easeIn'
  | 'easeOut'
  | 'easeInOut'
  | 'spring';

/**
 * Animation timing configuration.
 */
export interface AnimationTiming {
  readonly duration: string;
  readonly easing: string;
}

// ============================================================================
// THEME DEFINITION
// ============================================================================

/**
 * Complete theme definition.
 */
export interface Theme {
  readonly mode: ThemeMode;
  readonly colors: SemanticColors;
  readonly colorScales: Record<ColorIntent, ColorScale>;
  readonly typography: TypographyScale;
  readonly spacing: Record<SpacingSize, string>;
  readonly radius: Record<RadiusSize, string>;
  readonly shadows: Record<ElevationLevel, string>;
  readonly animation: {
    readonly durations: Record<AnimationDuration, string>;
    readonly easings: Record<AnimationEasing, string>;
  };
}

// ============================================================================
// COLOR SCALES
// ============================================================================

/**
 * Neutral gray scale.
 */
export const NEUTRAL_SCALE: ColorScale = {
  50: '#fafafa',
  100: '#f5f5f5',
  200: '#e5e5e5',
  300: '#d4d4d4',
  400: '#a3a3a3',
  500: '#737373',
  600: '#525252',
  700: '#404040',
  800: '#262626',
  900: '#171717',
  950: '#0a0a0a',
};

/**
 * Primary blue scale.
 */
export const PRIMARY_SCALE: ColorScale = {
  50: '#eff6ff',
  100: '#dbeafe',
  200: '#bfdbfe',
  300: '#93c5fd',
  400: '#60a5fa',
  500: '#3b82f6',
  600: '#2563eb',
  700: '#1d4ed8',
  800: '#1e40af',
  900: '#1e3a8a',
  950: '#172554',
};

/**
 * Secondary purple scale.
 */
export const SECONDARY_SCALE: ColorScale = {
  50: '#faf5ff',
  100: '#f3e8ff',
  200: '#e9d5ff',
  300: '#d8b4fe',
  400: '#c084fc',
  500: '#a855f7',
  600: '#9333ea',
  700: '#7e22ce',
  800: '#6b21a8',
  900: '#581c87',
  950: '#3b0764',
};

/**
 * Accent orange scale.
 */
export const ACCENT_SCALE: ColorScale = {
  50: '#fff7ed',
  100: '#ffedd5',
  200: '#fed7aa',
  300: '#fdba74',
  400: '#fb923c',
  500: '#f97316',
  600: '#ea580c',
  700: '#c2410c',
  800: '#9a3412',
  900: '#7c2d12',
  950: '#431407',
};

/**
 * Success green scale.
 */
export const SUCCESS_SCALE: ColorScale = {
  50: '#f0fdf4',
  100: '#dcfce7',
  200: '#bbf7d0',
  300: '#86efac',
  400: '#4ade80',
  500: '#22c55e',
  600: '#16a34a',
  700: '#15803d',
  800: '#166534',
  900: '#14532d',
  950: '#052e16',
};

/**
 * Warning yellow scale.
 */
export const WARNING_SCALE: ColorScale = {
  50: '#fefce8',
  100: '#fef9c3',
  200: '#fef08a',
  300: '#fde047',
  400: '#facc15',
  500: '#eab308',
  600: '#ca8a04',
  700: '#a16207',
  800: '#854d0e',
  900: '#713f12',
  950: '#422006',
};

/**
 * Error red scale.
 */
export const ERROR_SCALE: ColorScale = {
  50: '#fef2f2',
  100: '#fee2e2',
  200: '#fecaca',
  300: '#fca5a5',
  400: '#f87171',
  500: '#ef4444',
  600: '#dc2626',
  700: '#b91c1c',
  800: '#991b1b',
  900: '#7f1d1d',
  950: '#450a0a',
};

/**
 * Info cyan scale.
 */
export const INFO_SCALE: ColorScale = {
  50: '#ecfeff',
  100: '#cffafe',
  200: '#a5f3fc',
  300: '#67e8f9',
  400: '#22d3ee',
  500: '#06b6d4',
  600: '#0891b2',
  700: '#0e7490',
  800: '#155e75',
  900: '#164e63',
  950: '#083344',
};

// ============================================================================
// DEFAULT THEMES
// ============================================================================

/**
 * Light theme semantic colors.
 */
export const LIGHT_COLORS: SemanticColors = {
  // Backgrounds
  bgPrimary: '#ffffff',
  bgSecondary: NEUTRAL_SCALE[50],
  bgTertiary: NEUTRAL_SCALE[100],
  bgInverse: NEUTRAL_SCALE[900],
  bgOverlay: 'rgba(0, 0, 0, 0.4)',
  bgCard: '#ffffff',
  bgInput: '#ffffff',
  bgSelected: PRIMARY_SCALE[50],
  bgHover: NEUTRAL_SCALE[100],
  bgActive: NEUTRAL_SCALE[200],
  bgDisabled: NEUTRAL_SCALE[100],

  // Text
  textPrimary: NEUTRAL_SCALE[900],
  textSecondary: NEUTRAL_SCALE[600],
  textTertiary: NEUTRAL_SCALE[400],
  textInverse: '#ffffff',
  textDisabled: NEUTRAL_SCALE[400],
  textLink: PRIMARY_SCALE[600],
  textError: ERROR_SCALE[600],
  textSuccess: SUCCESS_SCALE[600],

  // Borders
  borderPrimary: NEUTRAL_SCALE[200],
  borderSecondary: NEUTRAL_SCALE[100],
  borderFocus: PRIMARY_SCALE[500],
  borderError: ERROR_SCALE[500],
  borderSuccess: SUCCESS_SCALE[500],

  // Interactive
  interactive: PRIMARY_SCALE[600],
  interactiveHover: PRIMARY_SCALE[700],
  interactiveActive: PRIMARY_SCALE[800],
  interactiveDisabled: NEUTRAL_SCALE[300],

  // Status
  success: SUCCESS_SCALE[500],
  warning: WARNING_SCALE[500],
  error: ERROR_SCALE[500],
  info: INFO_SCALE[500],

  // Shadows
  shadowColor: 'rgba(0, 0, 0, 0.1)',
};

/**
 * Dark theme semantic colors.
 */
export const DARK_COLORS: SemanticColors = {
  // Backgrounds
  bgPrimary: NEUTRAL_SCALE[900],
  bgSecondary: NEUTRAL_SCALE[800],
  bgTertiary: NEUTRAL_SCALE[700],
  bgInverse: '#ffffff',
  bgOverlay: 'rgba(0, 0, 0, 0.6)',
  bgCard: NEUTRAL_SCALE[800],
  bgInput: NEUTRAL_SCALE[800],
  bgSelected: PRIMARY_SCALE[900],
  bgHover: NEUTRAL_SCALE[700],
  bgActive: NEUTRAL_SCALE[600],
  bgDisabled: NEUTRAL_SCALE[800],

  // Text
  textPrimary: '#ffffff',
  textSecondary: NEUTRAL_SCALE[300],
  textTertiary: NEUTRAL_SCALE[500],
  textInverse: NEUTRAL_SCALE[900],
  textDisabled: NEUTRAL_SCALE[600],
  textLink: PRIMARY_SCALE[400],
  textError: ERROR_SCALE[400],
  textSuccess: SUCCESS_SCALE[400],

  // Borders
  borderPrimary: NEUTRAL_SCALE[700],
  borderSecondary: NEUTRAL_SCALE[800],
  borderFocus: PRIMARY_SCALE[500],
  borderError: ERROR_SCALE[500],
  borderSuccess: SUCCESS_SCALE[500],

  // Interactive
  interactive: PRIMARY_SCALE[500],
  interactiveHover: PRIMARY_SCALE[400],
  interactiveActive: PRIMARY_SCALE[300],
  interactiveDisabled: NEUTRAL_SCALE[700],

  // Status
  success: SUCCESS_SCALE[400],
  warning: WARNING_SCALE[400],
  error: ERROR_SCALE[400],
  info: INFO_SCALE[400],

  // Shadows
  shadowColor: 'rgba(0, 0, 0, 0.3)',
};

/**
 * High contrast theme semantic colors.
 */
export const HIGH_CONTRAST_COLORS: SemanticColors = {
  // Backgrounds
  bgPrimary: '#000000',
  bgSecondary: '#000000',
  bgTertiary: '#1a1a1a',
  bgInverse: '#ffffff',
  bgOverlay: 'rgba(0, 0, 0, 0.8)',
  bgCard: '#000000',
  bgInput: '#000000',
  bgSelected: '#003366',
  bgHover: '#1a1a1a',
  bgActive: '#333333',
  bgDisabled: '#1a1a1a',

  // Text
  textPrimary: '#ffffff',
  textSecondary: '#ffffff',
  textTertiary: '#cccccc',
  textInverse: '#000000',
  textDisabled: '#666666',
  textLink: '#00ffff',
  textError: '#ff6666',
  textSuccess: '#66ff66',

  // Borders
  borderPrimary: '#ffffff',
  borderSecondary: '#666666',
  borderFocus: '#00ffff',
  borderError: '#ff0000',
  borderSuccess: '#00ff00',

  // Interactive
  interactive: '#00ccff',
  interactiveHover: '#00ffff',
  interactiveActive: '#ffffff',
  interactiveDisabled: '#666666',

  // Status
  success: '#00ff00',
  warning: '#ffff00',
  error: '#ff0000',
  info: '#00ffff',

  // Shadows
  shadowColor: 'rgba(255, 255, 255, 0.1)',
};

// ============================================================================
// TYPOGRAPHY
// ============================================================================

/**
 * Default typography scale.
 */
export const DEFAULT_TYPOGRAPHY: TypographyScale = {
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  fontFamilyMono: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
  sizes: {
    'xs': {
      fontSize: '11px',
      lineHeight: '16px',
      fontWeight: 400,
      letterSpacing: '0.01em',
    },
    'sm': {
      fontSize: '12px',
      lineHeight: '16px',
      fontWeight: 400,
      letterSpacing: '0em',
    },
    'base': {
      fontSize: '14px',
      lineHeight: '20px',
      fontWeight: 400,
      letterSpacing: '0em',
    },
    'md': {
      fontSize: '16px',
      lineHeight: '24px',
      fontWeight: 400,
      letterSpacing: '-0.01em',
    },
    'lg': {
      fontSize: '18px',
      lineHeight: '28px',
      fontWeight: 400,
      letterSpacing: '-0.01em',
    },
    'xl': {
      fontSize: '20px',
      lineHeight: '28px',
      fontWeight: 400,
      letterSpacing: '-0.02em',
    },
    '2xl': {
      fontSize: '24px',
      lineHeight: '32px',
      fontWeight: 400,
      letterSpacing: '-0.02em',
    },
    '3xl': {
      fontSize: '32px',
      lineHeight: '40px',
      fontWeight: 400,
      letterSpacing: '-0.02em',
    },
  },
  weights: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
};

// ============================================================================
// SPACING & SIZING
// ============================================================================

/**
 * Spacing scale (4px base unit).
 */
export const SPACING_SCALE: Record<SpacingSize, string> = {
  '0': '0px',
  '0.5': '2px',
  '1': '4px',
  '1.5': '6px',
  '2': '8px',
  '2.5': '10px',
  '3': '12px',
  '4': '16px',
  '5': '20px',
  '6': '24px',
  '8': '32px',
  '10': '40px',
  '12': '48px',
  '16': '64px',
  '20': '80px',
  '24': '96px',
};

/**
 * Border radius tokens.
 */
export const RADIUS_SCALE: Record<RadiusSize, string> = {
  'none': '0px',
  'sm': '2px',
  'base': '4px',
  'md': '6px',
  'lg': '8px',
  'xl': '12px',
  '2xl': '16px',
  'full': '9999px',
};

/**
 * Shadow elevation system.
 */
export const SHADOW_SCALE: Record<ElevationLevel, string> = {
  'none': 'none',
  'sm': '0 1px 2px 0 var(--shadow-color)',
  'base': '0 1px 3px 0 var(--shadow-color), 0 1px 2px -1px var(--shadow-color)',
  'md': '0 4px 6px -1px var(--shadow-color), 0 2px 4px -2px var(--shadow-color)',
  'lg': '0 10px 15px -3px var(--shadow-color), 0 4px 6px -4px var(--shadow-color)',
  'xl': '0 20px 25px -5px var(--shadow-color), 0 8px 10px -6px var(--shadow-color)',
};

// ============================================================================
// ANIMATION
// ============================================================================

/**
 * Animation duration tokens.
 */
export const ANIMATION_DURATIONS: Record<AnimationDuration, string> = {
  'instant': '0ms',
  'fast': '100ms',
  'normal': '200ms',
  'slow': '300ms',
  'slower': '500ms',
  'slowest': '1000ms',
};

/**
 * Animation easing curves.
 */
export const ANIMATION_EASINGS: Record<AnimationEasing, string> = {
  'linear': 'linear',
  'ease': 'ease',
  'easeIn': 'cubic-bezier(0.4, 0, 1, 1)',
  'easeOut': 'cubic-bezier(0, 0, 0.2, 1)',
  'easeInOut': 'cubic-bezier(0.4, 0, 0.2, 1)',
  'spring': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
};

// ============================================================================
// THEME FACTORY
// ============================================================================

/**
 * All color scales.
 */
export const COLOR_SCALES: Record<ColorIntent, ColorScale> = {
  primary: PRIMARY_SCALE,
  secondary: SECONDARY_SCALE,
  accent: ACCENT_SCALE,
  success: SUCCESS_SCALE,
  warning: WARNING_SCALE,
  error: ERROR_SCALE,
  info: INFO_SCALE,
  neutral: NEUTRAL_SCALE,
};

/**
 * Create a theme for the given mode.
 */
export function createTheme(mode: ThemeMode): Theme {
  const colors = mode === 'light' ? LIGHT_COLORS
    : mode === 'dark' ? DARK_COLORS
    : HIGH_CONTRAST_COLORS;

  return {
    mode,
    colors,
    colorScales: COLOR_SCALES,
    typography: DEFAULT_TYPOGRAPHY,
    spacing: SPACING_SCALE,
    radius: RADIUS_SCALE,
    shadows: SHADOW_SCALE,
    animation: {
      durations: ANIMATION_DURATIONS,
      easings: ANIMATION_EASINGS,
    },
  };
}

/**
 * Default light theme.
 */
export const LIGHT_THEME = createTheme('light');

/**
 * Default dark theme.
 */
export const DARK_THEME = createTheme('dark');

/**
 * High contrast theme.
 */
export const HIGH_CONTRAST_THEME = createTheme('high-contrast');

// ============================================================================
// CSS CUSTOM PROPERTIES
// ============================================================================

/**
 * Generate CSS custom properties for a theme.
 */
export function themeToCSSProperties(theme: Theme): Record<string, string> {
  const props: Record<string, string> = {};

  // Colors
  for (const [key, value] of Object.entries(theme.colors)) {
    props[`--color-${camelToKebab(key)}`] = value;
  }

  // Color scales
  for (const [intent, scale] of Object.entries(theme.colorScales)) {
    for (const [shade, value] of Object.entries(scale)) {
      props[`--color-${intent}-${shade}`] = value;
    }
  }

  // Typography
  props['--font-family'] = theme.typography.fontFamily;
  props['--font-family-mono'] = theme.typography.fontFamilyMono;

  for (const [size, style] of Object.entries(theme.typography.sizes)) {
    props[`--font-size-${size}`] = style.fontSize;
    props[`--line-height-${size}`] = style.lineHeight;
    props[`--letter-spacing-${size}`] = style.letterSpacing;
  }

  for (const [weight, value] of Object.entries(theme.typography.weights)) {
    props[`--font-weight-${weight}`] = String(value);
  }

  // Spacing
  for (const [size, value] of Object.entries(theme.spacing)) {
    props[`--spacing-${size.replace('.', '_')}`] = value;
  }

  // Radius
  for (const [size, value] of Object.entries(theme.radius)) {
    props[`--radius-${size}`] = value;
  }

  // Shadows
  props['--shadow-color'] = theme.colors.shadowColor;
  for (const [level, value] of Object.entries(theme.shadows)) {
    props[`--shadow-${level}`] = value;
  }

  // Animation
  for (const [duration, value] of Object.entries(theme.animation.durations)) {
    props[`--duration-${camelToKebab(duration)}`] = value;
  }

  for (const [easing, value] of Object.entries(theme.animation.easings)) {
    props[`--easing-${camelToKebab(easing)}`] = value;
  }

  return props;
}

/**
 * Generate CSS string from theme.
 */
export function themeToCSSString(theme: Theme, selector: string = ':root'): string {
  const props = themeToCSSProperties(theme);
  const lines = Object.entries(props).map(([key, value]) => `  ${key}: ${value};`);
  return `${selector} {\n${lines.join('\n')}\n}`;
}

/**
 * Apply theme to document root.
 */
export function applyTheme(theme: Theme): void {
  if (typeof document === 'undefined') return;
  
  const root = document.documentElement;
  const props = themeToCSSProperties(theme);
  
  for (const [key, value] of Object.entries(props)) {
    root.style.setProperty(key, value);
  }
  
  root.setAttribute('data-theme', theme.mode);
}

/**
 * Convert camelCase to kebab-case.
 */
function camelToKebab(str: string): string {
  return str.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
}

// ============================================================================
// FOCUS & STATE STYLING
// ============================================================================

/**
 * Focus ring style configuration.
 */
export interface FocusRingStyle {
  readonly color: string;
  readonly width: string;
  readonly offset: string;
  readonly style: string;
}

/**
 * Default focus ring style.
 */
export const DEFAULT_FOCUS_RING: FocusRingStyle = {
  color: 'var(--color-border-focus)',
  width: '2px',
  offset: '2px',
  style: 'solid',
};

/**
 * Generate focus ring CSS.
 */
export function focusRingCSS(ring: FocusRingStyle = DEFAULT_FOCUS_RING): string {
  return `outline: ${ring.width} ${ring.style} ${ring.color}; outline-offset: ${ring.offset};`;
}

/**
 * State styling configuration.
 */
export interface StateStyles {
  readonly hover: Record<string, string>;
  readonly active: Record<string, string>;
  readonly focus: Record<string, string>;
  readonly disabled: Record<string, string>;
  readonly selected: Record<string, string>;
}

/**
 * Default interactive state styles.
 */
export const DEFAULT_STATE_STYLES: StateStyles = {
  hover: {
    background: 'var(--color-bg-hover)',
  },
  active: {
    background: 'var(--color-bg-active)',
  },
  focus: {
    outline: '2px solid var(--color-border-focus)',
    'outline-offset': '2px',
  },
  disabled: {
    opacity: '0.5',
    'pointer-events': 'none',
    cursor: 'not-allowed',
  },
  selected: {
    background: 'var(--color-bg-selected)',
    color: 'var(--color-interactive)',
  },
};

// ============================================================================
// THEME CONTEXT
// ============================================================================

/**
 * Theme context state.
 */
export interface ThemeContext {
  readonly theme: Theme;
  readonly setMode: (mode: ThemeMode) => void;
  readonly toggleMode: () => void;
}

/**
 * Theme mode preference from system.
 */
export function getSystemThemeMode(): ThemeMode {
  if (typeof window === 'undefined') return 'light';
  
  return window.matchMedia('(prefers-color-scheme: dark)').matches 
    ? 'dark' 
    : 'light';
}

/**
 * Theme mode preference from local storage.
 */
export function getStoredThemeMode(key: string = 'theme-mode'): ThemeMode | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    
    const stored = localStorage.getItem(key);
    if (stored === 'light' || stored === 'dark' || stored === 'high-contrast') {
      return stored;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Store theme mode preference.
 */
export function storeThemeMode(mode: ThemeMode, key: string = 'theme-mode'): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(key, mode);
  } catch {
    // Ignore storage errors
  }
}

/**
 * Watch for system theme changes.
 */
export function watchSystemTheme(
  callback: (mode: ThemeMode) => void
): () => void {
  if (typeof window === 'undefined') return () => {};
  
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const handler = (e: MediaQueryListEvent) => {
    callback(e.matches ? 'dark' : 'light');
  };
  
  mediaQuery.addEventListener('change', handler);
  return () => mediaQuery.removeEventListener('change', handler);
}

// ============================================================================
// ACCESSIBILITY
// ============================================================================

/**
 * Check if reduced motion is preferred.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Get animation duration based on reduced motion preference.
 */
export function getAnimationDuration(
  duration: AnimationDuration,
  reducedMotion: boolean = prefersReducedMotion()
): string {
  if (reducedMotion) return '0ms';
  return ANIMATION_DURATIONS[duration];
}

/**
 * Check if high contrast is preferred.
 */
export function prefersHighContrast(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-contrast: more)').matches;
}
