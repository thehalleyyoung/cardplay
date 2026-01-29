/**
 * @fileoverview Board Theme Tokens System
 * 
 * J001-J010: Board-level theme tokens with control-level indicator colors.
 * J046-J050: Semantic tokens for all UI components (no hard-coded colors).
 * 
 * Provides a complete token system that works across all boards and components.
 * 
 * @module @cardplay/ui/theme/board-tokens
 */

/**
 * Control level indicator colors (J006).
 * 
 * Maps each control level to a distinct color for visual identification.
 * Used in track headers, deck badges, and event coloring.
 */
export const CONTROL_LEVEL_COLORS = {
  'full-manual': {
    primary: '#2196F3',      // Blue - user control
    secondary: '#1976D2',
    container: '#E3F2FD',
    onContainer: '#0D47A1',
    emphasis: '#1E88E5'
  },
  'manual-with-hints': {
    primary: '#4CAF50',      // Green - helpful hints
    secondary: '#388E3C',
    container: '#E8F5E9',
    onContainer: '#1B5E20',
    emphasis: '#43A047'
  },
  'assisted': {
    primary: '#FF9800',      // Orange - assisted
    secondary: '#F57C00',
    container: '#FFF3E0',
    onContainer: '#E65100',
    emphasis: '#FB8C00'
  },
  'directed': {
    primary: '#9C27B0',      // Purple - AI-directed
    secondary: '#7B1FA2',
    container: '#F3E5F5',
    onContainer: '#4A148C',
    emphasis: '#8E24AA'
  },
  'generative': {
    primary: '#E91E63',      // Pink - fully generative
    secondary: '#C2185B',
    container: '#FCE4EC',
    onContainer: '#880E4F',
    emphasis: '#D81B60'
  },
  'collaborative': {
    primary: '#00BCD4',      // Cyan - hybrid
    secondary: '#0097A7',
    container: '#E0F7FA',
    onContainer: '#006064',
    emphasis: '#00ACC1'
  }
} as const;

/**
 * Semantic color tokens for UI components (J046-J048).
 * 
 * All components should use these tokens instead of hard-coded colors.
 * Supports light/dark/high-contrast modes.
 */
export interface ThemeTokens {
  // Surface colors
  surface: string;
  surfaceVariant: string;
  surfaceRaised: string;
  surfaceOverlay: string;
  
  // Text colors
  onSurface: string;
  onSurfaceVariant: string;
  onSurfaceEmphasis: string;
  
  // Primary colors
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  
  // Secondary colors
  secondary: string;
  onSecondary: string;
  secondaryContainer: string;
  onSecondaryContainer: string;
  
  // Border colors
  outline: string;
  outlineVariant: string;
  
  // State colors
  error: string;
  onError: string;
  errorContainer: string;
  onErrorContainer: string;
  
  warning: string;
  onWarning: string;
  
  success: string;
  onSuccess: string;
  
  info: string;
  onInfo: string;
  
  // Interactive states
  hover: string;
  pressed: string;
  focus: string;
  disabled: string;
  
  // Shadows
  shadowSm: string;
  shadowMd: string;
  shadowLg: string;
  
  // Border radius
  radiusSm: string;
  radiusMd: string;
  radiusLg: string;
  
  // Typography
  fontFamily: string;
  fontFamilyMono: string;
  fontSizeXs: string;
  fontSizeSm: string;
  fontSizeMd: string;
  fontSizeLg: string;
  fontSizeXl: string;
  
  // Spacing
  spacingXs: string;
  spacingSm: string;
  spacingMd: string;
  spacingLg: string;
  spacingXl: string;
}

/**
 * Light theme tokens.
 */
