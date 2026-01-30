/**
 * GOFAI NL Normalizer — Text Normalization Pipeline
 *
 * Implements a normalizer that canonicalizes whitespace, punctuation,
 * Unicode quotes, hyphenation, and common unit spellings. Operates
 * on the token stream produced by the span-preserving tokenizer.
 *
 * ## Normalization Phases
 *
 * 1. **Unicode normalization**: Smart quotes → ASCII, em dashes → hyphens
 * 2. **Whitespace normalization**: Collapse multiple spaces, trim
 * 3. **Punctuation normalization**: Standardize ellipses, dashes, etc.
 * 4. **Case normalization**: Lowercase (preserving original in span)
 * 5. **Hyphenation normalization**: "re-harmonize" → "reharmonize"
 * 6. **Unit spelling normalization**: "decibels" → "dB", "BPM" → "bpm"
 * 7. **Contraction expansion**: "don't" → "do not" (optional)
 * 8. **Abbreviation expansion**: "vox" → "vocals", "arp" → "arpeggio"
 *
 * ## Design
 *
 * Normalization produces a `NormalizedTokenStream` that preserves the
 * original spans while providing normalized text for downstream parsing.
 * Each normalization step is recorded so the UI can show what was changed.
 *
 * @module gofai/nl/tokenizer/normalizer
 * @see gofai_goalA.md Step 102
 */

import type { Token, TokenStream } from './span-tokenizer';

// =============================================================================
// NORMALIZED TOKEN — a token after normalization
// =============================================================================

/**
 * A normalized token with both original and normalized forms.
 */
export interface NormalizedToken {
  /** The underlying token */
  readonly token: Token;

  /** The normalized text */
  readonly normalizedText: string;

  /** Whether normalization changed the text */
  readonly wasNormalized: boolean;

  /** What normalizations were applied */
  readonly appliedRules: readonly NormalizationRule[];
}

/**
 * A normalization rule that was applied.
 */
export interface NormalizationRule {
  /** Rule name */
  readonly rule: string;

  /** What was changed */
  readonly from: string;

  /** What it was changed to */
  readonly to: string;

  /** The normalization category */
  readonly category: NormalizationCategory;
}

/**
 * Categories of normalization.
 */
export type NormalizationCategory =
  | 'unicode'         // Unicode character normalization
  | 'whitespace'      // Whitespace normalization
  | 'punctuation'     // Punctuation normalization
  | 'case'            // Case normalization
  | 'hyphenation'     // Hyphenation normalization
  | 'unit_spelling'   // Unit spelling normalization
  | 'contraction'     // Contraction expansion
  | 'abbreviation'    // Abbreviation expansion
  | 'spelling';       // Common spelling correction

// =============================================================================
// NORMALIZED TOKEN STREAM
// =============================================================================

/**
 * A token stream after normalization.
 */
export interface NormalizedTokenStream {
  /** The original token stream */
  readonly original: TokenStream;

  /** The normalized tokens */
  readonly tokens: readonly NormalizedToken[];

  /** Summary of normalizations applied */
  readonly summary: NormalizationSummary;
}

/**
 * Summary of normalizations applied to a token stream.
 */
export interface NormalizationSummary {
  /** Number of tokens that were normalized */
  readonly normalizedCount: number;

  /** Total number of rules applied */
  readonly totalRulesApplied: number;

  /** Rules applied by category */
  readonly byCategory: Readonly<Record<string, number>>;

  /** Whether any tokens were changed */
  readonly hasChanges: boolean;
}

// =============================================================================
// NORMALIZER CONFIGURATION
// =============================================================================

/**
 * Configuration for the normalizer.
 */
export interface NormalizerConfig {
  /** Whether to normalize Unicode characters */
  readonly normalizeUnicode: boolean;

  /** Whether to normalize whitespace */
  readonly normalizeWhitespace: boolean;

  /** Whether to normalize punctuation */
  readonly normalizePunctuation: boolean;

  /** Whether to normalize case (lowercase) */
  readonly normalizeCase: boolean;

  /** Whether to normalize hyphenation */
  readonly normalizeHyphenation: boolean;

  /** Whether to normalize unit spellings */
  readonly normalizeUnits: boolean;

  /** Whether to expand contractions */
  readonly expandContractions: boolean;

