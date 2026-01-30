/**
 * @fileoverview Feature IDs for Progressive Disclosure
 * 
 * Defines canonical feature identifiers used by the progressive disclosure
 * system (N126-N130). These are separate from DeckType/DeckId to avoid
 * vocabulary collision.
 * 
 * Feature IDs identify UI capabilities that can be shown/hidden based on
 * user skill level. They are NOT deck types or deck instance IDs.
 * 
 * Format: feature:<category>:<name>
 * Example: feature:editor:pattern-editor, feature:tool:quantize
 * 
 * @module @cardplay/canon/feature-ids
 */

// ============================================================================
// FEATURE ID TYPES
// ============================================================================

/**
 * Feature ID branded type.
 * Distinct from DeckId and DeckType to prevent confusion.
 */
export type FeatureId = string & { readonly __featureId?: unique symbol };

/**
 * Feature categories for organization.
 */
export type FeatureCategory =
  | 'editor'      // Editor/deck-related features
  | 'tool'        // Tool capabilities
  | 'view'        // View modes
  | 'action'      // User actions
  | 'ai'          // AI-powered features
  | 'advanced';   // Advanced/power-user features

// ============================================================================
// BUILTIN FEATURE IDS
// ============================================================================

/**
 * Editor-related features (corresponding to deck types but distinct IDs).
 */
export const EDITOR_FEATURES = {
  PATTERN_EDITOR: 'feature:editor:pattern-editor' as FeatureId,
  PIANO_ROLL: 'feature:editor:piano-roll' as FeatureId,
  NOTATION_SCORE: 'feature:editor:notation-score' as FeatureId,
  ARRANGEMENT: 'feature:editor:arrangement' as FeatureId,
  MIXER: 'feature:editor:mixer' as FeatureId,
  SAMPLER: 'feature:editor:sampler' as FeatureId,
  WAVEFORM: 'feature:editor:waveform' as FeatureId,
} as const;

/**
 * Tool-related features.
 */
export const TOOL_FEATURES = {
  QUANTIZE: 'feature:tool:quantize' as FeatureId,
  TRANSPOSE: 'feature:tool:transpose' as FeatureId,
  HUMANIZE: 'feature:tool:humanize' as FeatureId,
  VELOCITY_CURVE: 'feature:tool:velocity-curve' as FeatureId,
  SNAP_TO_GRID: 'feature:tool:snap-to-grid' as FeatureId,
  AUTOMATION: 'feature:tool:automation' as FeatureId,
} as const;

/**
 * View-related features.
 */
export const VIEW_FEATURES = {
  SPLIT_VIEW: 'feature:view:split-view' as FeatureId,
  FLOATING_DECK: 'feature:view:floating-deck' as FeatureId,
  FULLSCREEN: 'feature:view:fullscreen' as FeatureId,
  MINI_MAP: 'feature:view:mini-map' as FeatureId,
} as const;

/**
 * AI-powered features.
 */
export const AI_FEATURES = {
  SUGGESTIONS: 'feature:ai:suggestions' as FeatureId,
  AUTO_COMPLETE: 'feature:ai:auto-complete' as FeatureId,
  HARMONY_HINTS: 'feature:ai:harmony-hints' as FeatureId,
  STYLE_TRANSFER: 'feature:ai:style-transfer' as FeatureId,
} as const;

/**
 * Advanced/power-user features.
 */
export const ADVANCED_FEATURES = {
  SCRIPTING: 'feature:advanced:scripting' as FeatureId,
  CUSTOM_CARDS: 'feature:advanced:custom-cards' as FeatureId,
  PROLOG_CONSOLE: 'feature:advanced:prolog-console' as FeatureId,
  MODULAR_ROUTING: 'feature:advanced:modular-routing' as FeatureId,
} as const;

/**
 * All builtin feature IDs.
 */
export const BUILTIN_FEATURE_IDS = {
  ...EDITOR_FEATURES,
  ...TOOL_FEATURES,
  ...VIEW_FEATURES,
  ...AI_FEATURES,
  ...ADVANCED_FEATURES,
} as const;

// ============================================================================
// FEATURE ID UTILITIES
// ============================================================================

/**
 * Check if a string is a valid feature ID format.
 * Feature IDs must follow the pattern: feature:<category>:<name>
 */
export function isFeatureId(value: string): value is FeatureId {
  return /^feature:[a-z]+:[a-z][a-z0-9-]*$/.test(value);
}

/**
 * Parse a feature ID into its components.
 */
export function parseFeatureId(id: FeatureId): { category: string; name: string } | null {
  const match = id.match(/^feature:([a-z]+):([a-z][a-z0-9-]*)$/);
  if (!match || !match[1] || !match[2]) return null;
  return {
    category: match[1],
    name: match[2],
  };
}

/**
 * Create a feature ID from category and name.
 */
export function createFeatureId(category: FeatureCategory, name: string): FeatureId {
  return `feature:${category}:${name}` as FeatureId;
}

/**
 * Get the display name for a feature (title case, no prefix).
 */
export function getFeatureDisplayName(id: FeatureId): string {
  const parsed = parseFeatureId(id);
  if (!parsed) return id;
  
  return parsed.name
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// ============================================================================
// LEGACY COMPATIBILITY
// ============================================================================

/**
 * Map legacy feature strings (like 'pattern-editor') to canonical feature IDs.
 * 
 * These mappings help migrate code that used deck-type-style strings as feature IDs.
 */
export const LEGACY_FEATURE_ALIASES: Readonly<Record<string, FeatureId>> = {
  'pattern-editor': EDITOR_FEATURES.PATTERN_EDITOR,
  'piano-roll': EDITOR_FEATURES.PIANO_ROLL,
  'notation-score': EDITOR_FEATURES.NOTATION_SCORE,
  'notation': EDITOR_FEATURES.NOTATION_SCORE,
  'arrangement': EDITOR_FEATURES.ARRANGEMENT,
  'mixer': EDITOR_FEATURES.MIXER,
  'sampler': EDITOR_FEATURES.SAMPLER,
  'quantize': TOOL_FEATURES.QUANTIZE,
  'transpose': TOOL_FEATURES.TRANSPOSE,
  'humanize': TOOL_FEATURES.HUMANIZE,
};

/**
 * Normalize a feature string to a canonical feature ID.
 * 
 * @param feature - Feature string (possibly legacy format)
 * @returns Canonical feature ID, or the original if already valid/unknown
 */
export function normalizeFeatureId(feature: string): FeatureId {
  // Already a valid feature ID
  if (isFeatureId(feature)) {
    return feature;
  }
  
  // Check legacy aliases
  const alias = LEGACY_FEATURE_ALIASES[feature];
  if (alias) {
    console.warn(
      `[FeatureId] Legacy feature string '${feature}' should be '${alias}'`
    );
    return alias;
  }
  
  // Unknown - return as-is with warning
  console.warn(`[FeatureId] Unknown feature ID format: '${feature}'`);
  return feature as FeatureId;
}