export const LIGHT_THEME: ThemeTokens = {
  // Surface colors
  surface: '#FFFFFF',
  surfaceVariant: '#F5F5F5',
  surfaceRaised: '#FAFAFA',
  surfaceOverlay: 'rgba(0, 0, 0, 0.5)',
  
  // Text colors
  onSurface: '#212121',
  onSurfaceVariant: '#757575',
  onSurfaceEmphasis: '#000000',
  
  // Primary colors
  primary: '#1976D2',
  onPrimary: '#FFFFFF',
  primaryContainer: '#E3F2FD',
  onPrimaryContainer: '#0D47A1',
  
  // Secondary colors
  secondary: '#455A64',
  onSecondary: '#FFFFFF',
  secondaryContainer: '#ECEFF1',
  onSecondaryContainer: '#263238',
  
  // Border colors
  outline: '#BDBDBD',
  outlineVariant: '#E0E0E0',
  
  // State colors
  error: '#D32F2F',
  onError: '#FFFFFF',
  errorContainer: '#FFCDD2',
  onErrorContainer: '#B71C1C',
  
  warning: '#F57C00',
  onWarning: '#FFFFFF',
  
  success: '#388E3C',
  onSuccess: '#FFFFFF',
  
  info: '#0288D1',
  onInfo: '#FFFFFF',
  
  // Interactive states
  hover: 'rgba(0, 0, 0, 0.04)',
  pressed: 'rgba(0, 0, 0, 0.12)',
  focus: '#1976D2',
  disabled: 'rgba(0, 0, 0, 0.38)',
  
  // Shadows
  shadowSm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  shadowMd: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  shadowLg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  
  // Border radius
  radiusSm: '4px',
  radiusMd: '8px',
  radiusLg: '12px',
  
  // Typography
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  fontFamilyMono: '"Fira Code", "Cascadia Code", Menlo, Monaco, monospace',
  fontSizeXs: '0.75rem',
  fontSizeSm: '0.875rem',
  fontSizeMd: '1rem',
  fontSizeLg: '1.125rem',
  fontSizeXl: '1.25rem',
  
  // Spacing
  spacingXs: '0.25rem',
  spacingSm: '0.5rem',
  spacingMd: '1rem',
  spacingLg: '1.5rem',
  spacingXl: '2rem'
};

/**
 * Dark theme tokens.
 */
export const DARK_THEME: ThemeTokens = {
  // Surface colors
  surface: '#1E1E1E',
  surfaceVariant: '#2D2D2D',
  surfaceRaised: '#252525',
  surfaceOverlay: 'rgba(0, 0, 0, 0.7)',
  
  // Text colors
  onSurface: '#E0E0E0',
  onSurfaceVariant: '#9E9E9E',
  onSurfaceEmphasis: '#FFFFFF',
  
  // Primary colors
  primary: '#64B5F6',
  onPrimary: '#0D47A1',
  primaryContainer: '#1565C0',
  onPrimaryContainer: '#BBDEFB',
  
  // Secondary colors
  secondary: '#90A4AE',
  onSecondary: '#263238',
  secondaryContainer: '#546E7A',
  onSecondaryContainer: '#CFD8DC',
  
  // Border colors
  outline: '#424242',
  outlineVariant: '#333333',
  
  // State colors
  error: '#EF5350',
  onError: '#FFEBEE',
  errorContainer: '#C62828',
  onErrorContainer: '#FFCDD2',
  
  warning: '#FFA726',
  onWarning: '#FFFFFF',
  
  success: '#66BB6A',
  onSuccess: '#FFFFFF',
  
  info: '#29B6F6',
  onInfo: '#FFFFFF',
  
  // Interactive states
  hover: 'rgba(255, 255, 255, 0.08)',
  pressed: 'rgba(255, 255, 255, 0.12)',
  focus: '#64B5F6',
  disabled: 'rgba(255, 255, 255, 0.38)',
  
  // Shadows
  shadowSm: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
  shadowMd: '0 4px 6px -1px rgba(0, 0, 0, 0.4)',
  shadowLg: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
  
  // Border radius
  radiusSm: '4px',
  radiusMd: '8px',
  radiusLg: '12px',
  
  // Typography
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  fontFamilyMono: '"Fira Code", "Cascadia Code", Menlo, Monaco, monospace',
  fontSizeXs: '0.75rem',
  fontSizeSm: '0.875rem',
  fontSizeMd: '1rem',
  fontSizeLg: '1.125rem',
  fontSizeXl: '1.25rem',
  
  // Spacing
  spacingXs: '0.25rem',
  spacingSm: '0.5rem',
  spacingMd: '1rem',
  spacingLg: '1.5rem',
  spacingXl: '2rem'
};

/**
 * J050: Focus ring CSS (consistent across all interactive elements).
 */
export const FOCUS_RING_CSS = `
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
  border-radius: var(--radius-sm);
`;

/**
 * Apply theme tokens to document root as CSS custom properties.
 * 
 * J002: Board theme composition with base theme.
 * J005: Pure CSS updates (no component remounting).
 * 
 * @param tokens Theme tokens to apply
 */
