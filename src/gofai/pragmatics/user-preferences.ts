/**
 * User Preference Profiles for Vague Words
 *
 * Step 049 [HCI]: Define "user preference profiles" for vague words
 * (dark = timbre vs harmony vs register) and how UI edits those profiles.
 *
 * ## Purpose
 *
 * When a user says "darker", the system doesn't know whether they mean:
 * - Spectral darkness (less high-frequency energy)
 * - Harmonic darkness (minor modes, flat extensions)
 * - Register darkness (lower octaves)
 * - Textural darkness (fewer bright layers)
 *
 * Different users (and different sessions) have different preferences.
 * A film composer's "darker" is often harmonic; a mix engineer's "darker"
 * is often spectral. Rather than guessing, the system:
 *
 * 1. Asks on first encounter (clarification)
 * 2. Offers to save the answer as a preference
 * 3. Applies the preference in future encounters
 * 4. Always shows which preference was applied (inspectable)
 * 5. Allows overriding at any time
 *
 * ## Profile Structure
 *
 * A user profile contains:
 * - Per-word axis sense preferences ("dark" → timbre, "open" → voicing)
 * - Default degree preferences ("moderate" is the baseline, but some
 *   users prefer "small" as default)
 * - Safety level preferences (strict mode vs relaxed mode)
 * - Favorite preservation modes ("keep melody" = exact vs recognizable)
 *
 * ## Persistence
 *
 * Profiles are:
 * - Stored locally (never sent to a server)
 * - Versioned (with migration support)
 * - Exportable/importable (for sharing between machines)
 * - Inspectable in the UI preference panel
 *
 * @module gofai/pragmatics/user-preferences
 */

// =============================================================================
// Profile Types
// =============================================================================

/**
 * Unique identifier for a user profile.
 */
export type ProfileId = string & { readonly __brand: 'ProfileId' };

/**
 * Create a ProfileId.
 */
export function profileId(id: string): ProfileId {
  return id as ProfileId;
}

/**
 * A complete user preference profile.
 */
export interface UserPreferenceProfile {
  /** Unique profile ID. */
  readonly id: ProfileId;
  /** Display name for the profile. */
  readonly name: string;
  /** Description (e.g., "Mix engineer defaults", "Film scoring prefs"). */
  readonly description: string;
  /** Schema version for migration. */
  readonly version: number;
  /** When the profile was created (ISO string). */
  readonly createdAt: string;
  /** When the profile was last modified (ISO string). */
  readonly modifiedAt: string;

  /** Per-word axis sense preferences. */
  readonly axisSensePreferences: readonly AxisSensePreference[];
  /** Default degree preferences. */
  readonly degreePreferences: DegreePreferences;
  /** Safety/confirmation preferences. */
  readonly safetyPreferences: SafetyPreferences;
  /** Preservation mode defaults. */
  readonly preservationPreferences: PreservationPreferences;
  /** Vocabulary customizations. */
  readonly vocabularyCustomizations: readonly VocabularyCustomization[];
}

/**
 * Current profile schema version.
 */
export const PROFILE_SCHEMA_VERSION = 1;


// =============================================================================
// Axis Sense Preferences
// =============================================================================

/**
 * A user's preferred axis sense for a vague word.
 *
 * For example: "dark" → timbre (spectral) by default.
 */
export interface AxisSensePreference {
  /** The vague word. */
  readonly word: string;
  /** The preferred axis sense. */
  readonly preferredSense: string;
  /** Alternative senses (for showing options). */
  readonly alternativeSenses: readonly string[];
  /** When this preference was established. */
  readonly establishedAt: string;
  /** How it was established. */
  readonly origin: PreferenceOrigin;
  /** Number of times this preference has been applied. */
  readonly useCount: number;
  /** Number of times the user has overridden this preference. */
  readonly overrideCount: number;
}

/**
 * How a preference was established.
 */
