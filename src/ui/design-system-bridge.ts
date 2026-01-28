/**
 * @fileoverview Design System Bridge
 * 
 * Bridges Phase 4 UI Framework with Phase 41-43 Card/Deck UI System.
 * Provides a unified theming, component, and token system that works
 * across all UI layers.
 * 
 * Complements: cardplayui.md, theme.ts, deck-layouts.ts
 * Used by: card-component.ts, stack-component.ts, reveal-panel.ts
 * 
 * @module @cardplay/ui/design-system-bridge
 */

import type { ThemeMode, TypographySize } from './theme';

// ============================================================================
// CSS CUSTOM PROPERTY SYSTEM (cardplayui.md Section 11)
// ============================================================================

/**
 * Complete CSS custom property definitions for theming.
 * These bridge Phase 4's token system with Phase 43's component CSS.
 */
export const CSS_VARIABLES = {
  // Card system colors (Phase 43)
  '--cardplay-card-bg': 'var(--color-bg-card)',
  '--cardplay-card-header': 'var(--color-bg-secondary)',
  '--cardplay-card-border': 'var(--color-border-primary)',
  '--cardplay-card-shadow': 'var(--shadow-md)',
  '--cardplay-card-hover-shadow': 'var(--shadow-lg)',
  '--cardplay-card-selected-border': 'var(--color-border-focus)',
  
  // Stack colors
  '--cardplay-stack-bg': 'var(--color-bg-secondary)',
  '--cardplay-stack-header': 'var(--color-bg-tertiary)',
  '--cardplay-stack-border': 'var(--color-border-secondary)',
  
  // Reveal panel colors
  '--cardplay-panel-bg': 'var(--color-bg-primary)',
  '--cardplay-panel-header': 'var(--color-bg-secondary)',
  '--cardplay-panel-border': 'var(--color-border-primary)',
  
  // Connection colors
  '--cardplay-connection-audio': '#6366f1',
  '--cardplay-connection-midi': '#22c55e',
  '--cardplay-connection-mod': '#f59e0b',
  '--cardplay-connection-trigger': '#ec4899',
  '--cardplay-connection-control': '#06b6d4',
  '--cardplay-connection-sidechain': '#8b5cf6',
  
  // Text colors
  '--cardplay-text': 'var(--color-text-primary)',
  '--cardplay-text-secondary': 'var(--color-text-secondary)',
  '--cardplay-text-tertiary': 'var(--color-text-tertiary)',
  '--cardplay-text-inverse': 'var(--color-text-inverse)',
  
  // Interactive colors
  '--cardplay-accent': 'var(--color-interactive)',
  '--cardplay-accent-hover': 'var(--color-interactive-hover)',
  '--cardplay-accent-active': 'var(--color-interactive-active)',
  '--cardplay-accent-dim': 'rgba(99, 102, 241, 0.15)',
  
  // State colors
  '--cardplay-hover': 'var(--color-bg-hover)',
  '--cardplay-active': 'var(--color-bg-active)',
  '--cardplay-selected': 'var(--color-bg-selected)',
  '--cardplay-border': 'var(--color-border-primary)',
  '--cardplay-focus-ring': 'var(--color-border-focus)',
  
  // Visualization colors
  '--cardplay-viz-bg': '#1a1a1a',
  '--cardplay-viz-grid': '#333333',
  '--cardplay-viz-foreground': '#6366f1',
  '--cardplay-viz-accent': '#22c55e',
  '--cardplay-viz-peak': '#f59e0b',
  '--cardplay-viz-clip': '#ef4444',
  
  // MIDI visualization
  '--cardplay-midi-bg': '#1a1a1a',
  '--cardplay-midi-key-white': '#e5e5e5',
  '--cardplay-midi-key-black': '#333333',
  '--cardplay-midi-note-active': '#6366f1',
  '--cardplay-midi-velocity': '#22c55e',
  
  // Shadows
  '--cardplay-shadow-sm': '0 1px 2px rgba(0, 0, 0, 0.2)',
  '--cardplay-shadow-md': '0 4px 6px rgba(0, 0, 0, 0.25)',
  '--cardplay-shadow-lg': '0 10px 15px rgba(0, 0, 0, 0.3)',
  '--cardplay-shadow-xl': '0 20px 25px rgba(0, 0, 0, 0.35)',
  
  // Transitions
  '--cardplay-transition-fast': '0.1s ease',
  '--cardplay-transition-normal': '0.15s ease',
  '--cardplay-transition-slow': '0.3s ease',
  
  // Border radius
  '--cardplay-radius-sm': '4px',
  '--cardplay-radius-md': '6px',
  '--cardplay-radius-lg': '8px',
  '--cardplay-radius-xl': '12px',
  '--cardplay-radius-full': '9999px',
} as const;