  /** Whether to expand abbreviations */
  readonly expandAbbreviations: boolean;

  /** Whether to correct common spelling errors */
  readonly correctSpelling: boolean;

  /** Additional unit mappings */
  readonly additionalUnitMappings: Readonly<Record<string, string>>;

  /** Additional abbreviation mappings */
  readonly additionalAbbreviations: Readonly<Record<string, string>>;
}

/**
 * Default normalizer configuration.
 */
export const DEFAULT_NORMALIZER_CONFIG: NormalizerConfig = {
  normalizeUnicode: true,
  normalizeWhitespace: true,
  normalizePunctuation: true,
  normalizeCase: true,
  normalizeHyphenation: true,
  normalizeUnits: true,
  expandContractions: false,  // Off by default — contractions are meaningful
  expandAbbreviations: true,
  correctSpelling: true,
  additionalUnitMappings: {},
  additionalAbbreviations: {},
};

// =============================================================================
// UNIT SPELLING MAPPINGS
// =============================================================================

/**
 * Canonical unit spellings.
 * Maps variant spellings to their canonical form.
 */
export const UNIT_SPELLING_MAP: Readonly<Record<string, string>> = {
  // Decibels
  'decibel': 'dB',
  'decibels': 'dB',
  'db': 'dB',
  'dbs': 'dB',

  // BPM
  'bpm': 'BPM',
  'beats per minute': 'BPM',
  'beats/min': 'BPM',
  'b.p.m.': 'BPM',
  'b.p.m': 'BPM',

  // Hertz
  'hz': 'Hz',
  'hertz': 'Hz',
  'khz': 'kHz',
  'kilohertz': 'kHz',
  'mhz': 'MHz',
  'megahertz': 'MHz',

  // Time
  'ms': 'ms',
  'msec': 'ms',
  'millisecond': 'ms',
  'milliseconds': 'ms',
  'sec': 's',
  'secs': 's',
  'second': 's',
  'seconds': 's',

  // Musical intervals
  'semitone': 'st',
  'semitones': 'st',
  'half step': 'st',
  'half steps': 'st',
  'half-step': 'st',
  'half-steps': 'st',
  'halfstep': 'st',
  'halfsteps': 'st',
  'whole step': 'wt',
  'whole steps': 'wt',
  'whole-step': 'wt',
  'whole-steps': 'wt',
  'octave': 'oct',
  'octaves': 'oct',
  'cent': 'cents',
  'ct': 'cents',

  // Musical time
  'bar': 'bars',
  'measure': 'bars',
  'measures': 'bars',
  'beat': 'beats',
  'tick': 'ticks',
  'tik': 'ticks',

  // Percentage
  'percent': '%',
  'pct': '%',
  'per cent': '%',

  // MIDI
  'midi': 'MIDI',
  'velocity': 'vel',
  'velocities': 'vel',
  'vel': 'vel',
};

// =============================================================================
// ABBREVIATION EXPANSION MAP
// =============================================================================

/**
 * Common abbreviations used in music production.
 * Maps abbreviations to their full canonical forms.
 */
