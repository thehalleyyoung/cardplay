/**
 * GOFAI NL Morphology — Lemmatization-Lite
 *
 * Implements morphological normalization for core verbs and adjectives.
 * This is NOT a full morphological analyzer — it's a targeted system
 * for the specific word forms used in music editing commands.
 *
 * ## Scope
 *
 * Handles inflections of domain verbs and adjectives:
 * - **Verbs**: tighten/tightens/tightened/tightening → tighten
 * - **Adjectives**: brighter/brightest → bright
 * - **Comparatives**: louder → loud (comparative), loudest → loud (superlative)
 * - **Progressive**: widening → widen (present participle)
 * - **Past**: compressed → compress (past tense / past participle)
 *
 * ## Strategy
 *
 * Uses a table-driven approach for known musical domain words, plus
 * rule-based suffix stripping for regular English morphology as a fallback.
 * No AI/ML is used — all rules are deterministic and inspectable.
 *
 * @module gofai/nl/tokenizer/morphology
 * @see gofai_goalA.md Step 103
 */

// =============================================================================
// LEMMA RESULT
// =============================================================================

/**
 * Result of lemmatization.
 */
export interface LemmaResult {
  /** The lemma (base form) */
  readonly lemma: string;

  /** The original inflected form */
  readonly original: string;

  /** The inflection type, if recognized */
  readonly inflection: InflectionType;

  /** Whether the lemma was found in the domain table */
  readonly fromTable: boolean;

  /** The morphological rule that was applied (if rule-based) */
  readonly rule?: string;

  /** Word class of the lemma */
  readonly wordClass: WordClass;
}

/**
 * Inflection types.
 */
export type InflectionType =
  | 'base'              // Already in base form
  | 'third_person_s'    // runs, adds, makes
  | 'past_tense'        // added, removed, changed
  | 'past_participle'   // brightened, compressed
  | 'present_participle'// adding, removing, changing
  | 'comparative'       // brighter, louder, darker
  | 'superlative'       // brightest, loudest, darkest
  | 'nominalization'    // brightness, darkness (noun from adj)
  | 'adverbial'         // slightly, dramatically (adverb from adj)
  | 'unknown';          // Could not determine inflection

/**
 * Word classes.
 */
export type WordClass =
  | 'verb'
  | 'adjective'
  | 'adverb'
  | 'noun'
  | 'unknown';

// =============================================================================
// DOMAIN VERB TABLE — irregular and domain-specific verbs
// =============================================================================

/**
 * Domain verb entry: maps inflected forms to the lemma.
 */
export interface DomainVerbEntry {
  readonly lemma: string;
  readonly thirdPerson: string;
  readonly pastTense: string;
  readonly pastParticiple: string;
  readonly presentParticiple: string;
}

/**
 * Domain-specific verbs with their inflected forms.
 * These override rule-based lemmatization.
 */