// ============================================================================
// THEME PRESETS (cardplayui.md Section 11.2)
// ============================================================================

export interface CardPlayTheme {
  name: string;
  mode: ThemeMode;
  colors: {
    // Backgrounds
    bgPrimary: string;
    bgSecondary: string;
    bgTertiary: string;
    bgCard: string;
    bgOverlay: string;
    
    // Text
    textPrimary: string;
    textSecondary: string;
    textTertiary: string;
    textInverse: string;
    
    // Borders
    borderPrimary: string;
    borderSecondary: string;
    borderFocus: string;
    
    // Interactive
    accent: string;
    accentHover: string;
    accentActive: string;
    
    // Status
    success: string;
    warning: string;
    error: string;
    info: string;
    
    // Connection types
    connectionAudio: string;
    connectionMidi: string;
    connectionMod: string;
    connectionTrigger: string;
    connectionControl: string;
    
    // Visualization
    vizBackground: string;
    vizForeground: string;
    vizGrid: string;
    vizPeak: string;
    vizClip: string;
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  radii: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
    full: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  typography: {
    fontFamily: string;
    fontFamilyMono: string;
    sizes: Record<TypographySize, string>;
  };
}

/**
 * Dark theme (default)
 */
export const DARK_THEME: CardPlayTheme = {
  name: 'Dark',
  mode: 'dark',
  colors: {
    bgPrimary: '#0a0a0a',
    bgSecondary: '#141414',
    bgTertiary: '#1e1e1e',
    bgCard: '#1a1a1a',
    bgOverlay: 'rgba(0, 0, 0, 0.7)',
    
    textPrimary: '#ffffff',
    textSecondary: '#a1a1aa',
    textTertiary: '#71717a',
    textInverse: '#0a0a0a',
    
    borderPrimary: '#27272a',
    borderSecondary: '#3f3f46',
    borderFocus: '#6366f1',
    
    accent: '#6366f1',
    accentHover: '#818cf8',
    accentActive: '#4f46e5',
    
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#06b6d4',
    
    connectionAudio: '#6366f1',
    connectionMidi: '#22c55e',
    connectionMod: '#f59e0b',
    connectionTrigger: '#ec4899',
    connectionControl: '#06b6d4',
    
    vizBackground: '#0f0f0f',
    vizForeground: '#6366f1',
    vizGrid: '#333333',
    vizPeak: '#f59e0b',
    vizClip: '#ef4444',
  },
  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.3)',
    md: '0 4px 6px rgba(0, 0, 0, 0.4)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.5)',
    xl: '0 20px 25px rgba(0, 0, 0, 0.6)',
  },
  radii: {
    sm: '4px',
    md: '6px',
    lg: '8px',
    xl: '12px',
    full: '9999px',
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
  },
  typography: {
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontFamilyMono: 'JetBrains Mono, Menlo, Monaco, "Courier New", monospace',
    sizes: {
      xs: '11px',
      sm: '12px',
      base: '14px',
      md: '16px',
      lg: '18px',
      xl: '20px',
      '2xl': '24px',
      '3xl': '32px',
    },
  },
};

/**
 * Light theme
 */
export const LIGHT_THEME: CardPlayTheme = {
  name: 'Light',
  mode: 'light',
  colors: {
    bgPrimary: '#ffffff',
    bgSecondary: '#f4f4f5',
    bgTertiary: '#e4e4e7',
    bgCard: '#ffffff',
    bgOverlay: 'rgba(255, 255, 255, 0.9)',
    
    textPrimary: '#09090b',
    textSecondary: '#52525b',
    textTertiary: '#a1a1aa',
    textInverse: '#ffffff',
    
    borderPrimary: '#e4e4e7',
    borderSecondary: '#d4d4d8',
    borderFocus: '#6366f1',
    
    accent: '#6366f1',
    accentHover: '#4f46e5',
    accentActive: '#4338ca',
    
    success: '#16a34a',
    warning: '#d97706',
    error: '#dc2626',
    info: '#0891b2',
    
    connectionAudio: '#6366f1',
    connectionMidi: '#16a34a',
    connectionMod: '#d97706',
    connectionTrigger: '#db2777',
    connectionControl: '#0891b2',
    
    vizBackground: '#f4f4f5',
    vizForeground: '#6366f1',
    vizGrid: '#d4d4d8',
    vizPeak: '#d97706',
    vizClip: '#dc2626',
  },
  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.15)',
    xl: '0 20px 25px rgba(0, 0, 0, 0.2)',
  },
  radii: DARK_THEME.radii,
  spacing: DARK_THEME.spacing,
  typography: DARK_THEME.typography,
};