export const ABBREVIATION_MAP: Readonly<Record<string, string>> = {
  // Instruments / tracks
  'vox': 'vocals',
  'vocs': 'vocals',
  'gtr': 'guitar',
  'git': 'guitar',
  'bss': 'bass',
  'drm': 'drums',
  'drms': 'drums',
  'kik': 'kick',
  'snr': 'snare',
  'hh': 'hi-hat',
  'hihat': 'hi-hat',
  'hi hat': 'hi-hat',
  'oh': 'overhead',
  'ovhd': 'overhead',
  'syn': 'synth',
  'synt': 'synth',
  'synths': 'synth',
  'kb': 'keyboard',
  'kbd': 'keyboard',
  'pno': 'piano',
  'str': 'strings',
  'strs': 'strings',
  'hrn': 'horn',
  'hrns': 'horns',
  'trp': 'trumpet',
  'sax': 'saxophone',
  'perc': 'percussion',
  'arp': 'arpeggio',
  'fx': 'effects',
  'sfx': 'effects',
  'bg': 'background',
  'bkg': 'background',
  'bgv': 'background vocals',
  'bv': 'background vocals',
  'ldv': 'lead vocals',
  'lv': 'lead vocals',

  // Effects
  'rev': 'reverb',
  'rvb': 'reverb',
  'dly': 'delay',
  'del': 'delay',
  'comp': 'compressor',
  'cmp': 'compressor',
  'lim': 'limiter',
  'eq': 'equalizer',
  'sat': 'saturation',
  'dist': 'distortion',
  'cho': 'chorus',
  'flng': 'flanger',
  'phs': 'phaser',
  'trem': 'tremolo',
  'wah': 'wah-wah',
  'env': 'envelope',
  'lfo': 'LFO',
  'osc': 'oscillator',
  'flt': 'filter',
  'lpf': 'low-pass filter',
  'hpf': 'high-pass filter',
  'bpf': 'band-pass filter',

  // Production terms
  'vol': 'volume',
  'lvl': 'level',
  'gain': 'gain',
  'pan': 'panning',
  'freq': 'frequency',
  'amp': 'amplitude',
  'att': 'attack',
  'atk': 'attack',
  'rel': 'release',
  'sus': 'sustain',
  'dec': 'decay',
  'dcy': 'decay',
  'thrs': 'threshold',
  'thresh': 'threshold',
  'rto': 'ratio',

  // Sections
  'v': 'verse',
  'vs': 'verse',
  'ch': 'chorus',
  'br': 'bridge',
  'pre': 'pre-chorus',
  'prechorus': 'pre-chorus',

  // Musical terms
  'maj': 'major',
  'min': 'minor',
  'dim': 'diminished',
  'aug': 'augmented',
  'sus2': 'suspended 2nd',
  'sus4': 'suspended 4th',
  'dom': 'dominant',
  'inv': 'inversion',
  'prog': 'progression',
  'seq': 'sequence',
  'quant': 'quantize',
  'vel': 'velocity',
};

// =============================================================================
// HYPHENATION NORMALIZATION
// =============================================================================

/**
 * Words that should be dehyphenated (merged).
 * Maps "re-harmonize" → "reharmonize", etc.
 */
export const DEHYPHENATION_PREFIXES: readonly string[] = [
  're',    // re-harmonize → reharmonize
  'un',    // un-mute → unmute
  'de',    // de-tune → detune
  'pre',   // pre-chorus → prechorus (but "pre-chorus" is also valid)
  'over',  // over-drive → overdrive
  'under', // under-cut → undercut
  'auto',  // auto-tune → autotune
  'sub',   // sub-bass → subbass
  'mid',   // mid-range → midrange
  'multi', // multi-track → multitrack
  'cross', // cross-fade → crossfade
  'down',  // down-mix → downmix
  'up',    // up-mix → upmix
  'out',   // out-phase → outphase
];

/**
 * Words that should keep their hyphens.
 */
export const KEEP_HYPHENATED = new Set([
  'hi-hat', 'hi-fi', 'lo-fi', 'low-pass', 'high-pass', 'band-pass',
  'all-pass', 'wah-wah', 'half-step', 'whole-step', 'time-stretch',
  'side-chain', 'pre-chorus', 'post-chorus', 'mid-range', 'low-end',
  'high-end', 'cross-fade', 'call-and-response', 'on-beat', 'off-beat',
  'pitch-shift', 'ring-mod', 'bit-crush', 'sample-rate',
]);

// =============================================================================
// COMMON SPELLING CORRECTIONS (music-specific)
// =============================================================================

/**
 * Common misspellings in music production context.
 */