export const DOMAIN_VERBS: readonly DomainVerbEntry[] = [
  // Core editing verbs
  { lemma: 'make', thirdPerson: 'makes', pastTense: 'made', pastParticiple: 'made', presentParticiple: 'making' },
  { lemma: 'add', thirdPerson: 'adds', pastTense: 'added', pastParticiple: 'added', presentParticiple: 'adding' },
  { lemma: 'remove', thirdPerson: 'removes', pastTense: 'removed', pastParticiple: 'removed', presentParticiple: 'removing' },
  { lemma: 'delete', thirdPerson: 'deletes', pastTense: 'deleted', pastParticiple: 'deleted', presentParticiple: 'deleting' },
  { lemma: 'change', thirdPerson: 'changes', pastTense: 'changed', pastParticiple: 'changed', presentParticiple: 'changing' },
  { lemma: 'set', thirdPerson: 'sets', pastTense: 'set', pastParticiple: 'set', presentParticiple: 'setting' },
  { lemma: 'move', thirdPerson: 'moves', pastTense: 'moved', pastParticiple: 'moved', presentParticiple: 'moving' },
  { lemma: 'copy', thirdPerson: 'copies', pastTense: 'copied', pastParticiple: 'copied', presentParticiple: 'copying' },
  { lemma: 'duplicate', thirdPerson: 'duplicates', pastTense: 'duplicated', pastParticiple: 'duplicated', presentParticiple: 'duplicating' },
  { lemma: 'keep', thirdPerson: 'keeps', pastTense: 'kept', pastParticiple: 'kept', presentParticiple: 'keeping' },
  { lemma: 'put', thirdPerson: 'puts', pastTense: 'put', pastParticiple: 'put', presentParticiple: 'putting' },
  { lemma: 'get', thirdPerson: 'gets', pastTense: 'got', pastParticiple: 'gotten', presentParticiple: 'getting' },
  { lemma: 'give', thirdPerson: 'gives', pastTense: 'gave', pastParticiple: 'given', presentParticiple: 'giving' },
  { lemma: 'take', thirdPerson: 'takes', pastTense: 'took', pastParticiple: 'taken', presentParticiple: 'taking' },
  { lemma: 'bring', thirdPerson: 'brings', pastTense: 'brought', pastParticiple: 'brought', presentParticiple: 'bringing' },
  { lemma: 'cut', thirdPerson: 'cuts', pastTense: 'cut', pastParticiple: 'cut', presentParticiple: 'cutting' },
  { lemma: 'split', thirdPerson: 'splits', pastTense: 'split', pastParticiple: 'split', presentParticiple: 'splitting' },
  { lemma: 'try', thirdPerson: 'tries', pastTense: 'tried', pastParticiple: 'tried', presentParticiple: 'trying' },
  { lemma: 'undo', thirdPerson: 'undoes', pastTense: 'undid', pastParticiple: 'undone', presentParticiple: 'undoing' },
  { lemma: 'redo', thirdPerson: 'redoes', pastTense: 'redid', pastParticiple: 'redone', presentParticiple: 'redoing' },

  // Perceptual/quality verbs
  { lemma: 'brighten', thirdPerson: 'brightens', pastTense: 'brightened', pastParticiple: 'brightened', presentParticiple: 'brightening' },
  { lemma: 'darken', thirdPerson: 'darkens', pastTense: 'darkened', pastParticiple: 'darkened', presentParticiple: 'darkening' },
  { lemma: 'widen', thirdPerson: 'widens', pastTense: 'widened', pastParticiple: 'widened', presentParticiple: 'widening' },
  { lemma: 'narrow', thirdPerson: 'narrows', pastTense: 'narrowed', pastParticiple: 'narrowed', presentParticiple: 'narrowing' },
  { lemma: 'tighten', thirdPerson: 'tightens', pastTense: 'tightened', pastParticiple: 'tightened', presentParticiple: 'tightening' },
  { lemma: 'loosen', thirdPerson: 'loosens', pastTense: 'loosened', pastParticiple: 'loosened', presentParticiple: 'loosening' },
  { lemma: 'soften', thirdPerson: 'softens', pastTense: 'softened', pastParticiple: 'softened', presentParticiple: 'softening' },
  { lemma: 'harden', thirdPerson: 'hardens', pastTense: 'hardened', pastParticiple: 'hardened', presentParticiple: 'hardening' },
  { lemma: 'warm', thirdPerson: 'warms', pastTense: 'warmed', pastParticiple: 'warmed', presentParticiple: 'warming' },
  { lemma: 'cool', thirdPerson: 'cools', pastTense: 'cooled', pastParticiple: 'cooled', presentParticiple: 'cooling' },
  { lemma: 'thicken', thirdPerson: 'thickens', pastTense: 'thickened', pastParticiple: 'thickened', presentParticiple: 'thickening' },
  { lemma: 'thin', thirdPerson: 'thins', pastTense: 'thinned', pastParticiple: 'thinned', presentParticiple: 'thinning' },
  { lemma: 'smooth', thirdPerson: 'smooths', pastTense: 'smoothed', pastParticiple: 'smoothed', presentParticiple: 'smoothing' },
  { lemma: 'sharpen', thirdPerson: 'sharpens', pastTense: 'sharpened', pastParticiple: 'sharpened', presentParticiple: 'sharpening' },
  { lemma: 'deepen', thirdPerson: 'deepens', pastTense: 'deepened', pastParticiple: 'deepened', presentParticiple: 'deepening' },
  { lemma: 'flatten', thirdPerson: 'flattens', pastTense: 'flattened', pastParticiple: 'flattened', presentParticiple: 'flattening' },
  { lemma: 'strengthen', thirdPerson: 'strengthens', pastTense: 'strengthened', pastParticiple: 'strengthened', presentParticiple: 'strengthening' },
  { lemma: 'weaken', thirdPerson: 'weakens', pastTense: 'weakened', pastParticiple: 'weakened', presentParticiple: 'weakening' },
  { lemma: 'sweeten', thirdPerson: 'sweetens', pastTense: 'sweetened', pastParticiple: 'sweetened', presentParticiple: 'sweetening' },
  { lemma: 'fatten', thirdPerson: 'fattens', pastTense: 'fattened', pastParticiple: 'fattened', presentParticiple: 'fattening' },
  { lemma: 'dampen', thirdPerson: 'dampens', pastTense: 'dampened', pastParticiple: 'dampened', presentParticiple: 'dampening' },
  { lemma: 'quicken', thirdPerson: 'quickens', pastTense: 'quickened', pastParticiple: 'quickened', presentParticiple: 'quickening' },
  { lemma: 'liven', thirdPerson: 'livens', pastTense: 'livened', pastParticiple: 'livened', presentParticiple: 'livening' },
  { lemma: 'heighten', thirdPerson: 'heightens', pastTense: 'heightened', pastParticiple: 'heightened', presentParticiple: 'heightening' },
  { lemma: 'lighten', thirdPerson: 'lightens', pastTense: 'lightened', pastParticiple: 'lightened', presentParticiple: 'lightening' },

  // Audio/production verbs
  { lemma: 'boost', thirdPerson: 'boosts', pastTense: 'boosted', pastParticiple: 'boosted', presentParticiple: 'boosting' },
  { lemma: 'reduce', thirdPerson: 'reduces', pastTense: 'reduced', pastParticiple: 'reduced', presentParticiple: 'reducing' },
  { lemma: 'increase', thirdPerson: 'increases', pastTense: 'increased', pastParticiple: 'increased', presentParticiple: 'increasing' },
  { lemma: 'decrease', thirdPerson: 'decreases', pastTense: 'decreased', pastParticiple: 'decreased', presentParticiple: 'decreasing' },
  { lemma: 'raise', thirdPerson: 'raises', pastTense: 'raised', pastParticiple: 'raised', presentParticiple: 'raising' },
  { lemma: 'lower', thirdPerson: 'lowers', pastTense: 'lowered', pastParticiple: 'lowered', presentParticiple: 'lowering' },
  { lemma: 'compress', thirdPerson: 'compresses', pastTense: 'compressed', pastParticiple: 'compressed', presentParticiple: 'compressing' },
  { lemma: 'expand', thirdPerson: 'expands', pastTense: 'expanded', pastParticiple: 'expanded', presentParticiple: 'expanding' },
  { lemma: 'limit', thirdPerson: 'limits', pastTense: 'limited', pastParticiple: 'limited', presentParticiple: 'limiting' },
  { lemma: 'gate', thirdPerson: 'gates', pastTense: 'gated', pastParticiple: 'gated', presentParticiple: 'gating' },
  { lemma: 'filter', thirdPerson: 'filters', pastTense: 'filtered', pastParticiple: 'filtered', presentParticiple: 'filtering' },
  { lemma: 'equalize', thirdPerson: 'equalizes', pastTense: 'equalized', pastParticiple: 'equalized', presentParticiple: 'equalizing' },
  { lemma: 'saturate', thirdPerson: 'saturates', pastTense: 'saturated', pastParticiple: 'saturated', presentParticiple: 'saturating' },
  { lemma: 'distort', thirdPerson: 'distorts', pastTense: 'distorted', pastParticiple: 'distorted', presentParticiple: 'distorting' },
  { lemma: 'modulate', thirdPerson: 'modulates', pastTense: 'modulated', pastParticiple: 'modulated', presentParticiple: 'modulating' },
  { lemma: 'pan', thirdPerson: 'pans', pastTense: 'panned', pastParticiple: 'panned', presentParticiple: 'panning' },
  { lemma: 'mute', thirdPerson: 'mutes', pastTense: 'muted', pastParticiple: 'muted', presentParticiple: 'muting' },
  { lemma: 'solo', thirdPerson: 'solos', pastTense: 'soloed', pastParticiple: 'soloed', presentParticiple: 'soloing' },
  { lemma: 'fade', thirdPerson: 'fades', pastTense: 'faded', pastParticiple: 'faded', presentParticiple: 'fading' },
  { lemma: 'crossfade', thirdPerson: 'crossfades', pastTense: 'crossfaded', pastParticiple: 'crossfaded', presentParticiple: 'crossfading' },
  { lemma: 'trim', thirdPerson: 'trims', pastTense: 'trimmed', pastParticiple: 'trimmed', presentParticiple: 'trimming' },
  { lemma: 'extend', thirdPerson: 'extends', pastTense: 'extended', pastParticiple: 'extended', presentParticiple: 'extending' },
  { lemma: 'shorten', thirdPerson: 'shortens', pastTense: 'shortened', pastParticiple: 'shortened', presentParticiple: 'shortening' },
  { lemma: 'lengthen', thirdPerson: 'lengthens', pastTense: 'lengthened', pastParticiple: 'lengthened', presentParticiple: 'lengthening' },
  { lemma: 'stretch', thirdPerson: 'stretches', pastTense: 'stretched', pastParticiple: 'stretched', presentParticiple: 'stretching' },
  { lemma: 'pitch', thirdPerson: 'pitches', pastTense: 'pitched', pastParticiple: 'pitched', presentParticiple: 'pitching' },
  { lemma: 'detune', thirdPerson: 'detunes', pastTense: 'detuned', pastParticiple: 'detuned', presentParticiple: 'detuning' },
  { lemma: 'retune', thirdPerson: 'retunes', pastTense: 'retuned', pastParticiple: 'retuned', presentParticiple: 'retuning' },
  { lemma: 'sidechain', thirdPerson: 'sidechains', pastTense: 'sidechained', pastParticiple: 'sidechained', presentParticiple: 'sidechaining' },
  { lemma: 'automate', thirdPerson: 'automates', pastTense: 'automated', pastParticiple: 'automated', presentParticiple: 'automating' },

  // Musical structure verbs
  { lemma: 'transpose', thirdPerson: 'transposes', pastTense: 'transposed', pastParticiple: 'transposed', presentParticiple: 'transposing' },
  { lemma: 'harmonize', thirdPerson: 'harmonizes', pastTense: 'harmonized', pastParticiple: 'harmonized', presentParticiple: 'harmonizing' },
  { lemma: 'reharmonize', thirdPerson: 'reharmonizes', pastTense: 'reharmonized', pastParticiple: 'reharmonized', presentParticiple: 'reharmonizing' },
  { lemma: 'revoice', thirdPerson: 'revoices', pastTense: 'revoiced', pastParticiple: 'revoiced', presentParticiple: 'revoicing' },
  { lemma: 'quantize', thirdPerson: 'quantizes', pastTense: 'quantized', pastParticiple: 'quantized', presentParticiple: 'quantizing' },
  { lemma: 'humanize', thirdPerson: 'humanizes', pastTense: 'humanized', pastParticiple: 'humanized', presentParticiple: 'humanizing' },
  { lemma: 'syncopate', thirdPerson: 'syncopates', pastTense: 'syncopated', pastParticiple: 'syncopated', presentParticiple: 'syncopating' },
  { lemma: 'arpeggiate', thirdPerson: 'arpeggiates', pastTense: 'arpeggiated', pastParticiple: 'arpeggiated', presentParticiple: 'arpeggiating' },
  { lemma: 'arrange', thirdPerson: 'arranges', pastTense: 'arranged', pastParticiple: 'arranged', presentParticiple: 'arranging' },
  { lemma: 'orchestrate', thirdPerson: 'orchestrates', pastTense: 'orchestrated', pastParticiple: 'orchestrated', presentParticiple: 'orchestrating' },
  { lemma: 'layer', thirdPerson: 'layers', pastTense: 'layered', pastParticiple: 'layered', presentParticiple: 'layering' },
  { lemma: 'double', thirdPerson: 'doubles', pastTense: 'doubled', pastParticiple: 'doubled', presentParticiple: 'doubling' },
  { lemma: 'loop', thirdPerson: 'loops', pastTense: 'looped', pastParticiple: 'looped', presentParticiple: 'looping' },
  { lemma: 'repeat', thirdPerson: 'repeats', pastTense: 'repeated', pastParticiple: 'repeated', presentParticiple: 'repeating' },
  { lemma: 'swap', thirdPerson: 'swaps', pastTense: 'swapped', pastParticiple: 'swapped', presentParticiple: 'swapping' },
  { lemma: 'replace', thirdPerson: 'replaces', pastTense: 'replaced', pastParticiple: 'replaced', presentParticiple: 'replacing' },
  { lemma: 'switch', thirdPerson: 'switches', pastTense: 'switched', pastParticiple: 'switched', presentParticiple: 'switching' },
  { lemma: 'mix', thirdPerson: 'mixes', pastTense: 'mixed', pastParticiple: 'mixed', presentParticiple: 'mixing' },
  { lemma: 'blend', thirdPerson: 'blends', pastTense: 'blended', pastParticiple: 'blended', presentParticiple: 'blending' },
  { lemma: 'balance', thirdPerson: 'balances', pastTense: 'balanced', pastParticiple: 'balanced', presentParticiple: 'balancing' },
  { lemma: 'normalize', thirdPerson: 'normalizes', pastTense: 'normalized', pastParticiple: 'normalized', presentParticiple: 'normalizing' },
  { lemma: 'reverse', thirdPerson: 'reverses', pastTense: 'reversed', pastParticiple: 'reversed', presentParticiple: 'reversing' },
  { lemma: 'invert', thirdPerson: 'inverts', pastTense: 'inverted', pastParticiple: 'inverted', presentParticiple: 'inverting' },
  { lemma: 'preserve', thirdPerson: 'preserves', pastTense: 'preserved', pastParticiple: 'preserved', presentParticiple: 'preserving' },
  { lemma: 'maintain', thirdPerson: 'maintains', pastTense: 'maintained', pastParticiple: 'maintained', presentParticiple: 'maintaining' },
  { lemma: 'adjust', thirdPerson: 'adjusts', pastTense: 'adjusted', pastParticiple: 'adjusted', presentParticiple: 'adjusting' },
  { lemma: 'tweak', thirdPerson: 'tweaks', pastTense: 'tweaked', pastParticiple: 'tweaked', presentParticiple: 'tweaking' },
  { lemma: 'fix', thirdPerson: 'fixes', pastTense: 'fixed', pastParticiple: 'fixed', presentParticiple: 'fixing' },
  { lemma: 'apply', thirdPerson: 'applies', pastTense: 'applied', pastParticiple: 'applied', presentParticiple: 'applying' },
];