/**
 * High contrast theme (accessibility)
 */
export const HIGH_CONTRAST_THEME: CardPlayTheme = {
  name: 'High Contrast',
  mode: 'high-contrast',
  colors: {
    bgPrimary: '#000000',
    bgSecondary: '#0a0a0a',
    bgTertiary: '#141414',
    bgCard: '#0a0a0a',
    bgOverlay: 'rgba(0, 0, 0, 0.95)',
    
    textPrimary: '#ffffff',
    textSecondary: '#e5e5e5',
    textTertiary: '#a3a3a3',
    textInverse: '#000000',
    
    borderPrimary: '#ffffff',
    borderSecondary: '#a3a3a3',
    borderFocus: '#ffff00',
    
    accent: '#00ffff',
    accentHover: '#00cccc',
    accentActive: '#009999',
    
    success: '#00ff00',
    warning: '#ffff00',
    error: '#ff0000',
    info: '#00ffff',
    
    connectionAudio: '#00ffff',
    connectionMidi: '#00ff00',
    connectionMod: '#ffff00',
    connectionTrigger: '#ff00ff',
    connectionControl: '#00ffff',
    
    vizBackground: '#000000',
    vizForeground: '#00ffff',
    vizGrid: '#333333',
    vizPeak: '#ffff00',
    vizClip: '#ff0000',
  },
  shadows: {
    sm: '0 0 0 1px #ffffff',
    md: '0 0 0 2px #ffffff',
    lg: '0 0 0 3px #ffffff',
    xl: '0 0 0 4px #ffffff',
  },
  radii: DARK_THEME.radii,
  spacing: DARK_THEME.spacing,
  typography: {
    ...DARK_THEME.typography,
    // Slightly larger for accessibility
    sizes: {
      xs: '12px',
      sm: '13px',
      base: '15px',
      md: '17px',
      lg: '19px',
      xl: '22px',
      '2xl': '26px',
      '3xl': '34px',
    },
  },
};

// ============================================================================
// DAW-SPECIFIC THEMES (cardplayui.md Section 9)
// ============================================================================

/**
 * Renoise-inspired theme
 */
export const RENOISE_THEME: CardPlayTheme = {
  name: 'Renoise',
  mode: 'dark',
  colors: {
    bgPrimary: '#1a1a24',
    bgSecondary: '#22222e',
    bgTertiary: '#2a2a38',
    bgCard: '#1e1e28',
    bgOverlay: 'rgba(26, 26, 36, 0.95)',
    
    textPrimary: '#e0e0e8',
    textSecondary: '#8888aa',
    textTertiary: '#5555aa',
    textInverse: '#1a1a24',
    
    borderPrimary: '#3a3a4e',
    borderSecondary: '#4a4a5e',
    borderFocus: '#6688ff',
    
    accent: '#6688ff',
    accentHover: '#7799ff',
    accentActive: '#5577ee',
    
    success: '#44dd66',
    warning: '#ffaa44',
    error: '#ff4466',
    info: '#44ccff',
    
    connectionAudio: '#6688ff',
    connectionMidi: '#44dd66',
    connectionMod: '#ffaa44',
    connectionTrigger: '#ff44aa',
    connectionControl: '#44ccff',
    
    vizBackground: '#141418',
    vizForeground: '#6688ff',
    vizGrid: '#2a2a3a',
    vizPeak: '#ffaa44',
    vizClip: '#ff4466',
  },
  shadows: DARK_THEME.shadows,
  radii: {
    sm: '2px',
    md: '3px',
    lg: '4px',
    xl: '6px',
    full: '9999px',
  },
  spacing: DARK_THEME.spacing,
  typography: {
    fontFamily: '"Roboto Mono", monospace',
    fontFamilyMono: '"Roboto Mono", monospace',
    sizes: DARK_THEME.typography.sizes,
  },
};