export type PreferenceOrigin =
  | 'clarification_response'    // User answered a clarification question
  | 'explicit_setting'          // User set it in the preference panel
  | 'imported'                  // Imported from another profile
  | 'system_default';           // Built-in default (not user-set)

/**
 * The canonical set of words that commonly need axis sense preferences.
 *
 * These are the words where users most frequently disagree about meaning.
 * The system should proactively offer to save preferences for these.
 */
export const WORDS_NEEDING_PREFERENCES: readonly VagueWordEntry[] = [
  {
    word: 'dark',
    possibleSenses: [
      { senseId: 'timbre', label: 'Spectral (less bright, fewer highs)', description: 'Roll off high frequencies, warmer tone' },
      { senseId: 'harmony', label: 'Harmonic (minor, flat extensions)', description: 'Use darker chord voicings, minor modes' },
      { senseId: 'register', label: 'Register (lower octaves)', description: 'Move parts to lower octaves' },
      { senseId: 'texture', label: 'Textural (fewer bright layers)', description: 'Remove or dim bright arrangement elements' },
    ],
    defaultSense: 'timbre',
  },
  {
    word: 'bright',
    possibleSenses: [
      { senseId: 'timbre', label: 'Spectral (more highs, more air)', description: 'Boost high frequencies, add air' },
      { senseId: 'harmony', label: 'Harmonic (major, sharp extensions)', description: 'Use brighter voicings, major modes' },
      { senseId: 'register', label: 'Register (higher octaves)', description: 'Move parts to higher octaves' },
    ],
    defaultSense: 'timbre',
  },
  {
    word: 'warm',
    possibleSenses: [
      { senseId: 'spectral', label: 'Spectral (low-mid boost, less harsh)', description: 'EQ toward warmth' },
      { senseId: 'harmonic', label: 'Harmonic (3rds, 6ths, gentle voicings)', description: 'Warmer chord intervals' },
      { senseId: 'saturation', label: 'Saturation (analog-style harmonics)', description: 'Add tape/tube saturation' },
    ],
    defaultSense: 'spectral',
  },
  {
    word: 'big',
    possibleSenses: [
      { senseId: 'width', label: 'Stereo width (wider image)', description: 'Increase stereo width' },
      { senseId: 'loudness', label: 'Loudness (louder/more impactful)', description: 'Increase overall level' },
      { senseId: 'density', label: 'Density (more layers/elements)', description: 'Add layers and double parts' },
      { senseId: 'low_end', label: 'Low-end (more bass weight)', description: 'Add sub-bass and low-end presence' },
    ],
    defaultSense: 'width',
  },
  {
    word: 'tight',
    possibleSenses: [
      { senseId: 'timing', label: 'Timing (better quantization)', description: 'Tighter to the grid' },
      { senseId: 'dynamics', label: 'Dynamics (more compressed)', description: 'Tighter dynamic range' },
      { senseId: 'arrangement', label: 'Arrangement (less busy)', description: 'Tighter, more focused arrangement' },
      { senseId: 'mix', label: 'Mix (narrower stereo, drier)', description: 'Tighter mix imaging' },
    ],
    defaultSense: 'timing',
  },
  {
    word: 'open',
    possibleSenses: [
      { senseId: 'voicing', label: 'Voicing (open chord voicings)', description: 'Wider interval spacing in chords' },
      { senseId: 'spatial', label: 'Spatial (wider, more reverb)', description: 'More stereo width and depth' },
      { senseId: 'arrangement', label: 'Arrangement (sparser)', description: 'More space between elements' },
    ],
    defaultSense: 'voicing',
  },
  {
    word: 'heavy',
    possibleSenses: [
      { senseId: 'low_end', label: 'Low-end (more bass/sub)', description: 'Heavier low frequencies' },
      { senseId: 'distortion', label: 'Distortion (more drive/aggression)', description: 'More distortion and grit' },
      { senseId: 'rhythm', label: 'Rhythmic (heavier beat emphasis)', description: 'Heavier rhythmic accents' },
      { senseId: 'density', label: 'Density (thicker arrangement)', description: 'More dense, layered arrangement' },
    ],
    defaultSense: 'low_end',
  },
  {
    word: 'clean',
    possibleSenses: [
      { senseId: 'timing', label: 'Timing (tighter grid alignment)', description: 'Clean up sloppy timing' },
      { senseId: 'mix', label: 'Mix (remove masking/mud)', description: 'Clean up frequency masking' },
      { senseId: 'arrangement', label: 'Arrangement (remove clutter)', description: 'Remove unnecessary elements' },
      { senseId: 'tone', label: 'Tone (less distortion/effects)', description: 'Cleaner, less processed sound' },
    ],
    defaultSense: 'timing',
  },
  {
    word: 'smooth',
    possibleSenses: [
      { senseId: 'spectral', label: 'Spectral (less harsh frequencies)', description: 'EQ smoothing, reduce harsh peaks' },
      { senseId: 'articulation', label: 'Articulation (more legato)', description: 'More connected note transitions' },
      { senseId: 'dynamics', label: 'Dynamics (less dynamic jumps)', description: 'Compression for smoother dynamics' },
      { senseId: 'transitions', label: 'Transitions (smoother section changes)', description: 'Better section transitions' },
    ],
    defaultSense: 'spectral',
  },
  {
    word: 'full',
    possibleSenses: [
      { senseId: 'spectral', label: 'Spectral (fill frequency gaps)', description: 'More even spectral balance' },
      { senseId: 'arrangement', label: 'Arrangement (more layers)', description: 'Fuller arrangement with more parts' },
      { senseId: 'harmony', label: 'Harmonic (richer voicings)', description: 'More complex, richer chords' },
      { senseId: 'low_end', label: 'Low-end (more bass)', description: 'More low-frequency content' },
    ],
    defaultSense: 'spectral',
  },
  {
    word: 'space',
    possibleSenses: [
      { senseId: 'reverb', label: 'Reverb/spatial effects', description: 'Add reverb or spatial processing' },
      { senseId: 'arrangement', label: 'Arrangement (sparser)', description: 'Thin out the arrangement' },
      { senseId: 'stereo', label: 'Stereo width', description: 'Wider stereo image' },
      { senseId: 'dynamics', label: 'Dynamic space', description: 'More dynamic range, less compression' },
    ],
    defaultSense: 'arrangement',
  },
  {
    word: 'aggressive',
    possibleSenses: [
      { senseId: 'distortion', label: 'Distortion/saturation', description: 'Add drive, distortion, or saturation' },
      { senseId: 'transients', label: 'Transients (sharper attacks)', description: 'Harder, punchier transients' },
      { senseId: 'tempo', label: 'Tempo/energy (faster, more intense)', description: 'Higher energy and tempo' },
      { senseId: 'harmony', label: 'Harmonic (more dissonant)', description: 'More dissonant intervals and chords' },
    ],
    defaultSense: 'distortion',
  },
];

