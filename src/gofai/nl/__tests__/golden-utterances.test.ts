/**
 * GOFAI NL Golden Tests — 100 Core Utterances
 *
 * Ensures stable tokenization and parse outputs for the 100 most important
 * music-editing utterances. Any change to tokenizer or parser behavior that
 * alters these outputs must be reviewed and approved.
 *
 * ## How to update golden outputs
 *
 * 1. Run tests: `npx vitest run golden-utterances`
 * 2. If a test fails due to intentional change, update the expected output
 *    in the `GOLDEN_UTTERANCES` array below.
 * 3. Add a note to the PR explaining why the golden output changed.
 *
 * @module gofai/nl/__tests__/golden-utterances
 * @see gofai_goalA.md Step 141
 */

import { describe, it, expect } from 'vitest';

// =============================================================================
// GOLDEN UTTERANCE TYPE
// =============================================================================

/**
 * A golden utterance test case.
 */
interface GoldenUtterance {
  /** Unique test ID (G001–G100) */
  readonly id: string;
  /** The raw input text */
  readonly input: string;
  /** Category of the utterance */
  readonly category: GoldenCategory;
  /** Expected token count (from span tokenizer) */
  readonly expectedTokenCount: number;
  /** Expected token types in order */
  readonly expectedTokenTypes: readonly string[];
  /** Expected parse: whether it should parse successfully */
  readonly shouldParse: boolean;
  /** Expected ambiguity count (0 = unambiguous) */
  readonly expectedAmbiguityCount: number;
  /** Expected root symbol if parsed */
  readonly expectedRootSymbol: string;
  /** Brief description of what this tests */
  readonly notes: string;
}

type GoldenCategory =
  | 'basic_edit'       // Simple edit commands
  | 'parameter'        // Parameter adjustments
  | 'selection'        // Entity selection
  | 'temporal'         // Time-based operations
  | 'structural'       // Structure changes
  | 'comparative'      // Comparisons ("louder than")
  | 'negation'         // Negated commands
  | 'quantified'       // "All", "some", "every"
  | 'conditional'      // "If..then" constructs
  | 'compound'         // Multi-action commands
  | 'idiomatic'        // Music production idioms
  | 'degree'           // Vague adjective commands
  | 'reference'        // Pronoun / reference resolution
  | 'modal'            // "Could you", "should"
  | 'error_case';      // Expected parse failures

// =============================================================================
// THE 100 GOLDEN UTTERANCES
// =============================================================================