/**
 * Ableton-inspired theme
 */
export const ABLETON_THEME: CardPlayTheme = {
  name: 'Ableton',
  mode: 'dark',
  colors: {
    bgPrimary: '#1e1e1e',
    bgSecondary: '#2d2d2d',
    bgTertiary: '#3c3c3c',
    bgCard: '#2d2d2d',
    bgOverlay: 'rgba(30, 30, 30, 0.95)',
    
    textPrimary: '#ffffff',
    textSecondary: '#999999',
    textTertiary: '#666666',
    textInverse: '#1e1e1e',
    
    borderPrimary: '#4a4a4a',
    borderSecondary: '#5a5a5a',
    borderFocus: '#ff764d',
    
    accent: '#ff764d',
    accentHover: '#ff8866',
    accentActive: '#ee6644',
    
    success: '#00d000',
    warning: '#ffa500',
    error: '#ff3333',
    info: '#00b0ff',
    
    connectionAudio: '#00d000',
    connectionMidi: '#ffcc00',
    connectionMod: '#ff764d',
    connectionTrigger: '#ff00ff',
    connectionControl: '#00b0ff',
    
    vizBackground: '#1a1a1a',
    vizForeground: '#00d000',
    vizGrid: '#333333',
    vizPeak: '#ffa500',
    vizClip: '#ff3333',
  },
  shadows: DARK_THEME.shadows,
  radii: {
    sm: '0px',
    md: '2px',
    lg: '3px',
    xl: '4px',
    full: '9999px',
  },
  spacing: DARK_THEME.spacing,
  typography: DARK_THEME.typography,
};

/**
 * Cubase-inspired theme
 */
export const CUBASE_THEME: CardPlayTheme = {
  name: 'Cubase',
  mode: 'dark',
  colors: {
    bgPrimary: '#2b2b2b',
    bgSecondary: '#3a3a3a',
    bgTertiary: '#4a4a4a',
    bgCard: '#333333',
    bgOverlay: 'rgba(43, 43, 43, 0.95)',
    
    textPrimary: '#e0e0e0',
    textSecondary: '#b0b0b0',
    textTertiary: '#808080',
    textInverse: '#2b2b2b',
    
    borderPrimary: '#555555',
    borderSecondary: '#666666',
    borderFocus: '#5ca5d9',
    
    accent: '#5ca5d9',
    accentHover: '#6bb5e9',
    accentActive: '#4c95c9',
    
    success: '#7bca5e',
    warning: '#e8c547',
    error: '#d64545',
    info: '#5ca5d9',
    
    connectionAudio: '#7bca5e',
    connectionMidi: '#5ca5d9',
    connectionMod: '#e8c547',
    connectionTrigger: '#d64545',
    connectionControl: '#9b7bd4',
    
    vizBackground: '#232323',
    vizForeground: '#5ca5d9',
    vizGrid: '#404040',
    vizPeak: '#e8c547',
    vizClip: '#d64545',
  },
  shadows: DARK_THEME.shadows,
  radii: DARK_THEME.radii,
  spacing: DARK_THEME.spacing,
  typography: DARK_THEME.typography,
};

/**
 * Dorico-inspired theme (notation-focused)
 */
export const DORICO_THEME: CardPlayTheme = {
  name: 'Dorico',
  mode: 'light',
  colors: {
    bgPrimary: '#f5f5f5',
    bgSecondary: '#e8e8e8',
    bgTertiary: '#d8d8d8',
    bgCard: '#ffffff',
    bgOverlay: 'rgba(245, 245, 245, 0.95)',
    
    textPrimary: '#1a1a1a',
    textSecondary: '#4a4a4a',
    textTertiary: '#7a7a7a',
    textInverse: '#ffffff',
    
    borderPrimary: '#cccccc',
    borderSecondary: '#bbbbbb',
    borderFocus: '#0066cc',
    
    accent: '#0066cc',
    accentHover: '#0077dd',
    accentActive: '#0055bb',
    
    success: '#228b22',
    warning: '#cc7700',
    error: '#cc0000',
    info: '#0066cc',
    
    connectionAudio: '#228b22',
    connectionMidi: '#0066cc',
    connectionMod: '#cc7700',
    connectionTrigger: '#cc0000',
    connectionControl: '#6633cc',
    
    vizBackground: '#fafafa',
    vizForeground: '#0066cc',
    vizGrid: '#dddddd',
    vizPeak: '#cc7700',
    vizClip: '#cc0000',
  },
  shadows: LIGHT_THEME.shadows,
  radii: {
    sm: '2px',
    md: '4px',
    lg: '6px',
    xl: '8px',
    full: '9999px',
  },
  spacing: DARK_THEME.spacing,
  typography: {
    fontFamily: '"Noto Sans", "Helvetica Neue", Arial, sans-serif',
    fontFamilyMono: '"Noto Sans Mono", monospace',
    sizes: DARK_THEME.typography.sizes,
  },
};