export const SPELLING_CORRECTIONS: Readonly<Record<string, string>> = {
  'reverbe': 'reverb',
  'reveb': 'reverb',
  'rverb': 'reverb',
  'corus': 'chorus',
  'chrous': 'chorus',
  'choris': 'chorus',
  'verce': 'verse',
  'vers': 'verse',
  'brige': 'bridge',
  'brigde': 'bridge',
  'melod': 'melody',
  'melodie': 'melody',
  'harmonise': 'harmonize',
  'harmonisation': 'harmonization',
  'equaliser': 'equalizer',
  'equalisation': 'equalization',
  'synthesiser': 'synthesizer',
  'analyse': 'analyze',
  'colour': 'color',
  'favourite': 'favorite',
  'behaviour': 'behavior',
  'metre': 'meter',
  'centre': 'center',
  'tembre': 'timbre',
  'rythm': 'rhythm',
  'rythym': 'rhythm',
  'rhytm': 'rhythm',
  'rhythim': 'rhythm',
  'rhtyhm': 'rhythm',
  'arpeggo': 'arpeggio',
  'arpegio': 'arpeggio',
  'staccatto': 'staccato',
  'stacatto': 'staccato',
  'legatto': 'legato',
  'pizzacato': 'pizzicato',
  'cresendo': 'crescendo',
  'crescnedo': 'crescendo',
  'diminuendo': 'diminuendo',
  'glisando': 'glissando',
  'fortisimo': 'fortissimo',
  'pianisimo': 'pianissimo',
  'accoustic': 'acoustic',
  'acustic': 'acoustic',
  'sinusoid': 'sinusoidal',
  'frequncy': 'frequency',
  'freqency': 'frequency',
  'ampltude': 'amplitude',
  'aplitude': 'amplitude',
  'osscilator': 'oscillator',
  'oscilator': 'oscillator',
  'oscillater': 'oscillator',
  'envolope': 'envelope',
  'envelop': 'envelope',
  'envlope': 'envelope',
  'compresser': 'compressor',
  'compresion': 'compression',
  'distorsion': 'distortion',
  'distorshun': 'distortion',
  'modulaton': 'modulation',
  'modulaion': 'modulation',
  'transposing': 'transposing',
  'tranpose': 'transpose',
  'voiceing': 'voicing',
  'arrangment': 'arrangement',
  'arangement': 'arrangement',
  'instrament': 'instrument',
  'insturment': 'instrument',
  'tempoo': 'tempo',
  'temop': 'tempo',
};

// =============================================================================
// CONTRACTION EXPANSION
// =============================================================================

/**
 * Contractions and their expansions.
 */
export const CONTRACTION_MAP: Readonly<Record<string, string>> = {
  "don't": 'do not',
  "doesn't": 'does not',
  "didn't": 'did not',
  "won't": 'will not',
  "wouldn't": 'would not',
  "shouldn't": 'should not',
  "couldn't": 'could not',
  "can't": 'cannot',
  "isn't": 'is not',
  "aren't": 'are not',
  "wasn't": 'was not',
  "weren't": 'were not',
  "hasn't": 'has not',
  "haven't": 'have not',
  "hadn't": 'had not',
  "it's": 'it is',
  "that's": 'that is',
  "what's": 'what is',
  "there's": 'there is',
  "here's": 'here is',
  "let's": 'let us',
  "i'm": 'I am',
  "you're": 'you are',
  "we're": 'we are',
  "they're": 'they are',
  "i've": 'I have',
  "you've": 'you have',
  "we've": 'we have',
  "they've": 'they have',
  "i'll": 'I will',
  "you'll": 'you will',
  "we'll": 'we will',
  "they'll": 'they will',
  "i'd": 'I would',
  "you'd": 'you would',
  "we'd": 'we would',
  "they'd": 'they would',
};

// =============================================================================
// NORMALIZATION PIPELINE
// =============================================================================

/**
 * Normalize a token stream.
 */
