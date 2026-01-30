/**
 * Card Kind Mapping by Control Level
 * 
 * This module defines which card kinds are allowed at each ControlLevel,
 * enabling deck factories and boards to filter available cards appropriately.
 * 
 * ## Control Levels
 * 
 * - **basic** - Simplified view for beginners
 * - **standard** - Default view for most users
 * - **advanced** - Full feature set
 * - **expert** - All features including experimental
 * 
 * ## Card Kinds
 * 
 * Cards are categorized by their primary function:
 * - `generator` - Creates audio/MIDI signals
 * - `processor` - Transforms signals
 * - `effect` - Audio effects (subset of processor)
 * - `utility` - Routing, mixing, metering
 * - `control` - Modulation, automation, sequencing
 * - `theory` - Music theory helpers
 * - `experimental` - Unstable/beta features
 * 
 * @module canon/card-kind
 */

/**
 * Card kind enumeration.
 */
export type CardKind = 
  | 'generator'
  | 'processor'
  | 'effect'
  | 'utility'
  | 'control'
  | 'theory'
  | 'experimental';

/**
 * Control level enumeration.
 * Defines the complexity tier for UI and available features.
 */
export type ControlLevel = 'basic' | 'standard' | 'advanced' | 'expert';

/**
 * Branded ControlLevel type for type-safe comparisons.
 */
export type ControlLevelBranded = ControlLevel & { readonly __brand: 'ControlLevel' };

/**
 * Mapping from ControlLevel to allowed card kinds.
 * Higher levels include all cards from lower levels.
 */
export const CONTROL_LEVEL_CARD_KINDS: Record<ControlLevel, readonly CardKind[]> = {
  basic: ['generator', 'effect', 'utility'],
  standard: ['generator', 'processor', 'effect', 'utility', 'control'],
  advanced: ['generator', 'processor', 'effect', 'utility', 'control', 'theory'],
  expert: ['generator', 'processor', 'effect', 'utility', 'control', 'theory', 'experimental'],
} as const;

/**
 * Numeric ordering for control levels.
 */
export const CONTROL_LEVEL_ORDER: Record<ControlLevel, number> = {
  basic: 0,
  standard: 1,
  advanced: 2,
  expert: 3,
};

/**
 * Checks if a card kind is allowed at a given control level.
 */
export function isCardKindAllowed(kind: CardKind, level: ControlLevel): boolean {
  return CONTROL_LEVEL_CARD_KINDS[level].includes(kind);
}

/**
 * Gets the minimum control level required for a card kind.
 */
export function getMinimumControlLevel(kind: CardKind): ControlLevel {
  if (CONTROL_LEVEL_CARD_KINDS.basic.includes(kind)) return 'basic';
  if (CONTROL_LEVEL_CARD_KINDS.standard.includes(kind)) return 'standard';
  if (CONTROL_LEVEL_CARD_KINDS.advanced.includes(kind)) return 'advanced';
  return 'expert';
}

/**
 * Compares two control levels.
 * Returns negative if a < b, zero if equal, positive if a > b.
 */
export function compareControlLevels(a: ControlLevel, b: ControlLevel): number {
  return CONTROL_LEVEL_ORDER[a] - CONTROL_LEVEL_ORDER[b];
}

/**
 * Filters a list of card kinds by control level.
 */
export function filterCardKindsByLevel(kinds: readonly CardKind[], level: ControlLevel): CardKind[] {
  const allowed = CONTROL_LEVEL_CARD_KINDS[level];
  return kinds.filter(kind => allowed.includes(kind));
}

/**
 * Card metadata for filtering and display.
 */
export interface CardKindMetadata {
  readonly kind: CardKind;
  readonly displayName: string;
  readonly description: string;
  readonly icon: string;
  readonly minimumLevel: ControlLevel;
}

/**
 * Metadata for all card kinds.
 */
export const CARD_KIND_METADATA: Record<CardKind, Omit<CardKindMetadata, 'kind'>> = {
  generator: {
    displayName: 'Generator',
    description: 'Creates audio or MIDI signals',
    icon: '🎵',
    minimumLevel: 'basic',
  },
  processor: {
    displayName: 'Processor',
    description: 'Transforms signals',
    icon: '⚙️',
    minimumLevel: 'standard',
  },
  effect: {
    displayName: 'Effect',
    description: 'Audio effects and processing',
    icon: '✨',
    minimumLevel: 'basic',
  },
  utility: {
    displayName: 'Utility',
    description: 'Routing, mixing, and metering',
    icon: '🔧',
    minimumLevel: 'basic',
  },
  control: {
    displayName: 'Control',
    description: 'Modulation and automation',
    icon: '🎛️',
    minimumLevel: 'standard',
  },
  theory: {
    displayName: 'Theory',
    description: 'Music theory helpers',
    icon: '📚',
    minimumLevel: 'advanced',
  },
  experimental: {
    displayName: 'Experimental',
    description: 'Beta and unstable features',
    icon: '🧪',
    minimumLevel: 'expert',
  },
};