// =============================================================================
// DOMAIN ADJECTIVE TABLE — irregular and domain-specific adjectives
// =============================================================================

/**
 * Domain adjective entry: maps forms to the base adjective.
 */
export interface DomainAdjectiveEntry {
  readonly base: string;
  readonly comparative: string;
  readonly superlative: string;
  readonly nominalization?: string; // brightness from bright
  readonly verb?: string;           // brighten from bright
}

/**
 * Domain-specific adjectives with their comparative/superlative forms.
 */
export const DOMAIN_ADJECTIVES: readonly DomainAdjectiveEntry[] = [
  // Perceptual quality adjectives
  { base: 'bright', comparative: 'brighter', superlative: 'brightest', nominalization: 'brightness', verb: 'brighten' },
  { base: 'dark', comparative: 'darker', superlative: 'darkest', nominalization: 'darkness', verb: 'darken' },
  { base: 'wide', comparative: 'wider', superlative: 'widest', nominalization: 'width', verb: 'widen' },
  { base: 'narrow', comparative: 'narrower', superlative: 'narrowest', nominalization: 'narrowness', verb: 'narrow' },
  { base: 'tight', comparative: 'tighter', superlative: 'tightest', nominalization: 'tightness', verb: 'tighten' },
  { base: 'loose', comparative: 'looser', superlative: 'loosest', nominalization: 'looseness', verb: 'loosen' },
  { base: 'loud', comparative: 'louder', superlative: 'loudest', nominalization: 'loudness' },
  { base: 'quiet', comparative: 'quieter', superlative: 'quietest', nominalization: 'quietness' },
  { base: 'soft', comparative: 'softer', superlative: 'softest', nominalization: 'softness', verb: 'soften' },
  { base: 'hard', comparative: 'harder', superlative: 'hardest', nominalization: 'hardness', verb: 'harden' },
  { base: 'warm', comparative: 'warmer', superlative: 'warmest', nominalization: 'warmth', verb: 'warm' },
  { base: 'cool', comparative: 'cooler', superlative: 'coolest', nominalization: 'coolness', verb: 'cool' },
  { base: 'thick', comparative: 'thicker', superlative: 'thickest', nominalization: 'thickness', verb: 'thicken' },
  { base: 'thin', comparative: 'thinner', superlative: 'thinnest', nominalization: 'thinness', verb: 'thin' },
  { base: 'heavy', comparative: 'heavier', superlative: 'heaviest', nominalization: 'heaviness' },
  { base: 'light', comparative: 'lighter', superlative: 'lightest', nominalization: 'lightness', verb: 'lighten' },
  { base: 'dense', comparative: 'denser', superlative: 'densest', nominalization: 'density' },
  { base: 'sparse', comparative: 'sparser', superlative: 'sparsest', nominalization: 'sparseness' },
  { base: 'punchy', comparative: 'punchier', superlative: 'punchiest', nominalization: 'punchiness' },
  { base: 'muddy', comparative: 'muddier', superlative: 'muddiest', nominalization: 'muddiness' },
  { base: 'clean', comparative: 'cleaner', superlative: 'cleanest', nominalization: 'cleanness' },
  { base: 'dirty', comparative: 'dirtier', superlative: 'dirtiest', nominalization: 'dirtiness' },
  { base: 'crisp', comparative: 'crispier', superlative: 'crispiest', nominalization: 'crispness' },
  { base: 'smooth', comparative: 'smoother', superlative: 'smoothest', nominalization: 'smoothness', verb: 'smooth' },
  { base: 'rough', comparative: 'rougher', superlative: 'roughest', nominalization: 'roughness' },
  { base: 'big', comparative: 'bigger', superlative: 'biggest', nominalization: 'bigness' },
  { base: 'small', comparative: 'smaller', superlative: 'smallest', nominalization: 'smallness' },
  { base: 'full', comparative: 'fuller', superlative: 'fullest', nominalization: 'fullness' },
  { base: 'empty', comparative: 'emptier', superlative: 'emptiest', nominalization: 'emptiness' },
  { base: 'rich', comparative: 'richer', superlative: 'richest', nominalization: 'richness' },
  { base: 'lean', comparative: 'leaner', superlative: 'leanest', nominalization: 'leanness' },
  { base: 'sharp', comparative: 'sharper', superlative: 'sharpest', nominalization: 'sharpness', verb: 'sharpen' },
  { base: 'flat', comparative: 'flatter', superlative: 'flattest', nominalization: 'flatness', verb: 'flatten' },
  { base: 'deep', comparative: 'deeper', superlative: 'deepest', nominalization: 'depth', verb: 'deepen' },
  { base: 'shallow', comparative: 'shallower', superlative: 'shallowest', nominalization: 'shallowness' },
  { base: 'fast', comparative: 'faster', superlative: 'fastest', nominalization: 'speed' },
  { base: 'slow', comparative: 'slower', superlative: 'slowest', nominalization: 'slowness' },
  { base: 'high', comparative: 'higher', superlative: 'highest' },
  { base: 'low', comparative: 'lower', superlative: 'lowest' },
  { base: 'short', comparative: 'shorter', superlative: 'shortest', verb: 'shorten' },
  { base: 'long', comparative: 'longer', superlative: 'longest', verb: 'lengthen' },
  { base: 'strong', comparative: 'stronger', superlative: 'strongest', nominalization: 'strength', verb: 'strengthen' },
  { base: 'weak', comparative: 'weaker', superlative: 'weakest', nominalization: 'weakness', verb: 'weaken' },
  { base: 'dry', comparative: 'drier', superlative: 'driest', nominalization: 'dryness' },
  { base: 'wet', comparative: 'wetter', superlative: 'wettest', nominalization: 'wetness' },

  // Musical style adjectives
  { base: 'funky', comparative: 'funkier', superlative: 'funkiest', nominalization: 'funkiness' },
  { base: 'jazzy', comparative: 'jazzier', superlative: 'jazziest', nominalization: 'jazziness' },
  { base: 'groovy', comparative: 'groovier', superlative: 'grooviest', nominalization: 'grooviness' },
  { base: 'mellow', comparative: 'mellower', superlative: 'mellowest', nominalization: 'mellowness' },
  { base: 'airy', comparative: 'airier', superlative: 'airiest', nominalization: 'airiness' },
  { base: 'gritty', comparative: 'grittier', superlative: 'grittiest', nominalization: 'grittiness' },
  { base: 'ethereal', comparative: 'more ethereal', superlative: 'most ethereal' },
  { base: 'aggressive', comparative: 'more aggressive', superlative: 'most aggressive', nominalization: 'aggression' },
  { base: 'gentle', comparative: 'gentler', superlative: 'gentlest', nominalization: 'gentleness' },
  { base: 'dynamic', comparative: 'more dynamic', superlative: 'most dynamic' },
  { base: 'static', comparative: 'more static', superlative: 'most static' },
  { base: 'energetic', comparative: 'more energetic', superlative: 'most energetic' },
  { base: 'lush', comparative: 'lusher', superlative: 'lushest', nominalization: 'lushness' },
  { base: 'sparse', comparative: 'sparser', superlative: 'sparsest', nominalization: 'sparsity' },
];