export function normalizeTokenStream(
  stream: TokenStream,
  config: NormalizerConfig = DEFAULT_NORMALIZER_CONFIG,
): NormalizedTokenStream {
  const normalizedTokens: NormalizedToken[] = [];

  for (const token of stream.tokens) {
    const rules: NormalizationRule[] = [];
    let text = token.text;

    // 1. Case normalization (already lowercase from tokenizer, but ensure)
    if (config.normalizeCase && text !== text.toLowerCase()) {
      const from = text;
      text = text.toLowerCase();
      rules.push({ rule: 'case_lower', from, to: text, category: 'case' });
    }

    // 2. Unit spelling normalization
    if (config.normalizeUnits) {
      const unitNorm = UNIT_SPELLING_MAP[text] ?? config.additionalUnitMappings[text];
      if (unitNorm && unitNorm.toLowerCase() !== text) {
        const from = text;
        text = unitNorm.toLowerCase();
        rules.push({ rule: 'unit_spelling', from, to: text, category: 'unit_spelling' });
      }
    }

    // 3. Abbreviation expansion
    if (config.expandAbbreviations) {
      const abbr = ABBREVIATION_MAP[text] ?? config.additionalAbbreviations[text];
      if (abbr) {
        const from = text;
        text = abbr.toLowerCase();
        rules.push({ rule: 'abbreviation', from, to: text, category: 'abbreviation' });
      }
    }

    // 4. Contraction expansion
    if (config.expandContractions && token.type === 'contraction') {
      const expansion = CONTRACTION_MAP[text];
      if (expansion) {
        const from = text;
        text = expansion.toLowerCase();
        rules.push({ rule: 'contraction', from, to: text, category: 'contraction' });
      }
    }

    // 5. Hyphenation normalization
    if (config.normalizeHyphenation && text.includes('-')) {
      if (!KEEP_HYPHENATED.has(text)) {
        const dehyphenated = tryDehyphenate(text);
        if (dehyphenated !== text) {
          const from = text;
          text = dehyphenated;
          rules.push({ rule: 'dehyphenation', from, to: text, category: 'hyphenation' });
        }
      }
    }

    // 6. Spelling correction
    if (config.correctSpelling) {
      const corrected = SPELLING_CORRECTIONS[text];
      if (corrected) {
        const from = text;
        text = corrected.toLowerCase();
        rules.push({ rule: 'spelling', from, to: text, category: 'spelling' });
      }
    }

    normalizedTokens.push({
      token,
      normalizedText: text,
      wasNormalized: rules.length > 0,
      appliedRules: rules,
    });
  }

  // Build summary
  const byCategory: Record<string, number> = {};
  let totalRules = 0;
  let normalizedCount = 0;

  for (const nt of normalizedTokens) {
    if (nt.wasNormalized) normalizedCount++;
    for (const r of nt.appliedRules) {
      byCategory[r.category] = (byCategory[r.category] ?? 0) + 1;
      totalRules++;
    }
  }

  return {
    original: stream,
    tokens: normalizedTokens,
    summary: {
      normalizedCount,
      totalRulesApplied: totalRules,
      byCategory,
      hasChanges: normalizedCount > 0,
    },
  };
}

/**
 * Try to dehyphenate a word by removing the hyphen if the prefix is a known
 * dehyphenation prefix.
 */
function tryDehyphenate(word: string): string {
  const hyphenIdx = word.indexOf('-');
  if (hyphenIdx < 0) return word;

  const prefix = word.slice(0, hyphenIdx);
  if (DEHYPHENATION_PREFIXES.includes(prefix)) {
    return prefix + word.slice(hyphenIdx + 1);
  }

  return word;
}

// =============================================================================
// NORMALIZATION FOR RAW TEXT (before tokenization)
// =============================================================================

/**
 * Normalize raw text before tokenization.
 * This handles character-level normalization that should happen
 * before the tokenizer splits on boundaries.
 */
export function normalizeRawText(text: string): NormalizedRawText {
  const changes: RawTextChange[] = [];
  let result = text;

  // Unicode quote normalization
  const quoteNorm = result
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"');
  if (quoteNorm !== result) {
    changes.push({ category: 'unicode', description: 'Normalized Unicode quotes' });
    result = quoteNorm;
  }

  // Unicode dash normalization
  const dashNorm = result
    .replace(/[\u2013]/g, '-')   // en dash → hyphen
    .replace(/[\u2014]/g, ' - ') // em dash → spaced hyphen
    .replace(/[\u2015]/g, '-');  // horizontal bar → hyphen
  if (dashNorm !== result) {
    changes.push({ category: 'unicode', description: 'Normalized Unicode dashes' });
    result = dashNorm;
  }

  // Ellipsis normalization
  const ellipsisNorm = result.replace(/[\u2026]/g, '...');
  if (ellipsisNorm !== result) {
    changes.push({ category: 'unicode', description: 'Normalized ellipsis' });
    result = ellipsisNorm;
  }

  // Whitespace normalization: collapse multiple spaces
  const wsNorm = result.replace(/[ \t]+/g, ' ').trim();
  if (wsNorm !== result) {
    changes.push({ category: 'whitespace', description: 'Collapsed whitespace' });
    result = wsNorm;
  }

  // Normalize line breaks
  const lbNorm = result.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  if (lbNorm !== result) {
    changes.push({ category: 'whitespace', description: 'Normalized line breaks' });
    result = lbNorm;
  }

  return {
    original: text,
    normalized: result,
    changes,
    wasNormalized: changes.length > 0,
  };
}

