/**
 * GOFAI Eval Paraphrase Suite — Semantic Invariance Test Data
 *
 * Step 029 [Eval]: Create paraphrase sets for 50 of the seed instructions
 * (≥5 paraphrases each) to enforce semantic invariance.
 *
 * Every paraphrase of a given seed instruction MUST compile to the same
 * CPL-Intent (or the same set of holes/clarification triggers). This is
 * the primary mechanism for verifying that the parser is meaning-stable
 * rather than surface-form-dependent.
 *
 * ## Design Principles
 *
 * 1. **Surface variation, meaning preservation**: Paraphrases vary syntax,
 *    word choice, register, and phrasing while preserving the same intent.
 *
 * 2. **Coverage of variation types**: Each paraphrase set exercises multiple
 *    variation dimensions:
 *    - Lexical substitution ("darker" → "less bright")
 *    - Syntactic reordering ("in the chorus, add bass" → "add bass in the chorus")
 *    - Register shift (casual → formal, slang → standard)
 *    - Ellipsis / brevity ("make it darker" → "darker")
 *    - Elaboration ("make it darker" → "I want the overall feel to be darker")
 *    - Voice / mood ("make it darker" → "it should be darker")
 *    - Hedging / politeness ("make it darker" → "could you make it a bit darker?")
 *    - Musician jargon variants ("tighten" → "lock it in" → "clean up the timing")
 *
 * 3. **Paired with seed IDs**: Each paraphrase set references the seed
 *    example ID it paraphrases, so tests can verify CPL equivalence.
 *
 * 4. **Batched for size management**: Split into batches to avoid excessive
 *    file sizes. Each batch covers ~10 seed examples.
 *
 * @module gofai/eval/paraphrase-suite
 */

import { SeedExampleId, seedExampleId } from './seed-dataset';

// =============================================================================
// Paraphrase Suite Types
// =============================================================================

/**
 * Unique identifier for a paraphrase.
 */
export type ParaphraseId = string & { readonly __brand: 'ParaphraseId' };

/**
 * Create a ParaphraseId.
 */
export function paraphraseId(id: string): ParaphraseId {
  return id as ParaphraseId;
}

/**
 * The kind of surface variation a paraphrase exercises.
 */
export type VariationType =
  | 'lexical_substitution'     // synonym / antonym-flip
  | 'syntactic_reorder'        // clause/phrase reordering
  | 'register_shift'           // casual ↔ formal
  | 'ellipsis'                 // shortened form
  | 'elaboration'              // expanded / verbose form
  | 'voice_change'             // imperative ↔ declarative ↔ interrogative
  | 'hedging'                  // politeness markers / softeners
  | 'jargon_variant'           // musician/producer slang
  | 'negation_flip'            // "less bright" ↔ "darker"
  | 'passive_construction'     // "should be made darker"
  | 'nominalization'           // verb → noun form ("darken" → "a darkening")
  | 'degree_rephrasing'        // "slightly" ↔ "a touch" ↔ "just a hair"
  | 'metaphorical'             // figurative language ("pull back the curtain")
  | 'compound_rephrasing';     // multi-clause ↔ single-clause

/**
 * A single paraphrase of a seed instruction.
 */
export interface Paraphrase {
  /** Unique ID for this paraphrase. */
  readonly id: ParaphraseId;
  /** The paraphrased instruction text. */
  readonly text: string;
  /** What kind(s) of variation this exercises. */
  readonly variations: readonly VariationType[];
  /** Optional note about why this paraphrase is tricky or interesting. */
  readonly note: string | undefined;
}

/**
 * A paraphrase set: the seed ID plus all its paraphrases.
 */
export interface ParaphraseSet {
  /** The seed example this paraphrases. */
  readonly seedId: SeedExampleId;
  /** The original instruction (for reference). */
  readonly originalInstruction: string;
  /** The paraphrases (≥5 each). */
  readonly paraphrases: readonly Paraphrase[];
}

// =============================================================================
// Helper for concise paraphrase construction
// =============================================================================

function p(
  id: string,
  text: string,
  variations: readonly VariationType[],
  note?: string,
): Paraphrase {
  return {
    id: paraphraseId(id),
    text,
    variations,
    note: note ?? undefined,
  };
}

function pset(
  seedId: string,
  originalInstruction: string,
  paraphrases: readonly Paraphrase[],
): ParaphraseSet {
  return {
    seedId: seedExampleId(seedId),
    originalInstruction,
    paraphrases,
  };
}


// =============================================================================
// Batch 1: Paraphrases for Seed Examples 001–010
// (Basic imperatives with action verbs)
// =============================================================================