// =============================================================================
// BUILD LOOKUP TABLES
// =============================================================================

// Verb lookup: inflected form → { lemma, inflection }
const _verbLookup = new Map<string, { lemma: string; inflection: InflectionType }>();
for (const v of DOMAIN_VERBS) {
  _verbLookup.set(v.lemma, { lemma: v.lemma, inflection: 'base' });
  _verbLookup.set(v.thirdPerson, { lemma: v.lemma, inflection: 'third_person_s' });
  _verbLookup.set(v.pastTense, { lemma: v.lemma, inflection: 'past_tense' });
  _verbLookup.set(v.pastParticiple, { lemma: v.lemma, inflection: 'past_participle' });
  _verbLookup.set(v.presentParticiple, { lemma: v.lemma, inflection: 'present_participle' });
}

// Adjective lookup: inflected form → { base, inflection }
const _adjLookup = new Map<string, { lemma: string; inflection: InflectionType; wordClass: WordClass }>();
for (const a of DOMAIN_ADJECTIVES) {
  _adjLookup.set(a.base, { lemma: a.base, inflection: 'base', wordClass: 'adjective' });
  _adjLookup.set(a.comparative, { lemma: a.base, inflection: 'comparative', wordClass: 'adjective' });
  _adjLookup.set(a.superlative, { lemma: a.base, inflection: 'superlative', wordClass: 'adjective' });
  if (a.nominalization) {
    _adjLookup.set(a.nominalization, { lemma: a.base, inflection: 'nominalization', wordClass: 'noun' });
  }
}