// ============================================================================
// THEME REGISTRY
// ============================================================================

export const ALL_THEMES: Record<string, CardPlayTheme> = {
  dark: DARK_THEME,
  light: LIGHT_THEME,
  'high-contrast': HIGH_CONTRAST_THEME,
  renoise: RENOISE_THEME,
  ableton: ABLETON_THEME,
  cubase: CUBASE_THEME,
  dorico: DORICO_THEME,
};

// ============================================================================
// THEME APPLICATION
// ============================================================================

/**
 * Generate CSS variables from theme
 */
export function generateThemeCSS(theme: CardPlayTheme): string {
  return `
:root {
  /* Background colors */
  --color-bg-primary: ${theme.colors.bgPrimary};
  --color-bg-secondary: ${theme.colors.bgSecondary};
  --color-bg-tertiary: ${theme.colors.bgTertiary};
  --color-bg-card: ${theme.colors.bgCard};
  --color-bg-overlay: ${theme.colors.bgOverlay};
  --color-bg-hover: ${theme.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'};
  --color-bg-active: ${theme.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'};
  --color-bg-selected: ${theme.mode === 'dark' ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.15)'};
  --color-bg-disabled: ${theme.mode === 'dark' ? '#1f1f1f' : '#f3f3f3'};
  
  /* Text colors */
  --color-text-primary: ${theme.colors.textPrimary};
  --color-text-secondary: ${theme.colors.textSecondary};
  --color-text-tertiary: ${theme.colors.textTertiary};
  --color-text-inverse: ${theme.colors.textInverse};
  --color-text-disabled: ${theme.mode === 'dark' ? '#555' : '#999'};
  
  /* Border colors */
  --color-border-primary: ${theme.colors.borderPrimary};
  --color-border-secondary: ${theme.colors.borderSecondary};
  --color-border-focus: ${theme.colors.borderFocus};
  
  /* Interactive colors */
  --color-interactive: ${theme.colors.accent};
  --color-interactive-hover: ${theme.colors.accentHover};
  --color-interactive-active: ${theme.colors.accentActive};
  --color-interactive-disabled: ${theme.mode === 'dark' ? '#444' : '#ccc'};
  
  /* Status colors */
  --color-success: ${theme.colors.success};
  --color-warning: ${theme.colors.warning};
  --color-error: ${theme.colors.error};
  --color-info: ${theme.colors.info};
  
  /* Connection colors */
  --cardplay-connection-audio: ${theme.colors.connectionAudio};
  --cardplay-connection-midi: ${theme.colors.connectionMidi};
  --cardplay-connection-mod: ${theme.colors.connectionMod};
  --cardplay-connection-trigger: ${theme.colors.connectionTrigger};
  --cardplay-connection-control: ${theme.colors.connectionControl};
  
  /* Visualization colors */
  --cardplay-viz-bg: ${theme.colors.vizBackground};
  --cardplay-viz-foreground: ${theme.colors.vizForeground};
  --cardplay-viz-grid: ${theme.colors.vizGrid};
  --cardplay-viz-peak: ${theme.colors.vizPeak};
  --cardplay-viz-clip: ${theme.colors.vizClip};
  
  /* Shadows */
  --shadow-sm: ${theme.shadows.sm};
  --shadow-md: ${theme.shadows.md};
  --shadow-lg: ${theme.shadows.lg};
  --shadow-xl: ${theme.shadows.xl};
  
  /* Border radius */
  --radius-sm: ${theme.radii.sm};
  --radius-md: ${theme.radii.md};
  --radius-lg: ${theme.radii.lg};
  --radius-xl: ${theme.radii.xl};
  --radius-full: ${theme.radii.full};
  
  /* Spacing */
  --space-xs: ${theme.spacing.xs};
  --space-sm: ${theme.spacing.sm};
  --space-md: ${theme.spacing.md};
  --space-lg: ${theme.spacing.lg};
  --space-xl: ${theme.spacing.xl};
  
  /* Typography */
  --font-family: ${theme.typography.fontFamily};
  --font-family-mono: ${theme.typography.fontFamilyMono};
  --font-size-xs: ${theme.typography.sizes.xs};
  --font-size-sm: ${theme.typography.sizes.sm};
  --font-size-base: ${theme.typography.sizes.base};
  --font-size-md: ${theme.typography.sizes.md};
  --font-size-lg: ${theme.typography.sizes.lg};
  --font-size-xl: ${theme.typography.sizes.xl};
  --font-size-2xl: ${theme.typography.sizes['2xl']};
  --font-size-3xl: ${theme.typography.sizes['3xl']};
  
  /* CardPlay-specific variables (Phase 43 components) */
  --cardplay-card-bg: var(--color-bg-card);
  --cardplay-card-header: var(--color-bg-secondary);
  --cardplay-card-border: var(--color-border-primary);
  --cardplay-panel-bg: var(--color-bg-primary);
  --cardplay-panel-header: var(--color-bg-secondary);
  --cardplay-text: var(--color-text-primary);
  --cardplay-text-secondary: var(--color-text-secondary);
  --cardplay-accent: var(--color-interactive);
  --cardplay-accent-hover: var(--color-interactive-hover);
  --cardplay-accent-dim: ${theme.mode === 'dark' ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.1)'};
  --cardplay-hover: var(--color-bg-hover);
  --cardplay-active: var(--color-bg-active);
  --cardplay-border: var(--color-border-primary);
}
`;
}