export const PARAPHRASE_BATCH_1: readonly ParaphraseSet[] = [

  // --- seed-001: "Make it darker" ---
  pset('seed-001', 'Make it darker', [
    p('para-001-01', 'Darken it',
      ['ellipsis', 'lexical_substitution'],
      'Direct verb form instead of "make X adj"'),
    p('para-001-02', 'I want it to sound darker',
      ['elaboration', 'voice_change'],
      'First-person desire framing'),
    p('para-001-03', 'Can you make it less bright?',
      ['negation_flip', 'hedging'],
      'Antonym + politeness: "less bright" = "darker"'),
    p('para-001-04', 'It should be darker',
      ['voice_change'],
      'Declarative/modal rather than imperative'),
    p('para-001-05', 'Go darker with it',
      ['jargon_variant', 'syntactic_reorder'],
      'Studio slang: "go X with it"'),
    p('para-001-06', 'Darker, please',
      ['ellipsis', 'hedging'],
      'Minimal elliptical form with politeness'),
    p('para-001-07', 'Take it darker',
      ['jargon_variant'],
      'Producer phrasing: "take it" + direction'),
    p('para-001-08', 'Could we go in a darker direction?',
      ['hedging', 'metaphorical', 'elaboration'],
      'Collaborative framing with directional metaphor'),
    p('para-001-09', 'Pull back the brightness',
      ['negation_flip', 'metaphorical'],
      '"Pull back" as decrease metaphor + "brightness" as axis name'),
    p('para-001-10', 'Reduce the brightness',
      ['negation_flip', 'lexical_substitution'],
      'Explicit axis + decrease verb'),
  ]),

  // --- seed-002: "Make it brighter" ---
  pset('seed-002', 'Make it brighter', [
    p('para-002-01', 'Brighten it up',
      ['lexical_substitution', 'jargon_variant'],
      '"Brighten up" is common studio phrasing'),
    p('para-002-02', 'Add some brightness',
      ['nominalization', 'lexical_substitution'],
      'Noun form of the axis'),
    p('para-002-03', 'I need it brighter',
      ['voice_change', 'ellipsis'],
      'First-person need statement'),
    p('para-002-04', 'Make it less dark',
      ['negation_flip'],
      'Antonym flip: "less dark" = "brighter"'),
    p('para-002-05', 'Can you open it up a bit?',
      ['jargon_variant', 'hedging', 'metaphorical'],
      '"Open up" is a studio metaphor for brightness/air'),
    p('para-002-06', 'It could use more brightness',
      ['hedging', 'nominalization', 'elaboration'],
      'Indirect suggestion framing'),
    p('para-002-07', 'Brighter',
      ['ellipsis'],
      'Single-word command'),
    p('para-002-08', 'Push the highs forward',
      ['jargon_variant', 'metaphorical'],
      'Mix engineer phrasing mapping to brightness'),
  ]),

  // --- seed-003: "Add more energy" ---
  pset('seed-003', 'Add more energy', [
    p('para-003-01', 'Pump up the energy',
      ['jargon_variant', 'lexical_substitution'],
      '"Pump up" = increase colloquially'),
    p('para-003-02', 'I want more energy in this',
      ['elaboration', 'voice_change'],
      'First-person desire + deictic "this"'),
    p('para-003-03', 'Give it more energy',
      ['lexical_substitution'],
      '"Give it" as alternative to "add"'),
    p('para-003-04', 'Make it more energetic',
      ['lexical_substitution'],
      'Adjective form: "energetic" instead of noun "energy"'),
    p('para-003-05', 'It needs more energy',
      ['voice_change', 'elaboration'],
      'Declarative need statement'),
    p('para-003-06', 'Boost the energy',
      ['lexical_substitution'],
      '"Boost" = increase'),
    p('para-003-07', 'Crank it up',
      ['jargon_variant', 'metaphorical'],
      'Colloquial "crank up" meaning increase energy'),
    p('para-003-08', 'More energy, please',
      ['ellipsis', 'hedging'],
      'Minimal noun phrase command'),
    p('para-003-09', 'It feels too low-energy',
      ['negation_flip', 'voice_change'],
      'Complaint framing → infer increase goal'),
    p('para-003-10', 'The energy level is too low',
      ['negation_flip', 'voice_change', 'elaboration'],
      'Descriptive problem statement → goal inference'),
  ]),

  // --- seed-004: "Tighten the groove" ---
  pset('seed-004', 'Tighten the groove', [
    p('para-004-01', 'Make the groove tighter',
      ['syntactic_reorder'],
      'Standard "make X adj" form'),
    p('para-004-02', 'Lock in the groove',
      ['jargon_variant'],
      '"Lock in" = tighten in musician speak'),
    p('para-004-03', 'Clean up the timing',
      ['jargon_variant', 'lexical_substitution'],
      '"Clean up timing" ≈ tighten groove'),
    p('para-004-04', 'The groove needs to be tighter',
      ['voice_change', 'elaboration'],
      'Declarative framing'),
    p('para-004-05', 'Tighten up the feel',
      ['jargon_variant', 'lexical_substitution'],
      '"Feel" as synonym for groove quality'),
    p('para-004-06', 'Less sloppy on the timing',
      ['negation_flip', 'jargon_variant'],
      '"Less sloppy" → tighter'),
    p('para-004-07', 'Make it sit in the pocket better',
      ['jargon_variant', 'metaphorical', 'elaboration'],
      '"In the pocket" is a groove tightness idiom'),
    p('para-004-08', 'Quantize it a bit more',
      ['jargon_variant', 'degree_rephrasing'],
      'Technical term for grid alignment'),
  ]),

  // --- seed-005: "Widen the stereo image" ---
  pset('seed-005', 'Widen the stereo image', [
    p('para-005-01', 'Make it wider',
      ['ellipsis', 'lexical_substitution'],
      'Simplified form dropping "stereo image"'),
    p('para-005-02', 'Spread it out more',
      ['jargon_variant', 'metaphorical'],
      '"Spread out" as spatial widening'),
    p('para-005-03', 'Give it more width',
      ['nominalization', 'lexical_substitution'],
      'Noun form: "width"'),
    p('para-005-04', 'Open up the stereo field',
      ['jargon_variant', 'lexical_substitution'],
      '"Open up" + "stereo field" = widen'),
    p('para-005-05', 'I want a wider stereo image',
      ['voice_change', 'elaboration'],
      'First-person + comparative adj'),
    p('para-005-06', 'It sounds too narrow',
      ['negation_flip', 'voice_change'],
      'Problem statement → infer widen goal'),
    p('para-005-07', 'Increase the stereo width',
      ['lexical_substitution', 'nominalization'],
      'Explicit axis + verb'),
    p('para-005-08', 'Pan things out more',
      ['jargon_variant'],
      'Panning as a mechanism for perceived width'),
  ]),

  // --- seed-006: "Make it warmer" ---
  pset('seed-006', 'Make it warmer', [
    p('para-006-01', 'Warm it up',
      ['jargon_variant', 'lexical_substitution'],
      'Phrasal verb form'),
    p('para-006-02', 'Add some warmth',
      ['nominalization', 'lexical_substitution'],
      'Noun form: "warmth"'),
    p('para-006-03', 'It needs to be warmer',
      ['voice_change'],
      'Declarative need'),
    p('para-006-04', 'Make it less cold',
      ['negation_flip'],
      '"Less cold" = warmer'),
    p('para-006-05', 'Can you warm it up a bit?',
      ['hedging', 'jargon_variant'],
      'Polite request with degree softener'),
    p('para-006-06', 'Take the edge off — it sounds a bit harsh',
      ['metaphorical', 'jargon_variant', 'elaboration'],
      '"Take the edge off" / "harsh" → warmer'),
    p('para-006-07', 'I want it to feel cozy and warm',
      ['elaboration', 'voice_change', 'metaphorical'],
      'Emotional language mapping to warmth axis'),
    p('para-006-08', 'Roll off some of the high end',
      ['jargon_variant'],
      'Technical mix action that achieves warmth'),
  ]),

  // --- seed-007: "Remove the reverb" ---
  pset('seed-007', 'Remove the reverb', [
    p('para-007-01', 'Cut the reverb',
      ['lexical_substitution'],
      '"Cut" = remove in studio speak'),
    p('para-007-02', 'Get rid of the reverb',
      ['lexical_substitution', 'elaboration'],
      'Informal "get rid of"'),
    p('para-007-03', 'Take the reverb off',
      ['jargon_variant', 'syntactic_reorder'],
      'Phrasal verb: "take off"'),
    p('para-007-04', 'No reverb',
      ['ellipsis'],
      'Minimal imperative'),
    p('para-007-05', 'Kill the reverb',
      ['jargon_variant'],
      'Studio slang: "kill" = remove/mute'),
    p('para-007-06', 'I don\'t want any reverb',
      ['voice_change', 'negation_flip'],
      'First-person negative desire'),
    p('para-007-07', 'Bypass the reverb',
      ['jargon_variant'],
      'Technical audio term for disabling an effect'),
    p('para-007-08', 'Turn off the reverb',
      ['lexical_substitution'],
      'On/off metaphor for effect removal'),
    p('para-007-09', 'Make it completely dry',
      ['jargon_variant', 'metaphorical'],
      '"Dry" = no reverb/effects in studio terminology'),
  ]),

  // --- seed-008: "Add a pad layer" ---
  pset('seed-008', 'Add a pad layer', [
    p('para-008-01', 'I need a pad in there',
      ['voice_change', 'jargon_variant'],
      'First-person need + deictic "in there"'),
    p('para-008-02', 'Put a pad layer in',
      ['lexical_substitution'],
      '"Put in" = add'),
    p('para-008-03', 'Add some pads',
      ['lexical_substitution'],
      'Plural informal: "some pads"'),
    p('para-008-04', 'Include a pad track',
      ['lexical_substitution'],
      '"Include" = add; "track" = layer'),
    p('para-008-05', 'Can we add a pad?',
      ['hedging', 'ellipsis'],
      'Collaborative "we" + dropping "layer"'),
    p('para-008-06', 'It needs pads',
      ['voice_change', 'ellipsis'],
      'Declarative need, minimal'),
    p('para-008-07', 'Layer in a pad',
      ['jargon_variant', 'syntactic_reorder'],
      '"Layer in" as verb phrase'),
    p('para-008-08', 'Bring in a pad sound',
      ['jargon_variant'],
      '"Bring in" = add/introduce'),
  ]),

  // --- seed-009: "Duplicate the chorus" ---
  pset('seed-009', 'Duplicate the chorus', [
    p('para-009-01', 'Copy the chorus',
      ['lexical_substitution'],
      '"Copy" = duplicate'),
    p('para-009-02', 'Double the chorus',
      ['lexical_substitution'],
      '"Double" can mean duplicate structurally'),
    p('para-009-03', 'Repeat the chorus',
      ['lexical_substitution'],
      '"Repeat" = play again = duplicate in arrangement'),
    p('para-009-04', 'Add another chorus',
      ['lexical_substitution', 'elaboration'],
      'Describes outcome: another instance of chorus'),
    p('para-009-05', 'I want the chorus to play twice',
      ['voice_change', 'elaboration'],
      'First-person + frequency description'),
    p('para-009-06', 'Make a copy of the chorus section',
      ['elaboration', 'lexical_substitution'],
      'Verbose with "section" qualifier'),
    p('para-009-07', 'Clone the chorus',
      ['jargon_variant'],
      '"Clone" = exact duplicate'),
  ]),

  // --- seed-010: "Swap the verse and chorus" ---
  pset('seed-010', 'Swap the verse and chorus', [
    p('para-010-01', 'Switch the verse and chorus',
      ['lexical_substitution'],
      '"Switch" = swap'),
    p('para-010-02', 'Put the chorus where the verse is and vice versa',
      ['elaboration'],
      'Verbose explicit description of swap'),
    p('para-010-03', 'Flip the verse and chorus',
      ['jargon_variant'],
      '"Flip" = swap colloquially'),
    p('para-010-04', 'Exchange the verse and chorus positions',
      ['lexical_substitution', 'elaboration'],
      'Formal: "exchange positions"'),
    p('para-010-05', 'Move the chorus to where the verse is',
      ['elaboration', 'syntactic_reorder'],
      'One-directional description (implies swap)'),
    p('para-010-06', 'Reverse the order of the verse and chorus',
      ['lexical_substitution', 'elaboration'],
      '"Reverse order" framing'),
    p('para-010-07', 'The chorus should come before the verse',
      ['voice_change', 'elaboration'],
      'Declarative result description'),
  ]),
];