// =============================================================================
// LEMMATIZE — main entry point
// =============================================================================

/**
 * Lemmatize a word, returning its base form and inflection type.
 */
export function lemmatize(word: string): LemmaResult {
  const lower = word.toLowerCase();

  // 1. Check domain verb table
  const verbEntry = _verbLookup.get(lower);
  if (verbEntry) {
    return {
      lemma: verbEntry.lemma,
      original: word,
      inflection: verbEntry.inflection,
      fromTable: true,
      wordClass: 'verb',
    };
  }

  // 2. Check domain adjective table
  const adjEntry = _adjLookup.get(lower);
  if (adjEntry) {
    return {
      lemma: adjEntry.lemma,
      original: word,
      inflection: adjEntry.inflection,
      fromTable: true,
      wordClass: adjEntry.wordClass,
    };
  }

  // 3. Rule-based fallback
  return ruleBasedLemmatize(lower, word);
}

/**
 * Rule-based lemmatization for words not in the domain tables.
 * Applies regular English morphological rules.
 */
function ruleBasedLemmatize(lower: string, original: string): LemmaResult {
  // Present participle: -ing
  if (lower.endsWith('ing') && lower.length > 4) {
    const stem = stripSuffix(lower, 'ing');
    return {
      lemma: stem,
      original,
      inflection: 'present_participle',
      fromTable: false,
      rule: '-ing → stem',
      wordClass: 'verb',
    };
  }

  // Past tense / past participle: -ed
  if (lower.endsWith('ed') && lower.length > 3) {
    const stem = stripSuffix(lower, 'ed');
    return {
      lemma: stem,
      original,
      inflection: 'past_tense',
      fromTable: false,
      rule: '-ed → stem',
      wordClass: 'verb',
    };
  }

  // Comparative: -er
  if (lower.endsWith('er') && lower.length > 3 && !isCommonErWord(lower)) {
    const stem = stripSuffix(lower, 'er');
    return {
      lemma: stem,
      original,
      inflection: 'comparative',
      fromTable: false,
      rule: '-er → stem (comparative)',
      wordClass: 'adjective',
    };
  }

  // Superlative: -est
  if (lower.endsWith('est') && lower.length > 4 && !isCommonEstWord(lower)) {
    const stem = stripSuffix(lower, 'est');
    return {
      lemma: stem,
      original,
      inflection: 'superlative',
      fromTable: false,
      rule: '-est → stem (superlative)',
      wordClass: 'adjective',
    };
  }

  // Third person: -s, -es
  if (lower.endsWith('es') && lower.length > 3) {
    const stem = stripSuffix(lower, 'es');
    return {
      lemma: stem,
      original,
      inflection: 'third_person_s',
      fromTable: false,
      rule: '-es → stem',
      wordClass: 'verb',
    };
  }
  if (lower.endsWith('s') && lower.length > 2 && !lower.endsWith('ss')) {
    return {
      lemma: lower.slice(0, -1),
      original,
      inflection: 'third_person_s',
      fromTable: false,
      rule: '-s → stem',
      wordClass: 'verb',
    };
  }

  // Nominalization: -ness
  if (lower.endsWith('ness') && lower.length > 5) {
    return {
      lemma: lower.slice(0, -4),
      original,
      inflection: 'nominalization',
      fromTable: false,
      rule: '-ness → stem',
      wordClass: 'noun',
    };
  }

  // Adverbial: -ly
  if (lower.endsWith('ly') && lower.length > 3) {
    return {
      lemma: lower.slice(0, -2),
      original,
      inflection: 'adverbial',
      fromTable: false,
      rule: '-ly → stem',
      wordClass: 'adverb',
    };
  }

  // No rule applied — return as-is
  return {
    lemma: lower,
    original,
    inflection: 'base',
    fromTable: false,
    wordClass: 'unknown',
  };
}

