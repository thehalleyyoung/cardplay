/**
 * @fileoverview Board Settings Types (G019-G020)
 * 
 * Per-board settings that can be toggled by the user.
 * Includes harmony display options, view preferences, etc.
 * 
 * @module @cardplay/boards/settings/types
 */

/**
 * Harmony display settings for boards with harmony tools
 */
export interface HarmonySettings {
  /** Show chord-tone/scale-tone coloring in editors (G019) */
  showHarmonyColors: boolean;
  /** Show roman numeral analysis in harmony display (G020) */
  showRomanNumerals: boolean;
  /** Current key signature */
  currentKey: string | null;
  /** Current chord symbol */
  currentChord: string | null;
}

/**
 * Visual density settings for tracker/piano roll/session views
 */
export interface VisualDensitySettings {
  /** Density level: compact/comfortable/spacious */
  density: 'compact' | 'comfortable' | 'spacious';
  /** Row height in pixels (auto-computed from density) */
  rowHeight?: number;
}

/**
 * Generator settings for boards with generation tools
 */
export interface GeneratorSettings {
  /** Show generation badges on generated content */
  showGeneratedBadges: boolean;
  /** Auto-freeze generated content after N seconds of no edits */
  autoFreezeDelay: number | null;
}

/**
 * Complete per-board settings
 */
export interface BoardSettings {
  /** Board ID these settings apply to */
  boardId: string;
  /** Harmony display settings (if board has harmony tools) */
  harmony?: HarmonySettings;
  /** Visual density settings */
  visualDensity?: VisualDensitySettings;
  /** Generator settings (if board has generators) */
  generator?: GeneratorSettings;
}

/**
 * Default harmony settings (disabled by default, user opts in)
 */
export const DEFAULT_HARMONY_SETTINGS: HarmonySettings = {
  showHarmonyColors: false,
  showRomanNumerals: false,
  currentKey: 'C',  // Default to C major
  currentChord: null
};

/**
 * Default visual density settings
 */
export const DEFAULT_VISUAL_DENSITY: VisualDensitySettings = {
  density: 'comfortable'
};

/**
 * Default generator settings
 */
export const DEFAULT_GENERATOR_SETTINGS: GeneratorSettings = {
  showGeneratedBadges: true,
  autoFreezeDelay: null  // No auto-freeze by default
};