// =============================================================================
// Batch 2: Paraphrases for Seed Examples 011–020
// (Degree modifiers, numeric values, production terms)
// =============================================================================

export const PARAPHRASE_BATCH_2: readonly ParaphraseSet[] = [

  // --- seed-011: "Make it slightly brighter" ---
  pset('seed-011', 'Make it slightly brighter', [
    p('para-011-01', 'Brighten it just a touch',
      ['jargon_variant', 'degree_rephrasing'],
      '"Just a touch" = slightly'),
    p('para-011-02', 'A tiny bit brighter',
      ['ellipsis', 'degree_rephrasing'],
      'Minimal with degree phrase'),
    p('para-011-03', 'Could you make it a hair brighter?',
      ['hedging', 'degree_rephrasing'],
      '"A hair" = very small amount'),
    p('para-011-04', 'Nudge the brightness up',
      ['jargon_variant', 'metaphorical'],
      '"Nudge" implies small increase'),
    p('para-011-05', 'Just a little more brightness',
      ['nominalization', 'degree_rephrasing', 'ellipsis'],
      'Noun form + degree'),
    p('para-011-06', 'Brighten it ever so slightly',
      ['elaboration', 'degree_rephrasing'],
      'Emphatic small degree'),
    p('para-011-07', 'Ease up the brightness just a smidge',
      ['jargon_variant', 'degree_rephrasing'],
      '"Smidge" = tiny amount'),
  ]),

  // --- seed-012: "Make it much darker" ---
  pset('seed-012', 'Make it much darker', [
    p('para-012-01', 'Way darker',
      ['ellipsis', 'degree_rephrasing'],
      '"Way" = much colloquially'),
    p('para-012-02', 'Darken it significantly',
      ['lexical_substitution', 'degree_rephrasing'],
      '"Significantly" = much in formal register'),
    p('para-012-03', 'Really bring down the brightness',
      ['negation_flip', 'degree_rephrasing', 'jargon_variant'],
      '"Really" intensifier + axis flip'),
    p('para-012-04', 'I want it a lot darker',
      ['voice_change', 'degree_rephrasing'],
      'First-person + "a lot"'),
    p('para-012-05', 'Make it substantially darker',
      ['degree_rephrasing', 'register_shift'],
      'Formal register: "substantially"'),
    p('para-012-06', 'Go really dark with it',
      ['jargon_variant', 'degree_rephrasing'],
      'Studio phrasing with intensifier'),
  ]),

  // --- seed-013: "Add a lot more energy" ---
  pset('seed-013', 'Add a lot more energy', [
    p('para-013-01', 'Crank the energy way up',
      ['jargon_variant', 'degree_rephrasing'],
      '"Crank way up" = large increase'),
    p('para-013-02', 'Give it way more energy',
      ['lexical_substitution', 'degree_rephrasing'],
      '"Give it" + "way more"'),
    p('para-013-03', 'I want this to really bang',
      ['jargon_variant', 'voice_change', 'metaphorical'],
      '"Bang" = high energy in some contexts'),
    p('para-013-04', 'Significantly more energy, please',
      ['ellipsis', 'degree_rephrasing', 'hedging'],
      'Formal degree + politeness'),
    p('para-013-05', 'The energy needs to be much higher',
      ['voice_change', 'degree_rephrasing', 'elaboration'],
      'Declarative comparative'),
    p('para-013-06', 'Pump this up big time',
      ['jargon_variant', 'degree_rephrasing', 'metaphorical'],
      'Colloquial intensifier phrase'),
  ]),

  // --- seed-014: "Make it a tiny bit less busy" ---
  pset('seed-014', 'Make it a tiny bit less busy', [
    p('para-014-01', 'Thin it out just slightly',
      ['jargon_variant', 'degree_rephrasing'],
      '"Thin out" = less busy; "just slightly" = tiny bit'),
    p('para-014-02', 'Ease off a little on the density',
      ['jargon_variant', 'degree_rephrasing', 'nominalization'],
      '"Ease off" + technical "density"'),
    p('para-014-03', 'A touch less going on',
      ['ellipsis', 'degree_rephrasing', 'metaphorical'],
      '"Less going on" = less busy'),
    p('para-014-04', 'Simplify it just a hair',
      ['lexical_substitution', 'degree_rephrasing'],
      '"Simplify" maps to busyness decrease'),
    p('para-014-05', 'Pull back the arrangement just a tiny bit',
      ['jargon_variant', 'degree_rephrasing', 'metaphorical'],
      '"Pull back arrangement" ≈ reduce busyness'),
    p('para-014-06', 'Could we take a little bit out?',
      ['hedging', 'degree_rephrasing', 'elaboration'],
      'Polite + vague "take out" → less busy'),
  ]),

  // --- seed-015: "Increase the tension significantly" ---
  pset('seed-015', 'Increase the tension significantly', [
    p('para-015-01', 'Ramp up the tension a lot',
      ['jargon_variant', 'degree_rephrasing'],
      '"Ramp up" = increase'),
    p('para-015-02', 'Way more tension',
      ['ellipsis', 'degree_rephrasing'],
      'Minimal command'),
    p('para-015-03', 'Make it much more tense',
      ['lexical_substitution', 'degree_rephrasing'],
      'Adjective form: "tense"'),
    p('para-015-04', 'I need it to feel way more tense and urgent',
      ['voice_change', 'elaboration', 'degree_rephrasing'],
      'First-person + emotional elaboration'),
    p('para-015-05', 'Really build up the tension',
      ['jargon_variant', 'degree_rephrasing'],
      '"Build up" = increase for tension specifically'),
    p('para-015-06', 'The tension should be dramatically higher',
      ['voice_change', 'degree_rephrasing', 'register_shift'],
      'Formal declarative with adverb'),
  ]),

  // --- seed-016: "Set the tempo to 120 BPM" ---
  pset('seed-016', 'Set the tempo to 120 BPM', [
    p('para-016-01', 'Change the tempo to 120',
      ['lexical_substitution'],
      '"Change to" = "set to"; BPM implicit'),
    p('para-016-02', 'Make it 120 BPM',
      ['ellipsis'],
      'Minimal set command'),
    p('para-016-03', 'I want it at 120 beats per minute',
      ['voice_change', 'elaboration'],
      'Long form "beats per minute"'),
    p('para-016-04', 'Tempo: 120',
      ['ellipsis'],
      'Terse label-value format'),
    p('para-016-05', '120 BPM please',
      ['ellipsis', 'hedging'],
      'Value-first with politeness'),
    p('para-016-06', 'Put it at 120 BPM',
      ['lexical_substitution'],
      '"Put it at" = set'),
    p('para-016-07', 'The tempo should be 120',
      ['voice_change'],
      'Declarative form'),
  ]),

  // --- seed-017: "Transpose up by 3 semitones" ---
  pset('seed-017', 'Transpose up by 3 semitones', [
    p('para-017-01', 'Move it up 3 semitones',
      ['lexical_substitution'],
      '"Move up" = transpose up'),
    p('para-017-02', 'Shift it up three half steps',
      ['lexical_substitution'],
      '"Half steps" = semitones'),
    p('para-017-03', 'Raise the pitch by 3',
      ['lexical_substitution', 'ellipsis'],
      '"Raise pitch" = transpose up; unit implicit'),
    p('para-017-04', 'Up 3 semitones',
      ['ellipsis'],
      'Minimal with direction + amount'),
    p('para-017-05', 'Transpose +3',
      ['ellipsis'],
      'Terse signed numeric form'),
    p('para-017-06', 'Can you move everything up a minor third?',
      ['hedging', 'jargon_variant', 'lexical_substitution'],
      'Interval name "minor third" = 3 semitones'),
    p('para-017-07', 'Bump it up three semitones',
      ['jargon_variant'],
      '"Bump up" = shift/transpose'),
  ]),

  // --- seed-018: "Make the bass louder by 3 dB" ---
  pset('seed-018', 'Make the bass louder by 3 dB', [
    p('para-018-01', 'Turn up the bass 3 dB',
      ['jargon_variant', 'lexical_substitution'],
      '"Turn up" = make louder'),
    p('para-018-02', 'Boost the bass by 3 dB',
      ['lexical_substitution'],
      '"Boost" = increase level'),
    p('para-018-03', 'Bring up the bass 3 dB',
      ['jargon_variant'],
      '"Bring up" = raise level'),
    p('para-018-04', '+3 dB on the bass',
      ['ellipsis'],
      'Terse technical format'),
    p('para-018-05', 'The bass needs to be about 3 dB louder',
      ['voice_change', 'hedging'],
      'Declarative with "about"'),
    p('para-018-06', 'Give me 3 more dB on the bass',
      ['jargon_variant', 'voice_change'],
      'Mix engineer phrasing'),
    p('para-018-07', 'Bass up 3 dB',
      ['ellipsis'],
      'Minimal target + direction + amount'),
  ]),

  // --- seed-019: "Extend the intro by 4 bars" ---
  pset('seed-019', 'Extend the intro by 4 bars', [
    p('para-019-01', 'Make the intro 4 bars longer',
      ['lexical_substitution'],
      '"Longer by N" = extend by N'),
    p('para-019-02', 'Add 4 bars to the intro',
      ['lexical_substitution', 'syntactic_reorder'],
      '"Add N bars" = extend by N'),
    p('para-019-03', 'Lengthen the intro by four bars',
      ['lexical_substitution'],
      '"Lengthen" = extend; spelled-out number'),
    p('para-019-04', 'I want the intro to be 4 bars longer',
      ['voice_change', 'elaboration'],
      'First-person desire + comparative'),
    p('para-019-05', 'Stretch the intro out by 4 bars',
      ['jargon_variant', 'metaphorical'],
      '"Stretch out" = extend'),
    p('para-019-06', 'Give me 4 more bars of intro',
      ['jargon_variant', 'syntactic_reorder'],
      'Producer phrasing'),
  ]),

  // --- seed-020: "Make the drums punchier" ---
  pset('seed-020', 'Make the drums punchier', [
    p('para-020-01', 'Give the drums more punch',
      ['nominalization', 'lexical_substitution'],
      'Noun form: "punch"'),
    p('para-020-02', 'The drums need more punch',
      ['voice_change', 'nominalization'],
      'Declarative need'),
    p('para-020-03', 'Beef up the drums',
      ['jargon_variant', 'metaphorical'],
      '"Beef up" = make punchier/stronger'),
    p('para-020-04', 'Add more attack to the drums',
      ['jargon_variant', 'lexical_substitution'],
      '"Attack" is a component of punchiness'),
    p('para-020-05', 'I want the drums to hit harder',
      ['voice_change', 'jargon_variant'],
      '"Hit harder" = more punch/impact'),
    p('para-020-06', 'Can the drums be punchier?',
      ['hedging', 'voice_change'],
      'Polite interrogative'),
    p('para-020-07', 'Make the drums bang more',
      ['jargon_variant'],
      '"Bang" = punch/impact'),
  ]),
];