/**
 * Strip a suffix, handling consonant doubling and -e insertion.
 */
function stripSuffix(word: string, suffix: string): string {
  const stem = word.slice(0, -suffix.length);

  // Handle consonant doubling: "thinned" → "thin", "trimmed" → "trim"
  if (stem.length >= 2) {
    const last = stem[stem.length - 1];
    const secondLast = stem[stem.length - 2];
    if (last === secondLast && last !== undefined && secondLast !== undefined && /[bcdfgklmnprstvz]/.test(last)) {
      return stem.slice(0, -1);
    }
  }

  // Handle -e deletion: "muted" → "mute", "fading" → "fade"
  // If stem ends in consonant and the word would normally have an -e
  if (stem.length >= 2) {
    const possibleWithE = stem + 'e';
    // Check if adding -e makes a more plausible word
    if (_verbLookup.has(possibleWithE) || _adjLookup.has(possibleWithE)) {
      return possibleWithE;
    }
  }

  return stem;
}

/**
 * Common -er words that are NOT comparatives.
 */
function isCommonErWord(word: string): boolean {
  const nonComparatives = new Set([
    'after', 'never', 'over', 'under', 'super', 'other',
    'either', 'neither', 'ever', 'however', 'whatever',
    'wherever', 'whenever', 'whether', 'together', 'butter',
    'water', 'matter', 'filter', 'trigger', 'mixer',
    'compressor', 'limiter', 'master', 'slider', 'fader',
    'speaker', 'player', 'layer', 'order', 'power',
    'number', 'finger', 'letter', 'chapter', 'center',
    'meter', 'counter', 'register', 'chamber', 'timber',
    'timber', 'member', 'remember', 'consider',
  ]);
  return nonComparatives.has(word);
}