/**
 * Apply theme to document
 */
export function applyTheme(theme: CardPlayTheme): void {
  const styleId = 'cardplay-theme-css';
  let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
  
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = styleId;
    document.head.appendChild(styleEl);
  }
  
  styleEl.textContent = generateThemeCSS(theme);
  
  // Set data attribute for theme-aware CSS
  document.documentElement.dataset.theme = theme.name.toLowerCase().replace(/\s/g, '-');
  document.documentElement.dataset.themeMode = theme.mode;
}

/**
 * Get current theme from document
 */
export function getCurrentTheme(): CardPlayTheme {
  const themeName = document.documentElement.dataset.theme ?? 'dark';
  return ALL_THEMES[themeName] ?? DARK_THEME;
}

// ============================================================================
// CARD CATEGORY COLORS (Phase 5 integration)
// ============================================================================

/**
 * Card category color definitions
 * Maps to cardplay.md CardCategory and cardplayui.md visual system
 */
export const CARD_CATEGORY_COLORS: Record<string, { hue: number; color: string }> = {
  // Generators (blue spectrum)
  generator: { hue: 220, color: '#6366f1' },
  instrument: { hue: 220, color: '#6366f1' },
  sampler: { hue: 210, color: '#3b82f6' },
  synthesizer: { hue: 230, color: '#8b5cf6' },
  
  // MIDI (green spectrum)
  midi: { hue: 145, color: '#22c55e' },
  sequencer: { hue: 150, color: '#10b981' },
  arpeggiator: { hue: 160, color: '#14b8a6' },
  
  // Effects (purple spectrum)
  effect: { hue: 280, color: '#a855f7' },
  dynamics: { hue: 270, color: '#8b5cf6' },
  spatial: { hue: 290, color: '#d946ef' },
  modulation: { hue: 260, color: '#7c3aed' },
  
  // Transform (orange spectrum)
  transform: { hue: 30, color: '#f59e0b' },
  pitch: { hue: 25, color: '#f97316' },
  time: { hue: 35, color: '#eab308' },
  
  // Routing (cyan spectrum)
  routing: { hue: 185, color: '#06b6d4' },
  mixer: { hue: 190, color: '#0891b2' },
  bus: { hue: 180, color: '#14b8a6' },
  
  // Analysis (pink spectrum)
  analysis: { hue: 330, color: '#ec4899' },
  meter: { hue: 340, color: '#f43f5e' },
  scope: { hue: 320, color: '#d946ef' },
  
  // Utility (gray spectrum)
  utility: { hue: 0, color: '#71717a' },
  transport: { hue: 0, color: '#a1a1aa' },
};

