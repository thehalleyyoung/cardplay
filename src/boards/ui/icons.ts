/**
 * @fileoverview Board and Deck Icon System
 * 
 * Provides a consistent icon mapping for all boards and decks.
 * Uses a single source of truth for icon names and visual representation.
 * 
 * @module @cardplay/boards/ui/icons
 */

import type { ControlLevel, DeckType, ViewType } from '../types';

/**
 * Icon names using a consistent naming convention.
 * Icons can be mapped to any icon library (e.g., Lucide, Heroicons, Material).
 */
export type IconName =
  // Control level icons
  | 'manual'
  | 'hints'
  | 'assisted'
  | 'collaborative'
  | 'directed'
  | 'generative'
  // View type icons
  | 'tracker'
  | 'notation'
  | 'session'
  | 'arranger'
  | 'composer'
  | 'sampler'
  // Deck type icons
  | 'pattern'
  | 'piano-roll'
  | 'timeline'
  | 'instruments'
  | 'effects'
  | 'samples'
  | 'phrases'
  | 'harmony'
  | 'generators'
  | 'mixer'
  | 'routing'
  | 'automation'
  | 'properties'
  | 'transport'
  | 'ai-advisor'
  | 'modulation'
  // General icons
  | 'add'
  | 'remove'
  | 'settings'
  | 'search'
  | 'play'
  | 'stop'
  | 'record';

/**
 * Icon mapping for control levels.
 */
export const CONTROL_LEVEL_ICONS: Record<ControlLevel, IconName> = {
  'full-manual': 'manual',
  'manual-with-hints': 'hints',
  'assisted': 'assisted',
  'collaborative': 'collaborative',
  'directed': 'directed',
  'generative': 'generative',
};

/**
 * Icon mapping for view types.
 */
export const VIEW_TYPE_ICONS: Record<ViewType, IconName> = {
  'tracker': 'tracker',
  'notation': 'notation',
  'session': 'session',
  'arranger': 'arranger',
  'composer': 'composer',
  'sampler': 'sampler',
};

/**
 * Icon mapping for deck types.
 */
export const DECK_TYPE_ICONS: Record<DeckType, IconName> = {
  'pattern-deck': 'pattern',
  'notation-deck': 'notation',
  'piano-roll-deck': 'piano-roll',
  'session-deck': 'session',
  'arrangement-deck': 'timeline',
  'instruments-deck': 'instruments',
  'dsp-chain': 'effects',
  'effects-deck': 'effects',
  'samples-deck': 'samples',
  'phrases-deck': 'phrases',
  'harmony-deck': 'harmony',
  'generators-deck': 'generators',
  'mixer-deck': 'mixer',
  'routing-deck': 'routing',
  'automation-deck': 'automation',
  'properties-deck': 'properties',
  'transport-deck': 'transport',
  'arranger-deck': 'arranger',
  'ai-advisor-deck': 'ai-advisor',
  'sample-manager-deck': 'samples',
  'modulation-matrix-deck': 'modulation',
};

/**
 * Unicode emoji fallbacks for icons (when no icon library is available).
 * Provides accessibility and graceful degradation.
 */
export const ICON_EMOJI_FALLBACKS: Record<IconName, string> = {
  // Control levels
  'manual': '✋',
  'hints': '💡',
  'assisted': '🤝',
  'collaborative': '🔄',
  'directed': '🎯',
  'generative': '✨',
  // Views
  'tracker': '📝',
  'notation': '🎼',
  'session': '▶️',
  'arranger': '📐',
  'composer': '🎹',
  'sampler': '🎛️',
  // Decks
  'pattern': '📝',
  'piano-roll': '🎹',
  'timeline': '⏱️',
  'instruments': '🎺',
  'effects': '⚡',
  'samples': '🎵',
  'phrases': '📚',
  'harmony': '🎵',
  'generators': '🎲',
  'mixer': '🎚️',
  'routing': '🔌',
  'automation': '📊',
  'properties': '⚙️',
  'transport': '▶️',
  'ai-advisor': '🤖',
  'modulation': '🌊',
  // General
  'add': '➕',
  'remove': '➖',
  'settings': '⚙️',
  'search': '🔍',
  'play': '▶️',
  'stop': '⏹️',
  'record': '⏺️',
};

/**
 * Get icon name for a control level.
 */
export function getControlLevelIcon(level: ControlLevel): IconName {
  return CONTROL_LEVEL_ICONS[level];
}

/**
 * Get icon name for a view type.
 */
export function getViewTypeIcon(view: ViewType): IconName {
  return VIEW_TYPE_ICONS[view];
}

/**
 * Get icon name for a deck type.
 */
export function getDeckTypeIcon(deckType: DeckType): IconName {
  return DECK_TYPE_ICONS[deckType];
}

/**
 * Get emoji fallback for an icon.
 */
export function getIconEmoji(icon: IconName): string {
  return ICON_EMOJI_FALLBACKS[icon] ?? '○';
}

/**
 * Get SVG class name for an icon (for use with icon libraries).
 * Format: 'icon-{name}' which can be styled via CSS.
 */
export function getIconClass(icon: IconName): string {
  return `icon-${icon}`;
}

/**
 * Create an icon element with fallback support.
 * Returns either an SVG icon (if available) or emoji fallback.
 */
export function createIconElement(icon: IconName): HTMLElement {
  const span = document.createElement('span');
  span.className = `board-icon ${getIconClass(icon)}`;
  span.setAttribute('data-icon', icon);
  span.setAttribute('aria-hidden', 'true');
  
  // Use emoji as fallback text content
  span.textContent = getIconEmoji(icon);
  
  return span;
}