/**
 * Common -est words that are NOT superlatives.
 */
function isCommonEstWord(word: string): boolean {
  const nonSuperlatives = new Set([
    'test', 'best', 'rest', 'nest', 'west', 'east',
    'chest', 'guest', 'quest', 'vest', 'fest', 'pest',
    'arrest', 'request', 'suggest', 'invest', 'interest',
    'protest', 'manifest', 'harvest', 'forest',
  ]);
  return nonSuperlatives.has(word);
}

// =============================================================================
// BATCH LEMMATIZATION
// =============================================================================

/**
 * Lemmatize all words in a list.
 */
export function lemmatizeAll(words: readonly string[]): readonly LemmaResult[] {
  return words.map(w => lemmatize(w));
}

// =============================================================================
// FORMATTING
// =============================================================================

/**
 * Format a lemma result for display.
 */
export function formatLemmaResult(result: LemmaResult): string {
  if (result.inflection === 'base') {
    return `"${result.original}" = base form`;
  }
  const source = result.fromTable ? 'table' : `rule: ${result.rule ?? 'unknown'}`;
  return `"${result.original}" → "${result.lemma}" (${result.inflection}, ${result.wordClass}, ${source})`;
}

// =============================================================================
// STATISTICS
// =============================================================================

export interface MorphologyStats {
  readonly totalDomainVerbs: number;
  readonly totalDomainAdjectives: number;
  readonly totalVerbForms: number;
  readonly totalAdjectiveForms: number;
}