/**
 * Get color for card category
 */
export function getCategoryColor(category: string): { hue: number; color: string } {
  return CARD_CATEGORY_COLORS[category] ?? CARD_CATEGORY_COLORS.utility!;
}

// ============================================================================
// CONNECTION TYPE STYLES
// ============================================================================

/**
 * Connection type visual styles
 * Integrates with connection-router.ts
 */
export interface ConnectionTypeStyle {
  color: string;
  lineWidth: number;
  dashPattern: number[];
  particleSize: number;
  particleCount: number;
  label: string;
}

export const CONNECTION_TYPE_STYLES: Record<string, ConnectionTypeStyle> = {
  audio: {
    color: 'var(--cardplay-connection-audio)',
    lineWidth: 3,
    dashPattern: [],
    particleSize: 4,
    particleCount: 5,
    label: 'Audio',
  },
  midi: {
    color: 'var(--cardplay-connection-midi)',
    lineWidth: 2,
    dashPattern: [],
    particleSize: 3,
    particleCount: 4,
    label: 'MIDI',
  },
  modulation: {
    color: 'var(--cardplay-connection-mod)',
    lineWidth: 2,
    dashPattern: [4, 4],
    particleSize: 3,
    particleCount: 3,
    label: 'Mod',
  },
  trigger: {
    color: 'var(--cardplay-connection-trigger)',
    lineWidth: 2,
    dashPattern: [2, 2],
    particleSize: 2,
    particleCount: 6,
    label: 'Trigger',
  },
  control: {
    color: 'var(--cardplay-connection-control)',
    lineWidth: 1.5,
    dashPattern: [6, 3],
    particleSize: 2,
    particleCount: 2,
    label: 'Control',
  },
  sidechain: {
    color: '#8b5cf6',
    lineWidth: 2.5,
    dashPattern: [],
    particleSize: 3,
    particleCount: 3,
    label: 'Sidechain',
  },
};

// ============================================================================
// SPRING PHYSICS PRESETS (cardplayui.md Section 5.5)
// ============================================================================

export interface SpringPreset {
  tension: number;
  friction: number;
  mass: number;
}

export const SPRING_PRESETS: Record<string, SpringPreset> = {
  // Default for most UI (reveal panel, cards)
  default: { tension: 300, friction: 25, mass: 1 },
  
  // Snappy for quick interactions
  snappy: { tension: 400, friction: 30, mass: 1 },
  
  // Gentle for large panels
  gentle: { tension: 200, friction: 20, mass: 1 },
  
  // Bouncy for playful feedback
  bouncy: { tension: 350, friction: 15, mass: 1 },
  
  // Stiff for precise control
  stiff: { tension: 500, friction: 35, mass: 1 },
  
  // Slow for dramatic reveals
  slow: { tension: 150, friction: 18, mass: 1.5 },
};

// ============================================================================
// ANIMATION TIMING TOKENS
// ============================================================================

export const ANIMATION_DURATIONS = {
  instant: '0ms',
  fast: '100ms',
  normal: '150ms',
  slow: '300ms',
  slower: '500ms',
  slowest: '800ms',
};

export const ANIMATION_EASINGS = {
  linear: 'linear',
  ease: 'ease',
  easeIn: 'ease-in',
  easeOut: 'ease-out',
  easeInOut: 'ease-in-out',
  // Custom curves
  smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
};

// ============================================================================
// EXPORT ALL CSS
// ============================================================================

/**
 * Get complete CSS for Phase 43 components
 * Imports from each component and combines with theme
 */
export function getCardPlayCSS(theme: CardPlayTheme = DARK_THEME): string {
  return `
${generateThemeCSS(theme)}

/* Base reset for CardPlay components */
.cardplay-root {
  font-family: var(--font-family);
  font-size: var(--font-size-base);
  color: var(--color-text-primary);
  background: var(--color-bg-primary);
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.cardplay-root *,
.cardplay-root *::before,
.cardplay-root *::after {
  box-sizing: border-box;
}

/* Focus visible for keyboard navigation */
.cardplay-root :focus-visible {
  outline: 2px solid var(--color-border-focus);
  outline-offset: 2px;
}

/* Reduced motion preference */
@media (prefers-reduced-motion: reduce) {
  .cardplay-root *,
  .cardplay-root *::before,
  .cardplay-root *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
`;
}