export function applyThemeTokens(tokens: ThemeTokens): void {
  if (typeof document === 'undefined') return;
  
  const root = document.documentElement;
  
  // Surface colors
  root.style.setProperty('--color-surface', tokens.surface);
  root.style.setProperty('--color-surface-variant', tokens.surfaceVariant);
  root.style.setProperty('--color-surface-raised', tokens.surfaceRaised);
  root.style.setProperty('--color-surface-overlay', tokens.surfaceOverlay);
  
  // Text colors
  root.style.setProperty('--color-on-surface', tokens.onSurface);
  root.style.setProperty('--color-on-surface-variant', tokens.onSurfaceVariant);
  root.style.setProperty('--color-on-surface-emphasis', tokens.onSurfaceEmphasis);
  
  // Primary colors
  root.style.setProperty('--color-primary', tokens.primary);
  root.style.setProperty('--color-on-primary', tokens.onPrimary);
  root.style.setProperty('--color-primary-container', tokens.primaryContainer);
  root.style.setProperty('--color-on-primary-container', tokens.onPrimaryContainer);
  
  // Secondary colors
  root.style.setProperty('--color-secondary', tokens.secondary);
  root.style.setProperty('--color-on-secondary', tokens.onSecondary);
  root.style.setProperty('--color-secondary-container', tokens.secondaryContainer);
  root.style.setProperty('--color-on-secondary-container', tokens.onSecondaryContainer);
  
  // Border colors
  root.style.setProperty('--color-outline', tokens.outline);
  root.style.setProperty('--color-outline-variant', tokens.outlineVariant);
  
  // State colors
  root.style.setProperty('--color-error', tokens.error);
  root.style.setProperty('--color-on-error', tokens.onError);
  root.style.setProperty('--color-error-container', tokens.errorContainer);
  root.style.setProperty('--color-on-error-container', tokens.onErrorContainer);
  
  root.style.setProperty('--color-warning', tokens.warning);
  root.style.setProperty('--color-on-warning', tokens.onWarning);
  
  root.style.setProperty('--color-success', tokens.success);
  root.style.setProperty('--color-on-success', tokens.onSuccess);
  
  root.style.setProperty('--color-info', tokens.info);
  root.style.setProperty('--color-on-info', tokens.onInfo);
  
  // Interactive states
  root.style.setProperty('--color-hover', tokens.hover);
  root.style.setProperty('--color-pressed', tokens.pressed);
  root.style.setProperty('--color-focus', tokens.focus);
  root.style.setProperty('--color-disabled', tokens.disabled);
  
  // Shadows
  root.style.setProperty('--shadow-sm', tokens.shadowSm);
  root.style.setProperty('--shadow-md', tokens.shadowMd);
  root.style.setProperty('--shadow-lg', tokens.shadowLg);
  
  // Border radius
  root.style.setProperty('--radius-sm', tokens.radiusSm);
  root.style.setProperty('--radius-md', tokens.radiusMd);
  root.style.setProperty('--radius-lg', tokens.radiusLg);
  
  // Typography
  root.style.setProperty('--font-family', tokens.fontFamily);
  root.style.setProperty('--font-family-mono', tokens.fontFamilyMono);
  root.style.setProperty('--font-size-xs', tokens.fontSizeXs);
  root.style.setProperty('--font-size-sm', tokens.fontSizeSm);
  root.style.setProperty('--font-size-md', tokens.fontSizeMd);
  root.style.setProperty('--font-size-lg', tokens.fontSizeLg);
  root.style.setProperty('--font-size-xl', tokens.fontSizeXl);
  
  // Spacing
  root.style.setProperty('--spacing-xs', tokens.spacingXs);
  root.style.setProperty('--spacing-sm', tokens.spacingSm);
  root.style.setProperty('--spacing-md', tokens.spacingMd);
  root.style.setProperty('--spacing-lg', tokens.spacingLg);
  root.style.setProperty('--spacing-xl', tokens.spacingXl);
}

/**
 * Detect user's preferred color scheme.
 * 
 * @returns 'light' or 'dark'
 */
export function detectPreferredColorScheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  
  // Check for dark mode
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  
  return 'light';
}

/**
 * Get theme tokens for a color scheme.
 * 
 * @param scheme Color scheme
 * @returns Theme tokens
 */
export function getThemeTokens(scheme: 'light' | 'dark'): ThemeTokens {
  return scheme === 'dark' ? DARK_THEME : LIGHT_THEME;
}

/**
 * Initialize theme system with auto-detection.
 * 
 * @param scheme Optional override for color scheme
 */
export function initializeTheme(scheme?: 'light' | 'dark'): void {
  const colorScheme = scheme ?? detectPreferredColorScheme();
  const tokens = getThemeTokens(colorScheme);
  applyThemeTokens(tokens);
  
  // Listen for scheme changes
  if (typeof window !== 'undefined') {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!scheme) { // Only auto-update if not manually overridden
        const newScheme = e.matches ? 'dark' : 'light';
        applyThemeTokens(getThemeTokens(newScheme));
      }
    });
  }
}