export function getMorphologyStats(): MorphologyStats {
  return {
    totalDomainVerbs: DOMAIN_VERBS.length,
    totalDomainAdjectives: DOMAIN_ADJECTIVES.length,
    totalVerbForms: _verbLookup.size,
    totalAdjectiveForms: _adjLookup.size,
  };
}

// =============================================================================
// DECLARATIVE RULES
// =============================================================================

export const MORPHOLOGY_RULES = [
  'Rule MORPH-001: Domain verbs are lemmatized via the DOMAIN_VERBS table. ' +
  'All inflected forms (3rd person, past, progressive) map to the lemma.',

  'Rule MORPH-002: Domain adjectives are lemmatized via the DOMAIN_ADJECTIVES table. ' +
  'Comparative (-er) and superlative (-est) map to the base form.',

  'Rule MORPH-003: Nominalizations (brightness, warmth) are recognized and ' +
  'mapped back to the base adjective.',

  'Rule MORPH-004: The table-based approach takes priority over rule-based ' +
  'suffix stripping. Only unrecognized words fall through to rules.',

  'Rule MORPH-005: Rule-based lemmatization handles regular English morphology: ' +
  '-ing, -ed, -er, -est, -s, -es, -ness, -ly.',

  'Rule MORPH-006: Consonant doubling ("thinned" → "thin") and e-deletion ' +
  '("fading" → "fade") are handled during suffix stripping.',

  'Rule MORPH-007: Common -er words that are NOT comparatives ("filter", "mixer") ' +
  'are excluded from comparative analysis.',

  'Rule MORPH-008: Lemmatization preserves the original word; it only provides ' +
  'the lemma and inflection type as annotations.',

  'Rule MORPH-009: Multi-word comparatives ("more aggressive") are recognized ' +
  'in the adjective table but require upstream multi-word detection.',

  'Rule MORPH-010: The word class (verb, adjective, noun, adverb) is determined ' +
  'as part of lemmatization and can inform downstream parsing.',

  'Rule MORPH-011: Lemmatization is deterministic: the same input always ' +
  'produces the same lemma result.',

  'Rule MORPH-012: Extensions can add domain verbs and adjectives by ' +
  'registering entries in the lookup tables at runtime.',
] as const;