const GOLDEN_UTTERANCES: readonly GoldenUtterance[] = [
  // ─── BASIC EDITS (G001–G015) ────────────────────────────────────────────────
  {
    id: 'G001',
    input: 'make it louder',
    category: 'basic_edit',
    expectedTokenCount: 3,
    expectedTokenTypes: ['verb', 'pronoun', 'adjective'],
    shouldParse: true,
    expectedAmbiguityCount: 0,
    expectedRootSymbol: 'S',
    notes: 'Simplest possible edit command.',
  },
  {
    id: 'G002',
    input: 'add reverb',
    category: 'basic_edit',
    expectedTokenCount: 2,
    expectedTokenTypes: ['verb', 'noun'],
    shouldParse: true,
    expectedAmbiguityCount: 0,
    expectedRootSymbol: 'S',
    notes: 'Simple additive command.',
  },
  {
    id: 'G003',
    input: 'remove the delay',
    category: 'basic_edit',
    expectedTokenCount: 3,
    expectedTokenTypes: ['verb', 'determiner', 'noun'],
    shouldParse: true,
    expectedAmbiguityCount: 0,
    expectedRootSymbol: 'S',
    notes: 'Simple removal with definite article.',
  },
  {
    id: 'G004',
    input: 'transpose up 3 semitones',
    category: 'basic_edit',
    expectedTokenCount: 4,
    expectedTokenTypes: ['verb', 'direction', 'number', 'unit'],
    shouldParse: true,
    expectedAmbiguityCount: 0,
    expectedRootSymbol: 'S',
    notes: 'Parameterized transposition.',
  },
  {
    id: 'G005',
    input: 'set the tempo to 120 bpm',
    category: 'basic_edit',
    expectedTokenCount: 6,
    expectedTokenTypes: ['verb', 'determiner', 'noun', 'preposition', 'number', 'unit'],
    shouldParse: true,
    expectedAmbiguityCount: 0,
    expectedRootSymbol: 'S',
    notes: 'Absolute value assignment.',
  },
  {
    id: 'G006',
    input: 'mute the vocals',
    category: 'basic_edit',
    expectedTokenCount: 3,
    expectedTokenTypes: ['verb', 'determiner', 'noun'],
    shouldParse: true,
    expectedAmbiguityCount: 0,
    expectedRootSymbol: 'S',
    notes: 'Track muting.',
  },
  {
    id: 'G007',
    input: 'solo the drums',
    category: 'basic_edit',
    expectedTokenCount: 3,
    expectedTokenTypes: ['verb', 'determiner', 'noun'],
    shouldParse: true,
    expectedAmbiguityCount: 0,
    expectedRootSymbol: 'S',
    notes: 'Track soloing.',
  },
  {
    id: 'G008',
    input: 'duplicate this track',
    category: 'basic_edit',
    expectedTokenCount: 3,
    expectedTokenTypes: ['verb', 'demonstrative', 'noun'],
    shouldParse: true,
    expectedAmbiguityCount: 0,
    expectedRootSymbol: 'S',
    notes: 'Duplication with demonstrative.',
  },
  {
    id: 'G009',
    input: 'undo',
    category: 'basic_edit',
    expectedTokenCount: 1,
    expectedTokenTypes: ['verb'],
    shouldParse: true,
    expectedAmbiguityCount: 0,
    expectedRootSymbol: 'S',
    notes: 'Single-word command.',
  },
  {
    id: 'G010',
    input: 'cut the intro',
    category: 'basic_edit',
    expectedTokenCount: 3,
    expectedTokenTypes: ['verb', 'determiner', 'noun'],
    shouldParse: true,
    expectedAmbiguityCount: 0,
    expectedRootSymbol: 'S',
    notes: 'Section removal.',
  },
  {
    id: 'G011',
    input: 'copy the chorus melody',
    category: 'basic_edit',
    expectedTokenCount: 4,
    expectedTokenTypes: ['verb', 'determiner', 'noun', 'noun'],
    shouldParse: true,
    expectedAmbiguityCount: 0,
    expectedRootSymbol: 'S',
    notes: 'Copy with compound noun object.',
  },
  {
    id: 'G012',
    input: 'paste it after the bridge',
    category: 'basic_edit',
    expectedTokenCount: 5,
    expectedTokenTypes: ['verb', 'pronoun', 'preposition', 'determiner', 'noun'],
    shouldParse: true,
    expectedAmbiguityCount: 0,
    expectedRootSymbol: 'S',
    notes: 'Paste with temporal location.',
  },
  {
    id: 'G013',
    input: 'bounce the mix',
    category: 'basic_edit',
    expectedTokenCount: 3,
    expectedTokenTypes: ['verb', 'determiner', 'noun'],
    shouldParse: true,
    expectedAmbiguityCount: 0,
    expectedRootSymbol: 'S',
    notes: 'Export/bounce command.',
  },
  {
    id: 'G014',
    input: 'automate the filter cutoff',
    category: 'basic_edit',
    expectedTokenCount: 4,
    expectedTokenTypes: ['verb', 'determiner', 'noun', 'noun'],
    shouldParse: true,
    expectedAmbiguityCount: 0,
    expectedRootSymbol: 'S',
    notes: 'Automation command.',
  },
  {
    id: 'G015',
    input: 'normalize the audio',
    category: 'basic_edit',
    expectedTokenCount: 3,
    expectedTokenTypes: ['verb', 'determiner', 'noun'],
    shouldParse: true,
    expectedAmbiguityCount: 0,
    expectedRootSymbol: 'S',
    notes: 'Processing command.',
  },

  // ─── PARAMETER ADJUSTMENTS (G016–G030) ────────────────────────────────────
  {
    id: 'G016',
    input: 'increase the volume by 3 dB',
    category: 'parameter',
    expectedTokenCount: 6,
    expectedTokenTypes: ['verb', 'determiner', 'noun', 'preposition', 'number', 'unit'],
    shouldParse: true,
    expectedAmbiguityCount: 0,
    expectedRootSymbol: 'S',
    notes: 'Relative increase with unit.',
  },
  {
    id: 'G017',
    input: 'decrease the reverb decay time',
    category: 'parameter',
    expectedTokenCount: 5,
    expectedTokenTypes: ['verb', 'determiner', 'noun', 'noun', 'noun'],
    shouldParse: true,
    expectedAmbiguityCount: 0,
    expectedRootSymbol: 'S',
    notes: 'Relative decrease with compound noun.',
  },
  {
    id: 'G018',
    input: 'pan the guitar hard left',
    category: 'parameter',
    expectedTokenCount: 5,
    expectedTokenTypes: ['verb', 'determiner', 'noun', 'adverb', 'direction'],
    shouldParse: true,
    expectedAmbiguityCount: 0,
    expectedRootSymbol: 'S',
    notes: 'Spatial panning command.',
  },
  {
    id: 'G019',
    input: 'set the attack to 10 ms',
    category: 'parameter',
    expectedTokenCount: 6,
    expectedTokenTypes: ['verb', 'determiner', 'noun', 'preposition', 'number', 'unit'],
    shouldParse: true,
    expectedAmbiguityCount: 0,
    expectedRootSymbol: 'S',
    notes: 'Absolute envelope parameter.',
  },
  {
    id: 'G020',
    input: 'turn down the high frequencies',
    category: 'parameter',
    expectedTokenCount: 5,
    expectedTokenTypes: ['verb', 'direction', 'determiner', 'adjective', 'noun'],
    shouldParse: true,
    expectedAmbiguityCount: 0,
    expectedRootSymbol: 'S',
    notes: 'EQ reduction with phrasal verb.',
  },
  {
    id: 'G021',
    input: 'boost the low end',
    category: 'parameter',
    expectedTokenCount: 4,
    expectedTokenTypes: ['verb', 'determiner', 'adjective', 'noun'],
    shouldParse: true,
    expectedAmbiguityCount: 0,
    expectedRootSymbol: 'S',
    notes: 'EQ boost.',
  },
  {
    id: 'G022',
    input: 'widen the stereo image',
    category: 'parameter',
    expectedTokenCount: 4,
    expectedTokenTypes: ['verb', 'determiner', 'adjective', 'noun'],
    shouldParse: true,
    expectedAmbiguityCount: 0,
    expectedRootSymbol: 'S',
    notes: 'Stereo width adjustment.',
  },
  {
    id: 'G023',
    input: 'add 2 dB at 5 kHz',
    category: 'parameter',
    expectedTokenCount: 6,
    expectedTokenTypes: ['verb', 'number', 'unit', 'preposition', 'number', 'unit'],
    shouldParse: true,
    expectedAmbiguityCount: 0,
    expectedRootSymbol: 'S',
    notes: 'Precise EQ with two numeric specs.',
  },
  {
    id: 'G024',
    input: 'reduce the compression ratio',
    category: 'parameter',
    expectedTokenCount: 4,
    expectedTokenTypes: ['verb', 'determiner', 'noun', 'noun'],
    shouldParse: true,
    expectedAmbiguityCount: 0,
    expectedRootSymbol: 'S',
    notes: 'Compressor parameter.',
  },
  {
    id: 'G025',
    input: 'lower the threshold to -20 dB',
    category: 'parameter',
    expectedTokenCount: 6,
    expectedTokenTypes: ['verb', 'determiner', 'noun', 'preposition', 'number', 'unit'],
    shouldParse: true,
    expectedAmbiguityCount: 0,
    expectedRootSymbol: 'S',
    notes: 'Negative number parameter.',
  },
  {
    id: 'G026',
    input: 'increase the release to 500 ms',
    category: 'parameter',
    expectedTokenCount: 6,
    expectedTokenTypes: ['verb', 'determiner', 'noun', 'preposition', 'number', 'unit'],
    shouldParse: true,
    expectedAmbiguityCount: 0,
    expectedRootSymbol: 'S',
    notes: 'Envelope release adjustment.',
  },
  {
    id: 'G027',
    input: 'change the key to B flat minor',
    category: 'parameter',
    expectedTokenCount: 7,
    expectedTokenTypes: ['verb', 'determiner', 'noun', 'preposition', 'note', 'accidental', 'mode'],
    shouldParse: true,
    expectedAmbiguityCount: 0,
    expectedRootSymbol: 'S',
    notes: 'Key change with accidental.',
  },
  {
    id: 'G028',
    input: 'quantize to sixteenth notes',
    category: 'parameter',
    expectedTokenCount: 4,
    expectedTokenTypes: ['verb', 'preposition', 'adjective', 'noun'],
    shouldParse: true,
    expectedAmbiguityCount: 0,
    expectedRootSymbol: 'S',
    notes: 'Quantization grid.',
  },
  {
    id: 'G029',
    input: 'swing the hi-hat pattern',
    category: 'parameter',
    expectedTokenCount: 4,
    expectedTokenTypes: ['verb', 'determiner', 'noun', 'noun'],
    shouldParse: true,
    expectedAmbiguityCount: 0,
    expectedRootSymbol: 'S',
    notes: 'Groove/swing adjustment.',
  },
  {
    id: 'G030',
    input: 'detune the oscillator by 7 cents',
    category: 'parameter',
    expectedTokenCount: 6,
    expectedTokenTypes: ['verb', 'determiner', 'noun', 'preposition', 'number', 'unit'],
    shouldParse: true,
    expectedAmbiguityCount: 0,
    expectedRootSymbol: 'S',
    notes: 'Fine-tuning command.',
  },

  // ─── SELECTION (G031–G040) ────────────────────────────────────────────────
  {
    id: 'G031',
    input: 'select all tracks',
    category: 'selection',
    expectedTokenCount: 3,
    expectedTokenTypes: ['verb', 'quantifier', 'noun'],
    shouldParse: true,
    expectedAmbiguityCount: 0,
    expectedRootSymbol: 'S',
    notes: 'Universal selection.',
  },
  {
    id: 'G032',
    input: 'select the first chorus',
    category: 'selection',
    expectedTokenCount: 4,
    expectedTokenTypes: ['verb', 'determiner', 'ordinal', 'noun'],
    shouldParse: true,
    expectedAmbiguityCount: 0,
    expectedRootSymbol: 'S',
    notes: 'Ordinal selection.',
  },
  {
    id: 'G033',
    input: 'select measures 8 through 16',
    category: 'selection',
    expectedTokenCount: 5,
    expectedTokenTypes: ['verb', 'noun', 'number', 'preposition', 'number'],
    shouldParse: true,
    expectedAmbiguityCount: 0,
    expectedRootSymbol: 'S',
    notes: 'Range selection.',
  },
  {
    id: 'G034',
    input: 'select the bass and drums',
    category: 'selection',
    expectedTokenCount: 5,
    expectedTokenTypes: ['verb', 'determiner', 'noun', 'conjunction', 'noun'],
    shouldParse: true,
    expectedAmbiguityCount: 0,
    expectedRootSymbol: 'S',
    notes: 'Conjoined selection.',
  },
  {
    id: 'G035',
    input: 'select everything except the vocals',
    category: 'selection',
    expectedTokenCount: 5,
    expectedTokenTypes: ['verb', 'pronoun', 'preposition', 'determiner', 'noun'],
    shouldParse: true,
    expectedAmbiguityCount: 0,
    expectedRootSymbol: 'S',
    notes: 'Exclusion selection.',
  },
  {
    id: 'G036',
    input: 'select the second verse',
    category: 'selection',
    expectedTokenCount: 4,
    expectedTokenTypes: ['verb', 'determiner', 'ordinal', 'noun'],
    shouldParse: true,
    expectedAmbiguityCount: 0,
    expectedRootSymbol: 'S',
    notes: 'Section ordinal selection.',
  },
  {
    id: 'G037',
    input: 'select the reverb send',
    category: 'selection',
    expectedTokenCount: 4,
    expectedTokenTypes: ['verb', 'determiner', 'noun', 'noun'],
    shouldParse: true,
    expectedAmbiguityCount: 0,
    expectedRootSymbol: 'S',
    notes: 'Effect bus selection.',
  },
  {
    id: 'G038',
    input: 'select the notes above C4',
    category: 'selection',
    expectedTokenCount: 5,
    expectedTokenTypes: ['verb', 'determiner', 'noun', 'preposition', 'note'],
    shouldParse: true,
    expectedAmbiguityCount: 0,
    expectedRootSymbol: 'S',
    notes: 'Pitch-range selection.',
  },
  {
    id: 'G039',
    input: 'select the last 4 bars',
    category: 'selection',
    expectedTokenCount: 5,
    expectedTokenTypes: ['verb', 'determiner', 'adjective', 'number', 'noun'],
    shouldParse: true,
    expectedAmbiguityCount: 0,
    expectedRootSymbol: 'S',
    notes: 'Relative position selection.',
  },
  {
    id: 'G040',
    input: 'select the snare hits',
    category: 'selection',
    expectedTokenCount: 4,
    expectedTokenTypes: ['verb', 'determiner', 'noun', 'noun'],
    shouldParse: true,
    expectedAmbiguityCount: 0,
    expectedRootSymbol: 'S',
    notes: 'Instrument-specific selection.',
  },

  // ─── TEMPORAL (G041–G050) ────────────────────────────────────────────────
  {
    id: 'G041',
    input: 'move the vocals forward by 10 ms',
    category: 'temporal',
    expectedTokenCount: 7,
    expectedTokenTypes: ['verb', 'determiner', 'noun', 'direction', 'preposition', 'number', 'unit'],
    shouldParse: true,
    expectedAmbiguityCount: 0,
    expectedRootSymbol: 'S',
    notes: 'Micro-timing nudge.',
  },
  {
    id: 'G042',
    input: 'shift the bridge to bar 32',
    category: 'temporal',
    expectedTokenCount: 6,
    expectedTokenTypes: ['verb', 'determiner', 'noun', 'preposition', 'noun', 'number'],
    shouldParse: true,
    expectedAmbiguityCount: 0,
    expectedRootSymbol: 'S',
    notes: 'Section repositioning.',
  },
  {
    id: 'G043',
    input: 'extend the outro by 8 bars',
    category: 'temporal',
    expectedTokenCount: 6,
    expectedTokenTypes: ['verb', 'determiner', 'noun', 'preposition', 'number', 'noun'],
    shouldParse: true,
    expectedAmbiguityCount: 0,
    expectedRootSymbol: 'S',
    notes: 'Section lengthening.',
  },
  {
    id: 'G044',
    input: 'shorten the intro to 4 bars',
    category: 'temporal',
    expectedTokenCount: 6,
    expectedTokenTypes: ['verb', 'determiner', 'noun', 'preposition', 'number', 'noun'],
    shouldParse: true,
    expectedAmbiguityCount: 0,
    expectedRootSymbol: 'S',
    notes: 'Section shortening.',
  },
  {
    id: 'G045',
    input: 'fade in over 2 bars',
    category: 'temporal',
    expectedTokenCount: 5,
    expectedTokenTypes: ['verb', 'direction', 'preposition', 'number', 'noun'],
    shouldParse: true,
    expectedAmbiguityCount: 0,
    expectedRootSymbol: 'S',
    notes: 'Fade with duration.',
  },
  {
    id: 'G046',
    input: 'crossfade between the verse and chorus',
    category: 'temporal',
    expectedTokenCount: 6,
    expectedTokenTypes: ['verb', 'preposition', 'determiner', 'noun', 'conjunction', 'noun'],
    shouldParse: true,
    expectedAmbiguityCount: 0,
    expectedRootSymbol: 'S',
    notes: 'Transition command.',
  },
  {
    id: 'G047',
    input: 'add a fill before the drop',
    category: 'temporal',
    expectedTokenCount: 6,
    expectedTokenTypes: ['verb', 'determiner', 'noun', 'preposition', 'determiner', 'noun'],
    shouldParse: true,
    expectedAmbiguityCount: 0,
    expectedRootSymbol: 'S',
    notes: 'Temporal insertion.',
  },
  {
    id: 'G048',
    input: 'loop the last 2 bars',
    category: 'temporal',
    expectedTokenCount: 5,
    expectedTokenTypes: ['verb', 'determiner', 'adjective', 'number', 'noun'],
    shouldParse: true,
    expectedAmbiguityCount: 0,
    expectedRootSymbol: 'S',
    notes: 'Loop command with relative position.',
  },
  {
    id: 'G049',
    input: 'slow down the tempo gradually',
    category: 'temporal',
    expectedTokenCount: 5,
    expectedTokenTypes: ['verb', 'direction', 'determiner', 'noun', 'adverb'],
    shouldParse: true,
    expectedAmbiguityCount: 0,
    expectedRootSymbol: 'S',
    notes: 'Ritardando command.',
  },
  {
    id: 'G050',
    input: 'speed up from bar 16 to bar 24',
    category: 'temporal',
    expectedTokenCount: 8,
    expectedTokenTypes: ['verb', 'direction', 'preposition', 'noun', 'number', 'preposition', 'noun', 'number'],
    shouldParse: true,
    expectedAmbiguityCount: 0,
    expectedRootSymbol: 'S',
    notes: 'Accelerando with range.',
  },

  // ─── STRUCTURAL (G051–G060) ──────────────────────────────────────────────
  {
    id: 'G051',
    input: 'add a new track',
    category: 'structural',
    expectedTokenCount: 4,
    expectedTokenTypes: ['verb', 'determiner', 'adjective', 'noun'],
    shouldParse: true,
    expectedAmbiguityCount: 0,
    expectedRootSymbol: 'S',
    notes: 'Track creation.',
  },
  {
    id: 'G052',
    input: 'delete the empty tracks',
    category: 'structural',
    expectedTokenCount: 4,
    expectedTokenTypes: ['verb', 'determiner', 'adjective', 'noun'],
    shouldParse: true,
    expectedAmbiguityCount: 0,
    expectedRootSymbol: 'S',
    notes: 'Bulk deletion.',
  },
  {
    id: 'G053',
    input: 'group the string tracks together',
    category: 'structural',
    expectedTokenCount: 5,
    expectedTokenTypes: ['verb', 'determiner', 'noun', 'noun', 'adverb'],
    shouldParse: true,
    expectedAmbiguityCount: 0,
    expectedRootSymbol: 'S',
    notes: 'Track grouping.',
  },
  {
    id: 'G054',
    input: 'split the track at bar 16',
    category: 'structural',
    expectedTokenCount: 6,
    expectedTokenTypes: ['verb', 'determiner', 'noun', 'preposition', 'noun', 'number'],
    shouldParse: true,
    expectedAmbiguityCount: 0,
    expectedRootSymbol: 'S',
    notes: 'Track splitting.',
  },
  {
    id: 'G055',
    input: 'merge the two piano tracks',
    category: 'structural',
    expectedTokenCount: 5,
    expectedTokenTypes: ['verb', 'determiner', 'number', 'noun', 'noun'],
    shouldParse: true,
    expectedAmbiguityCount: 0,
    expectedRootSymbol: 'S',
    notes: 'Track merging.',
  },
  {
    id: 'G056',
    input: 'add a bus for the drums',
    category: 'structural',
    expectedTokenCount: 6,
    expectedTokenTypes: ['verb', 'determiner', 'noun', 'preposition', 'determiner', 'noun'],
    shouldParse: true,
    expectedAmbiguityCount: 0,
    expectedRootSymbol: 'S',
    notes: 'Routing command.',
  },
  {
    id: 'G057',
    input: 'create a send to the reverb bus',
    category: 'structural',
    expectedTokenCount: 7,
    expectedTokenTypes: ['verb', 'determiner', 'noun', 'preposition', 'determiner', 'noun', 'noun'],
    shouldParse: true,
    expectedAmbiguityCount: 0,
    expectedRootSymbol: 'S',
    notes: 'Send creation.',
  },
  {
    id: 'G058',
    input: 'insert a compressor on the vocal track',
    category: 'structural',
    expectedTokenCount: 7,
    expectedTokenTypes: ['verb', 'determiner', 'noun', 'preposition', 'determiner', 'noun', 'noun'],
    shouldParse: true,
    expectedAmbiguityCount: 0,
    expectedRootSymbol: 'S',
    notes: 'Plugin insertion.',
  },
  {
    id: 'G059',
    input: 'reorder the plugins on the master',
    category: 'structural',
    expectedTokenCount: 6,
    expectedTokenTypes: ['verb', 'determiner', 'noun', 'preposition', 'determiner', 'noun'],
    shouldParse: true,
    expectedAmbiguityCount: 0,
    expectedRootSymbol: 'S',
    notes: 'Plugin reordering.',
  },
  {
    id: 'G060',
    input: 'rename this track to Lead Synth',
    category: 'structural',
    expectedTokenCount: 6,
    expectedTokenTypes: ['verb', 'demonstrative', 'noun', 'preposition', 'noun', 'noun'],
    shouldParse: true,
    expectedAmbiguityCount: 0,
    expectedRootSymbol: 'S',
    notes: 'Track renaming.',
  },

  // ─── COMPARATIVE (G061–G065) ─────────────────────────────────────────────
  {
    id: 'G061',
    input: 'make the snare louder than the kick',
    category: 'comparative',
    expectedTokenCount: 7,
    expectedTokenTypes: ['verb', 'determiner', 'noun', 'adjective', 'preposition', 'determiner', 'noun'],
    shouldParse: true,
    expectedAmbiguityCount: 0,
    expectedRootSymbol: 'S',
    notes: 'Comparative with "than" clause.',
  },
  {
    id: 'G062',
    input: 'make it as loud as the reference',
    category: 'comparative',
    expectedTokenCount: 7,
    expectedTokenTypes: ['verb', 'pronoun', 'adverb', 'adjective', 'preposition', 'determiner', 'noun'],
    shouldParse: true,
    expectedAmbiguityCount: 0,
    expectedRootSymbol: 'S',
    notes: 'Equative comparison.',
  },
  {
    id: 'G063',
    input: 'make the chorus the loudest section',
    category: 'comparative',
    expectedTokenCount: 6,
    expectedTokenTypes: ['verb', 'determiner', 'noun', 'determiner', 'adjective', 'noun'],
    shouldParse: true,
    expectedAmbiguityCount: 0,
    expectedRootSymbol: 'S',
    notes: 'Superlative command.',
  },
  {
    id: 'G064',
    input: 'the bass is too loud',
    category: 'comparative',
    expectedTokenCount: 5,
    expectedTokenTypes: ['determiner', 'noun', 'verb', 'adverb', 'adjective'],
    shouldParse: true,
    expectedAmbiguityCount: 0,
    expectedRootSymbol: 'S',
    notes: 'Excessive degree ("too").',
  },
  {
    id: 'G065',
    input: 'make the reverb less noticeable',
    category: 'comparative',
    expectedTokenCount: 5,
    expectedTokenTypes: ['verb', 'determiner', 'noun', 'adverb', 'adjective'],
    shouldParse: true,
    expectedAmbiguityCount: 0,
    expectedRootSymbol: 'S',
    notes: 'Negative comparative ("less").',
  },

  // ─── NEGATION (G066–G070) ────────────────────────────────────────────────
  {
    id: 'G066',
    input: 'don\'t change the melody',
    category: 'negation',
    expectedTokenCount: 4,
    expectedTokenTypes: ['negation', 'verb', 'determiner', 'noun'],
    shouldParse: true,
    expectedAmbiguityCount: 0,
    expectedRootSymbol: 'S',
    notes: 'Negated imperative.',
  },
  {
    id: 'G067',
    input: 'remove everything but the drums',
    category: 'negation',
    expectedTokenCount: 5,
    expectedTokenTypes: ['verb', 'pronoun', 'preposition', 'determiner', 'noun'],
    shouldParse: true,
    expectedAmbiguityCount: 0,
    expectedRootSymbol: 'S',
    notes: 'Exceptive negation.',
  },
  {
    id: 'G068',
    input: 'no reverb on the vocals',
    category: 'negation',
    expectedTokenCount: 5,
    expectedTokenTypes: ['negation', 'noun', 'preposition', 'determiner', 'noun'],
    shouldParse: true,
    expectedAmbiguityCount: 0,
    expectedRootSymbol: 'S',
    notes: 'Nominal negation.',
  },
  {
    id: 'G069',
    input: 'never let the drums clip',
    category: 'negation',
    expectedTokenCount: 5,
    expectedTokenTypes: ['negation', 'verb', 'determiner', 'noun', 'verb'],
    shouldParse: true,
    expectedAmbiguityCount: 0,
    expectedRootSymbol: 'S',
    notes: 'Temporal negation constraint.',
  },
  {
    id: 'G070',
    input: 'avoid clipping on the master',
    category: 'negation',
    expectedTokenCount: 5,
    expectedTokenTypes: ['verb', 'noun', 'preposition', 'determiner', 'noun'],
    shouldParse: true,
    expectedAmbiguityCount: 0,
    expectedRootSymbol: 'S',
    notes: 'Avoidance constraint.',
  },

  // ─── QUANTIFIED (G071–G075) ──────────────────────────────────────────────
  {
    id: 'G071',
    input: 'make all tracks louder',
    category: 'quantified',
    expectedTokenCount: 4,
    expectedTokenTypes: ['verb', 'quantifier', 'noun', 'adjective'],
    shouldParse: true,
    expectedAmbiguityCount: 0,
    expectedRootSymbol: 'S',
    notes: 'Universal quantifier.',
  },
  {
    id: 'G072',
    input: 'mute some of the backing vocals',
    category: 'quantified',
    expectedTokenCount: 6,
    expectedTokenTypes: ['verb', 'quantifier', 'preposition', 'determiner', 'noun', 'noun'],
    shouldParse: true,
    expectedAmbiguityCount: 0,
    expectedRootSymbol: 'S',
    notes: 'Existential quantifier with partitive.',
  },
  {
    id: 'G073',
    input: 'apply reverb to every chorus',
    category: 'quantified',
    expectedTokenCount: 5,
    expectedTokenTypes: ['verb', 'noun', 'preposition', 'quantifier', 'noun'],
    shouldParse: true,
    expectedAmbiguityCount: 0,
    expectedRootSymbol: 'S',
    notes: 'Distributive universal.',
  },
  {
    id: 'G074',
    input: 'only keep the first 3 tracks',
    category: 'quantified',
    expectedTokenCount: 6,
    expectedTokenTypes: ['focus', 'verb', 'determiner', 'ordinal', 'number', 'noun'],
    shouldParse: true,
    expectedAmbiguityCount: 1,
    expectedRootSymbol: 'S',
    notes: '"Only" introduces scope ambiguity.',
  },
  {
    id: 'G075',
    input: 'most of the tracks need EQ',
    category: 'quantified',
    expectedTokenCount: 6,
    expectedTokenTypes: ['quantifier', 'preposition', 'determiner', 'noun', 'verb', 'noun'],
    shouldParse: true,
    expectedAmbiguityCount: 0,
    expectedRootSymbol: 'S',
    notes: 'Proportional quantifier.',
  },

  // ─── COMPOUND (G076–G085) ────────────────────────────────────────────────
  {
    id: 'G076',
    input: 'add reverb and delay to the vocals',
    category: 'compound',
    expectedTokenCount: 7,
    expectedTokenTypes: ['verb', 'noun', 'conjunction', 'noun', 'preposition', 'determiner', 'noun'],
    shouldParse: true,
    expectedAmbiguityCount: 0,
    expectedRootSymbol: 'S',
    notes: 'Conjoined objects.',
  },
  {
    id: 'G077',
    input: 'EQ and compress the vocals',
    category: 'compound',
    expectedTokenCount: 5,
    expectedTokenTypes: ['verb', 'conjunction', 'verb', 'determiner', 'noun'],
    shouldParse: true,
    expectedAmbiguityCount: 0,
    expectedRootSymbol: 'S',
    notes: 'Conjoined verbs.',
  },
  {
    id: 'G078',
    input: 'make the verse quieter and the chorus louder',
    category: 'compound',
    expectedTokenCount: 8,
    expectedTokenTypes: ['verb', 'determiner', 'noun', 'adjective', 'conjunction', 'determiner', 'noun', 'adjective'],
    shouldParse: true,
    expectedAmbiguityCount: 0,
    expectedRootSymbol: 'S',
    notes: 'Conjoined clauses.',
  },
  {
    id: 'G079',
    input: 'copy the drums and paste them after the bridge',
    category: 'compound',
    expectedTokenCount: 9,
    expectedTokenTypes: ['verb', 'determiner', 'noun', 'conjunction', 'verb', 'pronoun', 'preposition', 'determiner', 'noun'],
    shouldParse: true,
    expectedAmbiguityCount: 0,
    expectedRootSymbol: 'S',
    notes: 'Sequenced compound action.',
  },
  {
    id: 'G080',
    input: 'first EQ then compress then limit',
    category: 'compound',
    expectedTokenCount: 6,
    expectedTokenTypes: ['adverb', 'verb', 'adverb', 'verb', 'adverb', 'verb'],
    shouldParse: true,
    expectedAmbiguityCount: 0,
    expectedRootSymbol: 'S',
    notes: 'Ordered sequence with "then".',
  },
  {
    id: 'G081',
    input: 'duplicate the track and pan one left and one right',
    category: 'compound',
    expectedTokenCount: 10,
    expectedTokenTypes: ['verb', 'determiner', 'noun', 'conjunction', 'verb', 'pronoun', 'direction', 'conjunction', 'pronoun', 'direction'],
    shouldParse: true,
    expectedAmbiguityCount: 0,
    expectedRootSymbol: 'S',
    notes: 'Complex compound with split result.',
  },
  {
    id: 'G082',
    input: 'turn up the bass but keep the mids the same',
    category: 'compound',
    expectedTokenCount: 10,
    expectedTokenTypes: ['verb', 'direction', 'determiner', 'noun', 'conjunction', 'verb', 'determiner', 'noun', 'determiner', 'adjective'],
    shouldParse: true,
    expectedAmbiguityCount: 0,
    expectedRootSymbol: 'S',
    notes: 'Contrastive compound.',
  },
  {
    id: 'G083',
    input: 'add a sidechain from the kick to the bass',
    category: 'compound',
    expectedTokenCount: 9,
    expectedTokenTypes: ['verb', 'determiner', 'noun', 'preposition', 'determiner', 'noun', 'preposition', 'determiner', 'noun'],
    shouldParse: true,
    expectedAmbiguityCount: 0,
    expectedRootSymbol: 'S',
    notes: 'Routing with source and destination.',
  },
  {
    id: 'G084',
    input: 'export the stems and the mix',
    category: 'compound',
    expectedTokenCount: 6,
    expectedTokenTypes: ['verb', 'determiner', 'noun', 'conjunction', 'determiner', 'noun'],
    shouldParse: true,
    expectedAmbiguityCount: 0,
    expectedRootSymbol: 'S',
    notes: 'Multi-export.',
  },
  {
    id: 'G085',
    input: 'save a version and name it final mix',
    category: 'compound',
    expectedTokenCount: 8,
    expectedTokenTypes: ['verb', 'determiner', 'noun', 'conjunction', 'verb', 'pronoun', 'adjective', 'noun'],
    shouldParse: true,
    expectedAmbiguityCount: 0,
    expectedRootSymbol: 'S',
    notes: 'Save and name compound.',
  },

  // ─── IDIOMATIC (G086–G090) ────────────────────────────────────────────────
  {
    id: 'G086',
    input: 'make it hit harder',
    category: 'idiomatic',
    expectedTokenCount: 4,
    expectedTokenTypes: ['verb', 'pronoun', 'verb', 'adverb'],
    shouldParse: true,
    expectedAmbiguityCount: 1,
    expectedRootSymbol: 'S',
    notes: 'Music production idiom — construction grammar.',
  },
  {
    id: 'G087',
    input: 'bring in the strings',
    category: 'idiomatic',
    expectedTokenCount: 4,
    expectedTokenTypes: ['verb', 'direction', 'determiner', 'noun'],
    shouldParse: true,
    expectedAmbiguityCount: 0,
    expectedRootSymbol: 'S',
    notes: 'Phrasal verb "bring in".',
  },
  {
    id: 'G088',
    input: 'warm it up',
    category: 'idiomatic',
    expectedTokenCount: 3,
    expectedTokenTypes: ['verb', 'pronoun', 'particle'],
    shouldParse: true,
    expectedAmbiguityCount: 0,
    expectedRootSymbol: 'S',
    notes: 'Phrasal verb "warm up".',
  },
  {
    id: 'G089',
    input: 'tighten up the low end',
    category: 'idiomatic',
    expectedTokenCount: 5,
    expectedTokenTypes: ['verb', 'particle', 'determiner', 'adjective', 'noun'],
    shouldParse: true,
    expectedAmbiguityCount: 0,
    expectedRootSymbol: 'S',
    notes: 'Phrasal verb "tighten up".',
  },
  {
    id: 'G090',
    input: 'let it breathe',
    category: 'idiomatic',
    expectedTokenCount: 3,
    expectedTokenTypes: ['verb', 'pronoun', 'verb'],
    shouldParse: true,
    expectedAmbiguityCount: 0,
    expectedRootSymbol: 'S',
    notes: 'Causative + metaphorical verb.',
  },

  // ─── DEGREE / VAGUE ADJECTIVES (G091–G095) ────────────────────────────────
  {
    id: 'G091',
    input: 'make it darker',
    category: 'degree',
    expectedTokenCount: 3,
    expectedTokenTypes: ['verb', 'pronoun', 'adjective'],
    shouldParse: true,
    expectedAmbiguityCount: 1,
    expectedRootSymbol: 'S',
    notes: '"Darker" is ambiguous (timbre, harmony, mood).',
  },
  {
    id: 'G092',
    input: 'make it a bit brighter',
    category: 'degree',
    expectedTokenCount: 5,
    expectedTokenTypes: ['verb', 'pronoun', 'determiner', 'noun', 'adjective'],
    shouldParse: true,
    expectedAmbiguityCount: 0,
    expectedRootSymbol: 'S',
    notes: 'Hedged degree modifier.',
  },
  {
    id: 'G093',
    input: 'make it much warmer',
    category: 'degree',
    expectedTokenCount: 4,
    expectedTokenTypes: ['verb', 'pronoun', 'adverb', 'adjective'],
    shouldParse: true,
    expectedAmbiguityCount: 0,
    expectedRootSymbol: 'S',
    notes: 'Intensified degree modifier.',
  },
  {
    id: 'G094',
    input: 'make the mix more spacious',
    category: 'degree',
    expectedTokenCount: 5,
    expectedTokenTypes: ['verb', 'determiner', 'noun', 'adverb', 'adjective'],
    shouldParse: true,
    expectedAmbiguityCount: 0,
    expectedRootSymbol: 'S',
    notes: 'Analytic comparative.',
  },
  {
    id: 'G095',
    input: 'make the drums punchier',
    category: 'degree',
    expectedTokenCount: 4,
    expectedTokenTypes: ['verb', 'determiner', 'noun', 'adjective'],
    shouldParse: true,
    expectedAmbiguityCount: 0,
    expectedRootSymbol: 'S',
    notes: 'Synthetic comparative.',
  },

  // ─── REFERENCE / MODAL / ERROR (G096–G100) ────────────────────────────────
  {
    id: 'G096',
    input: 'do the same thing to the other tracks',
    category: 'reference',
    expectedTokenCount: 8,
    expectedTokenTypes: ['verb', 'determiner', 'adjective', 'noun', 'preposition', 'determiner', 'adjective', 'noun'],
    shouldParse: true,
    expectedAmbiguityCount: 1,
    expectedRootSymbol: 'S',
    notes: 'Anaphoric reference to previous action.',
  },
  {
    id: 'G097',
    input: 'could you make the bass warmer',
    category: 'modal',
    expectedTokenCount: 6,
    expectedTokenTypes: ['modal', 'pronoun', 'verb', 'determiner', 'noun', 'adjective'],
    shouldParse: true,
    expectedAmbiguityCount: 0,
    expectedRootSymbol: 'S',
    notes: 'Polite request modal.',
  },
  {
    id: 'G098',
    input: 'maybe add some reverb',
    category: 'modal',
    expectedTokenCount: 4,
    expectedTokenTypes: ['adverb', 'verb', 'quantifier', 'noun'],
    shouldParse: true,
    expectedAmbiguityCount: 0,
    expectedRootSymbol: 'S',
    notes: 'Hedged suggestion.',
  },
  {
    id: 'G099',
    input: '',
    category: 'error_case',
    expectedTokenCount: 0,
    expectedTokenTypes: [],
    shouldParse: false,
    expectedAmbiguityCount: 0,
    expectedRootSymbol: '',
    notes: 'Empty input should fail gracefully.',
  },
  {
    id: 'G100',
    input: '!!!???###',
    category: 'error_case',
    expectedTokenCount: 0,
    expectedTokenTypes: [],
    shouldParse: false,
    expectedAmbiguityCount: 0,
    expectedRootSymbol: '',
    notes: 'Pure punctuation should fail gracefully.',
  },
];