/**
 * A vague word entry with its possible senses.
 */
export interface VagueWordEntry {
  /** The word. */
  readonly word: string;
  /** All possible senses. */
  readonly possibleSenses: readonly VagueWordSense[];
  /** The system default sense (used before user sets a preference). */
  readonly defaultSense: string;
}

/**
 * A possible sense for a vague word.
 */
export interface VagueWordSense {
  /** Sense identifier. */
  readonly senseId: string;
  /** Short label for UI display. */
  readonly label: string;
  /** Longer description of what this sense means in practice. */
  readonly description: string;
}


// =============================================================================
// Degree Preferences
// =============================================================================

/**
 * User preferences for default degree amounts.
 */
export interface DegreePreferences {
  /** Default degree when none is specified (e.g., "make it brighter"). */
  readonly defaultDegree: 'tiny' | 'small' | 'moderate' | 'large';
  /** Whether to show degree controls in preview by default. */
  readonly showDegreeControls: boolean;
  /** Preferred control type. */
  readonly preferredControlType: 'chips' | 'slider' | 'both';
}

/**
 * Default degree preferences.
 */
export const DEFAULT_DEGREE_PREFERENCES: DegreePreferences = {
  defaultDegree: 'moderate',
  showDegreeControls: true,
  preferredControlType: 'both',
};