// =============================================================================
// Batch 3: Paraphrases for Seed Examples 021–030
// (Scoped edits, deictic references, muting/soloing)
// =============================================================================

export const PARAPHRASE_BATCH_3: readonly ParaphraseSet[] = [

  // --- seed-021: "Make the second verse darker" ---
  pset('seed-021', 'Make the second verse darker', [
    p('para-021-01', 'Darken verse 2',
      ['ellipsis', 'lexical_substitution'],
      'Direct verb + numbered section'),
    p('para-021-02', 'In the second verse, darken things',
      ['syntactic_reorder'],
      'Scope-first ordering'),
    p('para-021-03', 'I want verse two to be darker',
      ['voice_change', 'elaboration'],
      'First-person + spelled number'),
    p('para-021-04', 'The second verse should sound darker',
      ['voice_change'],
      'Declarative modal'),
    p('para-021-05', 'Take it darker in verse 2',
      ['jargon_variant', 'syntactic_reorder'],
      'Studio phrasing with scope postposed'),
    p('para-021-06', 'Reduce the brightness in the second verse',
      ['negation_flip', 'nominalization'],
      'Axis flip + explicit axis name'),
  ]),

  // --- seed-022: "In the chorus, add more bass" ---
  pset('seed-022', 'In the chorus, add more bass', [
    p('para-022-01', 'Add more bass in the chorus',
      ['syntactic_reorder'],
      'Action-first, scope-last'),
    p('para-022-02', 'More bass in the chorus',
      ['ellipsis'],
      'Minimal nominal command'),
    p('para-022-03', 'Bring up the bass in the chorus',
      ['jargon_variant'],
      '"Bring up" = add/increase'),
    p('para-022-04', 'I want the chorus to have more bass',
      ['voice_change', 'elaboration'],
      'First-person + have-construction'),
    p('para-022-05', 'Give the chorus more low end',
      ['jargon_variant', 'lexical_substitution'],
      '"Low end" = bass'),
    p('para-022-06', 'The chorus needs more bass presence',
      ['voice_change', 'elaboration'],
      'Declarative need + "presence" qualifier'),
    p('para-022-07', 'Boost the bass for the chorus section',
      ['lexical_substitution', 'elaboration'],
      '"Boost" = add more; "section" explicit'),
  ]),

  // --- seed-023: "Brighten the lead in verse 1" ---
  pset('seed-023', 'Brighten the lead in verse 1', [
    p('para-023-01', 'Make the lead brighter in the first verse',
      ['syntactic_reorder', 'lexical_substitution'],
      '"Make X adj" form + ordinal'),
    p('para-023-02', 'In verse 1, brighten the lead part',
      ['syntactic_reorder', 'elaboration'],
      'Scope-first with "part" qualifier'),
    p('para-023-03', 'The lead in verse one could be brighter',
      ['voice_change', 'hedging'],
      'Indirect suggestion'),
    p('para-023-04', 'Add more brightness to the lead in the first verse',
      ['nominalization', 'elaboration'],
      'Noun form: "brightness" + ordinal'),
    p('para-023-05', 'I want the lead to be brighter during verse 1',
      ['voice_change', 'lexical_substitution'],
      '"During" as temporal scope marker'),
    p('para-023-06', 'Open up the lead in verse 1',
      ['jargon_variant', 'metaphorical'],
      '"Open up" = brighten in studio speak'),
  ]),

  // --- seed-024: "From bar 17 to bar 32, increase the energy" ---
  pset('seed-024', 'From bar 17 to bar 32, increase the energy', [
    p('para-024-01', 'Increase the energy from bar 17 to 32',
      ['syntactic_reorder'],
      'Action first, scope last'),
    p('para-024-02', 'More energy in bars 17 through 32',
      ['ellipsis', 'lexical_substitution'],
      '"Bars X through Y" range syntax'),
    p('para-024-03', 'Boost the energy between bars 17 and 32',
      ['lexical_substitution'],
      '"Between" range marker'),
    p('para-024-04', 'I want bars 17-32 to have more energy',
      ['voice_change', 'elaboration'],
      'First-person + hyphenated range'),
    p('para-024-05', 'Crank up the energy for bars 17 to 32',
      ['jargon_variant'],
      '"Crank up" = increase a lot'),
    p('para-024-06', 'Add energy starting at bar 17 through bar 32',
      ['elaboration', 'lexical_substitution'],
      'Explicit start/end syntax'),
  ]),

  // --- seed-025: "Make the last 8 bars more intense" ---
  pset('seed-025', 'Make the last 8 bars more intense', [
    p('para-025-01', 'Increase the intensity in the last eight bars',
      ['nominalization', 'lexical_substitution'],
      'Noun form + spelled number'),
    p('para-025-02', 'The ending 8 bars need more intensity',
      ['voice_change', 'lexical_substitution'],
      '"Ending" = "last"'),
    p('para-025-03', 'Ramp up the last 8 bars',
      ['jargon_variant', 'ellipsis'],
      '"Ramp up" implies intensity increase'),
    p('para-025-04', 'Build to a climax in the final 8 bars',
      ['jargon_variant', 'metaphorical', 'lexical_substitution'],
      '"Build to climax" = increase intensity'),
    p('para-025-05', 'I want the last eight bars to really hit',
      ['voice_change', 'jargon_variant'],
      '"Really hit" = more intense'),
    p('para-025-06', 'Push the last 8 bars harder',
      ['jargon_variant', 'metaphorical'],
      '"Push harder" = increase intensity'),
  ]),

  // --- seed-026: "Darken just the pad in the bridge" ---
  pset('seed-026', 'Darken just the pad in the bridge', [
    p('para-026-01', 'Make only the pad darker in the bridge',
      ['lexical_substitution'],
      '"Only" = "just" for scope restriction'),
    p('para-026-02', 'In the bridge, darken the pad only',
      ['syntactic_reorder'],
      'Scope-first, restriction postposed'),
    p('para-026-03', 'Just the pad in the bridge — make it darker',
      ['syntactic_reorder', 'ellipsis'],
      'Scope as standalone phrase, then action'),
    p('para-026-04', 'I want the pad to be darker in the bridge, nothing else',
      ['voice_change', 'elaboration'],
      'Explicit "nothing else" scope restriction'),
    p('para-026-05', 'Darken the bridge pad and leave everything else alone',
      ['compound_rephrasing', 'elaboration'],
      'Explicit preservation of other elements'),
  ]),

  // --- seed-027: "Make the whole track less busy" ---
  pset('seed-027', 'Make the whole track less busy', [
    p('para-027-01', 'Thin out the whole thing',
      ['jargon_variant', 'lexical_substitution'],
      '"Thin out" = less busy; "whole thing" = whole track'),
    p('para-027-02', 'Simplify everything',
      ['lexical_substitution', 'ellipsis'],
      '"Simplify" → less busy; "everything" = whole track'),
    p('para-027-03', 'Reduce the density across the board',
      ['nominalization', 'lexical_substitution', 'metaphorical'],
      '"Density" = busyness; "across the board" = everywhere'),
    p('para-027-04', 'It\'s too busy — pull some stuff out',
      ['voice_change', 'jargon_variant', 'elaboration'],
      'Problem statement + action suggestion'),
    p('para-027-05', 'Less is more here — strip it back',
      ['metaphorical', 'jargon_variant'],
      'Aesthetic principle + action'),
    p('para-027-06', 'The arrangement is too crowded, clean it up',
      ['voice_change', 'jargon_variant', 'lexical_substitution'],
      '"Crowded" = busy; "clean up" = simplify'),
  ]),

  // --- seed-028: "In the intro and outro, reduce the volume" ---
  pset('seed-028', 'In the intro and outro, reduce the volume', [
    p('para-028-01', 'Turn down the intro and outro',
      ['jargon_variant', 'syntactic_reorder'],
      '"Turn down" = reduce volume'),
    p('para-028-02', 'Lower the volume in the intro and outro',
      ['lexical_substitution', 'syntactic_reorder'],
      '"Lower" = reduce'),
    p('para-028-03', 'The intro and outro should be quieter',
      ['voice_change', 'lexical_substitution'],
      '"Quieter" = lower volume'),
    p('para-028-04', 'Bring down the levels on the intro and outro',
      ['jargon_variant'],
      '"Bring down levels" = reduce volume'),
    p('para-028-05', 'Make the intro and outro softer',
      ['lexical_substitution'],
      '"Softer" = lower volume'),
  ]),

  // --- seed-029: "Make this brighter" (deictic) ---
  pset('seed-029', 'Make this brighter', [
    p('para-029-01', 'Brighten this',
      ['ellipsis', 'lexical_substitution'],
      'Direct verb form, deictic preserved'),
    p('para-029-02', 'This should be brighter',
      ['voice_change'],
      'Declarative with deictic'),
    p('para-029-03', 'Can you brighten what I\'ve selected?',
      ['hedging', 'elaboration'],
      'Explicit selection reference'),
    p('para-029-04', 'Add brightness to the selection',
      ['nominalization', 'lexical_substitution'],
      '"The selection" = explicit deictic reference'),
    p('para-029-05', 'I want this part brighter',
      ['voice_change', 'elaboration'],
      '"This part" = deictic'),
    p('para-029-06', 'Brighten the selected section',
      ['lexical_substitution', 'elaboration'],
      'Explicit "selected" for deictic resolution'),
  ]),

  // --- seed-030: "Do the same thing here" (anaphoric + deictic) ---
  pset('seed-030', 'Do the same thing here', [
    p('para-030-01', 'Same thing here',
      ['ellipsis'],
      'Minimal anaphoric + deictic'),
    p('para-030-02', 'Apply the same change here',
      ['lexical_substitution', 'elaboration'],
      '"Apply the same change" is more explicit'),
    p('para-030-03', 'Repeat that here',
      ['lexical_substitution'],
      '"Repeat that" = do the same thing'),
    p('para-030-04', 'Do it again but in this section',
      ['elaboration', 'lexical_substitution'],
      '"Do it again" + explicit scope'),
    p('para-030-05', 'Apply the last edit to this selection',
      ['elaboration'],
      'Very explicit anaphoric + deictic'),
    p('para-030-06', 'Ditto here',
      ['ellipsis', 'jargon_variant'],
      '"Ditto" = same thing'),
  ]),
];