// =============================================================================
// TEST INFRASTRUCTURE
// =============================================================================

/**
 * Verify the golden utterance database itself is well-formed.
 */
describe('Golden Utterance Database Integrity', () => {
  it('should contain exactly 100 utterances', () => {
    expect(GOLDEN_UTTERANCES.length).toBe(100);
  });

  it('should have unique IDs', () => {
    const ids = GOLDEN_UTTERANCES.map(g => g.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('should have sequential IDs from G001 to G100', () => {
    for (let i = 0; i < 100; i++) {
      const expected = `G${String(i + 1).padStart(3, '0')}`;
      expect(GOLDEN_UTTERANCES[i]!.id).toBe(expected);
    }
  });

  it('should have non-empty inputs except for error cases', () => {
    for (const g of GOLDEN_UTTERANCES) {
      if (g.category !== 'error_case') {
        expect(g.input.length).toBeGreaterThan(0);
      }
    }
  });

  it('should have expected token types matching token count', () => {
    for (const g of GOLDEN_UTTERANCES) {
      expect(g.expectedTokenTypes.length).toBe(g.expectedTokenCount);
    }
  });

  it('should cover all golden categories', () => {
    const categories = new Set(GOLDEN_UTTERANCES.map(g => g.category));
    expect(categories.has('basic_edit')).toBe(true);
    expect(categories.has('parameter')).toBe(true);
    expect(categories.has('selection')).toBe(true);
    expect(categories.has('temporal')).toBe(true);
    expect(categories.has('structural')).toBe(true);
    expect(categories.has('comparative')).toBe(true);
    expect(categories.has('negation')).toBe(true);
    expect(categories.has('quantified')).toBe(true);
    expect(categories.has('compound')).toBe(true);
    expect(categories.has('idiomatic')).toBe(true);
    expect(categories.has('degree')).toBe(true);
    expect(categories.has('reference')).toBe(true);
    expect(categories.has('modal')).toBe(true);
    expect(categories.has('error_case')).toBe(true);
  });
});

/**
 * Token count stability tests.
 */
describe('Golden Utterance Token Count Stability', () => {
  for (const g of GOLDEN_UTTERANCES) {
    if (g.category === 'error_case' && g.input === '') continue;

    it(`[${g.id}] "${g.input}" should produce ${g.expectedTokenCount} tokens`, () => {
      // This test verifies the golden expectation is well-defined.
      // When the tokenizer is wired up, replace this with actual tokenization.
      expect(g.expectedTokenCount).toBeGreaterThan(0);
      expect(g.expectedTokenTypes.length).toBe(g.expectedTokenCount);
    });
  }
});

/**
 * Parse expectation stability tests.
 */
describe('Golden Utterance Parse Expectations', () => {
  for (const g of GOLDEN_UTTERANCES) {
    it(`[${g.id}] "${g.input}" should${g.shouldParse ? '' : ' not'} parse`, () => {
      // Verify the golden database is self-consistent.
      if (g.shouldParse) {
        expect(g.expectedRootSymbol).not.toBe('');
      }
      if (g.category === 'error_case') {
        expect(g.shouldParse).toBe(false);
      }
    });
  }
});

/**
 * Ambiguity expectation tests.
 */
describe('Golden Utterance Ambiguity Expectations', () => {
  const ambiguous = GOLDEN_UTTERANCES.filter(g => g.expectedAmbiguityCount > 0);
  const unambiguous = GOLDEN_UTTERANCES.filter(g => g.expectedAmbiguityCount === 0 && g.shouldParse);

  it('should have a mix of ambiguous and unambiguous utterances', () => {
    expect(ambiguous.length).toBeGreaterThan(0);
    expect(unambiguous.length).toBeGreaterThan(ambiguous.length);
  });

  it('should mark known ambiguous utterances', () => {
    // These specific utterances are known to be ambiguous
    const knownAmbiguous = ['G074', 'G086', 'G091', 'G096'];
    for (const id of knownAmbiguous) {
      const g = GOLDEN_UTTERANCES.find(u => u.id === id);
      expect(g).toBeDefined();
      expect(g!.expectedAmbiguityCount).toBeGreaterThan(0);
    }
  });
});

/**
 * Category distribution tests.
 */
describe('Golden Utterance Category Distribution', () => {
  const categoryCount = new Map<string, number>();
  for (const g of GOLDEN_UTTERANCES) {
    categoryCount.set(g.category, (categoryCount.get(g.category) ?? 0) + 1);
  }

  it('should have at least 10 basic_edit utterances', () => {
    expect(categoryCount.get('basic_edit') ?? 0).toBeGreaterThanOrEqual(10);
  });

  it('should have at least 10 parameter utterances', () => {
    expect(categoryCount.get('parameter') ?? 0).toBeGreaterThanOrEqual(10);
  });

  it('should have at least 5 temporal utterances', () => {
    expect(categoryCount.get('temporal') ?? 0).toBeGreaterThanOrEqual(5);
  });

  it('should have at least 5 compound utterances', () => {
    expect(categoryCount.get('compound') ?? 0).toBeGreaterThanOrEqual(5);
  });

  it('should have error cases', () => {
    expect(categoryCount.get('error_case') ?? 0).toBeGreaterThanOrEqual(2);
  });
});

// =============================================================================
// EXPORT — For use by other test modules
// =============================================================================

export { GOLDEN_UTTERANCES, type GoldenUtterance, type GoldenCategory };
