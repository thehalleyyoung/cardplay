/**
 * @fileoverview Control Level Color System
 * 
 * Defines color palettes for each control level in the board system.
 * These colors are used for visual indicators, badges, and deck headers.
 * 
 * @module @cardplay/boards/theme/control-level-colors
 */

import type { ControlLevel } from '../types';

/**
 * Color palette for a control level.
 */
export interface ControlLevelColors {
  readonly primary: string;
  readonly secondary: string;
  readonly accent: string;
  readonly background: string;
  readonly text: string;
  readonly badge: string;
}

/**
 * Control level color palettes.
 * Each control level has a distinct color scheme for visual identification.
 * 
 * Colors follow accessibility guidelines (WCAG AA contrast ratios).
 */
export const CONTROL_LEVEL_COLORS: Record<ControlLevel, ControlLevelColors> = {
  'full-manual': {
    primary: '#2563eb',     // Blue 600 - Manual control
    secondary: '#3b82f6',   // Blue 500
    accent: '#60a5fa',      // Blue 400
    background: '#eff6ff',  // Blue 50 (light) / #1e3a8a (dark)
    text: '#1e3a8a',        // Blue 900
    badge: '#2563eb',
  },
  'manual-with-hints': {
    primary: '#7c3aed',     // Violet 600 - Hints available
    secondary: '#8b5cf6',   // Violet 500
    accent: '#a78bfa',      // Violet 400
    background: '#f5f3ff',  // Violet 50 (light) / #4c1d95 (dark)
    text: '#4c1d95',        // Violet 900
    badge: '#7c3aed',
  },
  'assisted': {
    primary: '#059669',     // Emerald 600 - Assisted workflows
    secondary: '#10b981',   // Emerald 500
    accent: '#34d399',      // Emerald 400
    background: '#ecfdf5',  // Emerald 50 (light) / #064e3b (dark)
    text: '#064e3b',        // Emerald 900
    badge: '#059669',
  },
  'collaborative': {
    primary: '#ea580c',     // Orange 600 - Collaborative 50/50
    secondary: '#f97316',   // Orange 500
    accent: '#fb923c',      // Orange 400
    background: '#fff7ed',  // Orange 50 (light) / #7c2d12 (dark)
    text: '#7c2d12',        // Orange 900
    badge: '#ea580c',
  },
  'directed': {
    primary: '#dc2626',     // Red 600 - Directed creation
    secondary: '#ef4444',   // Red 500
    accent: '#f87171',      // Red 400
    background: '#fef2f2',  // Red 50 (light) / #7f1d1d (dark)
    text: '#7f1d1d',        // Red 900
    badge: '#dc2626',
  },
  'generative': {
    primary: '#9333ea',     // Purple 600 - Generative AI
    secondary: '#a855f7',   // Purple 500
    accent: '#c084fc',      // Purple 400
    background: '#faf5ff',  // Purple 50 (light) / #581c87 (dark)
    text: '#581c87',        // Purple 900
    badge: '#9333ea',
  },
};

/**
 * Get the color palette for a control level.
 */
export function getControlLevelColors(level: ControlLevel): ControlLevelColors {
  return CONTROL_LEVEL_COLORS[level];
}

/**
 * Get the badge color for a control level.
 * Used for small indicators and chips.
 */
export function getControlLevelBadgeColor(level: ControlLevel): string {
  return CONTROL_LEVEL_COLORS[level].badge;
}

/**
 * Get the primary color for a control level.
 * Used for main UI elements and emphasis.
 */
export function getControlLevelPrimaryColor(level: ControlLevel): string {
  return CONTROL_LEVEL_COLORS[level].primary;
}

/**
 * Convert control level colors to CSS custom properties.
 */
export function controlLevelColorsToCSSProperties(
  level: ControlLevel,
  prefix: string = '--control-level'
): Record<string, string> {
  const colors = CONTROL_LEVEL_COLORS[level];
  return {
    [`${prefix}-primary`]: colors.primary,
    [`${prefix}-secondary`]: colors.secondary,
    [`${prefix}-accent`]: colors.accent,
    [`${prefix}-background`]: colors.background,
    [`${prefix}-text`]: colors.text,
    [`${prefix}-badge`]: colors.badge,
  };
}