// =============================================================================
// Safety Preferences
// =============================================================================

/**
 * User preferences for safety/confirmation behavior.
 */
export interface SafetyPreferences {
  /**
   * How often clarification questions are asked.
   *
   * - 'strict': Always ask when any ambiguity exists
   * - 'balanced': Ask for material ambiguities, use defaults for minor ones
   * - 'relaxed': Use defaults more aggressively, ask less often
   */
  readonly clarificationFrequency: 'strict' | 'balanced' | 'relaxed';

  /**
   * Whether to require confirmation for "caution" level changes.
   * (Risky changes ALWAYS require confirmation regardless of this setting.)
   */
  readonly confirmCaution: boolean;

  /**
   * Whether to show scope highlighting by default.
   */
  readonly autoHighlight: boolean;

  /**
   * Whether to show "why" explanations by default.
   */
  readonly autoExplain: boolean;
}

/**
 * Default safety preferences.
 */
export const DEFAULT_SAFETY_PREFERENCES: SafetyPreferences = {
  clarificationFrequency: 'balanced',
  confirmCaution: true,
  autoHighlight: true,
  autoExplain: false,
};


// =============================================================================
// Preservation Preferences
// =============================================================================

/**
 * User preferences for default preservation modes.
 */
export interface PreservationPreferences {
  /**
   * Default preservation mode when user says "keep the melody".
   * - 'exact': Pitch and rhythm must be identical
   * - 'functional': Harmonic function preserved, notes may differ
   * - 'recognizable': Must be recognizable, details may vary
   */
  readonly defaultPreservationMode: 'exact' | 'functional' | 'recognizable';

  /**
   * Whether to auto-generate preservation constraints when scope
   * is restricted (e.g., "just fix the drums" → preserve everything else).
   */
  readonly autoPreserveOnScopeRestriction: boolean;
}

/**
 * Default preservation preferences.
 */
export const DEFAULT_PRESERVATION_PREFERENCES: PreservationPreferences = {
  defaultPreservationMode: 'exact',
  autoPreserveOnScopeRestriction: true,
};


// =============================================================================
// Vocabulary Customizations
// =============================================================================

/**
 * A user-defined vocabulary customization.
 *
 * Users can define their own shortcuts and synonyms:
 * - "chunky" → increase(density) + increase(low_end)
 * - "glassy" → increase(brightness) + increase(width)
 */
export interface VocabularyCustomization {
  /** The user-defined word or phrase. */
  readonly word: string;
  /** What it maps to (axis + direction). */
  readonly mappings: readonly VocabularyMapping[];
  /** When this customization was added. */
  readonly addedAt: string;
  /** Notes from the user. */
  readonly note: string | undefined;
}

/**
 * A single mapping from a custom word to an axis effect.
 */
export interface VocabularyMapping {
  /** The axis affected. */
  readonly axis: string;
  /** The direction. */
  readonly direction: 'increase' | 'decrease';
  /** Optional degree. */
  readonly degree: string | undefined;
}


// =============================================================================
// Profile Management
// =============================================================================

/**
 * Create a new default profile.
 */
export function createDefaultProfile(name: string): UserPreferenceProfile {
  const now = new Date().toISOString();
  return {
    id: profileId(`profile-${Date.now()}`),
    name,
    description: 'Default GOFAI Music+ preferences',
    version: PROFILE_SCHEMA_VERSION,
    createdAt: now,
    modifiedAt: now,
    axisSensePreferences: [],
    degreePreferences: DEFAULT_DEGREE_PREFERENCES,
    safetyPreferences: DEFAULT_SAFETY_PREFERENCES,
    preservationPreferences: DEFAULT_PRESERVATION_PREFERENCES,
    vocabularyCustomizations: [],
  };
}