export interface NormalizedRawText {
  readonly original: string;
  readonly normalized: string;
  readonly changes: readonly RawTextChange[];
  readonly wasNormalized: boolean;
}

export interface RawTextChange {
  readonly category: string;
  readonly description: string;
}

// =============================================================================
// FORMATTING
// =============================================================================

/**
 * Format a normalized token for debugging.
 */
export function formatNormalizedToken(nt: NormalizedToken): string {
  if (!nt.wasNormalized) {
    return `"${nt.token.original}" → (unchanged)`;
  }

  const rules = nt.appliedRules.map(r => `${r.rule}: "${r.from}" → "${r.to}"`).join('; ');
  return `"${nt.token.original}" → "${nt.normalizedText}" [${rules}]`;
}

/**
 * Format a normalization summary.
 */
export function formatNormalizationSummary(summary: NormalizationSummary): string {
  if (!summary.hasChanges) {
    return 'No normalizations applied.';
  }

  const cats = Object.entries(summary.byCategory)
    .map(([cat, count]) => `${cat}: ${count}`)
    .join(', ');

  return `${summary.normalizedCount} tokens normalized (${summary.totalRulesApplied} rules: ${cats})`;
}

// =============================================================================
// NORMALIZER STATISTICS
// =============================================================================

export interface NormalizerStats {
  readonly totalUnitMappings: number;
  readonly totalAbbreviations: number;
  readonly totalContractions: number;
  readonly totalSpellingCorrections: number;
  readonly totalDehyphenationPrefixes: number;
  readonly totalKeepHyphenated: number;
}

export function getNormalizerStats(): NormalizerStats {
  return {
    totalUnitMappings: Object.keys(UNIT_SPELLING_MAP).length,
    totalAbbreviations: Object.keys(ABBREVIATION_MAP).length,
    totalContractions: Object.keys(CONTRACTION_MAP).length,
    totalSpellingCorrections: Object.keys(SPELLING_CORRECTIONS).length,
    totalDehyphenationPrefixes: DEHYPHENATION_PREFIXES.length,
    totalKeepHyphenated: KEEP_HYPHENATED.size,
  };
}

// =============================================================================
// DECLARATIVE RULES
// =============================================================================

export const NORMALIZER_RULES = [
  'Rule NORM-001: Normalization never destroys information. The original text ' +
  'is always preserved in the token span.',

  'Rule NORM-002: Unicode smart quotes are normalized to ASCII equivalents. ' +
  'Em dashes become spaced hyphens; en dashes become plain hyphens.',

  'Rule NORM-003: Unit spellings are canonicalized to their standard abbreviation ' +
  '(e.g., "decibels" → "dB", "beats per minute" → "BPM").',

  'Rule NORM-004: Abbreviations are expanded to canonical forms ' +
  '(e.g., "vox" → "vocals", "gtr" → "guitar").',

  'Rule NORM-005: Hyphenated words with known prefixes ("re-", "un-", "de-") are ' +
  'dehyphenated unless they are in the KEEP_HYPHENATED set (e.g., "hi-hat").',

  'Rule NORM-006: Contraction expansion is OFF by default because contractions ' +
  'carry pragmatic information ("don\'t" implies negation strength).',

  'Rule NORM-007: Spelling corrections are limited to the SPELLING_CORRECTIONS table. ' +
  'No AI-based spelling correction is used.',

  'Rule NORM-008: Normalization changes are recorded as NormalizationRule entries ' +
  'so the UI can show what was changed and why.',

  'Rule NORM-009: Extensions can add custom unit mappings and abbreviations ' +
  'via the normalizer config.',

  'Rule NORM-010: Whitespace is collapsed but never removed entirely. ' +
  'Leading and trailing whitespace is trimmed.',

  'Rule NORM-011: Raw text normalization runs BEFORE tokenization. Token-level ' +
  'normalization runs AFTER tokenization.',

  'Rule NORM-012: Normalization is deterministic: the same input always produces ' +
  'the same normalized output.',
] as const;