// =============================================================================
// Aggregate export
// =============================================================================

// Re-export batch 2 sets
import { PARAPHRASE_SETS_BATCH_2 } from './paraphrase-suite-batch2';

/**
 * All paraphrase sets across all batches.
 */
export const ALL_PARAPHRASE_SETS: readonly ParaphraseSet[] = [
  ...PARAPHRASE_BATCH_1,
  ...PARAPHRASE_BATCH_2,
  ...PARAPHRASE_BATCH_3,
  ...PARAPHRASE_SETS_BATCH_2,
];

/**
 * Get a paraphrase set by seed ID.
 */
export function getParaphraseSet(seedId: SeedExampleId): ParaphraseSet | undefined {
  return ALL_PARAPHRASE_SETS.find(ps => ps.seedId === seedId);
}

/**
 * Get all paraphrase texts for a given seed ID.
 */
export function getParaphraseTexts(seedId: SeedExampleId): readonly string[] {
  const ps = getParaphraseSet(seedId);
  return ps ? ps.paraphrases.map(p => p.text) : [];
}

/**
 * Total number of paraphrase sets.
 */
export function paraphraseSetCount(): number {
  return ALL_PARAPHRASE_SETS.length;
}

/**
 * Total number of individual paraphrases across all sets.
 */
export function totalParaphraseCount(): number {
  return ALL_PARAPHRASE_SETS.reduce((sum, ps) => sum + ps.paraphrases.length, 0);
}

/**
 * Verify that all paraphrase sets have at least the minimum required
 * number of paraphrases.
 */
export function validateMinimumParaphrases(minimum: number = 5): readonly string[] {
  const violations: string[] = [];
  for (const ps of ALL_PARAPHRASE_SETS) {
    if (ps.paraphrases.length < minimum) {
      violations.push(
        `${ps.seedId}: has ${ps.paraphrases.length} paraphrases, needs >= ${minimum}`
      );
    }
  }
  return violations;
}