/**
 * Look up a user's axis sense preference for a given word.
 *
 * Returns the user's preferred sense, or falls back to system default.
 */
export function getAxisSensePreference(
  profile: UserPreferenceProfile,
  word: string,
): { sense: string; source: 'user' | 'system_default' } {
  // Check user preferences
  const userPref = profile.axisSensePreferences.find(
    p => p.word.toLowerCase() === word.toLowerCase(),
  );
  if (userPref !== undefined) {
    return { sense: userPref.preferredSense, source: 'user' };
  }

  // Fall back to system default
  const entry = WORDS_NEEDING_PREFERENCES.find(
    w => w.word.toLowerCase() === word.toLowerCase(),
  );
  if (entry !== undefined) {
    return { sense: entry.defaultSense, source: 'system_default' };
  }

  // Unknown word — no preference
  return { sense: 'unknown', source: 'system_default' };
}

/**
 * Add or update an axis sense preference.
 */
export function setAxisSensePreference(
  profile: UserPreferenceProfile,
  word: string,
  preferredSense: string,
  origin: PreferenceOrigin,
): UserPreferenceProfile {
  const existing = profile.axisSensePreferences.find(
    p => p.word.toLowerCase() === word.toLowerCase(),
  );

  const entry = WORDS_NEEDING_PREFERENCES.find(
    w => w.word.toLowerCase() === word.toLowerCase(),
  );
  const alternatives = entry?.possibleSenses
    .filter(s => s.senseId !== preferredSense)
    .map(s => s.senseId) ?? [];

  const newPref: AxisSensePreference = {
    word: word.toLowerCase(),
    preferredSense,
    alternativeSenses: alternatives,
    establishedAt: new Date().toISOString(),
    origin,
    useCount: existing ? existing.useCount + 1 : 1,
    overrideCount: existing ? existing.overrideCount : 0,
  };

  const updated = profile.axisSensePreferences.filter(
    p => p.word.toLowerCase() !== word.toLowerCase(),
  );

  return {
    ...profile,
    axisSensePreferences: [...updated, newPref],
    modifiedAt: new Date().toISOString(),
  };
}

/**
 * Export a profile to a portable JSON format.
 */
export function exportProfile(profile: UserPreferenceProfile): string {
  return JSON.stringify(profile, null, 2);
}

/**
 * Import a profile from JSON.
 * Returns undefined if the JSON is invalid.
 */
export function importProfile(json: string): UserPreferenceProfile | undefined {
  try {
    const parsed = JSON.parse(json);
    // Basic structural validation
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      typeof parsed.id === 'string' &&
      typeof parsed.name === 'string' &&
      typeof parsed.version === 'number'
    ) {
      return parsed as UserPreferenceProfile;
    }
    return undefined;
  } catch {
    return undefined;
  }
}


// =============================================================================
// UI Copy Templates for Preference Setting
// =============================================================================

/**
 * UI templates for offering to save preferences.
 */
export const PREFERENCE_UI_TEMPLATES = {
  /** Offering to save after clarification. */
  SAVE_AFTER_CLARIFICATION:
    'Got it — "{word}" means {sense} for you. Want me to remember this for next time?',

  /** Showing which preference was applied. */
  PREFERENCE_APPLIED:
    'Using your preference: "{word}" → {sense}',

  /** Showing system default was used. */
  DEFAULT_APPLIED:
    'Using default: "{word}" → {sense} (you can change this in preferences)',

  /** Asking about a new vague word. */
  FIRST_ENCOUNTER:
    'By "{word}", do you mean {options}?',

  /** Profile exported confirmation. */
  PROFILE_EXPORTED:
    'Profile "{name}" exported successfully.',

  /** Profile imported confirmation. */
  PROFILE_IMPORTED:
    'Profile "{name}" imported with {count} preferences.',
} as const;
